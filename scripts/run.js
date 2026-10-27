// One launcher for everything, so beginners never have to guess which file to run.
//   npm start   -> installs (first time), builds the frontend (first time), starts the server
//   npm run dev -> server + Vite dev server with hot reload (http://localhost:5173)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const server = path.join(root, 'server');
const client = path.join(root, 'client');
const cmd = process.argv[2] || 'start';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 12)) {
  console.error(`\nNode.js ${process.versions.node} is too old. Please install the LTS version from https://nodejs.org (20.12 or newer), then reopen VS Code.\n`);
  process.exit(1);
}

function run(args, cwd, what) {
  console.log(`\n> ${what}`);
  const r = spawnSync('npm', args, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error(`\n"${what}" failed. Read the message above. Common causes: no internet connection, or a proxy/firewall blocking npm.`);
    console.error('See "Troubleshooting" in README.md.\n');
    process.exit(r.status || 1);
  }
}
function needsInstall(dir) {
  const marker = path.join(dir, 'node_modules', '.package-lock.json');
  if (!fs.existsSync(marker)) return true;
  // package.json changed after the last install (e.g. a new dependency was added) -> install again
  return fs.statSync(path.join(dir, 'package.json')).mtimeMs > fs.statSync(marker).mtimeMs;
}

function newestMtime(dir) {
  let newest = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    newest = Math.max(newest, e.isDirectory() ? newestMtime(p) : fs.statSync(p).mtimeMs);
  }
  return newest;
}
function needsBuild() {
  const index = path.join(client, 'dist', 'index.html');
  if (!fs.existsSync(index)) return true;
  return newestMtime(path.join(client, 'src')) > fs.statSync(index).mtimeMs;
}

function install() {
  if (needsInstall(server)) run(['install'], server, 'Installing server packages (first run only)');
  if (needsInstall(client)) run(['install'], client, 'Installing client packages (first run only)');
}
function build() { run(['run', 'build'], client, 'Building the website'); }

switch (cmd) {
  case 'setup': install(); build(); console.log('\nSetup complete. Now run: npm start\n'); break;
  case 'build': install(); build(); break;
  case 'test': install(); run(['test'], server, 'Server tests'); run(['test'], client, 'Client tests'); break;
  case 'start': {
    install();
    if (needsBuild()) build();
    const child = spawn(process.execPath, [path.join('src', 'server.js')], { cwd: server, stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
    for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => child.kill(sig));
    break;
  }
  case 'dev': {
    install();
    const s = spawn(process.execPath, ['--watch', path.join('src', 'server.js')], { cwd: server, stdio: 'inherit' });
    const c = spawn('npm', ['run', 'dev'], { cwd: client, stdio: 'inherit', shell: true });
    console.log('\nDev mode: open http://localhost:5173 (API on http://localhost:5000)\n');
    const stop = () => { s.kill(); c.kill(); process.exit(0); };
    process.on('SIGINT', stop); process.on('SIGTERM', stop);
    break;
  }
  default: console.error(`Unknown command "${cmd}". Use: start | setup | dev | build | test`); process.exit(1);
}
