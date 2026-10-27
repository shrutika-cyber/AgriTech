import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSoil, ratePh, rateNutrient, compareAnalyses } from '../src/services/soilRules.js';
import { recommendCrops, rangeScore } from '../src/services/cropRecommender.js';
import { adviceForDay } from '../src/services/weatherAdvice.js';
import { searchPests, pestRiskHints, matchSymptoms, getPest, PESTS } from '../src/services/pestLibrary.js';
import { simulatedForecast } from '../src/services/weatherService.js';

test('ratePh bands', () => {
  assert.equal(ratePh(5.0).status, 'warning');
  assert.equal(ratePh(5.8).status, 'watch');
  assert.equal(ratePh(6.8).status, 'good');
  assert.equal(ratePh(8.0).status, 'watch');
  assert.equal(ratePh(9.0).status, 'warning');
});

test('rateNutrient bands', () => {
  assert.equal(rateNutrient('nitrogen', 100), 'low');
  assert.equal(rateNutrient('nitrogen', 400), 'medium');
  assert.equal(rateNutrient('nitrogen', 700), 'high');
  assert.equal(rateNutrient('phosphorus'), null);
});

test('assessSoil is labelled educational and never gives fertilizer doses', () => {
  const r = assessSoil({ ph: 5.2, nitrogen: 200, soilType: 'sandy' });
  assert.equal(r.kind, 'rule-based-educational');
  assert.match(r.disclaimer, /Not a laboratory/);
  assert.equal(r.overall, 'needs attention');
  assert.ok(r.followUp.some((t) => /laboratory/.test(t)));
  assert.ok(!JSON.stringify(r).match(/\bkg\/acre\b|\bgrams? per\b/i));
  assert.ok(r.followUp.some((t) => /phosphorus/.test(t)), 'should ask for missing readings');
});

test('compareAnalyses reports direction of change', () => {
  const rows = compareAnalyses({ ph: 5.5, nitrogen: 300 }, { ph: 6.0, nitrogen: 250, moisture: 20 });
  assert.deepEqual(rows.map((r) => [r.parameter, r.direction]), [['pH', 'up'], ['Nitrogen', 'down']]);
});

test('rangeScore: inside = 1, far outside = 0, near edge in between', () => {
  assert.equal(rangeScore(6.5, [6, 7]), 1);
  assert.equal(rangeScore(20, [6, 7]), 0);
  const s = rangeScore(5.8, [6, 7]);
  assert.ok(s > 0 && s < 1);
});

test('recommendCrops needs at least two inputs', () => {
  const r = recommendCrops({ ph: 6.5 });
  assert.equal(r.results.length, 0);
  assert.match(r.limitations[0], /at least two/);
});

test('recommendCrops: rabi + loamy + pH 6.8 ranks wheat/mustard above rice, with reasons', () => {
  const r = recommendCrops({ ph: 6.8, season: 'rabi', soilType: 'loamy', temperature: 18, rainfall: 600 });
  const names = r.results.map((x) => x.crop);
  assert.ok(names.includes('Wheat'));
  assert.ok(!names.includes('Rice (paddy)'));
  assert.ok(r.results[0].reasons.length > 0);
  assert.ok(r.results.every((x, i, a) => i === 0 || a[i - 1].score >= x.score), 'sorted by score');
  assert.ok(r.limitations.some((l) => /No AI or machine-learning/.test(l)));
});

test('recommendCrops: kharif high rainfall clay favours rice', () => {
  const r = recommendCrops({ season: 'kharif', soilType: 'clay', rainfall: 1500, temperature: 28, ph: 6.0 });
  assert.equal(r.results[0].crop, 'Rice (paddy)');
});

test('weather advice thresholds', () => {
  assert.ok(adviceForDay({ tempMax: 41 }).some((a) => a.level === 'warning'));
  assert.ok(adviceForDay({ rain: 40 }).some((a) => /Heavy rain/.test(a.text)));
  assert.ok(adviceForDay({ windMax: 25 }).some((a) => /spray/i.test(a.text)));
  assert.equal(adviceForDay({ tempMax: 27, tempMin: 18, rain: 0, windMax: 5 })[0].level, 'good');
});

test('pest library: search, filters, and safety (no products or doses)', () => {
  assert.ok(searchPests({ q: 'blight' }).length >= 2);
  assert.ok(searchPests({ crop: 'cotton' }).every((p) => p.crops.some((c) => /cotton/i.test(c))));
  assert.ok(searchPests({ type: 'disease' }).every((p) => p.type === 'disease'));
  assert.equal(getPest('nope'), null);
  const text = JSON.stringify(PESTS);
  assert.ok(!/\b\d+\s?(ml|mg|g|kg|litre|liter)\b/i.test(text), 'no dosages');
  assert.ok(PESTS.every((p) => p.nextSteps.length && p.ipm.length && p.prevention.length));
});

test('pest risk hints respond to weather', () => {
  const humidCool = pestRiskHints({ tempAvg: 17, humidity: 92, rainDaily: 5 }, ['potato']).map((p) => p.id);
  assert.ok(humidCool.includes('late-blight'));
  const hot = pestRiskHints({ tempAvg: 30, humidity: 40, rainDaily: 0 }, ['potato']).map((p) => p.id);
  assert.ok(!hot.includes('late-blight'));
  assert.deepEqual(pestRiskHints({}, []), []);
});

test('symptom matching suggests but never diagnoses', () => {
  const m = matchSymptoms('white powdery patches on the leaves', 'wheat');
  assert.equal(m[0].id, 'powdery-mildew');
  assert.deepEqual(matchSymptoms('zzz', null), []);
});

test('simulated weather is always labelled as simulated and has 7 days', () => {
  const f = simulatedForecast('X');
  assert.equal(f.isSimulated, true);
  assert.match(f.notice, /SIMULATED/);
  assert.equal(f.daily.length, 7);
  assert.ok(f.advice.length === 7);
});
