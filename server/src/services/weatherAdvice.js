/** Simple threshold rules that turn weather numbers into plain-language farming considerations. */
export function adviceForDay({ tempMax, tempMin, rain, windMax, humidity }) {
  const out = [];
  if (typeof tempMax === 'number' && tempMax >= 38) out.push({ level: 'warning', text: `Very hot (up to ${tempMax}°C): crops can suffer heat stress. Irrigating in the early morning or evening is generally preferred.` });
  if (typeof tempMin === 'number' && tempMin <= 4) out.push({ level: 'warning', text: `Cold night (down to ${tempMin}°C): frost-sensitive crops may be at risk. Check local frost guidance.` });
  if (typeof rain === 'number' && rain >= 30) out.push({ level: 'warning', text: `Heavy rain expected (${rain} mm): check drainage, and consider postponing spraying and field work.` });
  else if (typeof rain === 'number' && rain >= 5) out.push({ level: 'watch', text: `Rain likely (${rain} mm): you may be able to delay irrigation, and avoid spraying just before rain.` });
  else if (typeof rain === 'number' && rain < 1 && typeof tempMax === 'number' && tempMax >= 33) out.push({ level: 'watch', text: 'Hot and dry: monitor soil moisture and irrigation needs.' });
  if (typeof windMax === 'number' && windMax >= 20) out.push({ level: 'watch', text: `Windy (up to ${windMax} km/h): spray drift is likely, so avoid spraying. Young plants may need protection.` });
  if (typeof humidity === 'number' && humidity >= 85 && typeof tempMax === 'number' && tempMax >= 18 && tempMax <= 30) out.push({ level: 'watch', text: 'Warm and humid conditions favour many fungal diseases. Scout your crop for early symptoms.' });
  if (!out.length) out.push({ level: 'good', text: 'No notable weather concerns from the available measurements.' });
  return out;
}

export function adviceForForecast(daily, currentHumidity) {
  return daily.map((d, i) => ({ date: d.date, advice: adviceForDay({ ...d, humidity: i === 0 ? currentHumidity : undefined }) }));
}
