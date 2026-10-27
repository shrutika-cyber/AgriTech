// Deletes all local demo data (users, farms, crops...). Run with: npm run reset-data
import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';

if (!fs.existsSync(env.dataDir)) { console.log('Nothing to reset.'); process.exit(0); }
let n = 0;
for (const f of fs.readdirSync(env.dataDir)) {
  if (f.endsWith('.json') || f.includes('.corrupt-')) { fs.rmSync(path.join(env.dataDir, f)); n += 1; }
}
console.log(`Removed ${n} data file(s) from ${env.dataDir}. Restart the server to recreate sample data.`);
