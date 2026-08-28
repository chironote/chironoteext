---
type: component-architecture
title: "Recent Notes and Clipboard Handoff"
description: "Owner isolation, realtime history reconciliation, completed-note review, and explicit clipboard actions."
resource: "../../src/hooks/useNotesHistory.js"
tags: [history, appsync, subscriptions, clipboard, clinical-review]
---

# Recent Notes and Clipboard Handoff

History queries up to 100 recent records for the authenticated username owner. Valid generated notes are merged by owner/timestamp, numerically sorted newest-first, and limited after deduplication. Empty and recognized backend-error payloads are excluded. Subscription events received during a query override that query's stale version of the same note. Other owners and late callbacks after cleanup are ignored.

The hook uses Amplify ConnectionState enum values plus online/offline events for Connecting, Synced, Reconnecting, and Offline. Synced describes the live connection, not a durable-save guarantee. Reconnection refetches history; failed subscriptions restart after five seconds while online. Retry history explicitly reloads the query and subscriptions. Network or query failures are visible.

Rows remain flat and full-width, with weekly groups and `time | Today` or `time | weekday | date` timestamps. Initial history opens the newest week and collapses older groups; refresh preserves the clinician's collapse choices. The labeled Recent Notes toolbar button opens history; during note review it reads Back to Notes with a back icon. Selecting a note returns to review. New Recording opens recording setup from history or review without starting capture; both navigation controls are disabled while a visit is busy.

Recording setup starts with Note settings expanded so the selected format and controls are immediately visible before recording begins.

Completed streamed notes reconcile with history by owner/timestamp, not text equality. Startup, recording, preparation, and generation block copying. A failed partial stream or error is never treated as a completed clinical note. Account identity changes remount and clear the complete workspace.

Subjective, Objective, Assessment, Plan, and Treatment headings copy their section body. Copy to Clipboard beside the Generated Note label and timestamp copies the whole note. Markdown/HTML cleanup is preserved. Copy is always user initiated; success and failure are announced, and whole-note failure suggests manual selection. Late clipboard promises cannot attach feedback to a different note. The review reminder asks clinicians to verify clinical accuracy before EHR entry. No EHR page access or automated insertion exists. The account menu retrieves the authenticated Cognito email through Amplify Auth; a failed attribute lookup safely leaves the existing sign-in identifier visible.

## Provenance

- `src/App.js` and `src/App.test.jsx`
- `src/hooks/useNotesHistory.js` and its tests
- `src/utils/mergeNotes.js`
- `src/components/History/`
- `src/utils/historyGrouping.js`, `src/utils/markdownStripper.js`, `src/utils/noteSections.js`
