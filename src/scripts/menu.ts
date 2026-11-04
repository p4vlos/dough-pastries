import { matches, normalise, sectionToHighlight } from '../lib/search.mjs';

const input = document.querySelector<HTMLInputElement>('[data-menu-search]')!;
const clear = document.querySelector<HTMLButtonElement>('[data-menu-clear]')!;
const count = document.querySelector<HTMLElement>('[data-menu-count]')!;
const empty = document.querySelector<HTMLElement>('[data-menu-empty]')!;
const hero = document.querySelector<HTMLElement>('[data-menu-hero]')!;
const header = document.querySelector<HTMLElement>('.site-header')!;
const blocks = [...document.querySelectorAll<HTMLElement>('[data-menu-block]')];
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

  // The drinks section and its two columns have headings and panels of their own, so hide them when empty.
  blocks.forEach((block) => {
    block.hidden = !block.querySelector('[data-menu-item]:not([hidden])');
  });

  clear.hidden = query === '';
  empty.hidden = shown > 0;
  count.textContent =
    query === ''
      ? ''
      : shown === 1
        ? count.dataset.one!
        : count.dataset.many!.replace('{n}', String(shown));
}

/* Filtering shortens the page, so go back to where the results start or they end up off screen. */
function showTopOfResults() {
  const resultsStart = hero.getBoundingClientRect().bottom + scrollY - header.offsetHeight;
  if (scrollY > resultsStart) scrollTo({ top: resultsStart, behavior: 'instant' });
}

input.addEventListener('input', () => {
  applySearch();
  showTopOfResults();
});
clear.addEventListener('click', () => {
  input.value = '';
  applySearch();
  showTopOfResults();
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
    const current = sectionToHighlight(
      [...inView].map((section) => ({ section, top: section.getBoundingClientRect().top })),
    );
    setActiveChip(current && chipFor(current.section));
  },
  { rootMargin: '-35% 0px -55% 0px' },
);
sections.forEach((section) => spy.observe(section));
