import assert from 'node:assert/strict';
import { test } from 'node:test';
import { matches, normalise } from '../src/lib/search.mjs';

const find = (text, query) => matches(normalise(text), query);

test('ignores case', () => {
  assert.ok(find('Lotus Cookie', 'lotus'));
  assert.ok(find('Lotus Cookie', 'LOTUS'));
});

test('ignores Greek accents and final sigma', () => {
  assert.ok(find('Ζεστή σοκολάτα', 'σοκολατα'));
  assert.ok(find('Κρύοι καφέδες', 'ΚΑΦΕΔΕΣ'));
  assert.ok(find('Κρύοι καφέδες', 'καφεδεσ'));
});

test('every word must match, in any order', () => {
  assert.ok(find('Oreo & White Chocolate Cookie', 'cookie oreo'));
  assert.equal(find('Oreo & White Chocolate Cookie', 'oreo lotus'), false);
});

test('an empty or blank query matches everything', () => {
  assert.ok(find('Latte', ''));
  assert.ok(find('Latte', '   '));
});

test('regex characters are treated as text', () => {
  assert.ok(find("M&M's Cookie", 'm&m'));
  assert.equal(find('Latte', '(.*'), false);
});
