/**
 * MongoDB storage (via Mongoose). Same small async API as jsonStore.js, so controllers and the
 * frontend are unchanged. Used automatically when MONGODB_URI is set in server/.env.
 *
 * Note for beginners: find()/findOne()/removeWhere() take a JavaScript filter function, so this
 * implementation loads the collection and filters in code. That is simple and correct for a student
 * project; for large data you would replace these with real MongoDB queries.
 */
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { COLLECTIONS } from './jsonStore.js';

const PROTECTED = ['id', '_id', 'owner', 'createdAt'];

function toRecord(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

class MongoCollection {
  constructor(name) {
    const schema = new mongoose.Schema({ _id: { type: String } }, { strict: false, versionKey: false });
    this.name = name;
    this.Model = mongoose.model(`agri_${name}`, schema, name);
  }

  async all() { return (await this.Model.find({}).lean()).map(toRecord); }
  async find(predicate) { return (await this.all()).filter(predicate); }
  async findOne(predicate) { return (await this.all()).find(predicate) || null; }

  async get(id) {
    if (typeof id !== 'string') return null; // never pass objects (e.g. {"$ne":null}) into a query
    return toRecord(await this.Model.findById(id).lean());
  }

  async insert(doc) {
    const now = new Date().toISOString();
    const { id, _id, ...rest } = structuredClone(doc);
    const created = await this.Model.create({ ...rest, _id: randomUUID(), createdAt: now, updatedAt: now });
    return toRecord(created.toObject());
  }

  async update(id, patch) {
    if (typeof id !== 'string') return null;
    const clean = Object.fromEntries(Object.entries(structuredClone(patch)).filter(([k, v]) => v !== undefined && !PROTECTED.includes(k)));
    clean.updatedAt = new Date().toISOString();
    return toRecord(await this.Model.findOneAndUpdate({ _id: id }, { $set: clean }, { new: true, lean: true }));
  }

  async remove(id) {
    if (typeof id !== 'string') return false;
    return (await this.Model.deleteOne({ _id: id })).deletedCount > 0;
  }

  async removeWhere(predicate) {
    const ids = (await this.find(predicate)).map((r) => r.id);
    if (!ids.length) return 0;
    return (await this.Model.deleteMany({ _id: { $in: ids } })).deletedCount;
  }
}

export async function createMongoStore(uri) {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (err) {
    throw new Error(`Could not connect to MongoDB: ${err.message}\nCheck MONGODB_URI in server/.env, your password, and (for Atlas) Network Access -> IP allow-list.`);
  }
  const store = { kind: 'mongodb', dataDir: null };
  for (const name of COLLECTIONS) store[name] = new MongoCollection(name);
  await store.users.Model.collection.createIndex({ email: 1 }, { unique: true });
  for (const name of ['farms', 'crops', 'soil', 'reminders', 'orders', 'consultations']) await store[name].Model.collection.createIndex({ owner: 1 });
  return store;
}
