# Extension data-use disclosure draft

This is an implementation-based handoff for the owner to reconcile with ChiroNote's published privacy policy and Chrome Web Store declarations. The policy published on August 29, 2026 at `https://public-docs-and-agreements.s3.us-east-2.amazonaws.com/ChiroNote-Privacy-Policy.pdf` covers the extension behavior documented below, including Chrome Web Store Limited Use. This repository still does not independently verify legal compliance, backend retention, deletion guarantees, or every processor practice.

## What the extension handles

- Existing-account authentication information: processed by the configured Cognito service; Amplify manages the browser's sign-in session. Temporary credentials and tokens authorize ChiroNote backend requests.
- Microphone audio: captured only after the user starts recording and grants access; uploaded to the existing ChiroNote AWS backend for transcription and note generation.
- Clinical content: generated notes and recent history are retrieved for the signed-in owner. These may contain health information and personal identifiers. Transcription completion is received through AppSync.
- Note-format preferences: Exam and Personal Injury settings are stored locally. Language detection remains automatic.
- Clipboard: reviewed full-note or section text is written only when the user clicks Copy. The extension does not read the clipboard or EHR page contents.

The extension does not add analytics or advertising. Application diagnostics contain fixed status/error codes, not audio, tokens, transcripts, or notes. It does not persist audio or clinical notes locally for offline recovery. Browser authentication storage is distinct from clinical-content persistence.

Discard or panel closure cancels local capture and pending client work; it is not a server-side deletion request. Audio already uploaded or processing already accepted may remain subject to the product's backend retention and processing policies.

## Owner verification required

Confirm the public policy remains current for the actual backend processors, uses, retention, deletion/contact process, and applicable limited-use commitments. Declare the relevant authentication, health, personal-information, personal-communications, and IP-address/location categories in the store dashboard according to the actual product data, not just extension permissions. Do not claim that no data is collected merely because clinical data is not persisted locally.

Source: [Chrome Web Store program policies](https://developer.chrome.com/docs/webstore/program-policies/policies) and the extension's recording, history, authentication, and clipboard code. No dashboard declaration or public policy was changed by this work.
