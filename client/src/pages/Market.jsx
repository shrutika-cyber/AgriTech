import { useState } from 'react';
import { api } from '../services/api.js';
import { useLoad } from '../hooks/useLoad.js';
import { useToast } from '../components/Toast.jsx';
import { Badge, DemoNotice, EmptyState, ErrorState, Loading } from '../components/ui.jsx';
import { fmtDate, fmtMoney } from '../utils/format.js';

export default function Market() {
  const toast = useToast();
  const products = useLoad(() => api.get('/market/products'), []);
  const orders = useLoad(() => api.get('/market/orders'), []);
  const [cart, setCart] = useState({}); // productId -> quantity
  const [busy, setBusy] = useState(false);

  const list = products.data || [];
  const lines = list.filter((p) => cart[p.id]);
  const total = lines.reduce((s, p) => s + p.price * cart[p.id], 0);
  const add = (id) => setCart((c) => ({ ...c, [id]: Math.min(100, (c[id] || 0) + 1) }));
  const dec = (id) => setCart((c) => { const n = { ...c }; if (n[id] > 1) n[id] -= 1; else delete n[id]; return n; });

  async function place() {
    if (busy || !lines.length) return;
    setBusy(true);
    try {
      await api.post('/market/orders', { items: lines.map((p) => ({ productId: p.id, quantity: cart[p.id] })) });
      setCart({}); orders.reload(); toast('Simulated order placed. No payment taken.');
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  }

  return (
    <section className="page">
      <h1>Marketplace</h1>
      <DemoNotice>All products are SAMPLE listings and orders are SIMULATED: no payment is taken and nothing is delivered.</DemoNotice>
      {products.loading && <Loading />}
      {products.error && <ErrorState message={products.error} onRetry={products.reload} />}
      <div className="market">
        <div className="grid2">
          {list.map((p) => (
            <article className="card" key={p.id}>
              <Badge tone="demo">sample</Badge> <Badge>{p.category}</Badge>
              <h3>{p.name}</h3>
              <p className="muted small">{p.description}</p>
              <p><b>{fmtMoney(p.price)}</b> <span className="muted">/ {p.unit}</span></p>
              <button className="btn btn-secondary btn-small" onClick={() => add(p.id)}>Add to cart</button>
            </article>
          ))}
        </div>
        <aside className="card cart" aria-label="Cart">
          <h2>Your cart</h2>
          {lines.length === 0 ? <p className="muted">Your cart is empty.</p> : (
            <>
              <ul className="list">
                {lines.map((p) => (
                  <li key={p.id}>{p.name}<br />
                    <span className="qty">
                      <button className="btn btn-small btn-secondary" onClick={() => dec(p.id)} aria-label={`Remove one ${p.name}`}>−</button>
                      <b>{cart[p.id]}</b>
                      <button className="btn btn-small btn-secondary" onClick={() => add(p.id)} aria-label={`Add one ${p.name}`}>+</button>
                      <span className="muted">{fmtMoney(p.price * cart[p.id])}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p><b>Total: {fmtMoney(total)}</b></p>
              <button className="btn btn-primary btn-block" onClick={place} disabled={busy}>{busy ? 'Placing…' : 'Place simulated order'}</button>
            </>
          )}
        </aside>
      </div>
      <h2>My simulated orders</h2>
      {orders.data?.length === 0 && <EmptyState title="No orders yet">Orders you place will appear here.</EmptyState>}
      <ul className="list cards">
        {orders.data?.map((o) => (
          <li className="card" key={o.id}><Badge tone="demo">simulated</Badge> <b>{fmtDate(o.createdAt)}</b>: {fmtMoney(o.total)}
            <ul>{o.items.map((i) => <li key={i.productId}>{i.quantity} × {i.name}</li>)}</ul></li>
        ))}
      </ul>
    </section>
  );
}
