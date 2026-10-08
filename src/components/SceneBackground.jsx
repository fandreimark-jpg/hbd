import { useEffect, useRef } from 'react'

// Decorative, non-interactive backdrop: layered light, balloons and sparkles at
// three depths. Pointer parallax only for a fine pointer without reduced motion;
// it writes CSS variables directly (no React state per frame).

const BALLOONS = [
  // x/y in % of the viewport, size in px at depth 1; kept near the edges, away from the text
  { x: 3, y: 30, size: 60, depth: 'far', color: 'gold', drift: 11 },
  { x: 89, y: 12, size: 66, depth: 'far', color: 'rose', drift: 13 },
  { x: -3, y: 13, size: 92, depth: 'mid', color: 'rose', drift: 9 },
  { x: 86, y: 36, size: 80, depth: 'mid', color: 'blush', drift: 12 },
  { x: 94, y: -6, size: 116, depth: 'near', color: 'gold', drift: 10 },
]

const SPARKLES = [
  { x: 24, y: 22, size: 14, depth: 'far', t: 4.2 },
  { x: 71, y: 14, size: 18, depth: 'mid', t: 5.1 },
  { x: 36, y: 8, size: 10, depth: 'far', t: 3.6 },
  { x: 62, y: 40, size: 12, depth: 'far', t: 4.8 },
  { x: 8, y: 52, size: 16, depth: 'mid', t: 5.6 },
  { x: 92, y: 58, size: 14, depth: 'near', t: 4.4 },
  { x: 50, y: 4, size: 12, depth: 'mid', t: 6 },
]

function Balloon({ size, color, id }) {
  const h = size * 1.5
  const dark = `var(--${color === 'gold' ? 'gold-deep' : 'rose'})`
  return (
    <svg width={size} height={h} viewBox="0 0 100 150" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="0.36" cy="0.3" r="0.75">
          <stop offset="0" style={{ stopColor: '#fff', stopOpacity: 0.85 }} />
          <stop offset="0.18" style={{ stopColor: `var(--${color})`, stopOpacity: 0.95 }} />
          <stop offset="1" style={{ stopColor: dark }} />
        </radialGradient>
      </defs>
      <path d="M50 108 C 47 120, 56 128, 50 150" fill="none" strokeOpacity="0.45" strokeWidth="1.4" style={{ stroke: 'var(--gold-deep)' }} />
      <ellipse cx="50" cy="52" rx="42" ry="50" fill={`url(#${id})`} />
      <path d="M44 101 L50 109 L56 101 Z" style={{ fill: dark }} />
      <ellipse cx="34" cy="30" rx="9" ry="14" fill="#fff" opacity="0.45" transform="rotate(-24 34 30)" />
    </svg>
  )
}

const Sparkle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden="true">
    <path d="M10 0 C11 7, 13 9, 20 10 C13 11, 11 13, 10 20 C9 13, 7 11, 0 10 C7 9, 9 7, 10 0Z" style={{ fill: 'var(--gold)' }} />
  </svg>
)

export default function SceneBackground({ intensity }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const fine = window.matchMedia('(pointer: fine)').matches
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!el || !fine || calm) return
    let frame = 0
    let x = 0
    let y = 0
    const onMove = (e) => {
      x = e.clientX / window.innerWidth - 0.5
      y = e.clientY / window.innerHeight - 0.5
      if (!frame)
        frame = requestAnimationFrame(() => {
          frame = 0
          el.style.setProperty('--px', x.toFixed(3))
          el.style.setProperty('--py', y.toFixed(3))
        })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(frame)
    }
  }, [])

  const level = Math.max(0, Math.min(1, intensity ?? 1))
  const balloons = level === 0 ? [] : level < 1 ? BALLOONS.filter((b) => b.depth !== 'near').slice(0, 3) : BALLOONS
  const sparkles = SPARKLES.slice(0, Math.round(SPARKLES.length * level))

  return (
    <div className="scene" ref={ref} aria-hidden="true" style={{ '--deco': 0.35 + 0.65 * level }}>
      <div className="scene__light" />
      <div className="scene__floor" />
      {['far', 'mid', 'near'].map((depth) => (
        <div key={depth} className={`scene__layer scene__layer--${depth}`}>
          {balloons
            .filter((b) => b.depth === depth)
            .map((b, i) => (
              <div
                key={`b${i}`}
                className="balloon"
                style={{ left: `${b.x}%`, top: `${b.y}%`, '--drift': `${b.drift}s` }}
              >
                <Balloon size={b.size} color={b.color} id={`balloon-${depth}-${i}`} />
              </div>
            ))}
          {sparkles
            .filter((s) => s.depth === depth)
            .map((s, i) => (
              <div key={`s${i}`} className="sparkle" style={{ left: `${s.x}%`, top: `${s.y}%`, '--t': `${s.t}s` }}>
                <Sparkle size={s.size} />
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
