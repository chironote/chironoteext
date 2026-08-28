import { parseLambdaErrorPayload } from '../components/Recording/noteGenerationErrors';

export function mergeNotes(existing, incoming, owner) {
  const notes = new Map();
  [...existing, ...incoming].forEach(note => {
    if (note?.owner !== owner || !Number.isFinite(Number(note.timestamp)) ||
        !note.note?.trim() || parseLambdaErrorPayload(note.note)) return;
    notes.set(`${note.owner}:${note.timestamp}`, note);
  });
  return [...notes.values()].sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, 100);
}
