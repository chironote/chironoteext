# Knowledge Update Log

## 2026-10-21

- **Publishing API and 1.3.2 preflight**: Owner enabled/linked the dedicated keyless identity under Publisher > Settings. Added the [API workflow](./development/workflow.md), verified published/draft 1.3.1 with no pending submission, and updated [release readiness](./development/release-readiness.md) and version metadata for the recovery update. The 1.3.2 preparation passed 115 tests/build/MV3/OKS and exact archive verification; its path/hash are recorded in release readiness. Browser restriction remains; no 1.3.2 publication is claimed at preflight.

- **Production release preparation**: Integrated reviewed PR 5 into main; refreshed [release readiness](./development/release-readiness.md) with compatibility evidence, exact source/checks, owner-reported prior submission, preserved October 16 release history and the live version/pending-state gate. Store automation remains blocked; no new publication is claimed.

- **Recovered-result candidate**: documented split stream controls, authoritative recovered body/version retrieval, session ownership, uncertainty and platform acceptance limits in [the recovery contract](components/recording-workflow.md). Synthetic validation only; no merge or production publication.

## 2026-10-16

- **Production package handoff**: Owner's Package screenshot shows draft/published 1.3.0. Preserved the latest validated source package as an explicitly named production 1.3.1 ZIP, rechecked source/hash/archive metadata, and recorded the exact upload path in [release readiness](./development/release-readiness.md). Upload/review/public availability remain unverified.

- **Production destination authorized**: Owner changed extension distribution from testers to public production. Updated [release readiness](./development/release-readiness.md) with fresh remote main verification and the remaining store-access/version-history blocker. No upload, submission, publication or feature enablement occurred.

## 2026-10-15

- **Tester release preparation**: Recorded fresh main `eaf0bc3`, 94 passing tests, successful build/MV3/ZIP gates, clean runtime audit and preserved fallback archives in [release readiness](./development/release-readiness.md). Candidate remains validation-only 1.3.1 with patient features disabled. Store/browser access prevents live version, isolated tester audience and real-Chrome verification; no upload or publication occurred.

- **Copy text preservation**: Updated [clipboard behavior](./components/note-history.md) for copy-only cleanup that preserves lists, numbering, quotes, rules and literal punctuation while removing paired Markdown formatting. Generation/display and SOAP extraction are unchanged; added separate helper and regression coverage. Source-only integration; no publication.

- **Custom Instructions handoff**: Added a direct website Settings link to the existing account menu. Preferences stay account-owned and apply through the shared generator; no extension editor, permission, version or backend change. Updated [system overview](./architecture/system-overview.md). Store publication and authenticated Chrome acceptance remain separate.

- **Knowledge validation**: Repaired concept-relative provenance links and added the index route to this log. Historical website/ignored-preview evidence remains identified as external or local-only. The [visual style](./design/style.md) now records the disabled gray Exam state.

- **Exam layout capture**: Updated [recording](./components/recording-workflow.md) and [patient notes](./architecture/patient-notes.md) for visible forced new-patient Exam, editable unassigned Exam, preservation of Exam/PI choices at typed-name confirmation, and separate synchronous session settings. Included the minimal typed-name capture/duplicate-check prerequisites from the prior local candidate. Source-only Git integration; no deployment, flag, version, backend or publishing change.

## 2026-10-10

- **Update**: Added patient capture/history integration, separate names/labels, guarded saved-note workflows and automatic language selection. Removed full clinical payload logging. Desktop extension has persistent Save and a website handoff for profiles/signature/export. It has no Patients directory and must never run Amplify backend operations. Local candidate only; no push, release or deployment.

## 2026-09-13

- **Update**: Declared OKF version 0.1 in the [knowledge index](./index.md) to align the extension with the shared ChiroNote knowledge format; verified concept metadata, provenance, index coverage, resource paths, and local links.

## 2026-09-11

- **1.3.1 store update preparation**: Included the pending whole-note drag and history toolbar changes and advanced package/manifest versions. All 64 tests in 10 suites pass. Owner authorized merge and submission; browser tooling rejected gallery/dashboard access, so store upload and actual side-panel acceptance remain outstanding.

## 2026-09-01

- **Whole-note drag handoff**: Recent Notes rows now transfer the complete trimmed note as plain text when dragged into the parent EHR page. Row selection and reviewed clipboard copy remain available as the keyboard-accessible alternatives, and no page-reading permission or automated insertion was added.

## 2026-08-29

- **History toolbar balance**: Kept search, New Recording, and account controls on one aligned row at standard side-panel widths. At 380px and below, New Recording retains its accessible name while using a compact 48px microphone presentation to prevent horizontal clipping.
- **Web Store submission handoff**: Verified the published August 29 privacy policy against current extension data handling, audited the unpublished 1.3.0 dashboard draft, prepared exact listing/privacy/reviewer copy, and generated current synthetic store icon, screenshots, and promotional tiles. Recorded the verified candidate hash and preserved owner gates for credentials, distribution choices, package upload, and final submission.
- **Web Store draft updated**: Uploaded the verified candidate and saved the Workflow & Planning listing, all graphic assets, privacy/permission declarations, and reviewer steps. Confirmed Free of charge, Public, and All regions. Review remains disabled until the publisher adds and verifies a public contact email; no submission was made.
- **Publisher identity prepared**: Changed the public publisher display name from `executive` to `ChiroNote`, added `development@chironote.ai` as the public contact, and sent Google's verification message. Email verification, reviewer credentials, and explicit submission approval remain outstanding.
- **Publisher contact verified**: Confirmed `development@chironote.ai` as the verified public contact. Chrome now enables Submit for review, but reviewer credentials and explicit submission approval remain outstanding; no submission was made.

## 2026-08-28

- **Recent-note search**: Replaced the active Recent Notes toolbar button with an accessible search field and icon. Local filtering covers full labels and note bodies, expands matching weeks, preserves review/back search state, and restores normal grouping on clear/Escape. Added regression coverage for content/label matching, realtime changes, empty/error states, and account reset.

- **Toolbar opening correction**: Owner testing found the initial tab-scoped version opened no panel. Replaced the async click handler with native toolbar toggling and preconfigured contextual panels for existing/new/replacement tabs and browser startup. Regression tests now prohibit programmatic opening or a custom click handler. Tests do not prove real-Chrome opening or recording continuity.

- **Tab-scoped side panel**: Removed the global default, configured and opened only the toolbar-clicked tab, and raised the Chrome minimum to 116 without adding permissions. Added worker/manifest regression tests and updated setup/release checks for tab hiding/restoration and separate explicit openings. Real-Chrome recording continuity while hidden remains an owner acceptance gate.

- **Side-panel touch-ups**: Removed duplicate authenticated branding, labeled Recent Notes / Back to Notes navigation, added New Recording in the toolbar, and moved whole-note Copy to Clipboard beside Generated Note while retaining busy-state guards and section copy.
- **Account and recording controls**: The account menu now displays the authenticated Cognito email when available, and New Recording uses the dark product-green hover/focus state.
- **Recording setup**: Note settings now start expanded so format options remain visible before the first recording action.
- **Recording safety**: Updated recording and architecture concepts for isolated sessions, ordered/cancellable uploads, teardown without finalization, startup eligibility gating, and completed-only generation with separate errors.
- **History and account safety**: Documented owner/timestamp reconciliation, realtime/query merging, real connection states, reconnect/retry behavior, account remounting, and clipboard feedback.
- **Clinical parity**: Aligned the design concept with shared product greens, system-font adaptation, readable text, keyboard/dialog behavior, short-panel scrolling, and keep-open guidance.
- **Release candidate**: Added [Extension Release Readiness](./development/release-readiness.md), reproducible MV3 build/package checks, privacy/reviewer handoff, security audit limits, and explicit outstanding real-Chrome acceptance. Version 1.3.0 is not approved for production or published.

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
