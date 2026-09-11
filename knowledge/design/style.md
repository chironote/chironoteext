---
type: design-system
title: "Extension Visual Style"
description: "Shared clinical product colors adapted to a compact, accessible Chrome side panel."
resource: "../../src/App.css"
tags: [design, clinical-workspace, chiro-colors, accessibility, older-users]
---

# Extension Visual Style

Use the website's authenticated clinical style as the product reference, not its warmer marketing palette. Keep one recording/review/history surface and the existing compact side-panel composition. Chrome's side-panel header supplies the logo and name, so the authenticated toolbar does not repeat the wordmark; the sign-in screen retains its branding.

The local token adapter maps primary action to #2e6930, strong brand to #1e4620, text to #102410, secondary text to #5c705d, borders to #cfdbcf, and soft surfaces to #fbfdfb / #f8f9fa. Error text uses #721c24 with pale red surfaces. Focus uses an opaque product-green outline. No remote fonts or scripts are loaded; the system sans-serif stack is the Chrome adapter, while clinical note content retains a readable 14px monospace treatment. Metadata has a 12px minimum.

The header reserves a small status row so its controls remain usable at 320px. Recent Notes pairs its label with a history icon, changing to Back to Notes with a back icon during review. New Recording pairs a microphone with its label beside the account control and turns solid dark product green on hover or keyboard focus. Primary controls and toolbar buttons target 48px hit areas. History keeps flat rows, weekly groups, Today labels, and a restrained green selection rail. In history, the search field and actions remain on one baseline; at 380px and below New Recording becomes a labeled-by-accessibility 48px microphone control so the search, recording, and account controls fit without horizontal overflow. At very narrow effective widths below 300px, the header/actions may wrap.

Ready recording has one dominant green start action with Note settings expanded on entry, so format controls are immediately visible before recording begins. Active recording shows a timer, explicit status, Pause/Resume, Finish visit, and separate Discard. Processing is named. A persistent hint explains the keep-panel-open lifecycle and the inability to recall accepted backend work. Do not imply the decorative bars are a measured audio meter.

In history, replace the active Recent Notes toolbar highlight with a labeled Search notes input: an outlined search icon, pale surface, rounded border, 16px input text, strong green focus ring, and a labeled clear button. Align its field with New Recording and the account control on the same row at normal side-panel widths. Keep the Recent notes heading, announce filtered counts, and explain that search covers labels and full content of loaded notes. Do not hide matching results behind collapsed week groups.

Review prioritizes the note, section-level copy, and clinical review guidance. The labeled Copy to Clipboard action sits beside Generated Note and its timestamp; New Recording is in the toolbar instead of a duplicate footer action. Status/error feedback uses words and live announcements. Short panels scroll; the note body has its own readable scroll region. Account controls support Escape and focus return. The destructive dialog traps focus, supports Escape, and restores its trigger when possible. Reduced-motion overrides remain global.

## Provenance

- `src/index.css`, `src/App.css`, `src/components/Recording/Recording.css`
- `src/components/Recording/ConfirmationPopup.jsx`
- Website `knowledge/development/STYLE.md` reviewed 2026-08-28
- UI/UX Pro Max accessibility guidance
- Synthetic real-component layout previews under ignored `release-artifacts/visual/`; these are not authenticated side-panel acceptance evidence.
