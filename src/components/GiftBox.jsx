// The gift is a real <button>. Faces are drawn in an oblique "3D-style" projection
// with clip-path (no 3D transforms), so every part stays in the page's stacking
// context and the photo layer can sit between the box opening and its front faces.
export default function GiftBox({ ref, open, onOpen, label }) {
  return (
    <button
      ref={ref}
      type="button"
      className={`gift${open ? ' is-open' : ''}`}
      onClick={onOpen}
      disabled={open}
      aria-label={label}
    >
      <span className="gift__part gift__back" aria-hidden="true" />
      <span className="gift__part gift__lid" aria-hidden="true">
        <span className="gift__lid-inner">
          <span className="lid__top">
            <span className="lid__band lid__band--depth" />
            <span className="lid__band lid__band--across" />
          </span>
          <span className="lid__front">
            <span className="gift__ribbon" />
          </span>
          <span className="lid__side">
            <span className="gift__ribbon" />
          </span>
          <span className="gift__bow">
            <span className="gift__tail gift__tail--l" />
            <span className="gift__tail gift__tail--r" />
            <span className="gift__loop gift__loop--l" />
            <span className="gift__loop gift__loop--r" />
            <span className="gift__knot" />
          </span>
        </span>
      </span>
      <span className="gift__part gift__body" aria-hidden="true">
        <span className="gift__ribbon" />
      </span>
      <span className="gift__part gift__side" aria-hidden="true">
        <span className="gift__ribbon" />
      </span>
    </button>
  )
}

const COLORS = ['var(--gold)', 'var(--rose)', 'var(--blush)', '#fff', 'var(--gold-deep)']

// Fixed, deterministic pieces: lightweight and identical on every replay.
const PIECES = Array.from({ length: 26 }, (_, i) => {
  const angle = (-160 + (140 / 25) * i) * (Math.PI / 180) // fan upward
  const dist = 120 + ((i * 37) % 90)
  return {
    dx: Math.round(Math.cos(angle) * dist),
    dy: Math.round(Math.sin(angle) * dist),
    rot: (i * 71) % 360,
    delay: (i % 5) * 40,
    color: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  }
})

export function Confetti({ x, y }) {
  return (
    <div className="confetti" style={{ left: x, top: y }} aria-hidden="true">
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={p.round ? 'is-round' : undefined}
          style={{
            '--dx': `${p.dx}px`,
            '--dy': `${p.dy}px`,
            '--rot': `${p.rot}deg`,
            animationDelay: `${p.delay}ms`,
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}
