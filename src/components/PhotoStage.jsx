import { useEffect, useRef, useState } from 'react'
import { loadDisplay } from '../loadPhoto.js'
import { placeIn } from '../photoLayout.js'

let nextKey = 1

/**
 * Releases photos from the gift into side spots and cycles them.
 * The schedule is a chain of pausable waits: pausing stores the time left,
 * resuming finishes exactly that wait, so nothing jumps or double-releases.
 * The parent remounts this component (new key) on replay.
 */
export default function PhotoStage({ photos, scene, active, paused, timing, bounce, photoScale = 1, onView, onEmpty }) {
  const { spots, capacity, mouth } = scene // ceiling: page y the flight must stay below
  const [items, setItems] = useState([]) // { key, index, spot, src, cutout, ratio, height, leaving }
  const seq = useRef({ photo: 0, count: 0, visible: [], stage: 'wait', remaining: null, pending: null })
  const live = useRef({ spots, capacity, onEmpty })
  useEffect(() => {
    live.current = { spots, capacity, onEmpty }
  })

  // Resize/rotation changed the set of spots: move the people already on screen
  // to the first free spots so none overlap; the next photo continues after them.
  const spotCount = spots.length
  useEffect(() => {
    const n = seq.current
    if (!n.visible.length) return
    const order = new Map(n.visible.map((v, i) => [v.key, i]))
    n.count = n.visible.length
    setItems((list) => list.filter((it) => order.has(it.key)).map((it) => ({ ...it, spot: order.get(it.key) % spotCount })))
  }, [spotCount])

  useEffect(() => {
    if (!active || paused || !capacity) return
    const n = seq.current
    let timer = 0
    let waitStart = 0
    let waiting = false
    let cancelled = false

    // Resolves after ms. If this run is cancelled the promise is simply dropped.
    const wait = (ms) =>
      new Promise((resolve) => {
        n.remaining = ms
        waitStart = performance.now()
        waiting = true
        timer = setTimeout(() => {
          waiting = false
          n.remaining = 0
          resolve()
        }, ms)
      })

    // Next photo that loads, from the pointer. The pointer only moves on placement.
    async function pick() {
      for (let step = 0; step < photos.length; step++) {
        const index = (n.photo + step) % photos.length
        const res = await loadDisplay(photos[index])
        if (cancelled) return null
        if (res.ok) return { ...res, index }
      }
      return { index: -1 }
    }

    function place() {
      const f = n.pending
      const { spots: sp, capacity: cap } = live.current
      const key = nextKey++
      const replaced = n.stage === 'exit' ? n.visible.shift() : null
      n.visible.push({ key, index: f.index })
      const dropped = n.visible.length > cap ? n.visible.splice(0, n.visible.length - cap) : []
      const gone = new Set([replaced?.key, ...dropped.map((d) => d.key)])
      const spot = n.count % sp.length
      n.pending = null
      n.stage = 'wait'
      n.count += 1
      n.photo = (f.index + 1) % photos.length
      setItems((list) => [
        ...list.filter((it) => !gone.has(it.key)),
        { key, index: f.index, spot, src: f.src, cutout: f.cutout, ratio: f.ratio, height: f.height, leaving: false },
      ])
      loadDisplay(photos[n.photo]) // warm up the next one
    }

    async function run() {
      await wait(n.remaining ?? timing.releaseDelayMs)
      if (n.stage === 'exit') {
        place()
        await wait(holdGap())
      }
      for (;;) {
        const cap = live.current.capacity
        const filling = n.visible.length < cap
        if (!filling && photos.length <= cap) return // everything is already on screen
        const found = await pick()
        if (!found) return
        if (found.index === -1) {
          if (n.count === 0) live.current.onEmpty()
          return
        }
        if (n.visible.some((v) => v.index === found.index)) return // too few working photos to cycle
        n.pending = found
        if (!filling) {
          n.stage = 'exit'
          const oldest = n.visible[0].key
          setItems((list) => list.map((it) => (it.key === oldest ? { ...it, leaving: true } : it)))
          await wait(timing.exitMs)
        }
        place()
        await wait(holdGap())
      }
    }
    const holdGap = () =>
      n.visible.length < live.current.capacity ? timing.releaseStaggerMs : timing.photoHoldMs / live.current.capacity

    if (photos.length) run()
    else live.current.onEmpty()
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (waiting) n.remaining = Math.max(0, n.remaining - (performance.now() - waitStart))
    }
  }, [active, paused, capacity, photos, timing])

  if (!active) return null

  return (
    <div
      className={`photos${paused ? ' is-paused' : ''}`}
      style={{ '--bh': `${bounce.heightPx}px`, '--bs': `${bounce.seconds}s` }}
    >
      {items.map((it) => {
        const spot = spots[it.spot % spots.length]
        const box = placeIn(spot, it.ratio, it.height, bounce.heightPx, photoScale)
        const label = photos[it.index].alt || `photo ${it.index + 1}`
        return (
          <div
            key={it.key}
            className={`cutout${it.cutout ? '' : ' cutout--framed'}${it.leaving ? ' is-leaving' : ''}`}
            data-spot={`${spot.row}-${spot.side}`}
            style={{
              left: box.x,
              top: box.y,
              width: box.w,
              height: box.h,
              '--fx': `${Math.round(mouth.x - (box.x + box.w / 2))}px`,
              '--fy': `${Math.round(mouth.y - (box.y + box.h / 2))}px`,
              '--tilt': `${spot.side === 'l' ? -1.5 : 1.5}deg`,
              // how far to rise out of the box before swinging sideways (kept below the heading)
              '--rise': `${Math.round(Math.max(0, Math.min(70, mouth.y - scene.ceiling - box.h * 0.2, box.y - scene.ceiling - bounce.heightPx)))}px`,
              '--phase': `${-(it.key % 4) * 0.7}s`,
            }}
          >
            {/* vertical motion outside, sideways + scale inside, so scaling never shrinks the rise */}
            <div className="cutout__bob">
              <div className="cutout__fly">
                <button
                  type="button"
                  className="cutout__btn"
                  onClick={(e) => onView(it.index, e.currentTarget)}
                  aria-label={`View ${label} larger`}
                  tabIndex={it.leaving ? -1 : 0}
                >
                  <img src={it.src} alt="" draggable="false" />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
