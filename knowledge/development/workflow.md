---
type: development-workflow
title: "Extension Development Workflow"
description: "Reproducible builds, tests, packaging, local Chrome installation, and maintenance boundaries."
resource: "../../package.json"
tags: [development, build, testing, chrome, workflow]
---

# Extension Development Workflow

Use npm with the checked-in lockfile. `npm ci` restores dependencies, `npm test` runs CRA/Jest without watch mode, and `npm run build` builds and verifies the production MV3 package. The build wrapper explicitly disables inline runtime scripts and source maps, independent of ignored local environment files.

Ignored frontend Amplify configuration must already be supplied by the owner. Agents must not run Amplify commands. The package verifier checks configuration-derived host permissions, package/manifest version parity, side-panel scope, local script references, and excluded source maps. Backend public client configuration is necessarily bundled; private AWS credentials are not build inputs.

`npm run package:release` verifies the current build, writes a candidate ZIP with root-level manifest, reopens it to check its version, and writes a SHA256 file under ignored `release-artifacts/`. It does not publish. Run the build first after every source change.

The owner loads `build/` from chrome://extensions, pins the icon, and opens a panel scoped to the clicked tab (Chrome 116+). Reload the extension card after rebuilding. Test beside a dummy EHR with synthetic content. Verify that switching to an unopened tab hides the panel and returning restores it, that same-tab navigation retains it, and that an explicit toolbar click in another tab opens a separate workspace. Native tab hiding and recording continuity, real permissions, microphone/audio completeness, authenticated backend integration, and cross-client history require actual Chrome testing; Jest and static previews do not replace that gate.

For visual-only evidence, set `CHIRONOTE_VISUAL_FIXTURES=1` when running tests. App tests export synthetic markup from real components to ignored `release-artifacts/visual/`. Serve that folder on localhost for responsive screenshots. Those fixtures contain no live authentication or recording and must not ship inside the extension ZIP.

## Publishing API

The owner configured the Chrome Web Store API in Google Cloud project `chironote-tools` on October 21, 2026. Dedicated service account `chrome-webstore-publisher@chironote-tools.iam.gserviceaccount.com` is linked under **Publisher > Settings** in the Web Store dashboard. It has no general project role or user-managed key. The existing owner Google account has `roles/iam.serviceAccountTokenCreator` on that service account only. Use existing `gcloud` login and service-account impersonation with scope `https://www.googleapis.com/auth/chromewebstore` for short-lived tokens; keep tokens in process memory and out of command arguments, logs, files and Git. Refresh interactive Google authentication through the normal owner sign-in if it expires.

Verified API resource: `publishers/de1b0bd2-7d7d-4993-9a2c-aa073e7da0f7/items/ikinlmngbmdglllenhhllneifmcbaedj`. V2 `fetchStatus` reads published/submitted versions and deployment percentages; it does not expose an unsubmitted draft version. A legacy read-only DRAFT request still returned 1.3.1 during this setup, but V1's documented support ended October 15, 2026; do not depend on it for future releases. If draft state cannot be established through supported tools, use an owner dashboard observation rather than inventing it.

For an authorized release, verify source, version and archive hash, upload the exact ZIP to the existing item using V2 `media.upload`, check returned `crxVersion` and upload state, then re-read status. Submit only after successful processing and unchanged review preflight. V2 `publish` with `DEFAULT_PUBLISH` publishes after review approval; use `skipReview: false` and `blockOnWarnings: true`, and preserve the current rollout/visibility. A returned pending-review state is not publication. Do not cancel submissions, change audience or increase rollout as implicit setup actions. Browser gallery scripting remains blocked; this separately owner-authorized official API setup does not remove that browser restriction.

Use JavaScript/JSX, two spaces, single quotes, and semicolons. Preserve narrow scope, minimal permissions, sanitized diagnostics, and no clinical-content persistence. Update affected concepts and the knowledge log with implementation changes. Validate with the repository's Healtech OKS validator.

## Provenance

- `../../package.json`
- `../../scripts/build.js`, `../../scripts/verify-package.js`, `../../scripts/package-release.ps1`
- `../../src/App.test.jsx`
- `../../AGENTS.md`
- `../../release/reviewer-instructions.md`
- [Chrome Web Store service accounts](https://developer.chrome.com/docs/webstore/service-accounts)
- [Chrome Web Store V2 status](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/fetchStatus)
- [Chrome Web Store V2 submission](https://developer.chrome.com/docs/webstore/api/reference/rest/v2/publishers.items/publish)
