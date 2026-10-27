export function fmtDate(value) {
  if (!value) return '–';
  const d = new Date(String(value).length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? '–' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
export const fmtMoney = (n) => `₹${Number(n).toLocaleString('en-IN')}`;
export const cToF = (c) => Math.round((c * 9) / 5 + 32);
export function fmtTemp(c, unit = 'C') {
  if (typeof c !== 'number') return '–';
  return unit === 'F' ? `${cToF(c)}°F` : `${Math.round(c)}°C`;
}
export const titleCase = (s) => String(s || '').replace(/[-_]/g, ' ').replace(/^./, (c) => c.toUpperCase());
