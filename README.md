# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Birthday surprise

- Run: `npm install` once, then `npm run dev` and open the printed URL.
- Edit name, message, colors, timing, bounce, decorations, photos and music in `src/surpriseConfig.js`.
- Photos: put the original in `public/photos/` and, if you have one, a transparent PNG of just the person in `public/photos/cutouts/` with the same name. Each entry in the config's `photos` list has `src` (original, used in the large viewer), `cutout` (transparent version; `''` shows the original in a soft frame instead), `alt` and `caption`. List order is display order.
- Music: put an audio file (`.mp3`, `.m4a`) or a video with sound (`.mp4`) in `public/music/` and set `music: 'music/<file name>'`.
- Layout self-check: `node src/photoLayout.check.js`.
