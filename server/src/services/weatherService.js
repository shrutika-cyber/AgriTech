import { adviceForForecast } from './weatherAdvice.js';

/**
 * LOCAL DEMO MODE: weather is SIMULATED. No weather provider is called, no API key is needed,
 * and these numbers are NOT real conditions. Keeping this behind one function makes it easy to
 * swap in a real provider (e.g. Open-Meteo) later without changing the frontend.
 */
export function simulatedForecast(label = 'Sample location') {
  const base = new Date();
  const rain = [0, 2, 12, 0, 35, 4, 0];
  const wind = [10, 12, 18, 9, 24, 14, 8];
  const daily = Array.from({ length: 7 }, (_, i) => ({
    date: new Date(base.getTime() + i * 86400000).toISOString().slice(0, 10),
    tempMax: 31 + (i % 3), tempMin: 21 + (i % 2), rain: rain[i], windMax: wind[i],
  }));
  const current = { temperature: 29, humidity: 72, rain: 0, wind: 11 };
  return {
    location: label, current, daily, advice: adviceForForecast(daily, current.humidity),
    isSimulated: true, notice: 'SIMULATED DATA: these are made-up demonstration values, not real weather.',
  };
}
