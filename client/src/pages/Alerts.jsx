import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { Badge, DemoNotice, EmptyState, ErrorState, Field, Loading } from '../components/ui.jsx';
import CrudPage from '../components/CrudPage.jsx';
import { fmtDate } from '../utils/format.js';

const tone = { warning: 'danger', watch: 'warn', info: 'neutral' };

function AlertList() {
  const { data, loading, error, reload } = useLoad(() => api.get('/alerts'), []);
  if (loading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  return (
    <>
      <DemoNotice>Pest and weather alerts use SIMULATED weather in this local version, so they are hints to go and check your crop, never confirmed detections. Reminder alerts come from your own reminders.</DemoNotice>
      {data.length === 0 ? <EmptyState title="No alerts right now">Add active crops and reminders to see relevant items here.</EmptyState> : (
        <ul className="list cards">
          {data.map((a) => <li className="card" key={a.id}><Badge tone={tone[a.severity]}>{a.type}</Badge> {a.isSimulated && <Badge tone="demo">simulated</Badge>} <b>{a.title}</b><p className="muted">{a.message}</p></li>)}
        </ul>
      )}
    </>
  );
}

const reminderFields = [
  { name: 'title', label: 'Reminder', required: true },
  { name: 'dueDate', label: 'Due date', type: 'date', required: true },
  { name: 'farmId', label: 'Farm (optional)', type: 'select', options: (x) => (x.farms || []).map((f) => ({ value: f.id, label: f.name })) },
  { name: 'done', label: 'Completed', type: 'checkbox' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
];
const reminderCols = [
  { label: 'Reminder', render: (r) => <span style={r.done ? { textDecoration: 'line-through' } : undefined}><b>{r.title}</b></span> },
  { label: 'Due', render: (r) => fmtDate(r.dueDate) },
  { label: 'Status', render: (r) => <Badge tone={r.done ? 'good' : 'warn'}>{r.done ? 'done' : 'open'}</Badge> },
];

function PestGuide() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [sym, setSym] = useState('');
  const [symOut, setSymOut] = useState(null);
  const [symErr, setSymErr] = useState('');
  const list = useLoad(() => api.get(`/pests?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}`), [q, type]);

  async function match(e) {
    e.preventDefault(); setSymErr('');
    try { setSymOut(await api.post('/pests/match', { symptoms: sym })); } catch (err) { setSymErr(err.fields?.symptoms || err.message); setSymOut(null); }
  }
  return (
    <>
      <DemoNotice>Educational information only. This is not a diagnosis. Follow product labels and local regulations, and ask a qualified agriculture officer before treating. No pesticide products or doses are given here.</DemoNotice>
      <div className="card form-grid">
        <Field id="pq" label="Search by crop, pest or symptom"><input id="pq" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. wheat, blight, yellow leaves" /></Field>
        <Field id="pt" label="Type"><select id="pt" value={type} onChange={(e) => setType(e.target.value)}><option value="">Pests and diseases</option><option value="pest">Pests</option><option value="disease">Diseases</option></select></Field>
      </div>
      {list.loading && <Loading />}
      {list.error && <ErrorState message={list.error} onRetry={list.reload} />}
      {list.data?.length === 0 && <EmptyState title="No matches">Try a different word.</EmptyState>}
      <div className="grid2">
        {list.data?.map((p) => (
          <article className="card" key={p.id}>
            <h3>{p.name} <Badge tone={p.type === 'pest' ? 'warn' : 'danger'}>{p.type}</Badge></h3>
            <p className="muted small">Crops: {p.crops.join(', ')}</p>
            <details><summary>Symptoms, prevention &amp; next steps</summary>
              <b>Common symptoms</b><ul>{p.symptoms.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>Causes &amp; risk factors</b><ul>{p.causes.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>Prevention</b><ul>{p.prevention.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>Integrated pest management</b><ul>{p.ipm.map((x) => <li key={x}>{x}</li>)}</ul>
              <b>Safe next steps</b><ul>{p.nextSteps.map((x) => <li key={x}>{x}</li>)}</ul>
            </details>
          </article>
        ))}
      </div>
      <form className="card" onSubmit={match} noValidate>
        <h3>Describe what you see</h3>
        <Field id="sym" label="Symptoms" error={symErr}><textarea id="sym" rows={2} value={sym} onChange={(e) => setSym(e.target.value)} placeholder="e.g. white powder on leaves" /></Field>
        <button className="btn btn-secondary">Find possible matches</button>
        {symOut && (
          <div><p className="muted small">{symOut.disclaimer}</p>
            {symOut.matches.length === 0 ? <p>No entries matched those words.</p> : <ul>{symOut.matches.map((m) => <li key={m.id}>{m.name} <span className="muted">(matched: {m.matchedWords.join(', ')})</span></li>)}</ul>}
          </div>
        )}
      </form>
    </>
  );
}

export default function Alerts() {
  const [tab, setTab] = useState('alerts');
  const tabs = [['alerts', 'Alerts'], ['reminders', 'Reminders'], ['guide', 'Pest & disease guide']];
  return (
    <section className="page">
      <h1>Alerts, reminders &amp; pest guide</h1>
      <div className="tabs" role="tablist">
        {tabs.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {tab === 'alerts' && <AlertList />}
      {tab === 'reminders' && <CrudPage embedded title="Farm reminders" noun="Reminder" endpoint="/reminders" fields={reminderFields} columns={reminderCols} loadExtra={async () => ({ farms: await api.get('/farms') })} />}
      {tab === 'guide' && <PestGuide />}
    </section>
  );
}
