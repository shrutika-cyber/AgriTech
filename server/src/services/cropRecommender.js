/**
 * Transparent rule-based crop recommender. No machine-learning model is used.
 * Each crop profile holds approximate, general agronomic ranges (educational, India-oriented).
 * Scoring: each supplied input earns 1 when inside the preferred range and fades linearly to 0
 * across a tolerance band outside it. Final score = weighted average over the inputs actually supplied.
 */
export const SEASONS = ['kharif', 'rabi', 'zaid'];
export const SOIL_TYPES = ['sandy', 'loamy', 'clay', 'silty', 'black', 'red', 'other'];

export const CROP_PROFILES = [
  { crop: 'Rice (paddy)', ph: [5.5, 7.0], temp: [20, 35], rain: [1000, 2000], soils: ['clay', 'loamy', 'silty'], seasons: ['kharif'], n: [280, 560], p: [11, 25], k: [110, 280] },
  { crop: 'Wheat', ph: [6.0, 7.5], temp: [10, 25], rain: [400, 900], soils: ['loamy', 'clay', 'silty', 'black'], seasons: ['rabi'], n: [280, 560], p: [11, 25], k: [110, 280] },
  { crop: 'Maize', ph: [5.8, 7.5], temp: [18, 32], rain: [600, 1200], soils: ['loamy', 'sandy', 'silty', 'red'], seasons: ['kharif', 'rabi', 'zaid'], n: [280, 560], p: [11, 25], k: [110, 280] },
  { crop: 'Soybean', ph: [6.0, 7.5], temp: [20, 32], rain: [600, 1000], soils: ['black', 'loamy', 'clay'], seasons: ['kharif'], n: [150, 400], p: [11, 25], k: [110, 280] },
  { crop: 'Chickpea (gram)', ph: [6.0, 8.0], temp: [15, 28], rain: [400, 800], soils: ['black', 'loamy', 'sandy', 'red'], seasons: ['rabi'], n: [150, 400], p: [11, 25], k: [110, 280] },
  { crop: 'Mustard', ph: [6.0, 7.5], temp: [10, 25], rain: [350, 700], soils: ['loamy', 'sandy', 'silty'], seasons: ['rabi'], n: [280, 560], p: [11, 25], k: [110, 280] },
  { crop: 'Cotton', ph: [6.0, 8.0], temp: [21, 35], rain: [600, 1200], soils: ['black', 'loamy', 'red'], seasons: ['kharif'], n: [280, 560], p: [11, 25], k: [110, 280] },
  { crop: 'Groundnut', ph: [5.8, 7.0], temp: [22, 32], rain: [500, 1000], soils: ['sandy', 'loamy', 'red'], seasons: ['kharif', 'zaid'], n: [150, 400], p: [11, 25], k: [110, 280] },
  { crop: 'Pigeon pea (tur)', ph: [6.0, 7.5], temp: [20, 32], rain: [600, 1000], soils: ['loamy', 'black', 'red'], seasons: ['kharif'], n: [150, 400], p: [11, 25], k: [110, 280] },
  { crop: 'Potato', ph: [5.0, 6.5], temp: [12, 24], rain: [500, 900], soils: ['loamy', 'sandy', 'silty'], seasons: ['rabi'], n: [280, 560], p: [11, 40], k: [110, 400] },
  { crop: 'Tomato', ph: [6.0, 7.0], temp: [18, 30], rain: [600, 1100], soils: ['loamy', 'sandy', 'red'], seasons: ['kharif', 'rabi', 'zaid'], n: [280, 560], p: [11, 40], k: [110, 400] },
  { crop: 'Sugarcane', ph: [6.0, 8.0], temp: [20, 35], rain: [1000, 1800], soils: ['loamy', 'clay', 'black'], seasons: ['kharif', 'zaid'], n: [280, 560], p: [11, 25], k: [110, 280] },
];

const WEIGHTS = { ph: 2, temp: 2, rain: 2, soil: 1.5, season: 1.5, n: 1, p: 1, k: 1 };

/** 1 inside [lo,hi]; linearly fades to 0 over a tolerance equal to `tol` * range width outside. */
export function rangeScore(value, [lo, hi], tol = 0.5) {
  if (value >= lo && value <= hi) return 1;
  const width = hi - lo || 1;
  const dist = value < lo ? lo - value : value - hi;
  return Math.max(0, 1 - dist / (width * tol));
}

export function recommendCrops(input, { limit = 5 } = {}) {
  const provided = [];
  const has = (v) => v !== undefined && v !== null && v !== '';
  if (has(input.ph)) provided.push('ph');
  if (has(input.temperature)) provided.push('temp');
  if (has(input.rainfall)) provided.push('rain');
  if (has(input.soilType)) provided.push('soil');
  if (has(input.season)) provided.push('season');
  if (has(input.nitrogen)) provided.push('n');
  if (has(input.phosphorus)) provided.push('p');
  if (has(input.potassium)) provided.push('k');

  const allKeys = ['ph', 'temp', 'rain', 'soil', 'season', 'n', 'p', 'k'];
  const labels = { ph: 'soil pH', temp: 'average temperature', rain: 'annual rainfall', soil: 'soil type', season: 'growing season', n: 'nitrogen', p: 'phosphorus', k: 'potassium' };
  const missing = allKeys.filter((k) => !provided.includes(k)).map((k) => labels[k]);

  if (provided.length < 2) {
    return { engine: 'rule-based-v1', results: [], missingInputs: missing, limitations: ['Provide at least two inputs (for example soil pH and season) to get suggestions.'] };
  }

  const scored = CROP_PROFILES.map((c) => {
    let sum = 0; let wsum = 0;
    const reasons = []; const cautions = [];
    const add = (key, score, okMsg, badMsg) => {
      sum += WEIGHTS[key] * score; wsum += WEIGHTS[key];
      if (score >= 0.85) reasons.push(okMsg); else if (score < 0.6) cautions.push(badMsg);
    };
    if (provided.includes('ph')) add('ph', rangeScore(input.ph, c.ph, 0.5), `pH ${input.ph} is within the preferred ${c.ph[0]}–${c.ph[1]}`, `pH ${input.ph} is outside the preferred ${c.ph[0]}–${c.ph[1]}`);
    if (provided.includes('temp')) add('temp', rangeScore(input.temperature, c.temp, 0.5), `${input.temperature}°C suits the typical ${c.temp[0]}–${c.temp[1]}°C`, `${input.temperature}°C is outside the typical ${c.temp[0]}–${c.temp[1]}°C`);
    if (provided.includes('rain')) add('rain', rangeScore(input.rainfall, c.rain, 0.6), `${input.rainfall} mm rainfall fits the usual ${c.rain[0]}–${c.rain[1]} mm`, `${input.rainfall} mm rainfall is outside the usual ${c.rain[0]}–${c.rain[1]} mm (irrigation or drainage may be needed)`);
    if (provided.includes('soil')) add('soil', c.soils.includes(input.soilType) ? 1 : 0.2, `${input.soilType} soil is commonly used for this crop`, `${input.soilType} soil is not a typical match`);
    if (provided.includes('season')) add('season', c.seasons.includes(input.season) ? 1 : 0, `Typically grown in the ${input.season} season`, `Not typically grown in the ${input.season} season`);
    if (provided.includes('n')) add('n', rangeScore(input.nitrogen, c.n, 0.6), 'Nitrogen level is in a workable band', 'Nitrogen level is outside the usual band');
    if (provided.includes('p')) add('p', rangeScore(input.phosphorus, c.p, 0.6), 'Phosphorus level is in a workable band', 'Phosphorus level is outside the usual band');
    if (provided.includes('k')) add('k', rangeScore(input.potassium, c.k, 0.6), 'Potassium level is in a workable band', 'Potassium level is outside the usual band');
    const score = wsum ? sum / wsum : 0;
    return { crop: c.crop, score: Math.round(score * 100), fit: score >= 0.8 ? 'good' : score >= 0.6 ? 'moderate' : 'low', reasons, cautions };
  });

  const results = scored.sort((a, b) => b.score - a.score).filter((r) => r.score >= 50).slice(0, limit);
  const limitations = [
    'Rule-based educational suggestion using approximate general ranges. No AI or machine-learning model is used.',
    'Local variety choice, market, water access, pests and regional recommendations matter. Check with your local agriculture department or Krishi Vigyan Kendra.',
  ];
  if (missing.length) limitations.push(`Not provided (so not considered): ${missing.join(', ')}.`);
  if (!results.length) limitations.push('No crop in the built-in list matched well. Try adjusting inputs or seek local advice.');
  return { engine: 'rule-based-v1', results, missingInputs: missing, limitations };
}
