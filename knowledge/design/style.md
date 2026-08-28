---
type: design-system
title: "Extension Visual Style"
description: "Single-surface clinical workflow, semantic colors, compact controls, section-first review, and accessibility rules."
resource: "../../src/App.css"
tags: [design, clinical-workspace, chiro-colors, accessibility, older-users]
---

# Extension Visual Style

The extension uses a calm single-surface style designed around one linear task: start a visit, record, generate, review, and copy into the EHR. Recording, review, and history replace one another within the workspace instead of competing side by side. Visual hierarchy comes from spacing, typography, and state rather than decorative surfaces.

## Color roles

- Primary action: `#1f6b5c` clinical teal-green.
- Primary hover and strong brand text: `#185247` and `#123c35`.
- Soft selected and icon surfaces: `#eff8f5` and `#dceee9`.
- Main text: `#17201e`; supporting text: `#52615d`; tertiary text: `#596863`.
- Borders: `#d9e2de`; work surface: white; note and history surfaces use restrained off-whites.
- Destructive actions use `#a53c3c` only for discard and limit/error states. Status is always paired with text, an accessible label, or an icon.

## Layout and surfaces

The workspace fills Chrome's resizable side panel and remains usable from 320 pixels wide. The 58-pixel top bar uses the website-owned black ChiroNote wordmark, labels the surface as the visit companion when space permits, and packs whole-note copy, history toggle, connection state, and account access into one compact row. The clock icon swaps full-width history with the active visit workspace; no internal side rail is reserved.

The generated note document receives the greatest available area. Only functional groups—generated document, optional note-format preferences, processing, and active recording—receive borders. History follows the website and Android list language: flat full-width rows, thin dividers, two-line label and timestamp hierarchy, compact collapsible week separators, and a restrained green selected rail. Nested card stacks, glass effects, decorative gradients, and ornamental animation are prohibited.

## Controls and typography

Use the native system sans-serif stack for instant rendering and a monospace stack for the generated note itself. Primary actions are at least 44 pixels tall, text-labeled, and solid brand green. Secondary actions are white with neutral borders and remain visually quieter. Use one consistent outlined SVG icon family; top-bar icon actions require accessible labels and tooltips.

Recording readiness uses one dominant green start surface and keeps the saved note-format summary visible beneath it. Optional Exam and Personal Injury settings use progressive disclosure. Active recording feedback is unmistakable: a red recording state, elapsed timer, subtle sound bars, and full text labels for Finish, Pause/Resume, and Discard. The finish action dominates; discard is spatially separated. Loading states explain both what is happening and that the window should remain open.

Note review does not add a large title above the clinical content. A small metadata row gives the note context, then the document fills the workspace. Recognized clinical section headings are green, underlined copy targets with inline word-based feedback. Whole-note copy is a quieter top-bar action, and Start next visit remains secondary beneath the document.

## Older-clinician usability

Keep one dominant decision per state, avoid hidden gestures, preserve strong contrast, and give every important action a text label or unambiguous accessible name. Status changes such as copied, paused, offline, or generating must be stated in words rather than conveyed by color alone.

## Provenance

- `src/index.css`
- `src/App.css`
- `src/components/Recording/Recording.css`
- `src/assets/fulllogo.svg`, synchronized with `C:/Users/nikit/ChiroNote/website/chironoteV4/src/assets/textlogo-blk.svg` on 2026-07-16.
- `C:/Users/nikit/ChiroNote/website/chironoteV4/src/components/Sidebar/ContentPopup.jsx` as the section-copy interaction reference.
- UI/UX Pro Max accessibility and interaction review on 2026-07-16.
