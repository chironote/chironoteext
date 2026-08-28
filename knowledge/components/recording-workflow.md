---
type: component-architecture
title: "Conversation Recording Workflow"
description: "Session isolation, Chrome media lifecycle, ordered uploads, generation, and failure behavior."
resource: "../../src/components/Recording/RecordingManager.jsx"
tags: [recording, microphone, s3, sqs, transcription, note-generation]
---

# Conversation Recording Workflow

RecordingManager composes the media, upload, and generation hooks. It exposes startup/recording/paused/preparing/generating state, separate structured errors, and the normal recording controls. Duplicate starts are guarded synchronously. A bounded subscription check runs before microphone acquisition; zero credits never starts capture. Pending checks and late permission results cannot restart work after teardown.

Each Chrome recording has an immutable session identity and timestamp. Chrome uses WebM, normal pause/resume, and stop/restart rotation every four minutes. Blob MIME type determines the upload extension and content type. Stop's emitted blob is held until onstop so a Finish click during rotation can correctly mark it final. Media events serialize identity lookup and upload queueing. Tracks remain live until final audio is emitted; discard/cleanup instead detach callbacks and stop without finalization. Header-only final audio produces an error instead of an indefinite spinner.

The website-derived upload queue preserves FIFO order. It cancels Amplify upload tasks and aborts SQS requests when invalidated; old sessions cannot dispatch or update the current UI. Authentication, S3, and SQS failures terminate submission and surface a fixed message rather than retrying forever. Diagnostics contain codes only.

Backend contracts remain unchanged: protected Cognito-user audio paths, timestamp/userId S3 metadata, existing SQS message keys, owner-scoped AppSync transcription updates, and the existing note-generation Lambda POST. Recording uses Cognito userId; history queries retain the authenticated username owner convention. No Amplify or infrastructure commands belong here.

The transcript wait falls back after 40 seconds. Generation allows 120 seconds normally or 45 seconds after fallback. A generation job owns its subscription, timers, abort controller, and stream reader. Cleanup invalidates all late work. Accumulated text detects split JSON/sentinel errors; success is emitted only at nonempty EOF. Errors clear partial output, never enter the note document, and do not promise a backend retry schedule.

Preferences retain standard SOAP, optional Exam/Personal Injury, and automatic language detection. Keep the side panel open. Discard or closure cancels pending local work but cannot delete audio or processing already accepted by the backend. No offline audio/note recovery is implemented.

## Provenance

- `src/components/Recording/RecordingManager.jsx`
- `src/components/Recording/useMediaRecorderController.js`
- `src/components/Recording/useAudioUploadQueue.js`
- `src/components/Recording/useNoteGeneration.js`
- `src/components/Recording/recordingMedia.js` and adjacent regression tests
- Website recording safety hooks adapted on 2026-08-28; Android/iOS capture protocols intentionally excluded.
