// Run with: node src/photoLayout.check.js
// Asserts photo spots stay on screen, clear of the text column and the gift.
import assert from 'node:assert/strict'
import { computeSpots, giftSize, placeIn } from './photoLayout.js'

const overlap = (a, b) => a.x < b.right && a.x + a.w > b.left && a.y < b.bottom && a.y + a.h > b.top

// Rough stand-in for the CSS: text column width, stage band, gift at its floor.
function page(W, H) {
  const colW = W >= 1000 ? 560 : W >= 700 ? 440 : W - 32
  const box = giftSize(W, H)
  const giftW = box * 1.16
  const stage = { top: 110, bottom: 110 + (W >= 700 ? Math.min(420, Math.max(250, H * 0.42)) : Math.min(460, Math.max(320, H * 0.48))) }
  const gift = { left: (W - giftW) / 2, right: (W + giftW) / 2, bottom: stage.bottom - box * 0.12, top: stage.bottom - box * 0.12 - box * 1.36 }
  const center = { left: (W - colW) / 2, right: (W + colW) / 2 }
  return { W, top: 16, bottom: H - 70, center, stage, gift, lidClear: giftW * 0.25 }
}

const expected = { '320x568': 'single', '390x844': 'pair', '844x390': 'wide', '1440x900': 'wide', '820x1180': 'wide' }
for (const [size, mode] of Object.entries(expected)) {
  const [W, H] = size.split('x').map(Number)
  const p = page(W, H)
  const s = computeSpots(p)
  assert.equal(s.mode, mode, size)
  assert.ok(s.capacity >= 1 && s.capacity <= s.spots.length)
  assert.deepEqual([...new Set(s.spots.slice(0, 2).map((x) => x.side))].sort(), ['l', 'r'], `${size}: first two spots alternate sides`)
  for (const spot of s.spots) {
    const at = `${size} ${JSON.stringify(spot)}`
    assert.ok(spot.x >= 0 && spot.x + spot.w <= W, `${at}: off-screen`)
    if (mode === 'wide') assert.ok(spot.x + spot.w <= p.center.left || spot.x >= p.center.right, `${at}: crosses the text column`)
    else for (const r of [spot, spot.alt].filter(Boolean)) assert.ok(!overlap(r, p.gift), `${at}: covers the gift`)
    for (const ratio of [0.27, 0.6, 1.1]) {
      const b = placeIn(spot, ratio, 800, 12)
      const inside = (r) => b.x >= r.x - 1 && b.x + b.w <= r.x + r.w + 1 && b.y >= r.y && b.y + b.h <= r.y + r.h + 1
      assert.ok(inside(spot) || (spot.alt && inside(spot.alt)), `${at}: photo ${ratio} spills out`)
      if (mode !== 'wide') assert.ok(!overlap(b, p.gift), `${at}: photo ${ratio} covers the gift`)
    }
  }
}
console.log('photoLayout: ok')
