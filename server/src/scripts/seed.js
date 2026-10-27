import { SAMPLE_PRODUCTS, DEMO_USER } from './seedData.js';

/** Runs at startup. Only fills things that are empty, so it never overwrites real data. */
export async function seedIfEmpty(store, hasher, { demoUser = true } = {}) {
  if ((await store.products.all()).length === 0) {
    for (const p of SAMPLE_PRODUCTS) await store.products.insert(p);
  }
  if (demoUser && (await store.users.all()).length === 0) {
    const user = await store.users.insert({
      name: DEMO_USER.name, email: DEMO_USER.email, passwordHash: await hasher.hash(DEMO_USER.password),
      role: 'farmer', phone: '', isDemo: true, preferences: { areaUnit: 'acres', tempUnit: 'C' },
    });
    const farm = await store.farms.insert({ owner: user.id, name: 'Demo Farm (sample)', locationLabel: 'Sample village', areaValue: 5, areaUnit: 'acres', soilType: 'loamy', notes: 'Sample data created automatically.' });
    await store.crops.insert({ owner: user.id, farmId: farm.id, crop: 'Wheat', variety: 'Sample variety', status: 'growing', sowingDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), notes: 'Sample crop record.' });
    await store.reminders.insert({ owner: user.id, farmId: farm.id, title: 'Check field moisture (sample reminder)', dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10), done: false });
  }
}
