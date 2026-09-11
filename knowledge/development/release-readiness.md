---
type: release-readiness
title: "Extension Release Readiness"
description: "Version 1.3.1 update evidence, historical 1.3.0 preparation, and remaining store validation."
resource: "../../release/reviewer-instructions.md"
tags: [release, chrome-web-store, validation, rollback]
---

# Extension Release Readiness

## Update status — 2026-09-11

The owner reports ChiroNote is now live and explicitly authorized merging and submitting the update. Version 1.3.1 includes the previously uncommitted whole-note plain-text drag handoff and compact history toolbar fixes. Remote main previously ended at 7076bde and did not include these changes.

All 64 tests across 10 suites pass, including complete drag payload, copy effect, drag feedback cleanup, and continued history navigation. Actual Chrome side-panel dragging, sign-in, recording, generation, and clipboard acceptance remain unverified in this session. The browser automation surface rejected the extension gallery ("The extensions gallery cannot be scripted") and publisher dashboard ("Not allowed"); no upload or submission is claimed. Verify the published version is below 1.3.1 before uploading the candidate. Preserve the published package for rollback evidence; any store rollback requires a higher-version forward release.

The following August status is historical and predates the owner's report that the extension is live.

The 1.3.1 production build and MV3 package verification passed. The release ZIP is `release-artifacts/chironote-extension-1.3.1-candidate.zip`, SHA-256 `b1218b787a9d3f290b846254e089dc3feb365592ca4ab98efd77465020deb23f`. Knowledge validation passed. The archive contains the root manifest and bundled build only.

## Candidate status — 2026-08-29

Version 1.3.0 is a local release candidate, not an approved or published production release. No Amplify command, backend deployment, other-project edit, Web Store submission, or production recording was performed.

The owner published a four-page privacy policy effective August 29, 2026 that explicitly covers the Chrome extension, its current data flow, conditional future direct insertion, retention caveats, subprocessors, and Chrome Web Store Limited Use. The verified 1.3.0 candidate has now replaced the earlier draft package. The dashboard listing, icon, three synthetic screenshots, promotional tiles, privacy declarations, reviewer instructions, and Free/Public/All-regions distribution are saved. The public publisher display name is `ChiroNote`, and `development@chironote.ai` is the verified public contact. Chrome now enables Submit for review. Reviewer credentials are still blank and remain an operational release gate because the extension requires an existing account. Submission-ready copy and generated assets are routed through `release/store-submission.md`.

Automated evidence includes recorder/session cancellation, chunk ordering and rotation/Finish races, late permission results, upload/SQS/auth failures, startup gating, split stream errors, generation timeouts, history reconnect/retry/merge behavior, account-state isolation, and completed-only copying. The final test/build counts and artifact hashes belong in the generated release handoff.

The runtime dependency audit is clean after fast-xml-parser 5.11.1. A compatible websocket-driver update also removed a critical build-tool advisory. Remaining full-audit findings affect the dev/build dependency tree (9 low, 5 moderate, 18 high at this review), not the production-only dependency audit. These still warrant separate maintenance; do not run audit fix --force or migrate CRA as part of this focused release.

Chrome layout inspection used synthetic markup rendered from the real components at 320px width, a short 360px height, and a 160px effective width for zoom reflow. It proves layout only. The browser automation policy blocked chrome://extensions, so the owner was asked to load/reload the candidate. No real side-panel, microphone, or authenticated backend acceptance result is claimed.

## Required owner acceptance before release

- [ ] Install/reload the candidate, sign in and recover an expired session.
- [ ] On Chrome 116+, open from the pinned toolbar icon; verify the panel stays beside the originating dummy EHR tab, hides on an unopened tab, and returns on switching back. Verify same-tab navigation, separate explicit opening in another tab, and closing/reopening from both the toolbar icon and panel close button. Test both an already-open tab and a newly created tab after reload. During a synthetic recording and during generation, switch away and back and verify continuity; closing the owning tab must stop local capture. Repeat after extension reload and service-worker suspension.
- [ ] Allow/deny/retry microphone access; verify zero-credit and failed-account-check behavior.
- [ ] Complete a short and a longer-than-four-minute synthetic conversation; verify the final spoken phrase and note completeness.
- [ ] Pause/resume, finish near a chunk boundary, discard during upload, and record consecutive visits.
- [ ] Disconnect/reconnect networking during upload/transcription/generation; verify a visible failure or successful recovery without duplicate submission.
- [ ] Close/reopen during startup, recording, upload, and generation; verify no continued local capture or deliberate final submission. Check history for independently completed backend work.
- [ ] Verify synthetic notes from website, Android, and iOS appear in extension history; copy whole-note and all five sections to a dummy EHR.
- [ ] Test actual side-panel resizing, 200% zoom, keyboard focus, screen-reader status, and reduced motion.
- [ ] Approve final store screenshots, credentials handoff, public privacy policy/declarations, and the version number relative to the existing listing.

## Artifacts and rollback

`release-artifacts/chironote-extension-1.3.0-candidate.zip` is generated from the verified build, with SHA-256 `2683903b2debdabf2346327fb15f2c00a67ba38c5bdb2a8ca22f215c14ab5c6c` and a matching .sha256 file. `release-artifacts/chironote-extension-1.2.1-baseline.zip` preserves the unmodified local baseline build from this session, whose source baseline was 072a10d. The Web Store has no published ChiroNote version to roll back to. Retain this local baseline only as diagnostic evidence, not as a safe production release.

For a local rollback, extract the retained baseline into a separate folder and load it explicitly. The older baseline has known recording-safety gaps. A store rollback is an owner-controlled forward release using a version higher than the current published version, not an automatic downgrade. No backend rollback is required because the contract/infrastructure is unchanged.

## Provenance

- `package.json`, `public/manifest.json`, and `scripts/verify-package.js`
- `src/components/Recording/*.test.js`, `src/hooks/useNotesHistory.test.js`, `src/App.test.jsx`
- `release/reviewer-instructions.md` and `release/privacy-disclosures.md`
- `release/store-submission.md` and `scripts/generate-store-assets.ps1`
- Local tests, builds, package verification, Web Store dashboard audit, published-policy review, and synthetic Chrome layout inspection through 2026-08-29
