import { useEffect, useRef, useState } from 'react'

// Transparent VP9 video is not rendered with alpha by Safari (it shows a black box),
// so Safari gets the transparent still unless an HEVC-with-alpha source is configured.
const isSafari = () => /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent)
const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Silent dancing person below the gift. One <video> for the whole session:
 * hidden while the gift is closed, revealed after the lid opens, paused with
 * the photos, rewound and hidden on replay.
 */
export default function Dancer({ ref, sources, still, active, paused, revealDelayMs, onFail }) {
  const video = useRef(null)
  const [revealed, setRevealed] = useState(false)
  const [mode] = useState(() => {
    const hevc = sources.some((s) => s.type.includes('hvc1'))
    if (calm() || (isSafari() && !hevc) || !sources.length) return still ? 'still' : 'none'
    return 'video'
  })

  // Reveal once the opening sequence reaches the lid. When the surprise closes
  // (replay), hide again and rewind to the first frame.
  useEffect(() => {
    if (!active) return
    const v = video.current
    const t = setTimeout(() => setRevealed(true), revealDelayMs)
    return () => {
      clearTimeout(t)
      setRevealed(false)
      if (!v) return
      v.pause()
      try {
        v.currentTime = 0
      } catch {
        // not loaded yet: nothing to rewind
      }
    }
  }, [active, revealDelayMs])

  // Play only while revealed and not paused; resumes from where it stopped.
  const playing = active && revealed && !paused
  useEffect(() => {
    const v = video.current
    if (!v || mode !== 'video') return
    if (!playing) {
      v.pause()
      return
    }
    v.muted = true // belt and braces: the clip's own sound never plays
    v.play()?.catch((err) => {
      // Autoplay refused (e.g. power saving): the poster still stays on screen.
      if (err?.name !== 'AbortError' && err?.name !== 'NotAllowedError') onFail?.()
    })
  }, [playing, mode, onFail])

  if (mode === 'none') return null
  return (
    <div ref={ref} className={`dancer${revealed ? ' is-revealed' : ''}`} aria-hidden="true">
      {mode === 'video' ? (
        <video
          ref={video}
          className="dancer__media"
          muted
          loop
          playsInline
          disablePictureInPicture
          preload="none"
          poster={still || undefined}
          tabIndex={-1}
          onError={onFail}
        >
          {sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} onError={s === sources[sources.length - 1] ? onFail : undefined} />
          ))}
        </video>
      ) : (
        <img className="dancer__media" src={still} alt="" draggable="false" onError={onFail} />
      )}
    </div>
  )
}
