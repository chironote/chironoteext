import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { localDate, patientRequest } from '../../services/patientNotes';
import './Patients.css';

const normalizedName = name => name.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

const PatientCapturePicker = forwardRef(function PatientCapturePicker({ value, onChange, onDraftChange, disabled = false }, ref) {
  const [search, setSearch] = useState(''); const [patients, setPatients] = useState([]);
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false); const [cursor, setCursor] = useState(null);
  const requestRef = useRef(0);
  useEffect(() => () => { ++requestRef.current; }, []);
  const checkingRef = useRef(false);
  const [checking, setChecking] = useState(false);
  const query = search.trim().replace(/\s+/g, ' ');
  const current = value || { dateOfService: localDate(), visitType: null, contextMode: 'patient' };
  useEffect(() => { onDraftChange?.(query); }, [query, onDraftChange]);
  useEffect(() => {
    let active = true; const request = ++requestRef.current;
    setPatients([]); setCursor(null); setError(''); setLoading(false);
    if (!query) return undefined;
    const timer = setTimeout(async () => {
      if (!active || request !== requestRef.current) return;
      setLoading(true); setError('');
      try { const page = await patientRequest('listPatients', { search: query, limit: 25 });
        if (active && request === requestRef.current) { setPatients(page.items.filter(patient => !patient.deletionPending)); setCursor(page.nextCursor); }
      } catch (failure) { if (active && request === requestRef.current) setError(failure.message); }
      finally { if (active && request === requestRef.current) setLoading(false); }
    }, 200);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);
  const change = (fields) => onChange({ ...current, ...fields });
  const selected = current.patientId ? (current.displayName || current.patientName || 'Selected patient') : 'Unassigned';
  const more = async () => {
    const request = requestRef.current; setLoading(true);
    try { const page = await patientRequest('listPatients', { search: query, cursor, limit: 25 });
      if (request === requestRef.current) { setPatients(old => [...old, ...page.items.filter(patient => !patient.deletionPending && !old.some(item => item.patientId === patient.patientId))]); setCursor(page.nextCursor); }
    } catch (failure) { if (request === requestRef.current) setError(failure.message); }
    finally { if (request === requestRef.current) setLoading(false); }
  };
  const prepareNewPatient = async () => {
    if (checkingRef.current || !query) return undefined;
    checkingRef.current = true; setChecking(true); setError('');
    const request = ++requestRef.current; setLoading(false);
    try {
      let nextCursor;
      const seenCursors = new Set();
      do {
        const page = await patientRequest('listPatients', { search: query, limit: 25, ...(nextCursor ? { cursor: nextCursor } : {}) });
        if (request !== requestRef.current) return undefined;
        const existing = page.items.find(patient => normalizedName(patient.name) === normalizedName(query));
        if (existing) {
          setPatients(old => old.some(patient => patient.patientId === existing.patientId) ? old : [existing, ...old]);
          setError('A patient with this name already exists. Select their name from the results below.');
          return undefined;
        }
        nextCursor = page.nextCursor;
        if (nextCursor && seenCursors.has(nextCursor)) throw new Error('Repeated patient page.');
        if (nextCursor) seenCursors.add(nextCursor);
      } while (nextCursor);
      return { ...current, patientId: crypto.randomUUID(), patientName: query, displayName: query, dateOfInjury: null, visitType: 'initialExam', contextMode: 'patient' };
    } catch {
      if (request === requestRef.current) setError('We could not check whether this patient already exists. Please try Add again, or select an existing patient.');
      return undefined;
    } finally { checkingRef.current = false; setChecking(false); }
  };
  useImperativeHandle(ref, () => ({ prepareNewPatient }));
  const addNew = async () => {
    const patient = await prepareNewPatient();
    if (patient) { onChange(patient); setSearch(''); }
  };
  const clearPatient = () => {
    ++requestRef.current;
    change({ patientId: null, patientName: undefined, displayName: '', dateOfInjury: null, visitType: null, initialExam: false });
    setSearch('');
  };
  return <fieldset className="patient-capture" disabled={disabled}><legend>Patient and visit</legend>
    <p className="patient-selection">{selected}</p>
    <label>Find a patient<input value={search} onChange={event => { ++requestRef.current; setSearch(event.target.value); }} type="search" autoComplete="off" /></label>
    {loading && <p role="status">Loading patients…</p>}
    {error && <p role="alert">{error} You can record an unassigned visit and assign it later.</p>}
    <div className="patient-picker-list" aria-label="Matching patients">
      {patients.map(patient => <button type="button" key={patient.patientId} aria-pressed={current.patientId === patient.patientId}
        onClick={() => { ++requestRef.current; change({ patientId: patient.patientId, patientName: undefined, displayName: patient.name, dateOfInjury: patient.dateOfInjury, visitType: null }); setSearch(''); }}><span className="patient-result-name" title={patient.name}>{patient.name}</span><small>{patient.visitCount} visits</small></button>)}
    </div>
    {cursor && <button type="button" disabled={loading} onClick={more}>More patients</button>}
    <div className="patient-actions patient-create-actions">
      {query && <button type="button" className="patient-create-option" aria-label={`Create New Patient: ${query}`} disabled={checking} onClick={addNew}>
        <span className="patient-create-name" title={`Create New Patient: ${query}`}>Create New Patient: <strong>{query}</strong></span>
        <span className="patient-create-action">{checking ? 'Checking…' : '+ Add'}</span>
      </button>}
      <button type="button" onClick={clearPatient}>Unassigned visit</button>
    </div>
    <div className="patient-field-grid">
      <label>Date of service<input type="date" required max={localDate()} value={current.dateOfService || localDate()} onChange={e => change({ dateOfService: e.target.value })} /></label>
      <label>Date of injury (optional)<input type="date" max={localDate()} value={current.dateOfInjury || ''} onChange={e => change({ dateOfInjury: e.target.value })} /></label>
      <label>Visit type<select disabled={Boolean(current.patientName)} value={current.patientName ? 'initialExam' : current.visitType || ''} onChange={e => change({ visitType: e.target.value || null })}>
        <option value="">Automatic</option><option value="initialExam">Initial exam</option><option value="reExam">Re-exam</option><option value="followUp">Follow-up</option>
      </select></label>
    </div>
    <p className="patient-help">The first verified encounter uses Initial exam. Language is detected automatically.</p>
    {current.patientId && <label className="patient-inline"><input type="checkbox" checked={current.contextMode !== 'none'} onChange={e => change({ contextMode: e.target.checked ? 'patient' : 'none' })} /> Use saved patient history</label>}
  </fieldset>;
});

export default PatientCapturePicker;
