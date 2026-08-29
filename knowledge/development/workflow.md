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

Use JavaScript/JSX, two spaces, single quotes, and semicolons. Preserve narrow scope, minimal permissions, sanitized diagnostics, and no clinical-content persistence. Update affected concepts and the knowledge log with implementation changes. Validate with the repository's Healtech OKS validator.

## Provenance

- `package.json`
- `scripts/build.js`, `scripts/verify-package.js`, `scripts/package-release.ps1`
- `src/App.test.jsx`
- `AGENTS.md`
- `release/reviewer-instructions.md`
