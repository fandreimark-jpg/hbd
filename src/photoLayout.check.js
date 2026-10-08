// Run with: node src/photoLayout.check.js
// Asserts photo spots stay on screen and clear of the greeting, gift, controls and each other.
import assert from 'node:assert/strict'
import { computeSpots, dancerHeight, giftSize, placeIn } from './photoLayout.js'

const overlap = (a, b) => a.x < b.right && a.x + a.w > b.left && a.y < b.bottom && a.y + a.h > b.top
const toRect = (s) => ({ left: s.x, right: s.x + s.w, top: s.y, bottom: s.y + s.h })

// Rough stand-in for the CSS: header, gift centre at 40% of the stage, toolbar in the corner.
function page(W, H) {
  const box = giftSize(W, H)
  const giftW = box * 1.16
  const headerBottom = W < 600 ? 140 : H < 500 ? 50 : 140
  const stageH = H - headerBottom
  const base = headerBottom + stageH * 0.4 + box * 0.68
  const gift = { left: (W - giftW) / 2, right: (W + giftW) / 2, bottom: base, top: base - box * 1.36 }
  const half = Math.max(W < 600 ? W / 2 - 20 : 230, giftW * 0.9)
  return {
    W, H, top: 16, bottom: H - 16,
    center: { left: W / 2 - half, right: W / 2 + half },
    header: { top: 0, bottom: headerBottom, left: W / 2 - half, right: W / 2 + half },
    controls: { left: W - 150, right: W - 10, top: 10, bottom: 54 },
    gift,
  }
}

// Same page with the dancer standing in the lower centre.
function withDancer(p) {
  const dh = dancerHeight(p.W, p.H, { desktop: 280, mobile: 220 })
  const dw = dh * (9 / 16)
  const reserve = { left: (p.W - dw) / 2, right: (p.W + dw) / 2, top: p.bottom + 16 - dh, bottom: p.bottom + 16 }
  return { ...p, reserve }
}

const expect = { '320x568': [2, 'lower'], '390x844': [3, 'lower'], '844x390': [2, 'middle'], '1440x900': [6, 'lower'], '820x1180': [4, 'lower'] }
for (const [size, [cap, mustHave]] of Object.entries(expect)) {
  const [W, H] = size.split('x').map(Number)
  const p = withDancer(page(W, H))
  const { spots, capacity } = computeSpots(p)
  assert.equal(capacity, cap, `${size} capacity`)
  assert.ok(spots.some((s) => s.row === mustHave), `${size}: has ${mustHave} spots`)
  for (let i = 0; i < spots.length; i += 2) assert.deepEqual([spots[i].side, spots[i + 1].side], ['l', 'r'], `${size}: spots alternate sides`)
  for (const [i, s] of spots.entries()) {
    const at = `${size} ${s.row}-${s.side}`
    assert.ok(s.x >= 0 && s.x + s.w <= W && s.y >= 0 && s.y + s.h <= H, `${at}: off-screen`)
    for (const [name, r] of Object.entries({ gift: p.gift, controls: p.controls, dancer: p.reserve })) assert.ok(!overlap(s, r), `${at}: covers the ${name}`)
    if (W >= 600) assert.ok(!overlap(s, p.header), `${at}: covers the greeting`)
    else assert.ok(s.y >= p.header.bottom || !overlap(s, p.header), `${at}: covers the greeting`)
    for (const o of spots.slice(i + 1)) assert.ok(!overlap(s, toRect(o)), `${at}: overlaps ${o.row}-${o.side}`)
    for (const ratio of [0.27, 0.6, 1.1]) {
      const b = placeIn(s, ratio, 800, 12)
      assert.ok(b.x >= s.x - 1 && b.x + b.w <= s.x + s.w + 1 && b.y - 12 >= s.y && b.y + b.h <= s.y + s.h + 1, `${at}: photo ${ratio} spills out (incl. bounce)`)
    }
  }
}
console.log('photoLayout: ok')
