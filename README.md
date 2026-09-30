# Pageflipper

A lightweight static reading experience for **Lunch Time — One-Way Reset**.

## Project structure

- `index.html` — library and reader shell.
- `app.js` — view switching, language state, progress tracking, and Service Worker registration.
- `novel-data.js` — frozen multilingual content and UI translations.
- `style.css` — responsive visual system and reading layout.
- `assets/background.webp` — optimized background asset.
- `sw.js` — offline asset cache with network-first navigation fallback.
- `manifest.webmanifest` — installable web app metadata.
- `404.html` — static-hosting not-found page.
- `scripts/validate-references.mjs` — cross-file reference and content-contract validator.

## Validate

```bash
npm run validate
```

The validator checks:

- Local HTML and CSS asset references.
- Application DOM IDs referenced by JavaScript.
- Translation keys across Arabic, English, and Japanese.
- Novel and chapter content for every supported language.
- Service Worker cache entries.

## Run locally

```bash
python3 -m http.server 4173
```

Open `http://127.0.0.1:4173/`. Service Workers require HTTPS or localhost and will not activate from a `file://` URL.
