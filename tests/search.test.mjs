import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { matches, normalise, searchText } from '../src/lib/search.mjs';

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

test('curly apostrophes match straight ones, as phones type them', () => {
  assert.ok(find("M&M's Cookie", 'm&m’s'));
  assert.ok(find('M&M’s Cookie', "m&m's"));
});

const menu = JSON.parse(readFileSync(new URL('../src/data/menu.json', import.meta.url), 'utf8'));
const textFor = (id) => {
  const category = menu.categories.find((candidate) => candidate.items.some((item) => item.id === id));
  return normalise(searchText(category.items.find((item) => item.id === id), category));
};

test('category names are searchable in both languages', () => {
  assert.ok(matches(textFor('kinder-cookie'), 'cookies'));
  assert.ok(matches(textFor('lemon-blueberry-muffin'), 'muffins'));
  assert.ok(matches(textFor('blt'), 'αλμυρά'));
});

test('everyday words people search for find the right items', () => {
  assert.ok(matches(textFor('blt'), 'sandwich'));
  assert.ok(matches(textFor('blt'), 'σάντουιτς'));
  assert.ok(matches(textFor('latte'), 'coffee'));
  assert.ok(matches(textFor('latte'), 'καφές'));
  assert.ok(matches(textFor('freddo-espresso'), 'καφές'));
});

test('a search for coffee does not match every item on the menu', () => {
  assert.equal(matches(textFor('blt'), 'coffee'), false);
});
