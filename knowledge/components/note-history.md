---
type: component-architecture
title: "Recent Notes and Clipboard Handoff"
description: "Owner isolation, realtime history reconciliation, completed-note review, and user-initiated EHR handoff."
resource: "../../src/hooks/useNotesHistory.js"
tags: [history, appsync, subscriptions, clipboard, drag-and-drop, clinical-review]
---

# Recent Notes and Clipboard Handoff

History queries up to 100 recent records for the authenticated username owner. Valid generated notes are merged by owner/timestamp, numerically sorted newest-first, and limited after deduplication. Empty and recognized backend-error payloads are excluded. Subscription events received during a query override that query's stale version of the same note. Other owners and late callbacks after cleanup are ignored.

The hook uses Amplify ConnectionState enum values plus online/offline events for Connecting, Synced, Reconnecting, and Offline. Synced describes the live connection, not a durable-save guarantee. Reconnection refetches history; failed subscriptions restart after five seconds while online. Retry history explicitly reloads the query and subscriptions. Network or query failures are visible.

Rows remain flat and full-width, with weekly groups and `time | Today` or `time | weekday | date` timestamps. Initial history opens the newest week and collapses older groups; refresh preserves the clinician's collapse choices. The labeled Recent Notes toolbar button opens history; during note review it reads Back to Notes with a back icon. Selecting a note returns to review. New Recording opens recording setup from history or review without starting capture; both navigation controls are disabled while a visit is busy.

Recording setup starts with Note settings expanded so the selected format and controls are immediately visible before recording begins.

While history is open, the Recent Notes toolbar button is replaced by a labeled search field with a search icon. The field shares a baseline with New Recording and the account control; at 380px and below the recording label is visually hidden while its accessible label remains. It filters loaded recent notes locally by the complete `noteLabel` and `note` body, case-insensitively. Whitespace-separated terms must all match, including across label and content. Search does not query older records beyond the hook's loaded recent-history limit or persist/log the query. Matches appear immediately with a result count and useful no-match guidance; matching weeks are expanded during search without changing the saved collapse choices. Clear or Escape restores the normal list. Query state survives review/back navigation within the workspace and resets on authenticated identity change. Realtime note changes also update search results, and loading/error/retry feedback remains available.

Completed streamed notes reconcile with history by owner/timestamp, not text equality. Startup, recording, preparation, and generation block copying. A failed partial stream or error is never treated as a completed clinical note. Account identity changes remount and clear the complete workspace.

Subjective, Objective, Assessment, Plan, and Treatment headings copy their section body. Copy to Clipboard beside the Generated Note label and timestamp copies the whole note. Markdown/HTML cleanup is preserved. Copy is always user initiated; success and failure are announced, and whole-note failure suggests manual selection. Late clipboard promises cannot attach feedback to a different note. The review reminder asks clinicians to verify clinical accuracy before EHR entry.

Each complete Recent Notes row is also draggable. Starting a drag publishes the trimmed complete note only as `text/plain` with a copy effect, allowing the browser or destination EHR to handle the drop in the parent page. The row remains selectable for review and explicit clipboard copy, providing the keyboard-accessible alternative to the pointer gesture. Dragging is visibly indicated and does not log note content, inspect the EHR, request page permissions, or automate insertion.

The account menu retrieves the authenticated Cognito email through Amplify Auth; a failed attribute lookup safely leaves the existing sign-in identifier visible.

## Provenance

- `src/App.js` and `src/App.test.jsx`
- `src/hooks/useNotesHistory.js` and its tests
- `src/utils/mergeNotes.js`
- `src/components/History/`
- `src/utils/historyGrouping.js`, `src/utils/markdownStripper.js`, `src/utils/noteSections.js`
