import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { Field } from '../components/ui.jsx';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', areaUnit: user.preferences.areaUnit, tempUnit: user.preferences.tempUnit });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErrors({});
    try { setUser(await api.patch('/profile', { ...form, phone: form.phone || null })); toast('Profile saved.'); }
    catch (err) { setErrors(err.fields || {}); toast(err.message, 'error'); } finally { setBusy(false); }
  }
  async function changePw(e) {
    e.preventDefault();
    if (pwBusy) return;
    setPwBusy(true); setPwErrors({});
    try { await api.post('/profile/password', pw); setPw({ currentPassword: '', newPassword: '' }); toast('Password changed.'); }
    catch (err) { setPwErrors(err.fields || {}); toast(err.message, 'error'); } finally { setPwBusy(false); }
  }

  return (
    <section className="page narrow">
      <h1>Profile &amp; settings</h1>
      <form className="card form-grid" onSubmit={save} noValidate>
        <h2>Your details</h2>
        <Field id="pr-name" label="Name" error={errors.name}><input id="pr-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field id="pr-email" label="Email" help="Email cannot be changed in this version."><input id="pr-email" value={user.email} disabled /></Field>
        <Field id="pr-phone" label="Phone (optional)" error={errors.phone}><input id="pr-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field id="pr-area" label="Preferred area unit" help="Used as the default when adding farms."><select id="pr-area" value={form.areaUnit} onChange={(e) => setForm({ ...form, areaUnit: e.target.value })}><option value="acres">Acres</option><option value="hectares">Hectares</option></select></Field>
        <Field id="pr-temp" label="Temperature unit" help="Used on the dashboard and weather pages."><select id="pr-temp" value={form.tempUnit} onChange={(e) => setForm({ ...form, tempUnit: e.target.value })}><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select></Field>
        <div className="row-end full"><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button></div>
      </form>
      <form className="card form-grid" onSubmit={changePw} noValidate>
        <h2>Change password</h2>
        <Field id="pw-cur" label="Current password" error={pwErrors.currentPassword}><input id="pw-cur" type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
        <Field id="pw-new" label="New password" error={pwErrors.newPassword} help="At least 8 characters, with a letter and a number."><input id="pw-new" type="password" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
        <div className="row-end full"><button className="btn btn-secondary" disabled={pwBusy}>{pwBusy ? 'Changing…' : 'Change password'}</button></div>
      </form>
      <button className="btn btn-secondary" onClick={async () => { await logout(); nav('/'); }}>Log out</button>
    </section>
  );
}
