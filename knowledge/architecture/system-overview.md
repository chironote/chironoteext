---
type: system-architecture
title: "Extension System Overview"
description: "Compact Chrome side-panel scope, authenticated workspace, and lifecycle boundaries."
resource: "../../src/App.js"
tags: [architecture, chrome-extension, side-panel, data-flow]
---

# Extension System Overview

The extension is a narrow companion to the website-owned ChiroNote product: record a visit, review generated or recent notes, and explicitly copy reviewed text into an EHR.

Manifest V3 has no global side-panel default. The service worker prepares a separate `index.html` panel for each existing, newly created, or replacement tab and enables Chrome's native `openPanelOnActionClick` behavior. Preparing a panel does not open it. Browser/worker startup reapplies tab configuration; there is no global path or custom click/open handler. The previous awaited `setOptions` then `open` sequence failed in the owner's Chrome, consistent with loss of user gesture across async work. Native toolbar toggling avoids that sequence entirely. Switching to a tab where ChiroNote is not open hides it; returning to the originating tab shows it again. Explicitly opening ChiroNote in another tab creates a separate workspace; there is no cross-tab transfer or single-instance lock. No extra tabs/storage permissions are required. The React workspace is keyed to the authenticated identity so switching accounts destroys the previous clinical state and recording controllers. Account management links open the website; sign-out and history navigation are disabled during startup, recording, uploading, transcription, and generation.

Recording, review, and history use the full panel one at a time. The default view is recording readiness. History is a toolbar toggle, not a permanent rail. Partial generated text remains non-copyable until stream completion. Errors are a separate controller value, never note content.

The panel must stay open during capture and processing. Tab switching uses Chrome's native hiding behavior, with no tab-activation teardown handler. Real-Chrome testing must verify recording and processing continuity while hidden; do not assume that unit tests prove Chrome's document lifecycle. Closing the owning tab also destroys its panel. React teardown and pagehide invalidate local startup, stop media tracks, cancel pending uploads/requests, and unsubscribe. Closing does not deliberately submit a final chunk. Already accepted backend work cannot be recalled and may finish independently. There is no offscreen recorder, automatic recovery, clinical-content persistence, EHR DOM access, or direct EHR insertion.

## Provenance

- `../../src/App.js`
- `../../public/manifest.json`
- `../../public/background.js`
- `../../src/components/Recording/RecordingManager.jsx`
- User-approved keep-panel-open lifecycle on 2026-08-28.
