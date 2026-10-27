import express from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler, HttpError, notFound } from '../utils/errors.js';
import { validate } from '../utils/validate.js';
import { readCookie } from '../utils/cookies.js';
import { createAuthService, toPublic } from '../services/authService.js';
import { createResources } from '../services/resources.js';
import { compareAnalyses } from '../services/soilRules.js';
import { recommendCrops } from '../services/cropRecommender.js';
import { searchPests, getPest, matchSymptoms } from '../services/pestLibrary.js';
import { simulatedForecast } from '../services/weatherService.js';
import { buildAlerts } from '../services/alerts.js';
import { recommendSchema, postSchema, consultationSchema } from '../validators/schemas.js';
import { ownedResource, requireOwnFarm } from '../services/resources.js';

const COOKIE = 'agri_token';
const ok = (res, data, status = 200) => res.status(status).json({ data });

export function buildApiRouter({ store, hasher, secret, authLimit, cookieSecure }) {
  const router = express.Router();
  const auth = createAuthService(store, hasher);
  const res_ = createResources(store);

  // ---------- auth helpers ----------
  const setCookie = (req, res, userId) => {
    const token = jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
    res.cookie(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: cookieSecure ?? req.secure, maxAge: 7 * 86400000, path: '/' });
  };
  const requireAuth = asyncHandler(async (req, res, next) => {
    const token = readCookie(req, COOKIE);
    if (!token) throw new HttpError(401, 'Please sign in to continue');
    let payload;
    try { payload = jwt.verify(token, secret, { algorithms: ['HS256'] }); } catch { throw new HttpError(401, 'Your session has expired. Please sign in again'); }
    const user = await store.users.get(payload.sub);
    if (!user) throw new HttpError(401, 'Your session is no longer valid. Please sign in again');
    req.user = user;
    next();
  });

  // ---------- auth ----------
  router.post('/auth/register', authLimit, asyncHandler(async (req, res) => {
    const user = await auth.register(req.body);
    setCookie(req, res, user.id);
    ok(res, user, 201);
  }));
  router.post('/auth/login', authLimit, asyncHandler(async (req, res) => {
    const user = await auth.login(req.body);
    setCookie(req, res, user.id);
    ok(res, user);
  }));
  router.post('/auth/logout', (req, res) => { res.clearCookie(COOKIE, { path: '/' }); ok(res, { loggedOut: true }); });
  router.get('/auth/me', requireAuth, (req, res) => ok(res, toPublic(req.user)));

  // Everything below requires a signed-in user.
  router.use(requireAuth);

  // ---------- profile ----------
  router.patch('/profile', asyncHandler(async (req, res) => ok(res, await auth.updateProfile(req.user.id, req.body))));
  router.post('/profile/password', authLimit, asyncHandler(async (req, res) => ok(res, await auth.changePassword(req.user.id, req.body))));

  // ---------- farms, crops, reminders, soil ----------
  const crud = (path, r, { update = true } = {}) => {
    router.get(path, asyncHandler(async (req, res) => ok(res, await r.list(req.user.id, req.query))));
    router.post(path, asyncHandler(async (req, res) => ok(res, await r.create(req.user.id, req.body), 201)));
    router.get(`${path}/:id`, asyncHandler(async (req, res) => ok(res, await r.get(req.user.id, req.params.id))));
    if (update) router.patch(`${path}/:id`, asyncHandler(async (req, res) => ok(res, await r.update(req.user.id, req.params.id, req.body))));
    router.delete(`${path}/:id`, asyncHandler(async (req, res) => ok(res, await r.remove(req.user.id, req.params.id))));
  };
  crud('/farms', res_.farms);
  crud('/crops', res_.crops);
  crud('/reminders', res_.reminders);

  // soil: compare route must be registered before '/soil/:id'
  router.get('/soil/compare', asyncHandler(async (req, res) => {
    const [a, b] = await Promise.all([res_.soil.get(req.user.id, req.query.a), res_.soil.get(req.user.id, req.query.b)]);
    const [older, newer] = a.createdAt <= b.createdAt ? [a, b] : [b, a];
    ok(res, { older: older.id, newer: newer.id, changes: compareAnalyses(older, newer) });
  }));
  crud('/soil', res_.soil, { update: false });

  // ---------- crop recommendation (rule-based, not saved) ----------
  router.post('/recommend', asyncHandler(async (req, res) => ok(res, recommendCrops(validate(req.body, recommendSchema)))));

  // ---------- pests & alerts ----------
  router.get('/pests', (req, res) => ok(res, searchPests({ q: String(req.query.q || '').slice(0, 60), crop: String(req.query.crop || '').slice(0, 60), type: ['pest', 'disease'].includes(req.query.type) ? req.query.type : undefined })));
  router.get('/pests/:id', (req, res) => { const p = getPest(req.params.id); if (!p) throw notFound('Pest or disease'); ok(res, p); });
  router.post('/pests/match', (req, res) => {
    const text = typeof req.body?.symptoms === 'string' ? req.body.symptoms.trim().slice(0, 500) : '';
    if (text.length < 5) throw new HttpError(400, 'Please correct the highlighted fields', { fields: { symptoms: 'Describe what you see in at least 5 characters' } });
    ok(res, { disclaimer: 'Educational keyword matching only. This is NOT a diagnosis. Confirm with a local agriculture officer.', matches: matchSymptoms(text, req.body?.crop ? String(req.body.crop).slice(0, 60) : null) });
  });
  router.get('/alerts', asyncHandler(async (req, res) => {
    const uid = req.user.id;
    const [crops, reminders] = await Promise.all([store.crops.find((c) => c.owner === uid), store.reminders.find((r) => r.owner === uid)]);
    ok(res, buildAlerts({ crops, reminders }));
  }));

  // ---------- weather (SIMULATED in local mode) ----------
  router.get('/weather', (req, res) => ok(res, simulatedForecast(String(req.query.location || '').slice(0, 80) || 'Sample location')));

  // ---------- dashboard ----------
  router.get('/dashboard', asyncHandler(async (req, res) => {
    const uid = req.user.id;
    const [farms, crops, reminders, soil] = await Promise.all([
      store.farms.find((x) => x.owner === uid), store.crops.find((x) => x.owner === uid),
      store.reminders.find((x) => x.owner === uid), store.soil.find((x) => x.owner === uid),
    ]);
    soil.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const alerts = buildAlerts({ crops, reminders });
    const w = simulatedForecast();
    ok(res, {
      counts: { farms: farms.length, crops: crops.length, activeCrops: crops.filter((c) => c.status !== 'harvested').length, openReminders: reminders.filter((r) => !r.done).length, soilAnalyses: soil.length },
      latestSoil: soil[0] || null, alerts: alerts.slice(0, 5),
      weather: { isSimulated: true, notice: w.notice, current: w.current, today: w.daily[0] },
    });
  }));

  // ---------- marketplace (sample products, SIMULATED orders) ----------
  router.get('/market/products', asyncHandler(async (req, res) => ok(res, await store.products.all())));
  router.get('/market/orders', asyncHandler(async (req, res) => ok(res, (await store.orders.find((o) => o.owner === req.user.id)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)))));
  router.post('/market/orders', asyncHandler(async (req, res) => {
    const items = req.body?.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) throw new HttpError(400, 'Add between 1 and 20 items to your order');
    const lines = [];
    for (const it of items) {
      const product = typeof it?.productId === 'string' ? await store.products.get(it.productId) : null;
      const qty = Number(it?.quantity);
      if (!product) throw new HttpError(400, 'One of the products no longer exists');
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) throw new HttpError(400, `Quantity for "${product.name}" must be a whole number from 1 to 100`);
      lines.push({ productId: product.id, name: product.name, unit: product.unit, price: product.price, quantity: qty, lineTotal: product.price * qty });
    }
    const order = await store.orders.insert({ owner: req.user.id, items: lines, total: lines.reduce((s, l) => s + l.lineTotal, 0), status: 'simulated', note: 'SIMULATED ORDER: no payment was taken and nothing will be delivered.' });
    ok(res, order, 201);
  }));

  // ---------- community posts (visible to all signed-in users) ----------
  router.get('/posts', asyncHandler(async (req, res) => {
    const posts = (await store.posts.all()).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 100);
    ok(res, posts.map(({ owner, ...p }) => ({ ...p, mine: owner === req.user.id })));
  }));
  router.post('/posts', asyncHandler(async (req, res) => {
    const data = validate(req.body, postSchema);
    const p = await store.posts.insert({ category: 'discussion', ...data, owner: req.user.id, authorName: req.user.name });
    const { owner, ...rest } = p;
    ok(res, { ...rest, mine: true }, 201);
  }));
  router.delete('/posts/:id', asyncHandler(async (req, res) => {
    const p = typeof req.params.id === 'string' ? await store.posts.get(req.params.id) : null;
    if (!p || p.owner !== req.user.id) throw notFound('Post');
    await store.posts.remove(p.id);
    ok(res, { id: p.id });
  }));

  // ---------- consultation requests (stored only; no real expert is connected) ----------
  const consults = ownedResource(store.consultations, consultationSchema, {
    label: 'Consultation request',
    defaults: { status: 'received' },
    async beforeSave(userId, data) { await requireOwnFarm(store, userId, data.farmId); },
  });
  router.get('/consultations', asyncHandler(async (req, res) => ok(res, await consults.list(req.user.id))));
  router.post('/consultations', asyncHandler(async (req, res) => ok(res, { ...(await consults.create(req.user.id, req.body)), note: 'Request saved. DEMO: no real expert is connected, so no reply will arrive.' }, 201)));
  router.delete('/consultations/:id', asyncHandler(async (req, res) => ok(res, await consults.remove(req.user.id, req.params.id))));

  return router;
}
