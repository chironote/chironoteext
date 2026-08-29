# ChiroNote Chrome Extension

ChiroNote's compact recording companion opens in Chrome's side panel beside an EHR. It uses the existing ChiroNote account and production backend to record a conversation, generate a clinical note, review recent notes, and copy a selected note.

## Local build

The repository expects the owner to pull the existing Amplify environment before building. Amplify infrastructure and generated environment configuration are deliberately ignored by Git. Agents and contributors must not run Amplify CLI commands.

```powershell
npm ci
npm test
npm run build
npm run package:release
```

## Load the unpacked extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Choose **Load unpacked**.
4. Select this repository's `build` directory.
5. Pin ChiroNote and click its icon. The icon opens ChiroNote only beside that tab (Chrome 116+). Switching to a tab where you have not opened ChiroNote hides the panel; returning to the original tab shows it again. Click the icon again or use the panel close button to close it. Opening ChiroNote in another tab creates a separate workspace.

After source changes, run `npm run build` and choose **Reload** on the extension card.

## Companion scope

- Existing-user Amplify authentication
- Persistent Chrome side panel
- V4 conversation recording, pause/resume, upload, transcription, and note generation
- Automatic transcription language detection with no language selector
- Exam and personal-injury note options
- Weekly recent-note history
- Note review and explicit clipboard copy

Dictation, Smart Editor, direct EHR insertion, and account-management screens remain outside this companion. Account links open the website.

Keep the panel open during recording and processing. Closing it cancels local capture and pending work, without deliberately submitting a final chunk. Already accepted backend work cannot be recalled. No audio or notes are persisted locally for recovery.

Version 1.3.0 is a release candidate, not an approved production release. Packaging verifies the MV3 build and writes a ZIP and checksum under ignored `release-artifacts/`. See [release readiness](knowledge/development/release-readiness.md) for evidence and the required real-Chrome acceptance gate, and [reviewer instructions](release/reviewer-instructions.md) for the store handoff.

Repository concepts and maintenance guidance are routed through [knowledge/index.md](knowledge/index.md).
