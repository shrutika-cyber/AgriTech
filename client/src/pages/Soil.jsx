import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useToast } from '../components/Toast.jsx';
import { Badge, ConfirmDialog, DemoNotice, EmptyState, ErrorState, Field, Loading } from '../components/ui.jsx';
import { fmtDate } from '../utils/format.js';
import { SOIL_OPTIONS } from './Farms.jsx';

const NUM = [
  ['ph', 'Soil pH *', '0 to 14', '0.1'],
  ['nitrogen', 'Nitrogen (kg/ha)', 'available N', 'any'],
  ['phosphorus', 'Phosphorus (kg/ha)', 'available P', 'any'],
  ['potassium', 'Potassium (kg/ha)', 'available K', 'any'],
  ['moisture', 'Moisture (%)', '0 to 100', 'any'],
];
const tone = { good: 'good', watch: 'warn', warning: 'danger', info: 'neutral' };
const empty = { ph: '', nitrogen: '', phosphorus: '', potassium: '', moisture: '', soilType: '', farmId: '', locationLabel: '', notes: '' };

function Assessment({ a }) {
  return (
    <div className="assessment">
      <p><b>Overall:</b> {a.overall}</p>
      <ul className="list">{a.findings.map((f) => <li key={f.parameter}><Badge tone={tone[f.status]}>{f.parameter}: {f.value}{f.unit ? ` ${f.unit}` : ''} ({f.rating})</Badge> {f.message}</li>)}</ul>
      <p><b>Suggested follow-up</b></p>
      <ul>{a.followUp.map((t) => <li key={t}>{t}</li>)}</ul>
      <p className="muted small">{a.disclaimer}</p>
    </div>
  );
}

export default function Soil() {
  const toast = useToast();
  const history = useLoad(() => api.get('/soil'), []);
  const farms = useLoad(() => api.get('/farms'), []);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (form.ph === '') { setErrors({ ph: 'Soil pH is required' }); return; }
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    setBusy(true); setErrors({});
    try {
      const rec = await api.post('/soil', body);
      setResult(rec); setForm(empty); history.reload(); toast('Soil reading saved.');
    } catch (err) { setErrors(err.fields || {}); toast(err.message, 'error'); } finally { setBusy(false); }
  }
  async function compare() {
    try { setComparison(await api.get(`/soil/compare?a=${picked[0]}&b=${picked[1]}`)); } catch (err) { toast(err.message, 'error'); }
  }
  async function remove() {
    setBusy(true);
    try { await api.del(`/soil/${toDelete.id}`); toast('Reading deleted.'); setPicked((p) => p.filter((x) => x !== toDelete.id)); setComparison(null); setToDelete(null); history.reload(); }
    catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }
  const toggle = (id) => { setComparison(null); setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id].slice(-2))); };

  return (
    <section className="page">
      <h1>Soil analysis</h1>
      <DemoNotice>Guidance here is simple, rule-based and educational. It is not a laboratory result. It gives no fertilizer doses. Use an accredited soil lab and local expert advice for decisions.</DemoNotice>
      <form className="card form-grid" onSubmit={submit} noValidate>
        <h2>Add a soil reading</h2>
        {NUM.map(([k, label, help, step]) => (
          <Field key={k} id={`s-${k}`} label={label} help={help} error={errors[k]}><input id={`s-${k}`} type="number" step={step} inputMode="decimal" value={form[k]} onChange={set(k)} /></Field>
        ))}
        <Field id="s-soilType" label="Soil type" error={errors.soilType}><select id="s-soilType" value={form.soilType} onChange={set('soilType')}><option value="">Not sure</option>{SOIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field id="s-farm" label="Farm" error={errors.farmId}><select id="s-farm" value={form.farmId} onChange={set('farmId')}><option value="">No farm</option>{(farms.data || []).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></Field>
        <Field id="s-loc" label="Location label" error={errors.locationLabel}><input id="s-loc" value={form.locationLabel} onChange={set('locationLabel')} /></Field>
        <Field id="s-notes" label="Notes" error={errors.notes}><textarea id="s-notes" rows={2} value={form.notes} onChange={set('notes')} /></Field>
        <div className="row-end full"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save & get guidance'}</button></div>
      </form>

      {result && <article className="card"><h2>Guidance for your reading (pH {result.ph})</h2><Assessment a={result.assessment} /></article>}

      <h2>History</h2>
      {history.loading && <Loading />}
      {history.error && <ErrorState message={history.error} onRetry={history.reload} />}
      {history.data?.length === 0 && <EmptyState title="No soil readings yet">Add your first reading above.</EmptyState>}
      {history.data?.length > 0 && (
        <>
          <p className="muted small">Tick two readings to compare them.</p>
          <ul className="list cards">
            {history.data.map((r) => (
              <li key={r.id} className="card">
                <label className="inline"><input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} /> <b>{fmtDate(r.createdAt)}</b> · pH {r.ph}{r.nitrogen != null && ` · N ${r.nitrogen}`}{r.phosphorus != null && ` · P ${r.phosphorus}`}{r.potassium != null && ` · K ${r.potassium}`}{r.moisture != null && ` · moisture ${r.moisture}%`}</label>
                {r.locationLabel && <p className="muted small">{r.locationLabel}</p>}
                <details><summary>Guidance</summary><Assessment a={r.assessment} /></details>
                <button className="btn btn-small btn-danger-outline" onClick={() => setToDelete(r)}>Delete</button>
              </li>
            ))}
          </ul>
          <button className="btn btn-secondary" disabled={picked.length !== 2} onClick={compare}>Compare selected</button>
          {comparison && (
            <div className="table-wrap"><table><thead><tr><th>Parameter</th><th>Earlier</th><th>Later</th><th>Change</th></tr></thead><tbody>
              {comparison.changes.length === 0 && <tr><td colSpan="4">No shared measurements to compare.</td></tr>}
              {comparison.changes.map((c) => <tr key={c.parameter}><td>{c.parameter}</td><td>{c.before}</td><td>{c.after}</td><td>{c.direction === 'same' ? 'No change' : `${c.change > 0 ? '+' : ''}${c.change} ${c.unit}`}</td></tr>)}
            </tbody></table></div>
          )}
        </>
      )}
      <ConfirmDialog open={Boolean(toDelete)} title="Delete this soil reading?" message="This cannot be undone." busy={busy} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </section>
  );
}
