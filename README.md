# Clean Sport Quest

An offline-first Electron and React MVP for learning anti-doping basics. Progress is stored in a local SQLite database under Electron's `userData` directory.

## Run locally

```sh
npm install
npm start
```

## Build a macOS DMG

```sh
npm run dist
```

The current builder target is Apple Silicon (`arm64`). Output is written to `release/`. A Developer ID certificate is needed to sign and notarize a distributable macOS app.

## Project layout

- `main.js` — Electron window, local SQLite database, and IPC handlers
- `preload.js` — restricted `contextBridge` API for the renderer
- `vite.config.js` — React renderer dev server and production bundler
- `src/` — React UI, lesson content presentation, and styles

## Privacy and learning scope

Progress stays on this device. There is no account, cloud sync, analytics service, or social backend; the leaderboard is sample data. Lessons are general education, not medical or legal advice. Rules and the Prohibited List change, so athletes should confirm current requirements with NADA/WADA and qualified medical professionals.

Official starting points:

- [WADA World Anti-Doping Code](https://www.wada-ama.org/en/what-we-do/world-anti-doping-code)
- [WADA Anti-Doping Education and Learning](https://adel.wada-ama.org/)
- [NADA India](https://www.nadaindia.org/)
