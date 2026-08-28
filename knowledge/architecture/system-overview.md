---
type: system-architecture
title: "Extension System Overview"
description: "Compact Chrome side-panel scope, authenticated workspace, and lifecycle boundaries."
resource: "../../src/App.js"
tags: [architecture, chrome-extension, side-panel, data-flow]
---

# Extension System Overview

The extension is a narrow companion to the website-owned ChiroNote product: record a visit, review generated or recent notes, and explicitly copy reviewed text into an EHR.

Manifest V3 registers a global side panel and a small service worker that configures toolbar-click opening. The React workspace is keyed to the authenticated identity so switching accounts destroys the previous clinical state and recording controllers. Account management links open the website; sign-out and history navigation are disabled during startup, recording, uploading, transcription, and generation.

Recording, review, and history use the full panel one at a time. The default view is recording readiness. History is a toolbar toggle, not a permanent rail. Partial generated text remains non-copyable until stream completion. Errors are a separate controller value, never note content.

The panel must stay open during capture and processing. React teardown and pagehide invalidate local startup, stop media tracks, cancel pending uploads/requests, and unsubscribe. Closing does not deliberately submit a final chunk. Already accepted backend work cannot be recalled and may finish independently. There is no offscreen recorder, automatic recovery, clinical-content persistence, EHR DOM access, or direct EHR insertion.

## Provenance

- `src/App.js`
- `public/manifest.json`
- `public/background.js`
- `src/components/Recording/RecordingManager.jsx`
- User-approved keep-panel-open lifecycle on 2026-08-28.
