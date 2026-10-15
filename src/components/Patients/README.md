# Patient components

Desktop extension has persistent Save and a website handoff for profiles/signature/export. It has no Patients directory and must never run Amplify backend operations.

All clinical requests go through `../../services/patientNotes.js`; server owner verification and conditional Save are authoritative. PatientCapturePicker edits metadata without committing a clinical body. SavedNoteEditor fetches an exact saved version, preserves drafts across failed saves/diagnosis confirmation, and exposes review/suggestion/context status. PatientDialog traps keyboard focus and restores the opener. useDraftGuard registers only in-memory drafts; draftNavigation serializes guarded transitions. CSS supports narrow layouts and visible focus.

Do not add a persistent PHI draft cache, infer patient identity from labels, substitute preview EOF for a saved result, or enable new mobile Save controls. See the repository patient-notes knowledge concept for gates and validation.

New patient capture keeps Exam layout visible, checked and disabled with a gray switch; it sends `visitType: initialExam` and effective `examLayout: true`. Unassigned capture keeps the Exam switch editable. Both direct start and the typed-name confirmation's Record without a patient retain the earlier Exam and PI selections while clearing patient/initial-exam linkage. The confirmation has no duplicate format controls. Existing patients retain the Automatic/Initial exam/Re-exam/Follow-up selector.

Manual format preferences alone are persisted. Effective settings travel synchronously from Recording through RecordingManager into the recorder's immutable session snapshot before microphone permission, separately from visit metadata. Forced new-patient Exam never becomes a saved manual preference when switching or clearing patients. The final confirmation click reaches microphone acquisition without awaiting another lookup; exact-name duplicate lookup failures prevent new-patient creation and preserve the draft.
