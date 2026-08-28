const SECTION_HEADER_PATTERN = /^(Subjective|Objective|Assessment|Plan|Treatment):[ \t]*/gim;

export function splitNoteIntoSections(note) {
  if (!note || typeof note !== 'string') return [];

  const matches = [...note.matchAll(SECTION_HEADER_PATTERN)];
  if (matches.length === 0) return [];

  const parts = [];
  const leadingText = note.slice(0, matches[0].index).trim();

  if (leadingText) {
    parts.push({ label: '', text: leadingText });
  }

  matches.forEach((match, index) => {
    const nextMatch = matches[index + 1];
    const textStart = match.index + match[0].length;
    const textEnd = nextMatch?.index ?? note.length;

    parts.push({
      label: match[1],
      text: note.slice(textStart, textEnd).trim()
    });
  });

  return parts;
}
