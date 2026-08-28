---
type: release-readiness
title: "Extension Release Readiness"
description: "Version 1.3.0 candidate evidence, packaging, approval gates, and rollback limitations."
resource: "../../release/reviewer-instructions.md"
tags: [release, chrome-web-store, validation, rollback]
---

# Extension Release Readiness

## Candidate status — 2026-08-28

Version 1.3.0 is a local release candidate, not an approved or published production release. No Amplify command, backend deployment, other-project edit, Web Store submission, or production recording was performed.

Automated evidence includes recorder/session cancellation, chunk ordering and rotation/Finish races, late permission results, upload/SQS/auth failures, startup gating, split stream errors, generation timeouts, history reconnect/retry/merge behavior, account-state isolation, and completed-only copying. The final test/build counts and artifact hashes belong in the generated release handoff.

The runtime dependency audit is clean after fast-xml-parser 5.11.1. A compatible websocket-driver update also removed a critical build-tool advisory. Remaining full-audit findings affect the dev/build dependency tree (9 low, 5 moderate, 18 high at this review), not the production-only dependency audit. These still warrant separate maintenance; do not run audit fix --force or migrate CRA as part of this focused release.

Chrome layout inspection used synthetic markup rendered from the real components at 320px width, a short 360px height, and a 160px effective width for zoom reflow. It proves layout only. The browser automation policy blocked chrome://extensions, so the owner was asked to load/reload the candidate. No real side-panel, microphone, or authenticated backend acceptance result is claimed.

## Required owner acceptance before release

- [ ] Install/reload the candidate, sign in and recover an expired session.
- [ ] Open from the pinned toolbar icon; keep the panel usable while editing a dummy EHR and switching tabs.
- [ ] Allow/deny/retry microphone access; verify zero-credit and failed-account-check behavior.
- [ ] Complete a short and a longer-than-four-minute synthetic conversation; verify the final spoken phrase and note completeness.
- [ ] Pause/resume, finish near a chunk boundary, discard during upload, and record consecutive visits.
- [ ] Disconnect/reconnect networking during upload/transcription/generation; verify a visible failure or successful recovery without duplicate submission.
- [ ] Close/reopen during startup, recording, upload, and generation; verify no continued local capture or deliberate final submission. Check history for independently completed backend work.
- [ ] Verify synthetic notes from website, Android, and iOS appear in extension history; copy whole-note and all five sections to a dummy EHR.
- [ ] Test actual side-panel resizing, 200% zoom, keyboard focus, screen-reader status, and reduced motion.
- [ ] Approve final store screenshots, credentials handoff, public privacy policy/declarations, and the version number relative to the existing listing.

## Artifacts and rollback

`release-artifacts/chironote-extension-1.3.0-candidate.zip` is generated from the verified build, with a matching .sha256 file. `release-artifacts/chironote-extension-1.2.1-baseline.zip` preserves the unmodified local baseline build from this session, whose source baseline was 072a10d. This is not confirmation of the published store version. Retain the actual published artifact separately before submission.

For a local rollback, extract the retained baseline into a separate folder and load it explicitly. The older baseline has known recording-safety gaps. A store rollback is an owner-controlled forward release using a version higher than the current published version, not an automatic downgrade. No backend rollback is required because the contract/infrastructure is unchanged.

## Provenance

- `package.json`, `public/manifest.json`, and `scripts/verify-package.js`
- `src/components/Recording/*.test.js`, `src/hooks/useNotesHistory.test.js`, `src/App.test.jsx`
- `release/reviewer-instructions.md` and `release/privacy-disclosures.md`
- Local tests, builds, audit results, and synthetic Chrome layout inspection on 2026-08-28
