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

New patient capture keeps Exam layout visible, checked and disabled with a gray switch; it sends `visitType: initialExam` and effective `examLayout: true`. Unassigned capture keeps the Exam switch editable. Both direct start and the typed-name confirmation's Record without a patient retain the earlier Exam and PI selections while clearing patient/initial-exam linkage. The confirmation has no duplicate format controls. Existing patients retain the Automatic/Initial exam/Re-exam/Follow-up selector.

Manual format preferences alone are persisted. Effective settings travel synchronously from Recording through RecordingManager into the recorder's immutable session snapshot before microphone permission, separately from visit metadata. Forced new-patient Exam never becomes a saved manual preference when switching or clearing patients. The final confirmation click reaches microphone acquisition without awaiting another lookup; exact-name duplicate lookup failures prevent new-patient creation and preserve the draft.

## Recovered generation and saved-note authority

The existing NUL ERROR control can carry `NOTE_RECOVERED` after the backend has
confirmed a saved result that differs from the streamed preview. The stream parser
holds control bytes across arbitrary read boundaries until its JSON completes;
truncated, malformed or oversized controls fail closed. Control text is never
added to the visible clinical preview. Whole-response JSON errors and transcript
error parsing retain their existing one-shot behavior.

Only NOTE_RECOVERED follows the saved-success path: fetch `getSavedNote` for the
captured timestamp, verify ready status, matching timestamp and a version, then
apply that authoritative body and identity. Ordinary EOF uses the same lookup when
patient notes are enabled. Genuine conflicts, interrupted streams and unavailable
or incomplete lookups preserve the preview and report unconfirmed persistence.
Reader cancellation is best effort and cannot block a confirmed saved result.
Saved-note retry accepts an unchanged version only for the explicit recovered
control; ordinary retry still requires its new saved revision.

The extension keeps one active generation job. The recovered control requests
the saved record even when the patient-notes feature defaults off: that explicit
backend success still needs authoritative retrieval. Completion carries savedNote
metadata for review/editor routing. A replaced or cancelled job cannot publish a
late retrieval. Ordinary feature-off completion retains its existing text path.

Synthetic parser, service, generation-hook/session and application tests cover the
recovery boundary. Browser tests do not establish installed-device acceptance.
Authenticated refresh, physical recording, interrupted connectivity and subsequent
conditional Save still require the platform's normal release checks. This source
patch does not publish a website, native app or extension release.

## Provenance

- [Incremental generation control parser](../../src/components/Recording/noteGenerationErrors.js)
- [Saved generation retry and retrieval](../../src/services/patientNotes.js)


- `../../src/components/Recording/Recording.jsx` and its regression tests
- `../../src/components/Recording/RecordingManager.jsx`
- `../../src/components/Recording/useMediaRecorderController.js`
- `../../src/components/Recording/useAudioUploadQueue.js`
- `../../src/components/Recording/useNoteGeneration.js`
- `../../src/components/Recording/recordingMedia.js` and adjacent regression tests
- Website recording safety hooks adapted on 2026-08-28; Android/iOS capture protocols intentionally excluded.
