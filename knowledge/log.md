# Knowledge Update Log

## 2026-07-16

- **Release**: Advanced the extension from `1.2.0` to `1.2.1` for the flat history-list and Today-aware timestamp update, then produced a fresh unpacked build.
- **History list alignment**: Replaced rounded history cards and trailing chevrons with flat full-width rows, thin dividers, compact week separators, and a restrained green selected rail matching the website and Android app.
- **History timestamps**: Standardized history metadata as `time | weekday | date`, using `time | Today` for notes from the current local calendar day across the extension, website, and Android app.
- **Side-panel architecture**: Replaced the separate popup-type window with a global Chrome side panel that stays docked beside the active EHR tab.
- **Responsive clinical surface**: Retained the focused recording, review, and history states while making the workspace usable down to a 320-pixel panel width.
- **Release**: Advanced the extension from `1.1.0` to `1.2.0` for the side-panel conversion.
- **Workflow rewrite**: Replaced the permanent history rail with a full-workspace history toggle and made recording readiness the default authenticated state.
- **Clipboard handoff**: Made recognized clinical section headings the primary copy controls, retained whole-note copy in the top bar, and added focused section parsing tests.
- **Brand and layout**: Adopted the website's black ChiroNote wordmark, labeled the compact top bar as the Chrome extension, and reduced the persistent window to 440 by 720 pixels.
- **Release**: Advanced the extension from `1.0.0` to `1.1.0` for the clinical-workspace UI/UX redesign.
- **Redesign**: Reframed the extension as a continuous clinical workspace with a stable visit-note rail, focused note review surface, and state-specific action hierarchy.
- **Workflow**: Clarified recording setup, consent guidance, live recording feedback, note generation, clinical review, and copy-to-EHR completion states.
- **Accessibility**: Standardized vector icons, focus indicators, status announcements, reduced-motion behavior, high-contrast semantic tokens, and destructive-dialog focus handling.

## 2026-07-13

- **Initialization**: Created the extension's Healtech simplified OKS and its architecture, component, design, infrastructure, and development concepts.
- **Creation**: Added [Extension Visual Style](./design/style.md) to preserve the Google-inspired compact card language and ChiroNote color adaptation.
- **Boundary**: Documented that Amplify remains website-owned, locally pulled, Git-ignored, and operated only by the repository owner.
