// Menu search helpers. Plain JS so `node --test` can run them without a build.

/** Lower-cases and strips accents, so "σοκολατα" finds "σοκολάτα" and final sigma matches sigma. */
export function normalise(text) {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/ς/g, 'σ')
    .toLocaleLowerCase('en')
    .replace(/ς/g, 'σ')
    .trim();
}

/** Every word typed must appear somewhere in the item's text. An empty query matches everything. */
export function matches(normalisedText, query) {
  return normalise(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => normalisedText.includes(word));
}
