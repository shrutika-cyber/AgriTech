import { createApp } from './app.js';
import { env } from './config/env.js';
import { DEMO_USER } from './scripts/seedData.js';

let created;
try { created = await createApp(); } catch (e) { console.error(`\n${e.message}\n`); process.exit(1); }
const { app, store } = created;
const server = app.listen(env.port, env.host, () => {
  console.log('\n  AgriSmart is running');
  console.log(`  Open:     http://localhost:${env.port}`);
  console.log(store.kind === 'mongodb' ? '  Storage:  MongoDB' : `  Storage:  local JSON files in ${store.dataDir} (not MongoDB)`);
  if (env.seedDemo) console.log(`  Demo login (created on first run): ${DEMO_USER.email} / ${DEMO_USER.password}`);
  console.log('  Stop with Ctrl+C\n');
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`\nPort ${env.port} is already in use. Close the other program, or set PORT=5001 in server/.env\n`);
  else console.error(e);
  process.exit(1);
});
