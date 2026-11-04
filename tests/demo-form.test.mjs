import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');
const markup = read('components/RequestBuilder.astro');
const script = read('scripts/builder.ts');

// The demo must never send anyone's details anywhere, even if its script fails to load.
test('the form has nowhere to send data', () => {
  const form = markup.match(/<form[^>]*>/)[0];
  assert.doesNotMatch(form, /\baction=/);
  assert.doesNotMatch(form, /\bmethod=/);
});

test('the submit button starts disabled, so the form cannot submit itself without the script', () => {
  const button = markup.match(/<button[^>]*type="submit"[^>]*>/)[0];
  assert.match(button, /\bdisabled\b/);
});

test('only the script enables the submit button', () => {
  assert.match(script, /\.disabled = false/);
});

test('the script makes no network requests', () => {
  assert.doesNotMatch(script, /\b(fetch|XMLHttpRequest|sendBeacon|WebSocket)\b/);
});

test('the script stops the browser submitting the form', () => {
  assert.match(script, /event\.preventDefault\(\)/);
});

test('every required field has an error message and a control the script can focus', () => {
  for (const name of ['people', 'date', 'address', 'firstName', 'lastName', 'phone']) {
    assert.match(markup, new RegExp(`name="${name}"`), `${name} control`);
    assert.match(markup, new RegExp(`data-error="${name}"`), `${name} error`);
  }
});
