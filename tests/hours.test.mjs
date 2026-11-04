import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { getStatus, shopTime } from '../src/lib/hours.mjs';

const site = JSON.parse(readFileSync(new URL('../src/data/site.json', import.meta.url), 'utf8'));
const { hours, timezone } = site;
const at = (day, time) => {
  const [h, m] = time.split(':').map(Number);
  return { day, minutes: h * 60 + m };
};

test('open during the day, with the closing time', () => {
  assert.deepEqual(getStatus(hours, at(3, '12:00')), { open: true, closes: '17:00' });
});

test('opening minute counts as open and closing minute as closed', () => {
  assert.equal(getStatus(hours, at(1, '08:30')).open, true);
  assert.equal(getStatus(hours, at(1, '08:29')).open, false);
  assert.equal(getStatus(hours, at(1, '16:59')).open, true);
  assert.equal(getStatus(hours, at(1, '17:00')).open, false);
});

test('before opening points at later today', () => {
  assert.deepEqual(getStatus(hours, at(2, '07:00')), { open: false, opens: '08:30', daysAway: 0, day: 2 });
});

test('after closing points at tomorrow', () => {
  assert.deepEqual(getStatus(hours, at(2, '18:00')), { open: false, opens: '08:30', daysAway: 1, day: 3 });
});

test('Friday evening points at the later Saturday opening', () => {
  assert.deepEqual(getStatus(hours, at(5, '18:00')), { open: false, opens: '09:30', daysAway: 1, day: 6 });
});

test('Saturday afternoon skips Sunday and points at Monday', () => {
  assert.deepEqual(getStatus(hours, at(6, '14:00')), { open: false, opens: '08:30', daysAway: 2, day: 1 });
});

test('Sunday is closed all day and points at Monday', () => {
  assert.deepEqual(getStatus(hours, at(0, '12:00')), { open: false, opens: '08:30', daysAway: 1, day: 1 });
});

test('a shop with no hours returns nothing instead of looping', () => {
  assert.equal(getStatus({ 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null }, at(1, '12:00')), null);
});

test('time is read in Cyprus, not in the visitor timezone', () => {
  // 21:30 UTC on Tuesday 7 July 2026 is 00:30 on Wednesday in Nicosia (UTC+3).
  assert.deepEqual(shopTime(new Date('2026-07-07T21:30:00Z'), timezone), { day: 3, minutes: 30 });
  // 12:00 UTC in winter is 14:00 in Nicosia (UTC+2).
  assert.deepEqual(shopTime(new Date('2026-01-14T12:00:00Z'), timezone), { day: 3, minutes: 840 });
});

test('midnight reads as 00:xx, not 24:xx', () => {
  assert.equal(shopTime(new Date('2026-01-13T22:05:00Z'), timezone).minutes, 5);
});
