import { useState } from 'react';
import { api } from '../services/api.js';
import { Badge, DemoNotice, Field } from '../components/ui.jsx';
import { SOIL_OPTIONS } from './Farms.jsx';

const empty = { ph: '', nitrogen: '', phosphorus: '', potassium: '', temperature: '', rainfall: '', soilType: '', season: '' };
const NUM = [['ph', 'Soil pH', '0.1'], ['temperature', 'Average temperature (°C)', 'any'], ['rainfall', 'Annual rainfall (mm)', 'any'], ['nitrogen', 'Nitrogen (kg/ha)', 'any'], ['phosphorus', 'Phosphorus (kg/ha)', 'any'], ['potassium', 'Potassium (kg/ha)', 'any']];
const tone = { good: 'good', moderate: 'warn', low: 'danger' };

export default function Advisor() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const body = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== ''));
    setBusy(true); setErrors({}); setOut(null);
    try { setOut(await api.post('/recommend', body)); } catch (err) { setErrors({ ...err.fields, form: err.message }); } finally { setBusy(false); }
  }

  return (
    <section className="page">
      <h1>Crop advisor</h1>
      <DemoNotice>Transparent rule-based suggestions using approximate general ranges. No AI or machine-learning model is used. Local conditions, varieties and markets matter, so confirm with your local agriculture office.</DemoNotice>
      <form className="card form-grid" onSubmit={submit} noValidate>
        <h2>Your conditions (fill in at least two)</h2>
        {errors.form && !Object.keys(errors).some((k) => k !== 'form') && <p className="banner-error full" role="alert">{errors.form}</p>}
        {NUM.map(([k, label, step]) => <Field key={k} id={`a-${k}`} label={label} error={errors[k]}><input id={`a-${k}`} type="number" step={step} inputMode="decimal" value={form[k]} onChange={set(k)} /></Field>)}
        <Field id="a-soil" label="Soil type" error={errors.soilType}><select id="a-soil" value={form.soilType} onChange={set('soilType')}><option value="">Not sure</option>{SOIL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
        <Field id="a-season" label="Season" error={errors.season} help="Kharif (monsoon), Rabi (winter), Zaid (summer)"><select id="a-season" value={form.season} onChange={set('season')}><option value="">Not sure</option><option value="kharif">Kharif</option><option value="rabi">Rabi</option><option value="zaid">Zaid</option></select></Field>
        <div className="row-end full"><button className="btn btn-primary" disabled={busy}>{busy ? 'Working…' : 'Suggest crops'}</button></div>
      </form>
      {out && (
        <>
          <h2>Suggestions</h2>
          {out.results.length === 0 && <p className="muted">No suggestions yet. {out.limitations[0]}</p>}
          <div className="grid2">
            {out.results.map((r) => (
              <article className="card" key={r.crop}>
                <h3>{r.crop} <Badge tone={tone[r.fit]}>{r.fit} fit · {r.score}%</Badge></h3>
                {r.reasons.length > 0 && <><b>Why</b><ul>{r.reasons.map((x) => <li key={x}>{x}</li>)}</ul></>}
                {r.cautions.length > 0 && <><b>Watch out</b><ul>{r.cautions.map((x) => <li key={x}>{x}</li>)}</ul></>}
              </article>
            ))}
          </div>
          <article className="card"><h3>Limitations</h3><ul>{out.limitations.map((l) => <li key={l}>{l}</li>)}</ul></article>
        </>
      )}
    </section>
  );
}
