import { pestRiskHints } from './pestLibrary.js';
import { simulatedForecast } from './weatherService.js';

/**
 * Builds the alert list shown to a user. Nothing here is stored.
 *  - 'reminder' alerts come from the user's own reminders (real user data).
 *  - 'pest' and 'weather' alerts use SIMULATED weather in local demo mode, and say so.
 */
export function buildAlerts({ crops, reminders, today = new Date() }) {
  const alerts = [];
  const day = (d) => new Date(`${d}T00:00:00`);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (const r of reminders.filter((x) => !x.done)) {
    const diff = Math.round((day(r.dueDate) - t0) / 86400000);
    if (diff < 0) alerts.push({ id: `rem-${r.id}`, type: 'reminder', severity: 'warning', title: `Overdue: ${r.title}`, message: `This was due on ${r.dueDate}.`, isSimulated: false });
    else if (diff <= 7) alerts.push({ id: `rem-${r.id}`, type: 'reminder', severity: diff <= 1 ? 'watch' : 'info', title: r.title, message: diff === 0 ? 'Due today.' : `Due in ${diff} day(s) (${r.dueDate}).`, isSimulated: false });
  }

  const forecast = simulatedForecast();
  const d0 = forecast.daily[0];
  const hintInput = { tempAvg: (d0.tempMax + d0.tempMin) / 2, humidity: forecast.current.humidity, rainDaily: d0.rain };
  const active = [...new Set(crops.filter((c) => c.status !== 'harvested').map((c) => c.crop.toLowerCase()))];
  for (const crop of active) {
    for (const pest of pestRiskHints(hintInput, [crop])) {
      alerts.push({
        id: `pest-${crop}-${pest.id}`, type: 'pest', severity: 'watch', pestId: pest.id, isSimulated: true,
        title: `Scouting hint: ${pest.name} (${crop})`,
        message: `Under the simulated weather, conditions are generally favourable for ${pest.name.toLowerCase()}. This is a prompt to check your crop, not a detection. Confirm with a local expert.`,
      });
    }
  }
  for (const a of forecast.advice[0].advice.filter((x) => x.level !== 'good')) {
    alerts.push({ id: `wx-${a.text.slice(0, 12)}`, type: 'weather', severity: a.level, title: 'Weather note (simulated)', message: a.text, isSimulated: true });
  }
  return alerts;
}
