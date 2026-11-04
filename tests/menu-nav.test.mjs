import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sectionToHighlight } from '../src/lib/search.mjs';

test('with two sections in the band, the lower one on screen wins', () => {
  // Just after tapping "Muffins": the end of Brownies and the start of Muffins are both in the band.
  const inBand = [{ id: 'brownies', top: -900 }, { id: 'muffins', top: 150 }];
  assert.equal(sectionToHighlight(inBand).id, 'muffins');
});

test('the result does not depend on the order sections are listed in', () => {
  const inBand = [{ id: 'muffins', top: 150 }, { id: 'brownies', top: -900 }];
  assert.equal(sectionToHighlight(inBand).id, 'muffins');
});

test('side by side drink columns pick the later group, not always the first', () => {
  const inBand = [{ id: 'hot-coffees', top: -400 }, { id: 'non-coffee', top: 120 }];
  assert.equal(sectionToHighlight(inBand).id, 'non-coffee');
});

test('nothing in the band means nothing is highlighted', () => {
  assert.equal(sectionToHighlight([]), undefined);
});
