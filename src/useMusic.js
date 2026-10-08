import { useCallback, useRef, useState } from 'react'

// One looping media element. status: idle | playing | paused | blocked | unavailable
export function useMusic() {
  const ref = useRef(null)
  const [status, setStatus] = useState('idle')

  // Must be called directly from a click/tap so browsers allow playback.
  const play = useCallback(() => {
    const el = ref.current
    if (!el) return setStatus('unavailable')
    let attempt
    try {
      attempt = el.play()
    } catch {
      setStatus('unavailable')
      return
    }
    attempt?.catch((err) => {
      if (err?.name === 'AbortError') return // interrupted by a pause/replay, not a failure
      setStatus(err?.name === 'NotAllowedError' ? 'blocked' : 'unavailable')
    })
  }, [])

  const pause = useCallback(() => ref.current?.pause(), [])

  const reset = useCallback(() => {
    setStatus((s) => (s === 'unavailable' ? s : 'idle'))
    const el = ref.current
    if (!el) return
    el.pause()
    try {
      el.currentTime = 0
    } catch {
      // not seekable yet; nothing to rewind
    }
  }, [])

  const mediaProps = {
    ref,
    loop: true,
    playsInline: true,
    preload: 'metadata',
    onPlaying: () => setStatus('playing'),
    onPause: () => setStatus((s) => (s === 'playing' ? 'paused' : s)),
    onError: () => setStatus('unavailable'),
  }

  return { status, play, pause, reset, mediaProps }
}
