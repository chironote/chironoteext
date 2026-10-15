jest.mock('aws-amplify/api', () => ({ generateClient: jest.fn() }));
jest.mock('aws-amplify/auth', () => ({ fetchAuthSession: jest.fn() }));

const load = (notes, capture) => {
  process.env.REACT_APP_PATIENT_NOTES_ENABLED = notes;
  process.env.REACT_APP_PATIENT_CAPTURE_ENABLED = capture;
  let service;
  jest.isolateModules(() => { service = require('./patientNotes'); });
  return service;
};
const originalEnv = { ...process.env };
afterEach(() => { process.env = { ...originalEnv }; localStorage.clear(); });

test.each([['false', 'true'], ['true', 'false']])('disabled patient features omit linkage: notes=%s capture=%s', (notes, capture) => {
  const service = load(notes, capture);
  expect(service.patientCaptureEnabled).toBe(false);
  expect(service.captureSnapshot({ patientId: 'fictional' })).toBeUndefined();
  localStorage.setItem('noteSettings', JSON.stringify({ examLayout: true, PILayout: true }));
  expect(service.recordingSettingsSnapshot()).toEqual({ examLayout: true, PILayout: true });
});

test('capture freezes separate clinical metadata and uses explicit settings without persisting forced Exam', () => {
  const service = load('true', 'true');
  const metadata = { patientId: 'fictional', patientName: ' Fictional Example ', visitType: 'initialExam', dateOfService: '2026-10-15' };
  const capture = service.captureSnapshot(metadata);
  metadata.visitType = null;
  expect(capture).toMatchObject({ patientName: 'Fictional Example', visitType: 'initialExam' });
  expect(Object.isFrozen(capture)).toBe(true);
  localStorage.setItem('noteSettings', JSON.stringify({ examLayout: false, PILayout: true }));
  expect(service.recordingSettingsSnapshot({ examLayout: true, PILayout: true })).toEqual({ examLayout: true, PILayout: true });
  expect(service.recordingSettingsSnapshot()).toEqual({ examLayout: false, PILayout: true });
});
