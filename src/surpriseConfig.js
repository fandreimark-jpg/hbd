// Everything personal about the surprise lives here. Edit freely.
// Paths are relative to the `public/` folder.

const recipientName = 'Jennalyn R'

// One entry per photo, shown in this order, then loops.
//   src      original photo (opened in the large viewer; also the fallback)
//   cutout   transparent PNG of just the person ('' = show the original in a soft frame)
//   alt      short description for screen readers ('' = "Photo 3")
//   caption  optional text shown under the photo in the large viewer
const photo = (n) => ({
  src: `photos/p${n}.png`,
  cutout: `photos/cutouts/p${n}.png`,
  alt: '',
  caption: '',
})

export const surprise = {
  recipientName,
  intro: 'A little surprise for you',
  hint: 'Tap the gift to open.',
  greeting: `Happy Birthday, ${recipientName}!`,
  
  // Audio or video file; a video's picture is never shown, only its sound is used.
  music: 'music/kambing.mp4',

  photos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(photo),

  // Dancing person shown below the gift after it opens. Silent; the birthday music keeps playing.
  // `sources` must have a transparent background (see README for how dance-alpha.webm was made).
  dancer: {
    enabled: true,
    sources: [{ src: 'videos/processed/dance-alpha.webm', type: 'video/webm; codecs="vp9"' }],
    still: 'videos/processed/dance-still.webp', // transparent still for reduced motion and browsers without transparent video
    heightPx: { desktop: 280, mobile: 220 }, // largest size; shrinks on short screens
    revealDelayMs: 1100, // after the tap, when the dancer appears (lid is open by then)
  },

  timing: {
    photoHoldMs: 7000, // how long each photo stays on screen
    releaseDelayMs: 1300, // wait for the lid to open before the first photo
    releaseStaggerMs: 650, // gap between photos on the first release
    exitMs: 600, // fade-out before a spot gets its next photo
  },

  bounce: {
    heightPx: 12, // gentle in-place bounce once a photo has landed (about 8–16)
    seconds: 2.8, // one up-and-down cycle
  },

  layout: {
    edgePx: 16, // space between photos and the screen edges
    spacingPx: 14, // space between photos, the greeting, the gift and the controls
    photoScale: 1, // 0.6–1: shrink people below the largest size that fits their spot
  },

  // Balloons and sparkles behind everything: 0 = none, 0.5 = fewer and fainter, 1 = full.
  decorations: 1,

  theme: {
    cream: '#FBF4EC',
    blush: '#F3D2D0',
    rose: '#DE9DA6',
    gold: '#C3A062',
    goldDeep: '#9A7A3E',
    ink: '#4A2C38',
  },
}
