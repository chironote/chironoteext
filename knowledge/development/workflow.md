---
type: development-workflow
title: "Extension Development Workflow"
description: "Build commands, unpacked Chrome installation, validation, coding conventions, and change-scope rules."
resource: "../../package.json"
tags: [development, build, testing, chrome, workflow]
---

# Extension Development Workflow

Use npm with the checked-in lockfile. `npm install` restores dependencies, `npm test` runs the non-watch CRA test command, and `npm run build` produces the unpacked extension in `build/`. The build disables inline runtime code and source maps so the output is compatible with Manifest V3 extension-page security requirements.

Load `build/` from `chrome://extensions` with Developer mode enabled. After rebuilding, reload the extension card. Clicking the pinned toolbar icon must toggle the global ChiroNote side panel in the current Chrome window. Confirm that it remains visible and mounted while interacting with an EHR tab.

Use JavaScript and JSX with two-space indentation, single quotes, semicolons, and focused feature folders. Keep Chrome permissions minimal. Do not introduce remote JavaScript, analytics, broad EHR page permissions, patient-data persistence, or PHI-bearing logs.

Changes to recording behavior require tests or manual validation of microphone permission, start, pause, resume, stop, discard, chunk upload, transcript waiting, streamed generation, and cleanup. UI changes require visual inspection at typical side-panel widths and at the 320-pixel minimum width.

Update relevant OKS concepts and the knowledge log whenever architecture, behavior, visual rules, infrastructure ownership, or workflow changes.

## Provenance

- `package.json`
- `.env`
- `public/manifest.json`
- `public/background.js`
- `README.md`
- `AGENTS.md`
