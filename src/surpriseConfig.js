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
