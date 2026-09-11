# ChiroNote Chrome extension 1.3.1 — release candidate

## Single purpose

Record a visit, review generated or recent clinical notes, and explicitly copy reviewed text into an EHR. ChiroNote opens as a Chrome side panel scoped to the tab where its toolbar icon is clicked (Chrome 116+). Switching to an unopened tab hides it; returning shows it again. An explicit click in another tab opens a separate workspace. Click the icon again or use the panel close button to close it. It does not read EHR pages, inject content scripts, or paste into another application automatically.

## Reviewer setup

1. Install the candidate through the owner's normal review channel, pin ChiroNote, and click the toolbar icon.
2. Sign in with an existing dedicated test account supplied privately by the owner. Credentials must not be included in this repository or the ZIP. Self-service signup is not included in the extension.
3. Use synthetic conversations only. Confirm consent, click Start recording, and allow the microphone when Chrome asks.
4. Keep the side panel open. Test Pause, Resume, Finish visit, generation, and the review reminder. Copy the full note and each SOAP/Treatment section into a dummy text field.
5. Open Recent notes, select a saved note, and confirm the selected note replaces the workspace. Return to history and drag a synthetic note into a dummy EHR text field; verify its complete text transfers and the source note remains intact. Account management opens the ChiroNote website.
6. Close the panel during a separate recording, reopen it, and confirm recording has stopped. Local audio recovery is intentionally not offered. Work already accepted by the backend may finish independently.

## Permission explanations

- `sidePanel`: provides the companion surface beside the active tab.
- Cognito regional hosts: authenticate the existing ChiroNote account and obtain temporary AWS credentials.
- AppSync API and realtime hosts: retrieve the signed-in owner's notes and receive transcription/history updates.
- The configured S3 bucket: upload microphone audio for transcription.
- Regional SQS and the existing note-generation Lambda URL: submit uploaded audio and request generated notes.
- Microphone access is requested through Chrome's media prompt when starting a visit; clipboard writes occur only after an explicit copy action. No clipboard-reading permission is requested.

All executable application code is bundled. No analytics, remote JavaScript, marketing screens, EHR access, or background-recording host is included.

## Owner checklist before submission

- Complete every pending scenario in `knowledge/development/release-readiness.md` against the actual unpacked candidate.
- Confirm version 1.3.1 exceeds the existing Web Store version and retain the currently published release artifact. The saved 1.2.1 baseline here is a local build, not proof of the published version.
- Provide working test-account credentials privately and verify the account has recording time.
- Use the August 29, 2026 public privacy-policy URL and confirm its store data-use declarations remain accurate. Review `release/privacy-disclosures.md` and `release/store-submission.md`; neither replaces the product's published policy.
- Capture final store screenshots from the actual side panel using synthetic data. The screenshots in `release-artifacts/visual/` are component-layout evidence, not verified store screenshots.
- Submit only the candidate ZIP; never upload the entire repository or baseline archive. Do not publish without owner approval.
