import test from 'node:test';
import assert from 'node:assert/strict';
import { validate, escapeRegex, isObjectId } from '../src/utils/validate.js';

const schema = {
  email: { type: 'email', required: true },
  age: { type: 'number', min: 18, max: 120, integer: true },
  kind: { type: 'enum', values: ['a', 'b'] },
  when: { type: 'date' },
  name: { type: 'string', required: true, minLength: 2, maxLength: 5 },
};

test('valid input is cleaned and unknown fields dropped', () => {
  const out = validate({ email: ' A@B.co ', age: '30', kind: 'a', when: '2026-01-02', name: 'Ann', admin: true }, schema);
  assert.equal(out.email, 'a@b.co');
  assert.equal(out.age, 30);
  assert.ok(out.when instanceof Date);
  assert.equal('admin' in out, false);
});

test('invalid input reports field-level errors', () => {
  try { validate({ email: 'nope', age: 5.5, kind: 'z', when: 'x', name: 'x' }, schema); assert.fail('should throw'); }
  catch (e) {
    assert.equal(e.status, 400);
    assert.deepEqual(Object.keys(e.fields).sort(), ['age', 'email', 'kind', 'name', 'when']);
  }
});

test('required fields enforced; partial skips them', () => {
  assert.throws(() => validate({}, schema), (e) => Boolean(e.fields.email && e.fields.name));
  assert.deepEqual(validate({ age: 40 }, schema, { partial: true }), { age: 40 });
});

test('rejects non-object bodies and wrong types (no NoSQL operator objects accepted as strings)', () => {
  assert.throws(() => validate(null, schema));
  assert.throws(() => validate({ email: { $ne: null }, name: 'Ann' }, schema), (e) => Boolean(e.fields.email));
});

test('helpers', () => {
  assert.equal(escapeRegex('a.b*c'), 'a\\.b\\*c');
  assert.ok(isObjectId('507f1f77bcf86cd799439011'));
  assert.ok(!isObjectId('abc'));
  assert.ok(!isObjectId({ $gt: '' }));
});
