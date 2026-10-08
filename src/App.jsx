import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { surprise } from './surpriseConfig.js'
import { computeSpots, dancerHeight, giftSize } from './photoLayout.js'
import { useMusic } from './useMusic.js'
import GiftBox, { Confetti } from './components/GiftBox.jsx'
import PhotoStage from './components/PhotoStage.jsx'
import PhotoViewer from './components/PhotoViewer.jsx'
import Toolbar from './components/Toolbar.jsx'
import SceneBackground from './components/SceneBackground.jsx'
import Dancer from './components/Dancer.jsx'
import { loadDisplay } from './loadPhoto.js'
import './App.css'

const base = import.meta.env.BASE_URL
const withBase = (p) => (p ? base + p : '')
const photos = surprise.photos.map((p) => ({ ...p, src: withBase(p.src), cutout: withBase(p.cutout) }))
const musicSrc = withBase(surprise.music)
const dancerConfig = surprise.dancer ?? { enabled: false, sources: [] }
const dancerSources = (dancerConfig.sources ?? []).map((s) => ({ ...s, src: withBase(s.src) }))
const dancerStill = withBase(dancerConfig.still)
const layoutConfig = { edgePx: 16, spacingPx: 14, photoScale: 1, ...surprise.layout }
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
  const [scene, setScene] = useState(null) // { capacity, spots, mouth, ceiling }
  const [dancerFailed, setDancerFailed] = useState(false)
  const dancerRef = useRef(null)
  const giftRef = useRef(null)
  const sceneRef = useRef(null)
  const headerRef = useRef(null)
  const toolbarRef = useRef(null)
  const headingRef = useRef(null)
  const opener = useRef(null)
  const music = useMusic()
  const box = giftSize(viewport.w, viewport.h)
  const showDancer = dancerConfig.enabled && !dancerFailed && (dancerSources.length > 0 || !!dancerStill)
  const dancerH = showDancer ? dancerHeight(viewport.w, viewport.h, dancerConfig.heightPx ?? { desktop: 280, mobile: 220 }) : 0

  // Reads the rendered page and decides where photos may stand.
  const measure = useCallback(() => {
    const gift = giftRef.current
    if (!gift || !sceneRef.current || !headerRef.current) return
    const W = document.documentElement.clientWidth
    const sceneR = pageRect(sceneRef.current)
    const header = pageRect(headerRef.current)
    const h1 = pageRect(headerRef.current.querySelector('h1'))
    const back = pageRect(gift.querySelector('.gift__back'))
    // Text column: the greeting's own width, padded, never narrower than the gift.
    const half = Math.max(h1.width / 2 + 24, gift.offsetWidth * 0.9, Math.min(280, W * 0.2))
    const next = {
      ...computeSpots({
        W,
        H: window.innerHeight,
        top: sceneR.top + layoutConfig.edgePx,
        bottom: sceneR.bottom - layoutConfig.edgePx,
        center: { left: W / 2 - half, right: W / 2 + half },
        header,
        controls: toolbarRef.current ? pageRect(toolbarRef.current) : { bottom: 0 },
        gift: pageRect(gift),
        reserve: dancerRef.current ? pageRect(dancerRef.current) : null,
        edge: layoutConfig.edgePx,
        spacing: layoutConfig.spacingPx,
      }),
      mouth: { x: Math.round(back.left + back.width / 2), y: Math.round(back.top + back.height * 0.7) },
      ceiling: Math.round(header.bottom),
    }
    setScene((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [])

  useLayoutEffect(() => {
    measure()
  }, [measure, open, viewport, dancerH])

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    const onVis = () => setTabHidden(document.hidden)
    const ro = new ResizeObserver(() => measure())
    ro.observe(sceneRef.current)
    ro.observe(headerRef.current)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [measure])

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
  const onDancerFail = useCallback(() => setDancerFailed(true), [])
  const viewed = viewing === null ? null : photos[viewing]

  return (
    <div
      className={`app${open ? ' is-open' : ''}${tabHidden ? ' is-hidden' : ''}${showDancer ? ' has-dancer' : ''}`}
      style={{ ...themeVars, '--box': `${box}px`, '--dancer-h': `${dancerH}px` }}
    >
      <SceneBackground intensity={surprise.decorations} />

      {open && (
        <Toolbar
          ref={toolbarRef}
          music={music.status}
          onPlayMusic={music.play}
          onPauseMusic={music.pause}
          pauseTarget={[!noPhotos && 'photos', showDancer && 'dancing'].filter(Boolean)}
          photosPaused={userPaused}
          onTogglePhotos={() => setUserPaused((p) => !p)}
          onReplay={replay}
        />
      )}

      <div className="scene-frame" ref={sceneRef}>
        <header className="intro" ref={headerRef}>
          <h1 ref={headingRef} tabIndex={-1} aria-live="polite">
            {open ? surprise.greeting : surprise.intro}
          </h1>
          {!open && <p className="intro__hint">{surprise.hint}</p>}
        </header>

        <main className="stage">
          <div className="gift-zone">
            <div className="gift-anchor">
              <span className="stage__floor" aria-hidden="true" />
              <GiftBox ref={giftRef} open={open} onOpen={openGift} label="Open the gift" />
            </div>
            {open && noPhotos && <p className="empty-note">Photos coming soon.</p>}
          </div>
          {showDancer && (
            <div className="dance-zone">
              <Dancer
                ref={dancerRef}
                sources={dancerSources}
                still={dancerStill}
                active={open}
                paused={userPaused || tabHidden}
                revealDelayMs={dancerConfig.revealDelayMs ?? 1100}
                onFail={onDancerFail}
              />
            </div>
          )}
        </main>
      </div>

      {open && surprise.message && <p className="message">{surprise.message}</p>}

      {scene && (
        <PhotoStage
          key={`photos-${runId}`}
          photos={photos}
          scene={scene}
          active={open}
          paused={paused}
          timing={surprise.timing}
          bounce={surprise.bounce}
          photoScale={layoutConfig.photoScale}
          onEmpty={onEmpty}
          onView={(index, el) => {
            opener.current = el
            setViewing(index)
          }}
        />
      )}
      {confetti && scene && <Confetti key={`confetti-${runId}`} x={scene.mouth.x} y={scene.mouth.y} />}

      <PhotoViewer
        photo={viewed}
        label={viewed ? viewed.alt || `Photo ${viewing + 1} of ${photos.length}` : ''}
        onClose={closeViewer}
      />

      {musicSrc && <video className="music-media" src={musicSrc} {...music.mediaProps} aria-hidden="true" tabIndex={-1} />}
    </div>
  )
}
