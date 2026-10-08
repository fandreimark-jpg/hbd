const Note = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M8 15.5a2.5 2.5 0 1 1-2-2.45V4l9-2v10.5a2.5 2.5 0 1 1-2-2.45V5.5L8 6.6z" />
  </svg>
)

export default function MusicControl({ status, onPlay, onPause }) {
  if (status === 'unavailable') {
    return (
      <p className="music-status" role="status">
        Music isn&rsquo;t available right now
      </p>
    )
  }
  if (status === 'playing' || status === 'paused') {
    const on = status === 'playing'
    return (
      <button type="button" className="control" aria-pressed={on} onClick={on ? onPause : onPlay}>
        <Note />
        {on ? 'Music on' : 'Music off'}
      </button>
    )
  }
  // idle (never started) or blocked by the browser
  return (
    <button type="button" className="control control--accent" onClick={onPlay}>
      <Note />
      Play music
    </button>
  )
}
