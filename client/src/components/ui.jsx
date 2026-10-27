import { useEffect, useRef } from 'react';

export const Loading = ({ text = 'Loading…' }) => <p className="state" role="status">{text}</p>;

export function ErrorState({ message, onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <p>{message}</p>
      {onRetry && <button className="btn btn-secondary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export const EmptyState = ({ title, children }) => (
  <div className="state empty"><h3>{title}</h3><div>{children}</div></div>
);

/** Yellow banner used wherever content is simulated or sample-only. */
export const DemoNotice = ({ children }) => <p className="demo-notice"><strong>DEMO:</strong> {children}</p>;

export const Badge = ({ tone = 'neutral', children }) => <span className={`badge badge-${tone}`}>{children}</span>;

export function Field({ label, error, help, children, id }) {
  return (
    <div className={`field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {help && !error && <small className="help">{help}</small>}
      {error && <small className="error" id={`${id}-err`} role="alert">{error}</small>}
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmText = 'Delete', onConfirm, onCancel, busy }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="row-end">
        <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>{busy ? 'Working…' : confirmText}</button>
      </div>
    </dialog>
  );
}
