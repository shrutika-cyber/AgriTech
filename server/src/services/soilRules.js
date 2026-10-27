/**
 * Rule-based soil guidance (EDUCATIONAL ONLY – not a laboratory result and not a machine-learning prediction).
 * Units: pH (unitless), N/P/K in kg/ha of available nutrient (as on typical Indian Soil Health Cards),
 * moisture in % volumetric. The ratings below are commonly used general bands; labs and regions differ,
 * so always confirm against your own soil-test report and local agricultural extension advice.
 */
export const NPK_BANDS = {
  nitrogen: { low: 280, high: 560 },
  phosphorus: { low: 11, high: 25 },
  potassium: { low: 110, high: 280 },
};

export function rateNutrient(name, value) {
  const b = NPK_BANDS[name];
  if (value === undefined || value === null) return null;
  if (value < b.low) return 'low';
  if (value > b.high) return 'high';
  return 'medium';
}

export function ratePh(ph) {
  if (ph < 5.5) return { band: 'strongly acidic', status: 'warning' };
  if (ph < 6.0) return { band: 'moderately acidic', status: 'watch' };
  if (ph <= 7.5) return { band: 'suitable for most crops', status: 'good' };
  if (ph <= 8.5) return { band: 'moderately alkaline', status: 'watch' };
  return { band: 'strongly alkaline', status: 'warning' };
}

export function rateMoisture(m) {
  if (m === undefined || m === null) return null;
  if (m < 15) return 'dry';
  if (m <= 35) return 'adequate';
  return 'wet';
}

export function assessSoil(input) {
  const findings = [];
  const followUp = [];
  const missing = [];

  const phInfo = ratePh(input.ph);
  findings.push({
    parameter: 'pH', value: input.ph, rating: phInfo.band, status: phInfo.status,
    message:
      phInfo.status === 'good'
        ? `pH ${input.ph} is in the range most field crops tolerate well.`
        : input.ph < 6
          ? `pH ${input.ph} is acidic. Nutrient availability and root growth can suffer; a local lab or extension officer can advise whether liming is appropriate.`
          : `pH ${input.ph} is alkaline. Some micronutrients (e.g. iron, zinc) can become less available; get local advice before amending.`,
  });

  for (const key of ['nitrogen', 'phosphorus', 'potassium']) {
    const rating = rateNutrient(key, input[key]);
    if (!rating) { missing.push(key); continue; }
    const label = key[0].toUpperCase() + key.slice(1);
    findings.push({
      parameter: label, value: input[key], unit: 'kg/ha', rating,
      status: rating === 'medium' ? 'good' : rating === 'low' ? 'watch' : 'info',
      message:
        rating === 'low' ? `${label} reads low. Crop needs differ; ask a local expert how to plan nutrient supply for your specific crop.`
        : rating === 'high' ? `${label} reads high. Extra application is unlikely to help and can cause losses or imbalance.`
        : `${label} reads in the medium band.`,
    });
  }

  const m = rateMoisture(input.moisture);
  if (m) {
    findings.push({
      parameter: 'Moisture', value: input.moisture, unit: '%', rating: m,
      status: m === 'adequate' ? 'good' : 'watch',
      message: m === 'dry' ? 'Soil is dry; check crop stage and irrigation plan.'
        : m === 'wet' ? 'Soil is very wet; check drainage and avoid field operations that compact the soil.'
        : 'Moisture is in a workable range.',
    });
  } else missing.push('moisture');

  if (input.soilType === 'sandy') followUp.push('Sandy soils drain fast and hold few nutrients: organic matter additions and split irrigation are commonly recommended.');
  if (input.soilType === 'clay') followUp.push('Clay soils hold water and can waterlog: check drainage and avoid working them when wet.');
  if (phInfo.status !== 'good') followUp.push('Re-test pH on a composite sample from several spots in the field to confirm the reading.');
  if (missing.length) followUp.push(`Add ${missing.join(', ')} readings for a fuller picture.`);
  followUp.push('Send a composite sample to an accredited soil-testing laboratory before making fertilizer or amendment decisions. This tool does not give fertilizer doses.');

  const warnings = findings.filter((f) => f.status === 'warning').length;
  const watches = findings.filter((f) => f.status === 'watch').length;
  const overall = warnings ? 'needs attention' : watches ? 'workable with some watch points' : 'looks generally suitable';

  return {
    kind: 'rule-based-educational',
    disclaimer: 'Educational guidance from simple rules. Not a laboratory analysis, diagnosis or prediction.',
    overall, findings, followUp,
  };
}

/** Compare two analyses (older -> newer). Returns per-parameter change. */
export function compareAnalyses(older, newer) {
  const params = [
    ['ph', 'pH', ''], ['nitrogen', 'Nitrogen', 'kg/ha'], ['phosphorus', 'Phosphorus', 'kg/ha'],
    ['potassium', 'Potassium', 'kg/ha'], ['moisture', 'Moisture', '%'],
  ];
  return params
    .filter(([k]) => typeof older[k] === 'number' && typeof newer[k] === 'number')
    .map(([k, label, unit]) => {
      const change = Math.round((newer[k] - older[k]) * 100) / 100;
      return { parameter: label, unit, before: older[k], after: newer[k], change, direction: change === 0 ? 'same' : change > 0 ? 'up' : 'down' };
    });
}
