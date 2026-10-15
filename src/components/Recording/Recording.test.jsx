import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import Recording from './Recording';
import { patientRequest } from '../../services/patientNotes';

let mockCaptureEnabled = true;
jest.mock('../../services/patientNotes', () => ({
  patientRequest: jest.fn(), localDate: () => '2026-10-13',
  get patientCaptureEnabled() { return mockCaptureEnabled; }
}));
global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root, start;
const button = text => [...container.querySelectorAll('button')].find(node => node.textContent.includes(text));
const click = async text => act(async () => button(text).click());
const type = async value => act(async () => {
  const input = container.querySelector('input[type=search]');
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
const render = (props = {}) => root.render(<Recording startRecording={start} onBack={jest.fn()} {...props} />);
const exam = () => container.querySelector('input[name=examLayout]');
const pi = () => container.querySelector('input[name=PILayout]');
const toggle = input => act(() => input.click());
beforeEach(() => {
  jest.useFakeTimers(); mockCaptureEnabled = true; localStorage.clear();
  patientRequest.mockReset(); patientRequest.mockResolvedValue({ items: [], nextCursor: null });
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'new-example-id' } });
  container = document.createElement('div'); document.body.append(container); root = createRoot(container); start = jest.fn();
  act(() => render());
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.useRealTimers(); });

test('typed creation prepares identity, keeps name-only prompt and starts in final click synchronously', async () => {
  await type('  Jordan   Example  '); await click('Start recording');
  expect(start).not.toHaveBeenCalled();
  expect(container.querySelector('.recording-patient-prompt').textContent).toBe('Jordan Example');
  expect(container.querySelector('.patient-create-option').getAttribute('aria-label')).toContain('Jordan Example');
  act(() => {
    button('Create patient & record').click();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'new-example-id', patientName: 'Jordan Example', visitType: 'initialExam' }), { examLayout: true, PILayout: false });
  });
  expect(patientRequest.mock.calls.every(([operation]) => operation === 'listPatients')).toBe(true);
});

test('close and Escape retain typed draft and restore recording focus', async () => {
  await type('Jordan Example'); button('Start recording').focus(); await click('Start recording');
  await click('Close');
  expect(container.querySelector('input[type=search]').value).toBe('Jordan Example');
  expect(document.activeElement).toBe(button('Start recording'));
  await click('Start recording');
  act(() => container.querySelector('[role=dialog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(container.querySelector('[role=dialog]')).toBeNull(); expect(start).not.toHaveBeenCalled();
});

test.each([false, true])('unassigned confirmation preserves Exam=%s and PI from the earlier controls', async checked => {
  if (checked) toggle(exam());
  toggle(pi());
  await type('Jordan Example'); await click('Start recording');
  expect(container.querySelector('[role=dialog] input')).toBeNull();
  act(() => {
    button('Record without a patient').click();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({ patientId: null, patientName: undefined, displayName: '', dateOfInjury: null, visitType: null, initialExam: false }), { examLayout: checked, PILayout: true });
  });
  expect(JSON.parse(localStorage.getItem('noteSettings'))).toEqual({ examLayout: checked, PILayout: true });
});

test('duplicates on a later page preserve input and allow existing selection directly', async () => {
  patientRequest.mockResolvedValueOnce({ items: [], nextCursor: 'second' }).mockResolvedValueOnce({ items: [{ patientId: 'existing', name: 'Jordan Example', visitCount: 2 }], nextCursor: null });
  await type(' jordan   EXAMPLE '); await click('Start recording');
  expect(patientRequest).toHaveBeenLastCalledWith('listPatients', { search: 'jordan EXAMPLE', limit: 25, cursor: 'second' });
  expect(container.querySelector('[role=alert]').textContent).toContain('already exists');
  expect(container.querySelector('input[type=search]').value).toBe(' jordan   EXAMPLE ');
  expect(start).not.toHaveBeenCalled();
  await click('Jordan Example'); await click('Start recording');
  expect(start).toHaveBeenCalledWith(expect.objectContaining({ patientId: 'existing', patientName: undefined, visitType: null }), { examLayout: false, PILayout: false });
});

test('lookup failure and repeated cursors block creation and keep input', async () => {
  patientRequest.mockRejectedValueOnce(new Error('Offline'));
  await type('Jordan Example'); await click('Start recording');
  expect(container.querySelector('[role=alert]').textContent).toContain('could not check');
  expect(start).not.toHaveBeenCalled();
  patientRequest.mockResolvedValue({ items: [], nextCursor: 'same' }); await click('Start recording');
  expect(container.querySelector('[role=dialog]')).toBeNull();
  expect(container.querySelector('input[type=search]').value).toBe('Jordan Example');
});

test('editing during pending lookup rejects stale prepared identity', async () => {
  let resolveLookup;
  patientRequest.mockImplementation(() => new Promise(resolve => { resolveLookup = resolve; }));
  await type('First Example'); act(() => button('Start recording').click());
  await type('Second Example');
  await act(async () => resolveLookup({ items: [], nextCursor: null }));
  expect(container.querySelector('[role=dialog]')).toBeNull(); expect(start).not.toHaveBeenCalled();
  expect(container.querySelector('input[type=search]').value).toBe('Second Example');
});

test.each([false, true])('direct unassigned start honors Exam=%s and PI', async checked => {
  expect(exam().disabled).toBe(false);
  if (checked) toggle(exam());
  toggle(pi());
  act(() => {
    button('Start recording').click();
    expect(start).toHaveBeenCalledWith(expect.objectContaining({ visitType: null }), { examLayout: checked, PILayout: true });
  });
});

test('new patient is visibly checked and disabled, preserving manual preference on clear', async () => {
  toggle(pi());
  await type('New Example'); await click('+ Add');
  expect(exam().checked).toBe(true); expect(exam().disabled).toBe(true);
  expect(exam().closest('label').classList.contains('setting-row-disabled')).toBe(true);
  expect(container.querySelector('select').value).toBe('initialExam');
  expect(container.querySelector('select').disabled).toBe(true);
  expect(JSON.parse(localStorage.getItem('noteSettings'))).toEqual({ examLayout: false, PILayout: true });
  await click('Start recording');
  expect(start).toHaveBeenLastCalledWith(expect.objectContaining({ patientName: 'New Example', visitType: 'initialExam' }), { examLayout: true, PILayout: true });
  await click('Unassigned visit');
  expect(exam().checked).toBe(false); expect(exam().disabled).toBe(false); expect(pi().checked).toBe(true);
  await click('Start recording');
  expect(start).toHaveBeenLastCalledWith(expect.objectContaining({ patientId: null, visitType: null, initialExam: false }), { examLayout: false, PILayout: true });
});

test('switching new to existing preserves follow-up and re-exam metadata and manual preference', async () => {
  toggle(exam()); toggle(pi());
  await type('New Example'); await click('+ Add');
  patientRequest.mockResolvedValue({ items: [{ patientId: 'existing', name: 'Existing Example', visitCount: 2 }], nextCursor: null });
  await type('Existing'); await act(async () => jest.advanceTimersByTime(200));
  await click('Existing Example');
  expect(exam()).toBeNull();
  for (const visitType of ['followUp', 'reExam', '']) {
    act(() => {
      const select = container.querySelector('select');
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(select, visitType);
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await click('Start recording');
    expect(start).toHaveBeenLastCalledWith(expect.objectContaining({ patientId: 'existing', patientName: undefined, visitType: visitType || null }), { examLayout: true, PILayout: true });
  }
  await click('Unassigned visit');
  expect(exam().checked).toBe(true); expect(pi().checked).toBe(true);
});

test('legacy flag-off keeps the saved preferences and starts without metadata', async () => {
  act(() => root.unmount());
  localStorage.setItem('noteSettings', JSON.stringify({ examLayout: true, PILayout: true }));
  mockCaptureEnabled = false; root = createRoot(container); act(() => render());
  expect(exam().checked).toBe(true); expect(exam().disabled).toBe(false);
  expect(container.querySelector('input[type=search]')).toBeNull();
  act(() => {
    button('Start recording').click();
    expect(start).toHaveBeenLastCalledWith(undefined, { examLayout: true, PILayout: true });
  });
});

test('starting guard blocks changes and duplicate recording requests', async () => {
  act(() => render({ isStarting: true }));
  expect(exam().closest('fieldset').disabled).toBe(true);
  expect(container.querySelector('.patient-capture').disabled).toBe(true);
  expect(button('Starting recording').disabled).toBe(true);
  await click('Starting recording'); expect(start).not.toHaveBeenCalled();
});
