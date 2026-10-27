import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from '../src/storage/jsonStore.js';
import { createAuthService } from '../src/services/authService.js';
import { createResources } from '../src/services/resources.js';
import { buildAlerts } from '../src/services/alerts.js';
import { seedIfEmpty } from '../src/scripts/seed.js';

// Fake hasher: lets these tests run without the bcryptjs package. (The real one is used by the API tests.)
const fakeHasher = { hash: async (p) => `hashed:${p.split('').reverse().join('')}`, compare: async (p, h) => h === `hashed:${p.split('').reverse().join('')}` };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'agri-'));
const reject = async (promise, status, field) => {
  await assert.rejects(promise, (e) => { assert.equal(e.status, status); if (field) assert.ok(e.fields?.[field], `expected field error on ${field}`); return true; });
};

test('JSON store persists across restarts and recovers from corrupt files', async () => {
  const dir = tmp();
  let s = createStore(dir);
  const rec = await s.farms.insert({ owner: 'u1', name: 'A' });
  assert.ok(rec.id && rec.createdAt);
  s = createStore(dir); // "restart"
  assert.equal((await s.farms.all()).length, 1);
  assert.equal((await s.farms.get(rec.id)).name, 'A');
  fs.writeFileSync(path.join(dir, 'farms.json'), '{not json');
  s = createStore(dir);
  assert.equal((await s.farms.all()).length, 0);
  assert.ok(fs.readdirSync(dir).some((f) => f.includes('.corrupt-')));
});

test('store update cannot change id/owner', async () => {
  const s = createStore(tmp());
  const r = await s.farms.insert({ owner: 'u1', name: 'A' });
  const u = await s.farms.update(r.id, { name: 'B', owner: 'hacker', id: 'x' });
  assert.equal(u.name, 'B'); assert.equal(u.owner, 'u1'); assert.equal(u.id, r.id);
});

test('passwords are never stored in plain text; role cannot be chosen', async () => {
  const dir = tmp();
  const s = createStore(dir);
  const auth = createAuthService(s, fakeHasher);
  const u = await auth.register({ name: 'Ann Farmer', email: 'ANN@Example.com', password: 'secret123', role: 'admin', isDemo: true });
  assert.equal(u.role, 'farmer');
  assert.equal(u.email, 'ann@example.com');
  assert.equal('passwordHash' in u, false);
  assert.ok(!fs.readFileSync(path.join(dir, 'users.json'), 'utf8').includes('secret123'));
  const stored = (await s.users.all())[0];
  assert.equal(stored.isDemo, undefined);
});

test('registration validation and duplicate email', async () => {
  const auth = createAuthService(createStore(tmp()), fakeHasher);
  await reject(auth.register({ name: 'A', email: 'bad', password: 'short' }), 400, 'email');
  await reject(auth.register({ name: 'Ann', email: 'a@b.co', password: 'onlyletters' }), 400, 'password');
  await auth.register({ name: 'Ann', email: 'a@b.co', password: 'abc12345' });
  await reject(auth.register({ name: 'Ann', email: 'A@B.co', password: 'abc12345' }), 409, 'email');
});

test('login succeeds with right password, fails generically otherwise', async () => {
  const auth = createAuthService(createStore(tmp()), fakeHasher);
  await auth.register({ name: 'Ann', email: 'a@b.co', password: 'abc12345' });
  assert.equal((await auth.login({ email: 'a@b.co', password: 'abc12345' })).email, 'a@b.co');
  await reject(auth.login({ email: 'a@b.co', password: 'wrong1234' }), 401);
  await reject(auth.login({ email: 'nobody@b.co', password: 'abc12345' }), 401);
});

test('profile update cannot touch role/email; password change checks current password', async () => {
  const s = createStore(tmp());
  const auth = createAuthService(s, fakeHasher);
  const u = await auth.register({ name: 'Ann', email: 'a@b.co', password: 'abc12345' });
  const upd = await auth.updateProfile(u.id, { name: 'Ann B', role: 'admin', email: 'x@y.z', tempUnit: 'F' });
  assert.equal(upd.name, 'Ann B'); assert.equal(upd.role, 'farmer'); assert.equal(upd.email, 'a@b.co'); assert.equal(upd.preferences.tempUnit, 'F');
  await reject(auth.changePassword(u.id, { currentPassword: 'nope1234', newPassword: 'newpass123' }), 400, 'currentPassword');
  await auth.changePassword(u.id, { currentPassword: 'abc12345', newPassword: 'newpass123' });
  await auth.login({ email: 'a@b.co', password: 'newpass123' });
});

test('farm CRUD + validation', async () => {
  const s = createStore(tmp());
  const { farms } = createResources(s);
  await reject(farms.create('u1', { name: '' }), 400, 'name');
  await reject(farms.create('u1', { name: 'Okay', areaValue: -3 }), 400, 'areaValue');
  const f = await farms.create('u1', { name: 'North field', areaValue: '2.5', areaUnit: 'hectares', soilType: 'clay' });
  assert.equal(f.areaValue, 2.5);
  assert.equal((await farms.update('u1', f.id, { name: 'North 2' })).name, 'North 2');
  assert.equal((await farms.list('u1')).length, 1);
  await farms.remove('u1', f.id);
  assert.equal((await farms.list('u1')).length, 0);
});

test('crop CRUD requires an owned farm and cascades on farm delete', async () => {
  const s = createStore(tmp());
  const { farms, crops } = createResources(s);
  const f1 = await farms.create('u1', { name: 'Farm one' });
  const f2 = await farms.create('u2', { name: 'Farm two' });
  await reject(crops.create('u1', { crop: 'Wheat' }), 400, 'farmId');
  await reject(crops.create('u1', { crop: 'Wheat', farmId: f2.id }), 400, 'farmId'); // someone else's farm
  const c = await crops.create('u1', { crop: 'Wheat', farmId: f1.id, sowingDate: '2026-11-01' });
  assert.equal(c.status, 'planned'); assert.equal(c.sowingDate, '2026-11-01');
  await reject(crops.create('u1', { crop: 'Wheat', farmId: f1.id, status: 'dead' }), 400, 'status');
  assert.equal((await crops.update('u1', c.id, { status: 'growing' })).status, 'growing');
  await farms.remove('u1', f1.id);
  assert.equal((await crops.list('u1')).length, 0);
});

test('ownership: users cannot read, edit or delete each other\'s records', async () => {
  const s = createStore(tmp());
  const r = createResources(s);
  const farm = await r.farms.create('alice', { name: 'Alice farm' });
  const crop = await r.crops.create('alice', { crop: 'Maize', farmId: farm.id });
  for (const [res, id] of [[r.farms, farm.id], [r.crops, crop.id]]) {
    await reject(res.get('bob', id), 404);
    await reject(res.update('bob', id, { notes: 'x' }), 404);
    await reject(res.remove('bob', id), 404);
    assert.equal((await res.list('bob')).length, 0);
  }
  await reject(r.farms.get('alice', { $ne: null }), 404); // object id is rejected, not used as a query
  assert.equal((await r.farms.get('alice', farm.id)).name, 'Alice farm');
});

test('soil analysis stores a rule-based assessment and rejects bad values', async () => {
  const s = createStore(tmp());
  const { soil } = createResources(s);
  await reject(soil.create('u1', { ph: 15 }), 400, 'ph');
  const rec = await soil.create('u1', { ph: 5.2, nitrogen: 200 });
  assert.equal(rec.assessment.kind, 'rule-based-educational');
});

test('alerts: reminders from real data, pest hints labelled simulated', () => {
  const today = new Date(2026, 9, 27);
  const alerts = buildAlerts({
    today,
    crops: [{ crop: 'Wheat', status: 'growing' }],
    reminders: [
      { id: '1', title: 'Irrigate', dueDate: '2026-10-28', done: false },
      { id: '2', title: 'Old', dueDate: '2026-10-20', done: false },
      { id: '3', title: 'Done', dueDate: '2026-10-28', done: true },
      { id: '4', title: 'Far', dueDate: '2026-12-28', done: false },
    ],
  });
  assert.deepEqual(alerts.filter((a) => a.type === 'reminder').map((a) => a.title).sort(), ['Irrigate', 'Overdue: Old']);
  assert.ok(alerts.filter((a) => a.type !== 'reminder').every((a) => a.isSimulated));
  assert.ok(alerts.filter((a) => a.type === 'reminder').every((a) => !a.isSimulated));
});

test('seeding creates sample products and a working demo account once, without overwriting', async () => {
  const s = createStore(tmp());
  await seedIfEmpty(s, fakeHasher);
  assert.ok((await s.products.all()).length >= 5);
  assert.ok((await s.products.all()).every((p) => p.isSample));
  const auth = createAuthService(s, fakeHasher);
  assert.equal((await auth.login({ email: 'demo@agrismart.local', password: 'Demo@12345' })).isDemo, true);
  await seedIfEmpty(s, fakeHasher);
  assert.equal((await s.users.all()).length, 1);
});
