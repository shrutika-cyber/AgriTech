import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useToast } from './Toast.jsx';
import { ConfirmDialog, EmptyState, ErrorState, Field, Loading } from './ui.jsx';

const blank = (fields) => Object.fromEntries(fields.map((f) => [f.name, f.type === 'checkbox' ? false : (f.default ?? '')]));

/**
 * Reusable list + create/edit form + delete-with-confirmation for one resource.
 * fields: [{ name, label, type: text|number|date|select|textarea|checkbox, options, required, step, help }]
 * columns: [{ label, render(item) }]   extra: loaded once, passed to select options via options(extra)
 */
export default function CrudPage({ title, intro, noun, endpoint, fields, columns, loadExtra, emptyHint, blocker, embedded = false, canEdit = true }) {
  const toast = useToast();
  const { data: items, loading, error, reload } = useLoad(() => api.get(endpoint), [endpoint]);
  const { data: extra } = useLoad(() => (loadExtra ? loadExtra() : Promise.resolve({})), []);
  const [editing, setEditing] = useState(null); // null | 'new' | item
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const optionsFor = (f) => (typeof f.options === 'function' ? f.options(extra || {}) : f.options || []);

  function open(item) {
    setErrors({});
    if (item === 'new') setValues(blank(fields));
    else setValues(Object.fromEntries(fields.map((f) => [f.name, item[f.name] ?? (f.type === 'checkbox' ? false : '')])));
    setEditing(item);
  }

  async function submit(e) {
    e.preventDefault();
    if (saving) return;
    const clientErrors = {};
    for (const f of fields) if (f.required && (values[f.name] === '' || values[f.name] == null)) clientErrors[f.name] = `${f.label} is required`;
    if (Object.keys(clientErrors).length) { setErrors(clientErrors); return; }
    const isNew = editing === 'new';
    const body = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.type === 'checkbox') body[f.name] = Boolean(v);
      else if (v === '' || v == null) { if (!isNew) body[f.name] = null; } // empty on edit clears the value
      else body[f.name] = v;
    }
    setSaving(true); setErrors({});
    try {
      if (isNew) await api.post(endpoint, body); else await api.patch(`${endpoint}/${editing.id}`, body);
      toast(`${noun} ${isNew ? 'added' : 'updated'}.`);
      setEditing(null); reload();
    } catch (err) {
      setErrors(err.fields || {});
      toast(err.message, 'error');
    } finally { setSaving(false); }
  }

  async function confirmDelete() {
    setSaving(true);
    try { await api.del(`${endpoint}/${toDelete.id}`); toast(`${noun} deleted.`); setToDelete(null); reload(); }
    catch (err) { toast(err.message, 'error'); } finally { setSaving(false); }
  }

  const set = (name, v) => setValues((s) => ({ ...s, [name]: v }));

  return (
    <section className={embedded ? 'embedded' : 'page'}>
      <div className="page-head">
        <div>{embedded ? <h2>{title}</h2> : <h1>{title}</h1>}{intro && <p className="muted">{intro}</p>}</div>
        {!editing && !blocker && <button className="btn btn-primary" onClick={() => open('new')}>+ Add {noun.toLowerCase()}</button>}
      </div>
      {blocker}
      {editing && (
        <form className="card form-grid" onSubmit={submit} noValidate>
          <h2>{editing === 'new' ? `Add ${noun.toLowerCase()}` : `Edit ${noun.toLowerCase()}`}</h2>
          {fields.map((f, i) => {
            const id = `f-${f.name}`;
            const common = { id, name: f.name, 'aria-invalid': Boolean(errors[f.name]), 'aria-describedby': errors[f.name] ? `${id}-err` : undefined };
            return (
              <Field key={f.name} id={id} label={f.required ? `${f.label} *` : f.label} error={errors[f.name]} help={f.help}>
                {f.type === 'select' ? (
                  <select {...common} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} autoFocus={i === 0}>
                    {!f.required && <option value="">None</option>}
                    {f.required && <option value="" disabled>Choose…</option>}
                    {optionsFor(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea {...common} rows={3} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                ) : f.type === 'checkbox' ? (
                  <input {...common} type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} />
                ) : (
                  <input {...common} type={f.type || 'text'} step={f.step} value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} autoFocus={i === 0} />
                )}
              </Field>
            );
          })}
          <div className="row-end full">
            <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}
      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {!loading && !error && items?.length === 0 && !blocker && <EmptyState title={`No ${noun.toLowerCase()} records yet`}>{emptyHint || `Click “Add ${noun.toLowerCase()}” to create your first one.`}</EmptyState>}
      {!loading && !error && items?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  {columns.map((c) => <td key={c.label} data-label={c.label}>{c.render(it, extra || {})}</td>)}
                  <td className="actions">
                    {canEdit && <button className="btn btn-small btn-secondary" onClick={() => open(it)} aria-label={`Edit ${noun.toLowerCase()}`}>Edit</button>}
                    <button className="btn btn-small btn-danger-outline" onClick={() => setToDelete(it)} aria-label={`Delete ${noun.toLowerCase()}`}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmDialog open={Boolean(toDelete)} title={`Delete this ${noun.toLowerCase()}?`} message="This cannot be undone." busy={saving} onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </section>
  );
}
