---
type: system-architecture
title: "Extension System Overview"
description: "Product boundaries, persistent Chrome side-panel behavior, major client modules, and end-to-end note flow."
resource: "../../src/App.js"
tags: [architecture, chrome-extension, side-panel, data-flow]
---

# Extension System Overview

The extension is a narrow companion to the ChiroNote website, not a second full product. Its job is to keep recording, generated notes, recent history, and clipboard handoff available beside an EHR without a ChiroNote browser tab.

Chrome loads a Manifest V3 service worker from `public/background.js`. The manifest registers `index.html` as a global side panel, and the service worker configures the toolbar action to toggle it. The React application remains mounted beside the active browser tab while the clinician interacts with the EHR, which protects the microphone and note-generation lifecycle from the focus-loss behavior of a toolbar dropdown popup and avoids a separate window being covered by the EHR.

After Amplify authentication, `src/App.js` owns one full-width workspace with explicit view states:

1. Recording readiness, active recording, transcript preparation, and note generation.
2. Generated or selected-note review with whole-note and section-level clipboard actions.
3. Weekly recent-note history backed by AppSync queries and subscriptions.

The clock icon toggles history into the full workspace instead of reserving permanent horizontal space. Selecting a history item returns directly to the review state. The default authenticated view is recording readiness, so the clinician can start an ordinary visit with one click while saved note-format preferences remain available through progressive disclosure.

Recording captures microphone audio, uploads ordered chunks to Amplify Storage, notifies SQS, waits for transcript completion through AppSync, and streams the generated note from the existing Lambda URL. Completed notes return through history subscriptions and remain owned by the production ChiroNote backend.

The extension deliberately excludes live dictation, Smart Editor, account management, direct EHR DOM access, marketing, analytics, and full website navigation.

## Provenance

- `public/manifest.json`
- `public/background.js`
- `src/App.js`
- `src/components/Recording/`
- `src/hooks/useNotesHistory.js`
- User decision on 2026-07-16 to use a global Chrome side panel as the clinical companion surface.
