import { useEffect, useRef } from 'react'

// Native modal <dialog>: traps focus and closes on Escape by itself.
// Visibility follows `photo`; no cleanup-close, so Strict Mode re-runs are harmless.
export default function PhotoViewer({ photo, label, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (photo && !dialog.open) dialog.showModal()
    if (!photo && dialog.open) dialog.close()
  }, [photo])

  return (
    <dialog
      ref={ref}
      className="viewer"
      aria-label={label}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {photo && (
        <figure className="viewer__frame">
          <img src={photo.src} alt={photo.alt || photo.caption || label} />
          {photo.caption && <figcaption>{photo.caption}</figcaption>}
          <button type="button" className="viewer__close" onClick={onClose} autoFocus>
            Close
          </button>
        </figure>
      )}
    </dialog>
  )
}
