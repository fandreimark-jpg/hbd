// Pure geometry for where photos stand. All rects are px in page (.app) coordinates.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// Gift front-face width for a given viewport.
export function giftSize(W, H) {
  return Math.round(clamp(Math.min(W * (W < 700 ? 0.3 : 0.17), H * 0.28), 96, 190))
}

// Dancer height for a viewport: the configured size, shrunk on short screens.
export function dancerHeight(W, H, sizes) {
  return Math.round(Math.min(W >= 700 ? sizes.desktop : sizes.mobile, H * 0.3))
}

// How many photos may be on screen at once.
export function maxPhotos(W, H) {
  if (H < 500) return 2 // short landscape: fewer, larger people
  if (W >= 1000 && H >= 640) return 6
  return W >= 700 ? 4 : 3
}

/**
 * Builds photo destinations around the central greeting + gift from measured rects:
 *   middle-left/right   beside the text column (wide) or beside the gift (phones)
 *   lower-left/right    the band below the gift, anchored to the outer corners
 *   upper-left/right    top of the side columns (wide screens with enough height)
 * Spots come in left/right pairs so filling them in order alternates sides,
 * and every spot is visited each time the sequence goes round.
 */
export function computeSpots({ W, H, top, bottom, center, header, controls, gift, reserve, edge = 16, spacing = 14 }) {
  const minW = W < 600 ? 76 : 130
  const minH = 150
  const cap = maxPhotos(W, H)
  const mirror = (r) => ({ ...r, x: W - r.x - r.w, side: 'r', align: r.align === 'l' ? 'r' : r.align })
  const ok = (r) => r && r.w >= minW && r.h >= minH

  const lowerTop = gift.bottom + spacing
  // `reserve`: the lower-centre area kept for the dancer; lower spots stop beside it.
  const lowerRight = reserve ? reserve.left - spacing : W / 2 - spacing / 2
  const lower = cap > 2 ? { x: edge, y: lowerTop, w: lowerRight - edge, h: bottom - lowerTop, side: 'l', align: 'l', row: 'lower' } : null

  let middle = null
  let upper = null
  const sideW = center.left - edge - spacing
  if (sideW >= minW) {
    // Wide: columns beside the text column, below the corner controls, above the lower band.
    const colTop = Math.max(top, controls.bottom + spacing)
    const colBottom = ok(lower) ? lowerTop - spacing : bottom
    const colH = colBottom - colTop
    if (cap >= 4 && colH >= 2 * minH + spacing) {
      const h = (colH - spacing) / 2
      upper = { x: edge, y: colTop, w: sideW, h, side: 'l', align: 'c', row: 'upper' }
      middle = { x: edge, y: colTop + h + spacing, w: sideW, h, side: 'l', align: 'c', row: 'middle' }
    } else {
      middle = { x: edge, y: colTop, w: sideW, h: colH, side: 'l', align: 'c', row: 'middle' }
    }
  } else {
    // Phones: the strip beside the gift, below the greeting.
    const y = Math.max(header.bottom, controls.bottom) + spacing
    middle = { x: edge, y, w: gift.left - spacing - edge, h: gift.bottom - y, side: 'l', align: 'c', row: 'middle' }
  }

  const spots = [middle, lower, upper].filter(ok).flatMap((r) => [r, mirror(r)])
  return { capacity: Math.min(cap, spots.length), spots }
}

// Fits one photo (width/height ratio, natural height) into a spot: whole subject
// visible, standing on the spot's floor, room left above for the bounce.
export function placeIn(spot, ratio, naturalH, bounce, scale = 1) {
  // Head-and-shoulders shots stay life-sized in very tall spots.
  const cap = spot.h > 360 && ratio > 0.6 ? spot.h * 0.62 : spot.h
  const maxH = Math.min(spot.h - bounce - 4, cap * scale, spot.w / ratio, naturalH * 1.6)
  const h = Math.max(40, Math.floor(maxH))
  const w = Math.round(h * ratio)
  const free = spot.w - w
  const x = spot.align === 'l' ? spot.x : spot.align === 'r' ? spot.x + free : spot.x + free / 2
  return { x: Math.round(x), y: Math.round(spot.y + spot.h - h), w, h }
}
