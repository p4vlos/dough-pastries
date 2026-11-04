import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidPhone, todayInZone, validateRequest } from '../src/lib/request.mjs';

const TODAY = '2026-11-04';
const contact = {
  date: '2026-11-20',
  location: 'nicosia',
  address: 'Kyriakou Matsi 1',
  firstName: 'Maria',
  lastName: 'Georgiou',
  phone: '99 123456',
};

test('a complete cake request passes', () => {
  assert.deepEqual(validateRequest({ ...contact, mode: 'cake', flavour: 'carrot', size: '15' }, TODAY), []);
});

test('a cake needs a flavour and a size', () => {
  assert.deepEqual(validateRequest({ ...contact, mode: 'cake' }, TODAY), ['flavour', 'size']);
});

test('event sweets need at least one sweet and a head count', () => {
  assert.deepEqual(validateRequest({ ...contact, mode: 'sweets', sweets: [], people: '' }, TODAY), ['sweets', 'people']);
  assert.deepEqual(validateRequest({ ...contact, mode: 'sweets', sweets: ['event-carrot'], people: '40' }, TODAY), []);
});

test('zero or negative people are rejected', () => {
  assert.deepEqual(validateRequest({ ...contact, mode: 'people', people: '0' }, TODAY), ['people']);
  assert.deepEqual(validateRequest({ ...contact, mode: 'people', people: '-3' }, TODAY), ['people']);
});

test('"something else" only needs date and contact details', () => {
  assert.deepEqual(validateRequest({ ...contact, mode: 'other' }, TODAY), []);
});

test('the date cannot be in the past, but today is allowed', () => {
  const request = { ...contact, mode: 'other' };
  assert.deepEqual(validateRequest({ ...request, date: '2026-11-03' }, TODAY), ['date']);
  assert.deepEqual(validateRequest({ ...request, date: TODAY }, TODAY), []);
  assert.deepEqual(validateRequest({ ...request, date: '' }, TODAY), ['date']);
});

test('an address is only needed for delivery', () => {
  const request = { ...contact, mode: 'other', address: '   ' };
  assert.deepEqual(validateRequest(request, TODAY), ['address']);
  assert.deepEqual(validateRequest({ ...request, location: 'collect' }, TODAY), []);
});

test('names cannot be blank and errors come back in field order', () => {
  const request = { mode: 'other', location: 'nicosia', firstName: ' ', lastName: '', phone: '123' };
  assert.deepEqual(validateRequest(request, TODAY), ['date', 'address', 'firstName', 'lastName', 'phone']);
});

test('phone numbers accept local and international formats', () => {
  assert.ok(isValidPhone('96663158'));
  assert.ok(isValidPhone('+357 96 663158'));
  assert.ok(isValidPhone('(+357) 96-663-158'));
  assert.equal(isValidPhone('1234'), false);
  assert.equal(isValidPhone('call me'), false);
  assert.equal(isValidPhone(undefined), false);
});

test('today is the Cyprus date, even when it is still yesterday in UTC', () => {
  assert.equal(todayInZone(new Date('2026-07-07T21:30:00Z'), 'Asia/Nicosia'), '2026-07-08');
  assert.equal(todayInZone(new Date('2026-07-07T20:30:00Z'), 'Asia/Nicosia'), '2026-07-07');
});

test('people must be a whole number from 1 to 2000', () => {
  const request = { ...contact, mode: 'people' };
  for (const bad of ['1.5', '99999', '1e3', '2001', 'abc']) {
    assert.deepEqual(validateRequest({ ...request, people: bad }, TODAY), ['people'], bad);
  }
  for (const good of ['1', '40', '2000']) {
    assert.deepEqual(validateRequest({ ...request, people: good }, TODAY), [], good);
  }
});
