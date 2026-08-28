---
type: component-architecture
title: "Conversation Recording Workflow"
description: "Recording controls, media lifecycle, upload ordering, transcript completion, note generation, and preserved website behavior."
resource: "../../src/components/Recording/RecordingManager.jsx"
tags: [recording, microphone, s3, sqs, transcription, note-generation]
---

# Conversation Recording Workflow

`RecordingManager` is the public orchestration boundary. It composes `useMediaRecorderController`, `useAudioUploadQueue`, and `useNoteGeneration`; implementation details belong in those focused modules rather than the UI controller.

The media controller obtains a mono microphone stream, records browser-compatible WebM audio, emits periodic chunks, and provides pause, resume, stop, discard, and cleanup. The upload queue sends chunks to the production Amplify Storage bucket in order and notifies the production FIFO SQS queue. The final chunk starts an AppSync subscription for the matching owner and timestamp.

When the transcript completes, `useNoteGeneration` calls the production note-generation Lambda and streams text into the workspace. Timeouts, backend error parsing, abort controllers, subscription cleanup, and retry copy remain part of the copied V4 core.

The authenticated extension opens directly in recording readiness. A single dominant button starts the ordinary visit with the saved microphone and note-format preferences. Exam Layout and Personal Injury Case remain available in a collapsed preferences control rather than forcing a settings screen before every encounter. There is no language selector: `selectedLanguage` is stored as the string `null`, causing the existing queue message to send a JSON null and leave language detection to the transcription service.

Never log access tokens, transcripts, generated notes, or patient information. Keep the ChiroNote side panel open during recording and processing.

## Provenance

- `src/components/Recording/RecordingManager.jsx`
- `src/components/Recording/useMediaRecorderController.js`
- `src/components/Recording/useAudioUploadQueue.js`
- `src/components/Recording/useNoteGeneration.js`
- `src/components/Recording/Recording.jsx`
- `C:/Users/nikit/ChiroNote/website/chironoteV4/src/components/Recording/` as the copied behavior source on 2026-07-13.
