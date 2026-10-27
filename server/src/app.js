import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createStore } from './storage/jsonStore.js';
import { passwordHasher } from './utils/password.js';
import { seedIfEmpty } from './scripts/seed.js';
import { buildApiRouter } from './routes/api.js';
import { env } from './config/env.js';

function loadSecret(dataDir, fromEnv) {
  if (fromEnv) return fromEnv;
  const file = path.join(dataDir, '.jwt-secret');
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  const s = randomBytes(48).toString('hex');
  fs.writeFileSync(file, s, { mode: 0o600 });
  return s;
}

export async function createApp(opts = {}) {
  const dataDir = opts.dataDir || env.dataDir;
  let store = opts.store;
  if (!store && env.mongoUri) store = await (await import('./storage/mongoStore.js')).createMongoStore(env.mongoUri); // needs the mongoose package
  if (!store) store = createStore(dataDir);
  const hasher = opts.hasher || passwordHasher;
  fs.mkdirSync(dataDir, { recursive: true }); // the token secret file always lives in the local data folder
  const secret = loadSecret(dataDir, opts.jwtSecret ?? env.jwtSecret);
  await seedIfEmpty(store, hasher, { demoUser: opts.seedDemo ?? env.seedDemo });

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { useDefaults: true, directives: { 'upgrade-insecure-requests': null } } }));
  app.use(express.json({ limit: '50kb' }));

  // CSRF defence: the browser app always sends this custom header; a cross-site form cannot.
  app.use('/api', (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('x-requested-with') !== 'agrismart') return res.status(403).json({ error: { message: 'Missing required request header' } });
    next();
  });

  const generalLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: opts.generalLimit ?? 1000, standardHeaders: true, legacyHeaders: false });
  // Only FAILED login/register attempts count, so normal use is never blocked.
  const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: opts.authLimit ?? 15, skipSuccessfulRequests: true, standardHeaders: true, legacyHeaders: false, message: { error: { message: 'Too many attempts. Please wait a few minutes and try again.' } } });
  app.use('/api', generalLimit);

  app.get('/api/health', (req, res) => res.json({ data: { status: 'ok', storage: store.kind, time: new Date().toISOString() } }));
  app.use('/api', buildApiRouter({ store, hasher, secret, authLimit, cookieSecure: opts.cookieSecure }));
  app.use('/api', (req, res) => res.status(404).json({ error: { message: 'Endpoint not found' } }));

  // Serve the built React app (client/dist) with SPA fallback.
  const dist = opts.clientDist ?? env.clientDist;
  if (fs.existsSync(path.join(dist, 'index.html'))) {
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    app.get('/', (req, res) => res.status(200).type('text/plain').send('AgriSmart API is running, but the frontend is not built yet. From the project root run: npm run build'));
  }

  // Central error handler: never leaks stack traces.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: { message: 'Request body is not valid JSON' } });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: { message: 'Request body is too large' } });
    const status = err.status && err.status < 600 ? err.status : 500;
    if (status === 500) console.error('[error]', err.message);
    res.status(status).json({ error: { message: status === 500 ? 'Something went wrong on the server' : err.message, ...(err.fields && { fields: err.fields }) } });
  });

  return { app, store };
}
