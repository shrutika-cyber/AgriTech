import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (!form.email.trim()) errs.email = 'Enter your email';
    if (!form.password) errs.password = 'Enter your password';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await login(form.email, form.password); nav(loc.state?.from || '/dashboard', { replace: true }); }
    catch (err) { setErrors({ ...err.fields, form: err.message }); toast(err.message, 'error'); }
    finally { setBusy(false); }
  }

  return (
    <section className="page auth">
      <form className="card" onSubmit={submit} noValidate>
        <h1>Log in</h1>
        {errors.form && <p className="banner-error" role="alert">{errors.form}</p>}
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoFocus />
        </Field>
        <Field id="password" label="Password" error={errors.password}>
          <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Signing in…' : 'Log in'}</button>
        <p className="muted small">New here? <Link to="/register">Create an account</Link></p>
        <div className="demo-box">
          <p className="small"><strong>Demo account</strong> (created automatically on first run; unavailable if demo data was reset):</p>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => setForm({ email: 'demo@agrismart.local', password: 'Demo@12345' })}>Fill demo login</button>
        </div>
      </form>
    </section>
  );
}
