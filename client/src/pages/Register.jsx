import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Field } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/dashboard" replace />;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your name (at least 2 characters)';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email address';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errs.password = 'Use at least 8 characters with a letter and a number';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try { await register(form); toast('Welcome to AgriSmart!'); nav('/dashboard', { replace: true }); }
    catch (err) { setErrors({ ...err.fields, form: err.message }); }
    finally { setBusy(false); }
  }

  return (
    <section className="page auth">
      <form className="card" onSubmit={submit} noValidate>
        <h1>Create your account</h1>
        {errors.form && <p className="banner-error" role="alert">{errors.form}</p>}
        <Field id="name" label="Full name" error={errors.name}><input id="name" autoComplete="name" value={form.name} onChange={set('name')} autoFocus /></Field>
        <Field id="email" label="Email" error={errors.email}><input id="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field id="password" label="Password" error={errors.password} help="At least 8 characters, with a letter and a number."><input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Creating account…' : 'Register'}</button>
        <p className="muted small">Already registered? <Link to="/login">Log in</Link></p>
      </form>
    </section>
  );
}
