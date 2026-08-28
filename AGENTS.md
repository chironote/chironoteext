# Repository Guidelines

## Product boundary

This repository is the compact Chrome client for the website-owned ChiroNote product. Keep its purpose narrow: record a visit, display generated/recent notes, and copy a reviewed note into an EHR. Do not recreate the complete website in this project.

## Amplify boundary

The `amplify/` directory and generated frontend configuration are local, ignored inputs pulled from the website-owned backend. Never run `amplify pull`, `amplify push`, `amplify init`, or any other Amplify command. The repository owner performs all Amplify operations. Do not edit backend infrastructure from this repository.

## Structure

- `public/manifest.json` and `public/background.js` define the Manifest V3 extension and persistent side panel.
- `src/App.js` owns authenticated UI orchestration.
- `src/components/Recording/` owns conversation recording and generated-note streaming.
- `src/components/History/` owns recent-note selection and note review.
- `src/hooks/useNotesHistory.js` owns GraphQL history queries and subscriptions.

Use JavaScript/JSX, two-space indentation, single quotes, and semicolons. Keep permissions minimal and never log access tokens, transcripts, generated notes, or patient information.

## Knowledge maintenance

Repository knowledge follows Healtech simplified OKS under `knowledge/`. Concepts synthesize domains rather than mirror source documents. When implementation changes invalidate a concept, update that concept, `knowledge/index.md` when routing changes, and `knowledge/log.md` in the same change. Keep only `index.md` and `log.md` at the knowledge root; concepts belong at `knowledge/<category>/<concept>.md`.

Validate knowledge changes with:

```powershell
python C:\Users\nikit\.codex\skills\healtech-oks\scripts\validate_oks.py .
```

## Validation

Run `npm test` and `npm run build`. Load `build/` from `chrome://extensions`, verify that the toolbar icon opens the ChiroNote side panel beside the active tab and that it stays open while using the EHR, then manually test sign-in, recording controls, note generation, history selection, and clipboard copy.
