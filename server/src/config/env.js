import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Node 20.12+ can read a .env file natively (no dotenv package needed).
try { process.loadEnvFile(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env')); } catch { /* no .env: use defaults */ }

const here = path.dirname(fileURLToPath(import.meta.url));

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  host: process.env.HOST || '127.0.0.1',
  // Where the JSON "database" lives. This is NOT MongoDB: it is plain local files for demo use.
  dataDir: path.resolve(process.env.DATA_DIR || path.join(here, '../../data')),
  clientDist: path.resolve(here, '../../../client/dist'),
  jwtSecret: process.env.JWT_SECRET || '', // if empty, a random secret is generated into data/.jwt-secret
  // If set, MongoDB is used instead of the local JSON files.
  mongoUri: process.env.MONGODB_URI || '',
  seedDemo: process.env.SEED_DEMO !== 'false',
};
