import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { surprise } from './surpriseConfig.js'
import { computeSpots, giftSize } from './photoLayout.js'
import { useMusic } from './useMusic.js'
import GiftBox, { Confetti } from './components/GiftBox.jsx'
import PhotoStage from './components/PhotoStage.jsx'
import PhotoViewer from './components/PhotoViewer.jsx'
import MusicControl from './components/MusicControl.jsx'
import SceneBackground from './components/SceneBackground.jsx'
import { loadDisplay } from './loadPhoto.js'
import './App.css'

const base = import.meta.env.BASE_URL
const withBase = (p) => (p ? base + p : '')
const photos = surprise.photos.map((p) => ({ ...p, src: withBase(p.src), cutout: withBase(p.cutout) }))
const musicSrc = withBase(surprise.music)
const { cream, blush, rose, gold, goldDeep, ink } = surprise.theme
const themeVars = {
  '--cream': cream,
  '--blush': blush,
  '--rose': rose,
  '--gold': gold,
  '--gold-deep': goldDeep,
  '--ink': ink,
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pageRect = (el) => {
  const r = el.getBoundingClientRect()
  return { left: r.left, right: r.right, top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, width: r.width, height: r.height }
}

export default function App() {
  const [open, setOpen] = useState(false)
  const [runId, setRunId] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [viewing, setViewing] = useState(null) // photo index
  const [noPhotos, setNoPhotos] = useState(photos.length === 0)
  const [viewport, setViewport] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const [scene, setScene] = useState(null) // { mode, capacity, spots, mouth }
  const appRef = useRef(null)
  const giftRef = useRef(null)
  const stageRef = useRef(null)
  const centerRef = useRef(null)
  const controlsRef = useRef(null)
  const headingRef = useRef(null)
  const opener = useRef(null)
  const music = useMusic()
  const box = giftSize(viewport.w, viewport.h)

  // Reads the rendered page and decides where photos may stand.
  const measure = useCallback(() => {
    const app = appRef.current
    const gift = giftRef.current
    if (!app || !gift || !stageRef.current || !centerRef.current) return
    const controlsH = controlsRef.current ? controlsRef.current.offsetHeight : 0
    app.style.setProperty('--controls-h', `${controlsH}px`)
    const g = pageRect(gift)
    const back = pageRect(gift.querySelector('.gift__back'))
    const next = {
      ...computeSpots({
        W: document.documentElement.clientWidth,
        top: 16,
        bottom: window.innerHeight - controlsH - 12,
        center: pageRect(centerRef.current),
        stage: pageRect(stageRef.current),
        gift: g,
        lidClear: g.width * 0.25, // photos may overlap the lifted lid, never the box
      }),
      mouth: { x: Math.round(back.left + back.width / 2), y: Math.round(back.top + back.height * 0.7) },
      ceiling: Math.round(pageRect(stageRef.current).top),
    }
    setScene((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [measure, open, viewport, scene?.mode])

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    const onVis = () => setTabHidden(document.hidden)
    const ro = new ResizeObserver(() => measure())
    ro.observe(stageRef.current)
    ro.observe(centerRef.current)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [measure])

  // Controls wrap differently at different widths; keep their reserved space exact.
  useEffect(() => {
    if (!open || !controlsRef.current) return
    const ro = new ResizeObserver(() => measure())
    ro.observe(controlsRef.current)
    return () => ro.disconnect()
  }, [open, measure])

  // Warm up the first photos while the gift is still closed.
  useEffect(() => {
    photos.slice(0, 2).forEach((p) => loadDisplay(p))
  }, [])

  useEffect(() => {
    if (!confetti) return
    const t = setTimeout(() => setConfetti(false), 1900)
    return () => clearTimeout(t)
  }, [confetti])

  function openGift() {
    if (open) return // one sequence per opening
    music.play() // straight from the tap, so browsers allow it
    setOpen(true)
    setConfetti(!reducedMotion())
    photos.slice(0, 4).forEach((p) => loadDisplay(p))
    headingRef.current?.focus({ preventScroll: true })
  }

  function replay() {
    setViewing(null)
    music.reset()
    setConfetti(false)
    setUserPaused(false)
    setNoPhotos(photos.length === 0)
    setOpen(false)
    setRunId((n) => n + 1)
    window.scrollTo({ top: 0 })
    requestAnimationFrame(() => giftRef.current?.focus())
  }

  function closeViewer() {
    setViewing(null)
    const el = opener.current
    if (el?.isConnected) requestAnimationFrame(() => el.focus())
  }

  const onEmpty = useCallback(() => setNoPhotos(true), [])
  const paused = userPaused || tabHidden || viewing !== null
  const viewed = viewing === null ? null : photos[viewing]

  return (
    <div
      ref={appRef}
      className={`app${open ? ' is-open' : ''}${tabHidden ? ' is-hidden' : ''}`}
      data-mode={scene?.mode}
      style={{ ...themeVars, '--box': `${box}px` }}
    >
      <SceneBackground intensity={surprise.decorations} />

      <div className="center" ref={centerRef}>
        <header className="intro">
          <h1 ref={headingRef} tabIndex={-1} aria-live="polite">
            {open ? surprise.greeting : surprise.intro}
          </h1>
          {!open && <p className="intro__hint">{surprise.hint}</p>}
        </header>

        <main className="stage" ref={stageRef}>
          <span className="stage__floor" aria-hidden="true" />
          <GiftBox ref={giftRef} open={open} onOpen={openGift} label="Open the gift" />
        </main>

        {open && (
          <div className="message">
            <p>{surprise.message}</p>
            {noPhotos && <p className="empty-note">Photos coming soon.</p>}
          </div>
        )}
      </div>

      {scene && (
        <PhotoStage
          key={`photos-${runId}`}
          photos={photos}
          scene={scene}
          active={open}
          paused={paused}
          timing={surprise.timing}
          bounce={surprise.bounce}
          onEmpty={onEmpty}
          onView={(index, el) => {
            opener.current = el
            setViewing(index)
          }}
        />
      )}
      {confetti && scene && <Confetti key={`confetti-${runId}`} x={scene.mouth.x} y={scene.mouth.y} />}

      {open && (
        <nav className="controls" ref={controlsRef} aria-label="Surprise controls">
          {!noPhotos && (
            <button type="button" className="control" onClick={() => setUserPaused((p) => !p)}>
              <svg viewBox="0 0 20 20" aria-hidden="true">
                {userPaused ? <path d="M6 4l10 6-10 6z" /> : <path d="M5 4h3.5v12H5zM11.5 4H15v12h-3.5z" />}
              </svg>
              {userPaused ? 'Resume photos' : 'Pause photos'}
            </button>
          )}
          <MusicControl status={music.status} onPlay={music.play} onPause={music.pause} />
          <button type="button" className="control" onClick={replay}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 3a7 7 0 1 1-6.6 4.7l1.9.6A5 5 0 1 0 10 5v2.5L6 4.5 10 1.5z" />
            </svg>
            Replay surprise
          </button>
        </nav>
      )}

      <PhotoViewer
        photo={viewed}
        label={viewed ? viewed.alt || `Photo ${viewing + 1} of ${photos.length}` : ''}
        onClose={closeViewer}
      />

      {musicSrc && <video className="music-media" src={musicSrc} {...music.mediaProps} aria-hidden="true" tabIndex={-1} />}
    </div>
  )
}
