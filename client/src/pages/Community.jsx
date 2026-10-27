import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useToast } from '../components/Toast.jsx';
import { Badge, ConfirmDialog, DemoNotice, EmptyState, ErrorState, Field, Loading } from '../components/ui.jsx';
import CrudPageLite from '../components/CrudPage.jsx';
import { fmtDate, titleCase } from '../utils/format.js';

function Posts() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad(() => api.get('/posts'), []);
  const [form, setForm] = useState({ title: '', body: '', category: 'question' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErrors({});
    try { await api.post('/posts', form); setForm({ title: '', body: '', category: 'question' }); reload(); toast('Post published.'); }
    catch (err) { setErrors(err.fields || {}); toast(err.message, 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true);
    try { await api.del(`/posts/${toDelete.id}`); toast('Post deleted.'); setToDelete(null); reload(); } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }
  return (
    <>
      <p className="muted">Posts are visible to every signed-in user. Please do not share personal details.</p>
      <form className="card form-grid" onSubmit={submit} noValidate>
        <h2>Start a conversation</h2>
        <Field id="p-title" label="Title" error={errors.title}><input id="p-title" value={form.title} maxLength={120} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
        <Field id="p-cat" label="Category"><select id="p-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="question">Question</option><option value="tip">Tip</option><option value="discussion">Discussion</option></select></Field>
        <Field id="p-body" label="Message" error={errors.body}><textarea id="p-body" rows={3} maxLength={2000} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
        <div className="row-end full"><button className="btn btn-primary" disabled={busy}>{busy ? 'Posting…' : 'Post'}</button></div>
      </form>
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data?.length === 0 && <EmptyState title="No posts yet">Be the first to post a question or tip.</EmptyState>}
      <ul className="list cards">
        {data?.map((p) => (
          <li className="card" key={p.id}>
            <Badge>{p.category}</Badge> <b>{p.title}</b>
            <p style={{ whiteSpace: 'pre-wrap' }}>{p.body}</p>
            <p className="muted small">{p.authorName} · {fmtDate(p.createdAt)}</p>
            {p.mine && <button className="btn btn-small btn-danger-outline" onClick={() => setToDelete(p)}>Delete my post</button>}
          </li>
        ))}
      </ul>
      <ConfirmDialog open={Boolean(toDelete)} title="Delete this post?" message="This cannot be undone." busy={busy} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </>
  );
}

const TOPICS = ['crop-selection', 'soil-health', 'pest-disease', 'irrigation', 'other'].map((v) => ({ value: v, label: titleCase(v) }));
const fields = [
  { name: 'topic', label: 'Topic', type: 'select', required: true, options: TOPICS },
  { name: 'crop', label: 'Crop (optional)' },
  { name: 'farmId', label: 'Farm (optional)', type: 'select', options: (x) => (x.farms || []).map((f) => ({ value: f.id, label: f.name })) },
  { name: 'message', label: 'Your question', type: 'textarea', required: true, help: 'At least 10 characters' },
];
const columns = [
  { label: 'Topic', render: (c) => titleCase(c.topic) },
  { label: 'Question', render: (c) => c.message },
  { label: 'Sent', render: (c) => fmtDate(c.createdAt) },
  { label: 'Status', render: () => <Badge tone="demo">saved (demo: no expert reply)</Badge> },
];

export default function Community() {
  const [tab, setTab] = useState('posts');
  return (
    <section className="page">
      <h1>Community &amp; consultation</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'posts'} className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>Community posts</button>
        <button role="tab" aria-selected={tab === 'consult'} className={tab === 'consult' ? 'active' : ''} onClick={() => setTab('consult')}>Consultation requests</button>
      </div>
      {tab === 'posts' ? <Posts /> : (
        <>
          <DemoNotice>Requests are saved, but no real expert is connected, so no reply will arrive. For real advice contact your local agriculture office.</DemoNotice>
          <CrudPageLite embedded canEdit={false} title="My consultation requests" noun="Request" endpoint="/consultations" fields={fields} columns={columns} loadExtra={async () => ({ farms: await api.get('/farms') })} />
        </>
      )}
    </section>
  );
}
