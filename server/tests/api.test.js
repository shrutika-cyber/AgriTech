// End-to-end API tests over real HTTP. They need the server dependencies (run `npm install` first);
// without them they are skipped rather than failing.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let createApp;
try { ({ createApp } = await import('../src/app.js')); } catch { createApp = null; }
const skip = createApp ? false : 'server dependencies are not installed';

async function boot() {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agri-api-'));
  const { app } = await createApp({ dataDir, seedDemo: false, clientDist: path.join(dataDir, 'none'), authLimit: 1000 });
  const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const client = () => {
    let cookie = '';
    return async (method, url, body, headers = {}) => {
      const res = await fetch(base + url, { method, headers: { 'content-type': 'application/json', 'x-requested-with': 'agrismart', ...(cookie && { cookie }), ...headers }, body: body ? JSON.stringify(body) : undefined });
      const set = res.headers.get('set-cookie');
      if (set) cookie = set.split(';')[0];
      return { status: res.status, body: await res.json().catch(() => null) };
    };
  };
  return { server, client };
}

test('API: auth, farms, crops, ownership, other features', { skip }, async () => {
  const { server, client } = await boot();
  try {
    const alice = client(); const bob = client(); const anon = client();

    assert.equal((await anon('GET', '/health')).body.data.status, 'ok');
    assert.equal((await anon('GET', '/farms')).status, 401, 'protected without login');
    assert.equal((await anon('POST', '/auth/register', { name: 'A' }, { 'x-requested-with': '' })).status, 403, 'CSRF header required');

    const reg = await alice('POST', '/auth/register', { name: 'Alice', email: 'alice@example.com', password: 'password1', role: 'admin' });
    assert.equal(reg.status, 201); assert.equal(reg.body.data.role, 'farmer');
    assert.equal((await alice('POST', '/auth/register', { name: 'Alice', email: 'alice@example.com', password: 'password1' })).status, 409);
    assert.equal((await anon('POST', '/auth/login', { email: 'alice@example.com', password: 'wrongpass1' })).status, 401);
    assert.equal((await alice('GET', '/auth/me')).body.data.email, 'alice@example.com');
    await bob('POST', '/auth/register', { name: 'Bob', email: 'bob@example.com', password: 'password2' });

    const bad = await alice('POST', '/farms', { name: '' });
    assert.equal(bad.status, 400); assert.ok(bad.body.error.fields.name);
    const farm = (await alice('POST', '/farms', { name: 'Alice farm', areaValue: 3 })).body.data;
    const crop = (await alice('POST', '/crops', { farmId: farm.id, crop: 'Wheat' })).body.data;
    assert.equal((await alice('PATCH', `/crops/${crop.id}`, { status: 'growing' })).body.data.status, 'growing');

    // Bob cannot see or change Alice's data
    assert.equal((await bob('GET', '/farms')).body.data.length, 0);
    assert.equal((await bob('GET', `/farms/${farm.id}`)).status, 404);
    assert.equal((await bob('PATCH', `/farms/${farm.id}`, { name: 'hacked' })).status, 404);
    assert.equal((await bob('DELETE', `/crops/${crop.id}`)).status, 404);
    assert.equal((await bob('POST', '/crops', { farmId: farm.id, crop: 'Rice' })).status, 400);

    // other features
    assert.equal((await alice('POST', '/soil', { ph: 5.4, nitrogen: 200 })).body.data.assessment.kind, 'rule-based-educational');
    assert.ok((await alice('POST', '/recommend', { season: 'rabi', ph: 6.8, soilType: 'loamy' })).body.data.results.length > 0);
    assert.ok((await alice('GET', '/pests?q=blight')).body.data.length >= 2);
    assert.equal((await alice('GET', '/weather')).body.data.isSimulated, true);
    assert.ok(Array.isArray((await alice('GET', '/alerts')).body.data));
    assert.equal((await alice('GET', '/dashboard')).body.data.counts.farms, 1);
    const products = (await alice('GET', '/market/products')).body.data;
    assert.ok(products.length > 0);
    const order = await alice('POST', '/market/orders', { items: [{ productId: products[0].id, quantity: 2 }] });
    assert.equal(order.status, 201); assert.equal(order.body.data.status, 'simulated'); assert.equal(order.body.data.total, products[0].price * 2);
    assert.equal((await alice('POST', '/market/orders', { items: [{ productId: products[0].id, quantity: 0 }] })).status, 400);
    const post = (await alice('POST', '/posts', { title: 'Hello', body: 'First post' })).body.data;
    assert.equal((await bob('GET', '/posts')).body.data.length, 1);
    assert.equal((await bob('DELETE', `/posts/${post.id}`)).status, 404);
    assert.equal((await alice('POST', '/consultations', { topic: 'soil-health', message: 'My soil is hard after rain, what should I check?' })).status, 201);
    assert.equal((await alice('PATCH', '/profile', { name: 'Alice B', role: 'admin' })).body.data.role, 'farmer');

    await alice('DELETE', `/farms/${farm.id}`);
    assert.equal((await alice('GET', '/crops')).body.data.length, 0, 'crops removed with their farm');
    await alice('POST', '/auth/logout');
    assert.equal((await anon('GET', '/auth/me')).status, 401);
  } finally { server.close(); }
});
