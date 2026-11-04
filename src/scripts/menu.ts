import { matches, normalise } from '../lib/search.mjs';

const input = document.querySelector<HTMLInputElement>('[data-menu-search]')!;
const clear = document.querySelector<HTMLButtonElement>('[data-menu-clear]')!;
const count = document.querySelector<HTMLElement>('[data-menu-count]')!;
const empty = document.querySelector<HTMLElement>('[data-menu-empty]')!;
const chipBar = document.querySelector<HTMLElement>('[data-menu-chips]')!;
const chips = [...chipBar.querySelectorAll<HTMLAnchorElement>('a')];
const sections = [...document.querySelectorAll<HTMLElement>('[data-menu-section]')];
const items = [...document.querySelectorAll<HTMLElement>('[data-menu-item]')].map((element) => ({
  element,
  text: normalise(element.dataset.search ?? ''),
}));

function chipFor(section: HTMLElement) {
  return chips.find((chip) => chip.hash === `#${section.id}`);
}

function applySearch() {
  const query = input.value;
  let shown = 0;

  items.forEach(({ element, text }) => {
    const match = matches(text, query);
    element.hidden = !match;
    if (match) shown += 1;
  });

  sections.forEach((section) => {
    const visible = [...section.querySelectorAll<HTMLElement>('[data-menu-item]')].some((item) => !item.hidden);
    section.hidden = !visible;
    const chip = chipFor(section);
    if (chip) chip.hidden = !visible;
  });

  // The drinks panel is one block, so hide it whole when no drink matches.
  const drinks = document.querySelector<HTMLElement>('.drinks');
  if (drinks) drinks.hidden = !drinks.querySelector('[data-menu-item]:not([hidden])');

  clear.hidden = query === '';
  empty.hidden = shown > 0;
  count.textContent =
    query === ''
      ? ''
      : shown === 1
        ? count.dataset.one!
        : count.dataset.many!.replace('{n}', String(shown));
}

input.addEventListener('input', applySearch);
clear.addEventListener('click', () => {
  input.value = '';
  applySearch();
  input.focus();
});

/* Highlight the chip for the section in view, and keep that chip scrolled into its bar. */
function setActiveChip(active: HTMLAnchorElement | undefined) {
  chips.forEach((chip) => {
    if (chip === active) chip.setAttribute('aria-current', 'true');
    else chip.removeAttribute('aria-current');
  });
  if (active) {
    chipBar.scrollTo({ left: active.offsetLeft - chipBar.offsetLeft - 16, behavior: 'smooth' });
  }
}

const inView = new Set<HTMLElement>();
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) inView.add(target as HTMLElement);
      else inView.delete(target as HTMLElement);
    });
    const current = sections.find((section) => inView.has(section));
    if (current) setActiveChip(chipFor(current));
  },
  { rootMargin: '-35% 0px -55% 0px' },
);
sections.forEach((section) => spy.observe(section));
