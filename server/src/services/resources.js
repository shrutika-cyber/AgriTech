import { HttpError, notFound } from '../utils/errors.js';
import { validate } from '../utils/validate.js';
import { assessSoil } from './soilRules.js';
import { farmSchema, cropSchema, soilSchema, reminderSchema } from '../validators/schemas.js';

/** Convert Date objects (from validation) into plain YYYY-MM-DD strings for storage. */
function normalize(data) {
  const out = {};
  for (const [k, v] of Object.entries(data)) out[k] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
  return out;
}

/**
 * Generic "records owned by one user" CRUD. Every read/update/delete checks record.owner === userId
 * and answers 404 (not 403) for other people's records, so their existence is not leaked.
 * `defaults` are applied on create only (e.g. status: 'planned').
 */
export function ownedResource(collection, schema, { label, defaults = {}, beforeSave, afterRemove, filter } = {}) {
  async function get(userId, id) {
    const rec = typeof id === 'string' ? await collection.get(id) : null;
    if (!rec || rec.owner !== userId) throw notFound(label);
    return rec;
  }
  async function prepare(userId, body, partial) {
    let data = normalize(validate(body, schema, { partial }));
    if (beforeSave) data = (await beforeSave(userId, data)) ?? data;
    return data;
  }
  return {
    get,
    async list(userId, query = {}) {
      let items = await collection.find((r) => r.owner === userId);
      if (filter) items = items.filter((r) => filter(r, query));
      return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
    async create(userId, body) {
      const data = await prepare(userId, body, false);
      return collection.insert({ ...defaults, ...data, owner: userId });
    },
    async update(userId, id, body) {
      await get(userId, id);
      return collection.update(id, await prepare(userId, body, true));
    },
    async remove(userId, id) {
      const rec = await get(userId, id);
      await collection.remove(id);
      if (afterRemove) await afterRemove(userId, rec);
      return { id };
    },
  };
}

/** Throws a field-level 400 unless farmId (when given) belongs to this user. */
export async function requireOwnFarm(store, userId, farmId) {
  if (farmId === undefined || farmId === null) return;
  const farm = typeof farmId === 'string' ? await store.farms.get(farmId) : null;
  if (!farm || farm.owner !== userId) {
    throw new HttpError(400, 'Please correct the highlighted fields', { fields: { farmId: 'Choose one of your own farms' } });
  }
}

export function createResources(store) {
  const ownFarm = async (userId, data) => { await requireOwnFarm(store, userId, data.farmId); };

  const farms = ownedResource(store.farms, farmSchema, {
    label: 'Farm',
    defaults: { areaUnit: 'acres', soilType: 'other' },
    async afterRemove(userId, farm) {
      await store.crops.removeWhere((c) => c.farmId === farm.id && c.owner === userId);
      await store.reminders.removeWhere((r) => r.farmId === farm.id && r.owner === userId);
      for (const s of await store.soil.find((x) => x.farmId === farm.id && x.owner === userId)) await store.soil.update(s.id, { farmId: null });
    },
  });
  const crops = ownedResource(store.crops, cropSchema, {
    label: 'Crop', defaults: { status: 'planned' }, beforeSave: ownFarm,
    filter: (r, q) => !q.farmId || r.farmId === q.farmId,
  });
  // Soil records are history: create/list/delete only. The rule-based assessment is stored with each record.
  const soil = ownedResource(store.soil, soilSchema, {
    label: 'Soil analysis',
    async beforeSave(userId, data) { await ownFarm(userId, data); return { ...data, assessment: assessSoil(data) }; },
  });
  const reminders = ownedResource(store.reminders, reminderSchema, { label: 'Reminder', defaults: { done: false }, beforeSave: ownFarm });
  return { farms, crops, soil, reminders };
}

