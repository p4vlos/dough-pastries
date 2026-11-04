// Menu search helpers. Plain JS so `node --test` can run them without a build.

/** Lower-cases and strips accents, so "σοκολατα" finds "σοκολάτα", and straightens phone-style apostrophes. */
export function normalise(text) {
  return text
    .replace(/[’‘ʼ]/g, "'")
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en')
    .replace(/ς/g, 'σ')
    .trim();
}

/** Everything an item can be found by: its name and description, plus its category in both languages. */
export function searchText(item, category) {
  return [item.name.en, item.name.el, item.desc?.en, item.desc?.el, category.name.en, category.name.el, category.keywords]
    .filter(Boolean)
    .join(' ');
}

/** Of the sections crossing the reading line, [{ top }, ...], the one that started furthest down the screen. */
export function sectionToHighlight(inBand) {
  return inBand.reduce((best, section) => (!best || section.top > best.top ? section : best), undefined);
}

/** Every word typed must appear somewhere in the item's text. An empty query matches everything. */
export function matches(normalisedText, query) {
  return normalise(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => normalisedText.includes(word));
}
