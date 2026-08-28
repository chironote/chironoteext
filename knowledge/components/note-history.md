---
type: component-architecture
title: "Recent Notes and Clipboard Handoff"
description: "How completed notes load, update in realtime, group by week, become selected, and move to the EHR clipboard."
resource: "../../src/hooks/useNotesHistory.js"
tags: [history, appsync, subscriptions, clipboard, clinical-review]
---

# Recent Notes and Clipboard Handoff

The history hook queries up to 100 recent records for the authenticated owner, filters records without generated note text, and keeps them sorted newest-first. AppSync create and update subscriptions upsert notes without duplicates. Connection-state events power the compact Synced, Connecting, or Offline indicator in the top bar.

The history view groups records by week using shared timestamp helpers. Rows use a flat, full-width two-line treatment with thin dividers instead of rounded cards. Selected notes use a pale green surface and narrow green leading rail. Each row shows `time | weekday | date`; notes from the current local calendar day use `time | Today`. Compact week separators remain collapsible, with the current week expanded and older weeks collapsed. History is a full workspace toggle opened from the top-bar clock icon; it is never a permanent side rail. Selecting an item closes history and gives the note document visual priority.

Copying is always an explicit user action. `splitNoteIntoSections` recognizes Subjective, Objective, Assessment, Plan, and Treatment headings. Each recognized heading is rendered as an accessible hyperlink-style button that copies only its section body and announces success or failure inline. Because clinicians commonly move one section at a time, section copying is the primary document interaction; whole-note copy remains available through the top-bar copy icon.

Markdown and accidental HTML formatting are removed before the Clipboard API receives either a section or the full note. The interface reminds clinicians to review clinical accuracy before putting text into the EHR. This MVP neither reads from nor writes directly into an EHR page.

## Provenance

- `src/hooks/useNotesHistory.js`
- `src/components/History/HistorySidebar.jsx`
- `src/components/History/NoteWorkspace.jsx`
- `src/utils/historyGrouping.js`
- `src/utils/markdownStripper.js`
- `src/utils/noteSections.js`
- `C:/Users/nikit/ChiroNote/website/chironoteV4/src/components/Sidebar/` as the history interaction reference.
