// Pure geometry for where photos stand. All rects are px in page (.app) coordinates.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Gift front-face width for a given viewport.
export function giftSize(W, H) {
  return Math.round(clamp(Math.min(W * (W < 700 ? 0.3 : 0.17), H * 0.28), 96, 190))
}

/**
 * Picks photo spots from measured page rects.
 *   wide:   balanced areas left and right of the text column (1–2 per side)
 *   pair:   one spot either side of the gift (phones)
 *   single: one spot above the gift, alternating left/right (very narrow)
 * Spots alternate sides in order, so filling them round-robin alternates sides.
 */
export function computeSpots({ W, top, bottom, center, stage, gift, lidClear }) {
  const m = 12
  const gap = 14
  const sideW = center.left - m - gap

  if (sideW >= 150) {
    const h = bottom - top
    const mirror = (r) => ({ ...r, x: W - r.x - r.w, side: 'r' })
    if (sideW >= 2 * 170) {
      const outer = { x: m, y: top, w: sideW * 0.56, h, side: 'l', depth: 1 }
      // back row: higher feet and smaller, so it reads as further away
      const inner = { x: m + sideW * 0.44, y: top + h * 0.05, w: sideW * 0.56, h: h * 0.66, side: 'l', depth: 0.9 }
      return { mode: 'wide', capacity: 4, spots: [outer, mirror(outer), inner, mirror(inner)] }
    }
    const one = { x: m, y: top, w: sideW, h, side: 'l', depth: 1 }
    return { mode: 'wide', capacity: 2, spots: [one, mirror(one)] }
  }

  const leftW = gift.left - gap - m
  const rightW = W - m - (gift.right + gap)
  const pairW = Math.min(leftW, rightW)
  if (pairW >= 92) {
    const y = stage.top + 4
    const h = gift.bottom - y
    // Wide photos fit better in the half above the gift than in the strip beside it.
    const aboveW = W / 2 - m - gap / 2
    const aboveH = gift.top - lidClear * 0.5 - y
    const above = (x) => (aboveH >= 100 ? { x, y, w: aboveW, h: aboveH } : null)
    return {
      mode: 'pair',
      capacity: 2,
      spots: [
        { x: m, y, w: pairW, h, side: 'l', depth: 1, alt: above(m) },
        { x: W - m - pairW, y, w: pairW, h, side: 'r', depth: 1, alt: above(W - m - aboveW) },
      ],
    }
  }

  const y = stage.top + 4
  const h = Math.max(120, gift.top - lidClear - y)
  const w = (W - 2 * m) * 0.64
  return {
    mode: 'single',
    capacity: 1,
    spots: [
      { x: m, y, w, h, side: 'l', depth: 1 },
      { x: W - m - w, y, w, h, side: 'r', depth: 1 },
    ],
  }
}

// Fits one photo (width/height ratio, natural height) into a spot: whole subject
// visible, standing on the spot's floor, room left above for the bounce.
export function placeIn(spot, ratio, naturalH, bounce) {
  if (spot.alt) {
    const a = fit(spot, ratio, naturalH, bounce)
    const b = fit({ ...spot.alt, depth: spot.depth }, ratio, naturalH, bounce)
    return b.w * b.h > a.w * a.h ? b : a
  }
  return fit(spot, ratio, naturalH, bounce)
}

function fit(spot, ratio, naturalH, bounce) {
  // Head-and-shoulders shots get less height than full-body ones so faces stay life-sized.
  const cap = spot.h * (ratio > 0.6 ? 0.62 : 1)
  const maxH = Math.min(spot.h - bounce - 4, cap, spot.w / ratio, naturalH * 1.6) * spot.depth
  const h = Math.max(40, Math.floor(maxH))
  const w = Math.round(h * ratio)
  return {
    x: Math.round(spot.x + (spot.w - w) / 2),
    y: Math.round(spot.y + spot.h - h),
    w,
    h,
  }
}
