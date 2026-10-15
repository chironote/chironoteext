---
type: infrastructure-boundary
title: "Amplify Ownership Boundary"
description: "Backend ownership, ignored local artifacts, configuration expectations, and the prohibition on agent-run Amplify commands."
resource: "../../.gitignore"
tags: [amplify, backend, gitignore, ownership, generated-config]
---

# Amplify Ownership Boundary

The production ChiroNote website owns the Amplify backend. This extension is another authenticated frontend client of those existing Cognito, AppSync, Storage, and identity resources.

The repository owner runs `amplify pull` when the local backend view must be created or refreshed. Agents and contributors must never run Amplify CLI commands or edit backend infrastructure from this repository.

The entire local `amplify/` directory is ignored and removed from Git tracking. Generated frontend configuration such as `src/amplifyconfiguration.json` and `src/aws-exports.js` is also ignored. A local build therefore requires the owner to pull the correct environment first. The production JavaScript bundle contains the public client configuration needed at runtime, while Git remains separated from backend state.

GraphQL operation documents under `src/graphql/` are client code and remain versioned. If the backend schema changes, the website/backend workflow remains authoritative and the owner must coordinate regeneration or deliberate updates.

## Provenance

- `../../.gitignore`
- `../../AGENTS.md`
- Owner's local ignored frontend configuration created by the owner's 2026-07-13 Amplify pull; no sensitive values are reproduced here.
- User decision on 2026-07-13 to keep Amplify and Git as separate as possible.
