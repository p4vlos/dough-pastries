import site from '../data/site.json';
import { getStatus, shopTime } from '../lib/hours.mjs';
import { describeStatus } from '../lib/status-text.mjs';

const lang = document.documentElement.lang === 'el' ? 'el' : 'en';
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Live open/closed badge and today's row in the hours table, always in Cyprus time. */
function updateOpenStatus() {
  const now = shopTime(new Date(), site.timezone);
  const { open, label, detail } = describeStatus(getStatus(site.hours, now), lang);

  document.querySelectorAll<HTMLElement>('[data-open-status]').forEach((badge) => {
    badge.dataset.state = open ? 'open' : 'closed';
    badge.querySelector('[data-open-status-label]')!.textContent = label;
    badge.querySelector('[data-open-status-detail]')!.textContent = detail;
    badge.hidden = false;
  });

  document.querySelectorAll<HTMLElement>('[data-hours-day]').forEach((row) => {
    if (Number(row.dataset.hoursDay) === now.day) row.setAttribute('aria-current', 'date');
    else row.removeAttribute('aria-current');
  });
}

updateOpenStatus();
setInterval(updateOpenStatus, 60_000);

/* Scroll-linked motion: pin rules roll, cookies turn. Only runs for what is on screen. */
if (!reducedMotion) {
  const rules = [...document.querySelectorAll<HTMLElement>('[data-pin-rule]')];
  const rollers = [...document.querySelectorAll<HTMLElement>('[data-roll]')];
  const visible = new Set<HTMLElement>();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) visible.add(target as HTMLElement);
        else visible.delete(target as HTMLElement);
      });
      requestTick();
    },
    { rootMargin: '10% 0px' },
  );
  [...rules, ...rollers].forEach((element) => observer.observe(element));

  let ticking = false;
  const requestTick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const update = () => {
    ticking = false;
    const height = innerHeight;
    visible.forEach((element) => {
      if ('pinRule' in element.dataset) {
        const { top } = element.getBoundingClientRect();
        // Starts as the rule enters at the bottom of the screen, done by the top third.
        const progress = (height - top) / (height * 0.72);
        element.style.setProperty('--p', Math.min(1, Math.max(0, progress)).toFixed(4));
      } else {
        element.style.setProperty('--roll', `${(scrollY * 0.06).toFixed(2)}deg`);
      }
    });
  };

  rules.forEach((rule) => rule.style.setProperty('--p', '0'));
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', requestTick, { passive: true });
}
