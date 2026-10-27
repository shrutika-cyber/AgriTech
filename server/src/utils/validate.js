import { HttpError } from './errors.js';

/**
 * Tiny schema validator (no dependency). Schema shape:
 *   { field: { type: 'string'|'number'|'boolean'|'date'|'email'|'enum', required, min, max,
 *              minLength, maxLength, values, integer, nullable } }
 * Returns a cleaned object containing only fields declared in the schema.
 * With { partial: true } missing fields are skipped (for PATCH-style updates).
 */
export function validate(body, schema, { partial = false } = {}) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const out = {};
  const fields = {};

  for (const [key, rule] of Object.entries(schema)) {
    let v = input[key];
    const missing = v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

    if (missing) {
      if (rule.nullable && (v === null || v === '')) { out[key] = null; continue; }
      if (rule.required && !partial) fields[key] = `${rule.label || key} is required`;
      continue;
    }

    switch (rule.type) {
      case 'string':
      case 'email':
      case 'enum': {
        if (typeof v !== 'string') { fields[key] = `${rule.label || key} must be text`; break; }
        v = v.trim();
        if (rule.type === 'email') {
          v = v.toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 254) { fields[key] = 'Enter a valid email address'; break; }
        }
        if (rule.type === 'enum' && !rule.values.includes(v)) { fields[key] = `${rule.label || key} must be one of: ${rule.values.join(', ')}`; break; }
        if (rule.minLength && v.length < rule.minLength) { fields[key] = `${rule.label || key} must be at least ${rule.minLength} characters`; break; }
        if (rule.maxLength && v.length > rule.maxLength) { fields[key] = `${rule.label || key} must be at most ${rule.maxLength} characters`; break; }
        out[key] = v;
        break;
      }
      case 'number': {
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(n)) { fields[key] = `${rule.label || key} must be a number`; break; }
        if (rule.integer && !Number.isInteger(n)) { fields[key] = `${rule.label || key} must be a whole number`; break; }
        if (rule.min !== undefined && n < rule.min) { fields[key] = `${rule.label || key} must be at least ${rule.min}`; break; }
        if (rule.max !== undefined && n > rule.max) { fields[key] = `${rule.label || key} must be at most ${rule.max}`; break; }
        out[key] = n;
        break;
      }
      case 'boolean': {
        if (typeof v !== 'boolean') { fields[key] = `${rule.label || key} must be true or false`; break; }
        out[key] = v;
        break;
      }
      case 'date': {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) { fields[key] = `${rule.label || key} must be a valid date`; break; }
        out[key] = d;
        break;
      }
      default:
        throw new Error(`Unknown rule type ${rule.type}`);
    }
  }

  if (Object.keys(fields).length) throw new HttpError(400, 'Please correct the highlighted fields', { fields });
  return out;
}

export const isObjectId = (s) => typeof s === 'string' && /^[a-f\d]{24}$/i.test(s);

/** Escape user text before using it inside a RegExp (prevents ReDoS / regex injection). */
export const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
