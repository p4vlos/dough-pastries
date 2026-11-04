import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

const menu = read('../src/data/menu.json');
const occasions = read('../src/data/occasions.json');
const items = menu.categories.flatMap((category) => category.items);

test('every menu item has an English name and a positive price', () => {
  for (const item of items) {
    assert.ok(item.name?.en, `${item.id} has no English name`);
    assert.ok(item.price > 0, `${item.id} has no price`);
  }
});

test('menu item ids are unique', () => {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every item with a description has it in both languages', () => {
  for (const item of items.filter((candidate) => candidate.desc)) {
    assert.ok(item.desc.en && item.desc.el, `${item.id} is missing a translation`);
  }
});

test('every item marked as having a photo has its file', () => {
  for (const item of items.filter((candidate) => candidate.image)) {
    const photo = new URL(`../src/assets/menu/${item.id}.jpg`, import.meta.url);
    assert.ok(existsSync(photo), `${item.id}.jpg is missing`);
  }
});

test('all 12 of the most ordered items on Wolt are flagged', () => {
  assert.equal(items.filter((item) => item.popular).length, 12);
});

test('occasion data matches the live order form', () => {
  assert.equal(occasions.cakeFlavours.length, 8);
  assert.equal(occasions.cakeSizes.length, 4);
  assert.equal(occasions.eventFlavours.length, 13);
  assert.equal(occasions.locations.length, 3);
});
