import test from 'node:test';
import assert from 'node:assert/strict';
import { fmtDate, fmtMoney, fmtTemp, cToF, titleCase } from './format.js';

test('formatters', () => {
  assert.equal(fmtDate(''), '–');
  assert.equal(fmtDate('not a date'), '–');
  assert.match(fmtDate('2026-10-27'), /27/);
  assert.equal(fmtMoney(1250), '₹1,250');
  assert.equal(cToF(100), 212);
  assert.equal(fmtTemp(30, 'F'), '86°F');
  assert.equal(fmtTemp(30.4), '30°C');
  assert.equal(fmtTemp(undefined), '–');
  assert.equal(titleCase('soil-health'), 'Soil health');
});
