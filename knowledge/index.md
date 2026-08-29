# ChiroNote Extension Knowledge

This knowledge layer explains the extension's stable product, architecture, visual, infrastructure, and development boundaries. Start here when deciding where a change belongs or whether a website feature should be added to the compact Chrome client.

## Architecture

- [Extension System Overview](./architecture/system-overview.md) explains the tab-scoped side-panel boundary, authenticated client, and end-to-end data flow.

## Components

- [Conversation Recording Workflow](./components/recording-workflow.md) explains microphone capture, chunk upload, transcription completion, and streamed note generation.
- [Recent Notes and Clipboard Handoff](./components/note-history.md) explains history loading, label/content search, Today-aware timestamps, realtime updates, note selection, review, and copying.

## Design

- [Extension Visual Style](./design/style.md) defines the Google-inspired visual language adapted to ChiroNote colors and older clinicians.

## Infrastructure

- [Amplify Ownership Boundary](./infrastructure/amplify-boundary.md) explains which backend artifacts are local, who may run Amplify commands, and what Git intentionally excludes.

## Development

- [Extension Development Workflow](./development/workflow.md) explains build, validation, unpacked installation, code conventions, and scope control.
- [Extension Release Readiness](./development/release-readiness.md) records candidate evidence, real-Chrome acceptance gates, store handoff, and rollback limitations.

## Knowledge maintenance

Concepts synthesize stable domains rather than mirror source documents. Update affected concepts whenever implementation changes invalidate them. Link each concept exactly once here, keep only `index.md` and `log.md` at the knowledge root, and record meaningful knowledge changes in `log.md` under the current ISO date.
