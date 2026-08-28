import { extractPlainText, getFirstSentenceOrSubstring } from './historyGrouping';
import { stripMarkdown } from './markdownStripper';
import { splitNoteIntoSections } from './noteSections';

describe('clinical note text helpers', () => {
  test('removes markdown while preserving clinical content', () => {
    const note = '## Subjective\n**Patient** reports improvement.\n- Continue exercises';

    expect(stripMarkdown(note)).toBe('Subjective\nPatient reports improvement.\nContinue exercises');
  });

  test('converts formatted note content to safe clipboard text', () => {
    expect(extractPlainText('<strong>Assessment:</strong> Improving')).toBe('Assessment: Improving');
  });

  test('shortens history previews at a word boundary', () => {
    expect(getFirstSentenceOrSubstring('Patient reports improving lower back pain', 24))
      .toBe('Patient reports...');
  });

  test('splits generated notes into individually copyable clinical sections', () => {
    const sections = splitNoteIntoSections(
      'SUBJECTIVE: Improving\n\nOBJECTIVE: Rotation restricted\n\nTreatment: CMT performed'
    );

    expect(sections).toEqual([
      { label: 'SUBJECTIVE', text: 'Improving' },
      { label: 'OBJECTIVE', text: 'Rotation restricted' },
      { label: 'Treatment', text: 'CMT performed' }
    ]);
  });

  test('returns no sections when the note has no recognized headings', () => {
    expect(splitNoteIntoSections('Free-form clinical note')).toEqual([]);
  });
});
