// src -> Promise<{ ok, ratio, height }>. Shared across replays so photos load once.
const loads = new Map()
export function loadPhoto(src) {
  if (!loads.has(src)) {
    loads.set(
      src,
      new Promise((resolve) => {
        const img = new Image()
        img.onload = () =>
          Promise.resolve(img.decode?.())
            .catch(() => {})
            .then(() => resolve({ ok: true, ratio: img.naturalWidth / img.naturalHeight, height: img.naturalHeight }))
        img.onerror = () => resolve({ ok: false })
        img.src = src
      }),
    )
  }
  return loads.get(src)
}

// Prefers the transparent cutout; falls back to the original photo in a frame.
export async function loadDisplay(photo) {
  if (photo.cutout) {
    const res = await loadPhoto(photo.cutout)
    if (res.ok) return { ...res, src: photo.cutout, cutout: true }
  }
  const res = await loadPhoto(photo.src)
  return res.ok ? { ...res, src: photo.src, cutout: false } : res
}
