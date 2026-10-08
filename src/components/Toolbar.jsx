import { useEffect, useId, useRef, useState } from 'react'

// Small icon controls for the top-right corner. Each icon button keeps a 44px
// hit area; the visible label appears on hover/focus and always names the action.

const icons = {
  note: <path d="M8 15.5a2.5 2.5 0 1 1-2-2.45V4l9-2v10.5a2.5 2.5 0 1 1-2-2.45V5.5L8 6.6z" />,
  muted: (
    <>
      <path d="M8 15.5a2.5 2.5 0 1 1-2-2.45V4l9-2v10.5a2.5 2.5 0 1 1-2-2.45V5.5L8 6.6z" opacity="0.45" />
      <path d="M3 3l14 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  pause: <path d="M5.5 4h3v12h-3zM11.5 4h3v12h-3z" />,
  play: <path d="M6.5 4l10 6-10 6z" />,
  more: <path d="M4 8.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm6 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />,
  replay: <path d="M10 3a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 10 5v2.5L6 4.5 10 1.5z" />,
}

const Icon = ({ name }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    {icons[name]}
  </svg>
)

function IconButton({ label, icon, onClick, accent, ...rest }) {
  return (
    <button type="button" className={`tool${accent ? ' tool--accent' : ''}`} aria-label={label} onClick={onClick} {...rest}>
      <span className="tool__face">
        <Icon name={icon} />
      </span>
      <span className="tool__tip" aria-hidden="true">
        {label}
      </span>
    </button>
  )
}

// pauseTarget: what the pause button controls, e.g. ['photos', 'dancing'] -> "Pause photos and dancing".
export default function Toolbar({ ref, music, onPlayMusic, onPauseMusic, pauseTarget, photosPaused, onTogglePhotos, onReplay }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const moreRef = useRef(null)
  const menuRef = useRef(null)
  const menuId = useId()

  // Escape / outside tap closes the menu; Escape returns focus to the More button.
  useEffect(() => {
    if (!menuOpen) return
    menuRef.current?.querySelector('[role="menuitem"]')?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        moreRef.current?.focus()
      }
    }
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !moreRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [menuOpen])

  const playing = music === 'playing'
  return (
    <nav className="toolbar" ref={ref} aria-label="Surprise controls">
      {music === 'unavailable' ? (
        <span className="tool tool--off" role="img" aria-label="Music unavailable" tabIndex={0}>
          <span className="tool__face">
            <Icon name="muted" />
          </span>
          <span className="tool__tip" aria-hidden="true">
            Music unavailable
          </span>
        </span>
      ) : (
        <IconButton
          label={playing ? 'Mute music' : 'Play music'}
          icon={playing ? 'note' : 'muted'}
          accent={!playing && music !== 'paused'} // never started or blocked: draw the eye
          onClick={playing ? onPauseMusic : onPlayMusic}
        />
      )}
      {pauseTarget.length > 0 && (
        <IconButton
          label={`${photosPaused ? 'Resume' : 'Pause'} ${pauseTarget.join(' and ')}`}
          icon={photosPaused ? 'play' : 'pause'}
          onClick={onTogglePhotos}
        />
      )}
      <div className="toolbar__more">
        <IconButton
          ref={moreRef}
          label="More"
          icon="more"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((o) => !o)}
        />
        {menuOpen && (
          <div
            className="menu"
            id={menuId}
            role="menu"
            ref={menuRef}
            aria-label="More"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== moreRef.current) setMenuOpen(false)
            }}
          >
            <button
              type="button"
              role="menuitem"
              className="menu__item"
              onClick={() => {
                setMenuOpen(false)
                onReplay()
              }}
            >
              <Icon name="replay" />
              Replay surprise
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
