/**
 * Educational pest & disease library. General information only: NOT a diagnosis.
 * Deliberately contains no pesticide product names or doses: always follow the product label,
 * local regulations and advice from a qualified agricultural officer.
 * `risk` describes weather conditions under which the problem is generally more likely (used for risk hints).
 */
export const PESTS = [
  {
    id: 'fall-armyworm', name: 'Fall armyworm', type: 'pest', crops: ['Maize', 'Sorghum', 'Rice'],
    symptoms: ['Ragged holes and windowpane scraping on young leaves', 'Sawdust-like droppings in the whorl', 'Damaged growing point in young plants'],
    causes: ['Moths lay egg masses on leaves; larvae feed in the whorl', 'Warm weather and continuous maize planting help populations build up'],
    prevention: ['Plant at the same time as neighbouring farms', 'Remove weeds and crop residue that shelter larvae', 'Use clean, healthy seed'],
    ipm: ['Scout regularly, especially in the first 6 weeks, and note the share of plants affected', 'Encourage natural enemies such as predatory beetles, wasps and birds', 'Hand-pick egg masses on small plots'],
    nextSteps: ['Confirm identification with your local agriculture office before taking action', 'Use only products registered locally for this crop and follow the label'],
    risk: { tempMin: 22, tempMax: 36, maxRainDaily: 20 },
  },
  {
    id: 'aphids', name: 'Aphids', type: 'pest', crops: ['Mustard', 'Wheat', 'Potato', 'Tomato', 'Cotton', 'Chickpea'],
    symptoms: ['Clusters of small soft insects on new shoots and under leaves', 'Curled or yellowing leaves', 'Sticky honeydew and black sooty mould'],
    causes: ['Cool to moderate weather with cloudy spells', 'Excess soft growth from over-fertilization'],
    prevention: ['Avoid excess nitrogen', 'Keep field edges weed-free', 'Inspect seedlings before transplanting'],
    ipm: ['Check the undersides of leaves weekly', 'Ladybird beetles and lacewings are natural enemies: protect them', 'A strong water jet can reduce numbers on small plots'],
    nextSteps: ['Ask local experts for the action threshold for your crop before any treatment'],
    risk: { tempMin: 10, tempMax: 25, maxRainDaily: 10 },
  },
  {
    id: 'late-blight', name: 'Late blight', type: 'disease', crops: ['Potato', 'Tomato'],
    symptoms: ['Dark, water-soaked patches on leaves that spread quickly', 'White fuzzy growth under leaves in humid mornings', 'Brown firm rot on tubers or fruit'],
    causes: ['Fungus-like pathogen spread by wind and splashing rain', 'Cool, wet, humid and cloudy weather'],
    prevention: ['Use certified disease-free seed tubers or healthy seedlings', 'Avoid overhead irrigation late in the day', 'Rotate crops and remove volunteer potato plants'],
    ipm: ['Scout fields often when weather is cool and wet', 'Remove and destroy infected plants away from the field', 'Improve spacing for airflow'],
    nextSteps: ['Late blight can destroy a crop fast: contact your local agriculture officer promptly if you suspect it'],
    risk: { tempMin: 10, tempMax: 24, minHumidity: 85 },
  },
  {
    id: 'early-blight', name: 'Early blight', type: 'disease', crops: ['Tomato', 'Potato'],
    symptoms: ['Brown spots with concentric rings (target-like) on older leaves', 'Yellowing around spots', 'Leaf drop starting from the bottom of the plant'],
    causes: ['Fungus surviving on crop residue and soil', 'Warm, humid weather with alternating wet and dry periods'],
    prevention: ['Rotate with non-host crops', 'Remove crop debris after harvest', 'Water at the base of plants'],
    ipm: ['Remove lower infected leaves early', 'Mulch to reduce soil splash', 'Keep plants well-nourished and not water-stressed'],
    nextSteps: ['Compare symptoms with extension photos and confirm locally before treating'],
    risk: { tempMin: 20, tempMax: 30, minHumidity: 75 },
  },
  {
    id: 'powdery-mildew', name: 'Powdery mildew', type: 'disease', crops: ['Wheat', 'Tomato', 'Mustard', 'Cotton', 'Chickpea'],
    symptoms: ['White powdery patches on leaves and stems', 'Leaves yellowing, curling or drying', 'Stunted growth in severe cases'],
    causes: ['Fungal spores spread by wind', 'Moderate temperatures, shade, dense canopy and humid nights with dry days'],
    prevention: ['Use resistant varieties where available', 'Avoid overcrowded planting', 'Avoid excess nitrogen'],
    ipm: ['Scout shaded and dense areas first', 'Remove severely affected plant parts', 'Improve airflow through spacing and pruning'],
    nextSteps: ['Confirm with local advice before choosing any treatment, and follow label directions'],
    risk: { tempMin: 15, tempMax: 28, minHumidity: 70 },
  },
  {
    id: 'rice-blast', name: 'Rice blast', type: 'disease', crops: ['Rice (paddy)'],
    symptoms: ['Diamond-shaped spots with grey centres on leaves', 'Neck of the panicle turns brown and breaks', 'Empty or partially filled grains'],
    causes: ['Fungus spread by airborne spores', 'Long leaf-wetness periods, cool nights, high humidity, heavy nitrogen use'],
    prevention: ['Choose varieties recommended locally for blast tolerance', 'Avoid very high nitrogen', 'Use clean seed'],
    ipm: ['Scout nurseries and fields at tillering and booting stages', 'Keep bunds weed-free'],
    nextSteps: ['Report suspected outbreaks to your local agriculture department'],
    risk: { tempMin: 18, tempMax: 28, minHumidity: 90 },
  },
  {
    id: 'bacterial-leaf-blight', name: 'Bacterial leaf blight', type: 'disease', crops: ['Rice (paddy)'],
    symptoms: ['Water-soaked to yellow stripes starting at leaf tips and edges', 'Leaves drying and turning straw-coloured', 'Milky ooze on leaves in the early morning'],
    causes: ['Bacteria entering through wounds and water pores', 'Strong winds, heavy rain, flooding, high nitrogen'],
    prevention: ['Use resistant varieties where available', 'Avoid clipping seedling tips at transplanting', 'Balanced fertilization'],
    ipm: ['Drain fields when disease is present if water management allows', 'Clean tools between fields'],
    nextSteps: ['Confirm symptoms locally: several rice problems look similar'],
    risk: { tempMin: 25, tempMax: 34, minHumidity: 80, minRainDaily: 10 },
  },
  {
    id: 'wheat-rust', name: 'Wheat rust (yellow / brown)', type: 'disease', crops: ['Wheat'],
    symptoms: ['Yellow or orange-brown powdery pustules on leaves, often in stripes', 'Rust-coloured dust on fingers when touching leaves', 'Premature drying of leaves'],
    causes: ['Windborne fungal spores', 'Cool, moist weather for yellow rust; warmer moist weather for brown rust'],
    prevention: ['Grow locally recommended resistant varieties', 'Avoid very early or very late sowing', 'Remove volunteer wheat'],
    ipm: ['Scout from tillering onwards, especially after cool, foggy or dewy periods', 'Report outbreaks to local authorities as rusts spread regionally'],
    nextSteps: ['Contact your local agriculture office quickly if you see rust pustules'],
    risk: { tempMin: 8, tempMax: 22, minHumidity: 80 },
  },
  {
    id: 'pink-bollworm', name: 'Pink bollworm', type: 'pest', crops: ['Cotton'],
    symptoms: ['Rosette-shaped (twisted) flowers', 'Small entry holes in bolls and damaged seeds', 'Stained or poor-quality lint'],
    causes: ['Moths lay eggs on bolls; larvae feed inside', 'Late-season crops and leftover bolls and stalks allow carry-over'],
    prevention: ['Follow recommended sowing windows and crop duration', 'Remove and destroy crop residue after harvest', 'Avoid ratooning cotton'],
    ipm: ['Use pheromone traps to monitor moth activity', 'Regularly sample green bolls for larvae'],
    nextSteps: ['Follow your state agriculture department\'s cotton pest advisories'],
    risk: { tempMin: 25, tempMax: 35 },
  },
  {
    id: 'whitefly', name: 'Whitefly', type: 'pest', crops: ['Cotton', 'Tomato'],
    symptoms: ['Tiny white flying insects when plants are disturbed', 'Yellowing and curling of leaves', 'Sticky honeydew and sooty mould'],
    causes: ['Warm, dry weather', 'Can spread plant viruses (e.g. leaf curl)'],
    prevention: ['Use healthy transplants', 'Remove weeds that host whiteflies', 'Consider reflective mulch or insect nets in nurseries'],
    ipm: ['Yellow sticky traps for monitoring', 'Remove heavily infested leaves', 'Protect natural enemies by avoiding unnecessary broad-spectrum sprays'],
    nextSteps: ['Ask local experts which viruses are active in your area before replanting'],
    risk: { tempMin: 27, tempMax: 40, maxRainDaily: 5 },
  },
];

export function searchPests({ q, crop, type } = {}) {
  const needle = q ? q.toLowerCase() : null;
  return PESTS.filter((p) => {
    if (type && p.type !== type) return false;
    if (crop && !p.crops.some((c) => c.toLowerCase().includes(crop.toLowerCase()))) return false;
    if (needle) {
      const hay = [p.name, ...p.crops, ...p.symptoms].join(' ').toLowerCase();
      return hay.includes(needle);
    }
    return true;
  });
}

export const getPest = (id) => PESTS.find((p) => p.id === id) || null;

/**
 * Weather-based risk hints. Input: { tempAvg, humidity, rainDaily } (any may be missing).
 * Returns entries whose general risk conditions are met. This is a hint to start scouting, NOT a detection.
 */
export function pestRiskHints({ tempAvg, humidity, rainDaily }, cropFilter = []) {
  const crops = cropFilter.map((c) => c.toLowerCase());
  return PESTS.filter((p) => {
    if (crops.length && !p.crops.some((c) => crops.some((f) => c.toLowerCase().includes(f)))) return false;
    const r = p.risk;
    if (!r) return false;
    if (typeof tempAvg !== 'number') return false;
    if (tempAvg < r.tempMin || tempAvg > r.tempMax) return false;
    if (r.minHumidity !== undefined && !(typeof humidity === 'number' && humidity >= r.minHumidity)) return false;
    if (r.minRainDaily !== undefined && !(typeof rainDaily === 'number' && rainDaily >= r.minRainDaily)) return false;
    if (r.maxRainDaily !== undefined && typeof rainDaily === 'number' && rainDaily > r.maxRainDaily) return false;
    return true;
  });
}

/** Match user-described symptoms against the library. Educational suggestion only. */
export function matchSymptoms(text, crop) {
  const words = String(text).toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  if (!words.length) return [];
  return PESTS
    .filter((p) => !crop || p.crops.some((c) => c.toLowerCase().includes(crop.toLowerCase())))
    .map((p) => {
      const hay = p.symptoms.join(' ').toLowerCase();
      const hits = words.filter((w) => hay.includes(w));
      return { id: p.id, name: p.name, type: p.type, matchedWords: [...new Set(hits)], score: new Set(hits).size };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
