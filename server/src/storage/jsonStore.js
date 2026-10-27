/**
 * Local JSON-file storage for the demo.
 * Every collection has the same small async API (all/find/get/insert/update/remove/removeWhere),
 * so it can later be replaced by a MongoDB-backed implementation without touching controllers or the frontend.
 * Writes are atomic (write temp file, then rename) so a crash cannot leave half-written JSON.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const COLLECTIONS = ['users', 'farms', 'crops', 'soil', 'reminders', 'products', 'orders', 'posts', 'consultations'];

const clone = (v) => structuredClone(v);

class Collection {
  constructor(name, dir) {
    this.name = name;
    this.file = path.join(dir, `${name}.json`);
    this.items = this.#load();
  }

  #load() {
    if (!fs.existsSync(this.file)) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (!Array.isArray(parsed)) throw new Error('not an array');
      return parsed;
    } catch (err) {
      const backup = `${this.file}.corrupt-${Date.now()}`;
      fs.renameSync(this.file, backup);
      console.warn(`[storage] ${this.name}.json was unreadable (${err.message}). Moved to ${path.basename(backup)} and started empty.`);
      return [];
    }
  }

  #save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.items, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
  }

  async all() { return clone(this.items); }
  async find(predicate) { return clone(this.items.filter(predicate)); }
  async findOne(predicate) { const r = this.items.find(predicate); return r ? clone(r) : null; }
  async get(id) { const r = this.items.find((x) => x.id === id); return r ? clone(r) : null; }

  async insert(doc) {
    const now = new Date().toISOString();
    const rec = { ...clone(doc), id: randomUUID(), createdAt: now, updatedAt: now };
    this.items.push(rec);
    this.#save();
    return clone(rec);
  }

  async update(id, patch) {
    const i = this.items.findIndex((x) => x.id === id);
    if (i === -1) return null;
    const clean = Object.fromEntries(Object.entries(clone(patch)).filter(([k, v]) => v !== undefined && !['id', 'owner', 'createdAt'].includes(k)));
    this.items[i] = { ...this.items[i], ...clean, updatedAt: new Date().toISOString() };
    this.#save();
    return clone(this.items[i]);
  }

  async remove(id) {
    const before = this.items.length;
    this.items = this.items.filter((x) => x.id !== id);
    if (this.items.length !== before) this.#save();
    return before !== this.items.length;
  }

  async removeWhere(predicate) {
    const before = this.items.length;
    this.items = this.items.filter((x) => !predicate(x));
    if (this.items.length !== before) this.#save();
    return before - this.items.length;
  }
}

export function createStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true });
  const store = { kind: 'json-file', dataDir };
  for (const name of COLLECTIONS) store[name] = new Collection(name, dataDir);
  return store;
}
