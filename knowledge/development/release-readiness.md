---
type: release-readiness
title: "Extension Release Readiness"
description: "Recovered-note production preparation, observed store-access limits, historical release evidence, and remaining acceptance gates."
resource: "../../release/reviewer-instructions.md"
tags: [release, chrome-web-store, validation, rollback]
---

# Extension Release Readiness

## Recovered-note production preparation — 2026-10-21

The owner authorized the existing public Chrome extension update on October 21. PR [5](https://github.com/chironote/chironoteext/pull/5), reviewed head `68af8e79d2df034be0ccf094a2088b3b52e2fa46`, was merged into main as `f2310c84636cbbf8f746824744292812a7d6d70b`. The merge tree equals the reviewed head. Independent read-only source review found no remaining blocking finding. Exact-head local validation passed 16 suites / 115 tests, production build/MV3 verification and 8-concept OKS validation. There are no configured GitHub checks; the empty check list is not a CI pass.

The [recording workflow](../components/recording-workflow.md) describes recovered-result lookup, split-control buffering and preserved session ownership. The source compatibility gate permits independent staging with the current backend: the existing request/API and NOTE_RECOVERED formats are unchanged, and clients do not consume private completion receipts. This release does not modify backend functions, website deployment, native apps or patient feature flags. Authenticated real-Chrome recovered-note retrieval, side-panel/microphone workflows, history/copy and subsequent conditional Save remain separate acceptance gaps; synthetic tests do not prove them.

The owner reported uploading and submitting the October 16 package `production-2026-10-16-eaf0bc3/chironote-extension-1.3.1.zip` for public review. That report supersedes earlier statements that no submission was known. Approval, automatic-publication choice and public availability were not verified. Do not infer publication from elapsed time or overwrite a pending submission.

Early access preflight on October 21 again returned `Not allowed` for the publisher dashboard. No alternate automation surface or new API credentials were used. Published/draft/pending versions remain unknown; source metadata is still 1.3.1 and must not be presented as a new upload package. The final upload version is held until a current owner-controlled Package/Status observation establishes an unused higher version and any pending-review constraints. Local integration/build preparation may continue while that access handoff is pending.

Preserve the old versioned release directories and hashes as fallback/provenance evidence. No new upload, review submission or publication is claimed by this preparation record. The exact final ZIP/source/hash and observed store state will be recorded when the version gate clears. Git integration alone does not deploy.

## Production authorization — 2026-10-16

The owner subsequently supplied the Package dashboard screenshot showing **Draft 1.3.0 / Published 1.3.0**, establishing that source version 1.3.1 is higher than both displayed versions. The already-validated ZIP was copied unchanged to `release-artifacts/production-2026-10-16-eaf0bc3/chironote-extension-1.3.1.zip`; SHA-256 remains `43b804e5698ad0bf8dbccf56a3d3cad5e2f95f557a57197f70ae2edfede244d2`. Root manifest/version, excluded source maps, archive hash and unchanged remote main were rechecked. This supersedes the earlier unknown displayed store version below. Upload acceptance, review submission and publication remain unverified; the owner-controlled dashboard handoff is still required. Do not upload the older September archive with the same version from the release-artifacts root.

The owner explicitly changed the destination from testers to the existing public production listing and authorized publishing the latest extension. An isolated tester audience is no longer a scope gate. Fresh fetch still resolves main to `eaf0bc35d41558bbb25bc5e1f160ee96f403f414`, with no open PRs. The checks and validation package below remain source evidence; live store history must establish an unused version before creating the final upload package. No established Chrome Web Store publishing API tool, repository workflow, or Chrome/Web Store environment configuration was found. The browser access block remains in effect, so production upload, review submission and actual availability are still unverified and no publication is claimed. Publisher-dashboard access requires an owner handoff; do not bypass the browser policy. Patient feature flags remain disabled pending their separate coordinated readiness gates.

## Tester preparation — 2026-10-15

Fresh fetch and remote main verification selected `eaf0bc35d41558bbb25bc5e1f160ee96f403f414` from `chironote/chironoteext`. Main includes patient capture/Save (PR 1), new/unassigned Exam Layout (PR 2), the website Custom Instructions Settings link (PR 3), and copy text structure preservation (PR 4). GitHub returned no open PRs and no other remote branches. The earlier Settings verification chat assessed `d823964`, before PR 4; this package includes that newer integration. Mobile Wi-Fi recovery/diagnostics belongs to the mobile repositories and is not an extension release dependency.

Validation passed: 14 Jest suites / 94 tests using `npm test -- --runInBand`, production build, MV3 verifier, ZIP root manifest/version verification, and runtime dependency audit (zero vulnerabilities). No Amplify operations or backend mutations occurred. Patient-note/capture feature flags remain unset (patient notes disabled); the integrated Exam capture fix remains gated. Do not enable patient features merely to release: the coordinated backend prerequisites in [patient notes](../architecture/patient-notes.md) require independent readiness evidence. The Settings link hands off to the website; it does not prove deployment of the website or Custom Instructions backend.

The validation-only package is `release-artifacts/tester-2026-10-15-eaf0bc3/chironote-extension-1.3.1-eaf0bc3-validation-only.zip`, SHA-256 `43b804e5698ad0bf8dbccf56a3d3cad5e2f95f557a57197f70ae2edfede244d2`. Its version remains source version 1.3.1: it is **not a verified unused store version**, upload candidate, or published tester release. The existing September 1.3.1 ZIP/hash were preserved, including at their original paths; they are historical evidence, not proof of the currently published package. Task-local provenance is stored beside the validation package.

Tester publication is blocked. The established workflow documents item `ikinlmngbmdglllenhhllneifmcbaedj` as Public / all regions, with no documented isolated tester mechanism or audience. Browser automation rejected both the publisher dashboard and public listing with `Not allowed`; live package history, version allocation, tester distribution and availability could not be verified. No upload, submission, visibility change, new listing, or publication occurred. A publisher access handoff must establish an existing isolated tester channel/audience or the owner must choose a separate tester destination before store work continues. Authorization for tester distribution does not authorize updating public users.

Chrome extension-management navigation was explicitly blocked by browser security policy. No workaround was attempted. Real toolbar/side-panel persistence, sign-in, microphone controls, generation, history, clipboard/drag, and cross-client/device acceptance remain unverified; synthetic tests do not satisfy these checks. Continue with the acceptance checklist below after loading the candidate through an authorized owner-controlled Chrome session.

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

- `../../package.json`, `../../public/manifest.json`, and `../../scripts/verify-package.js`
- `../../src/components/Recording/` regression tests, `../../src/hooks/useNotesHistory.test.js`, `../../src/App.test.jsx`
- `../../release/reviewer-instructions.md` and `../../release/privacy-disclosures.md`
- `../../release/store-submission.md` and `../../scripts/generate-store-assets.ps1`
- Local tests, builds, package verification, Web Store dashboard audit, published-policy review, and synthetic Chrome layout inspection through 2026-08-29
