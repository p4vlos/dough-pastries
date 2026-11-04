import { isValidPeople, todayInZone, validateRequest } from '../lib/request.mjs';

const form = document.querySelector<HTMLFormElement>('[data-builder]')!;
const text = JSON.parse(form.dataset.text!);
const result = document.querySelector<HTMLElement>('[data-result]')!;
const resultList = result.querySelector<HTMLElement>('[data-result-list]')!;
const cake = form.querySelector<HTMLElement>('[data-cake]')!;
const tray = form.querySelector<HTMLElement>('[data-tray]')!;
const title = form.querySelector<HTMLElement>('[data-preview-title]')!;
const detail = form.querySelector<HTMLElement>('[data-preview-detail]')!;
const tall = form.querySelector<HTMLElement>('[data-preview-tall]')!;
const across = form.querySelector<HTMLElement>('[data-preview-across]')!;
const preview = form.querySelector<HTMLElement>('[data-preview]')!;
const addressField = form.querySelector<HTMLElement>('[data-address-field]')!;
const dateInput = form.elements.namedItem('date') as HTMLInputElement;
const locationInput = form.elements.namedItem('location') as HTMLSelectElement;
const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;

const MAX_TRAY_TOKENS = 60;
const today = () => todayInZone(new Date(), form.dataset.timezone!);
const checked = (name: string) => form.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
const allChecked = (name: string) => [...form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]:checked`)];
const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value.trim();
const labelOf = (input: HTMLInputElement) =>
  input.closest('label')!.querySelector('[data-label]')?.textContent?.trim() ??
  input.closest('label')!.textContent!.trim();
const currentMode = () => checked('occasion')!.dataset.mode!;

function showView(name: string) {
  form.querySelectorAll<HTMLElement>('[data-view]').forEach((view) => {
    view.hidden = view.dataset.view !== name;
  });
}

function renderTray(people: number) {
  const colours = allChecked('sweets').map((input) => input.dataset.colour!);
  const tokens = Math.min(MAX_TRAY_TOKENS, Math.max(18, people || 0));
  // Rebuild only what changed so existing tokens don't all pop again.
  while (tray.children.length > tokens) tray.lastElementChild!.remove();
  while (tray.children.length < tokens) tray.append(document.createElement('span'));
  [...tray.children].forEach((token, index) => {
    (token as HTMLElement).style.setProperty('--c', colours.length ? colours[index % colours.length] : 'transparent');
  });
}

function peopleText() {
  const people = value('people');
  return isValidPeople(people) ? text.people.replace('{n}', people) : text.peopleBlank;
}

function updatePreview() {
  const occasion = checked('occasion')!;
  const mode = currentMode();
  const isDelivery = locationInput.value !== 'collect';

  form.querySelectorAll<HTMLElement>('[data-for-mode]').forEach((step) => {
    step.hidden = !step.dataset.forMode!.split(' ').includes(mode);
  });
  addressField.hidden = !isDelivery;
  preview.dataset.preview = mode;

  if (mode === 'cake') {
    const flavour = checked('flavour')!;
    const size = checked('size')!;
    showView('cake');
    cake.style.setProperty('--sponge', flavour.dataset.sponge!);
    cake.style.setProperty('--filling', flavour.dataset.filling!);
    cake.style.setProperty('--top', flavour.dataset.top!);
    cake.style.setProperty('--d', size.dataset.d!);
    cake.style.setProperty('--h', size.dataset.h!);
    tall.textContent = text.tall.replace('{n}', size.dataset.h!);
    across.textContent = text.across.replace('{n}', size.dataset.d!);
    title.textContent = labelOf(flavour);
    detail.textContent = text.pieces.replace('{n}', size.dataset.pieces!);
  } else if (mode === 'other') {
    showView('logo');
    title.textContent = labelOf(occasion);
    detail.textContent = '';
  } else {
    showView('tray');
    renderTray(Number(value('people')));
    title.textContent = labelOf(occasion);
    detail.textContent = peopleText();
  }
}

const controlsFor = (key: string) => [...form.querySelectorAll<HTMLElement>(`[name="${key}"]`)];

function showError(key: string) {
  const message = form.querySelector<HTMLElement>(`[data-error="${key}"]`)!;
  message.hidden = false;
  controlsFor(key).forEach((control) => {
    control.setAttribute('aria-invalid', 'true');
    control.setAttribute('aria-describedby', message.id);
  });
}

function clearError(key: string) {
  const message = form.querySelector<HTMLElement>(`[data-error="${key}"]`);
  if (!message) return;
  message.hidden = true;
  controlsFor(key).forEach((control) => {
    control.removeAttribute('aria-invalid');
    control.removeAttribute('aria-describedby');
  });
}

function clearErrors() {
  form.querySelectorAll<HTMLElement>('[data-error]').forEach((error) => clearError(error.dataset.error!));
}

function collectValues() {
  return {
    mode: currentMode(),
    flavour: checked('flavour')?.value,
    size: checked('size')?.value,
    sweets: allChecked('sweets').map((input) => input.value),
    people: value('people'),
    date: value('date'),
    location: locationInput.value,
    address: value('address'),
    firstName: value('firstName'),
    lastName: value('lastName'),
    phone: value('phone'),
    message: value('message'),
  };
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(document.documentElement.lang === 'el' ? 'el-GR' : 'en-GB', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function showResult(values: ReturnType<typeof collectValues>) {
  const s = text.summary;
  const rows: [string, string][] = [[s.request, labelOf(checked('occasion')!)]];

  if (values.mode === 'cake') {
    rows.push([s.flavour, labelOf(checked('flavour')!)], [s.size, labelOf(checked('size')!)]);
  }
  if (values.mode === 'sweets') rows.push([s.sweets, allChecked('sweets').map(labelOf).join('\n')]);
  if (values.mode === 'sweets' || values.mode === 'people') rows.push([s.people, values.people]);

  rows.push([s.date, formatDate(values.date)], [s.location, locationInput.selectedOptions[0].textContent!.trim()]);
  if (values.location !== 'collect') rows.push([s.address, values.address]);
  rows.push([s.name, `${values.firstName} ${values.lastName}`], [s.phone, values.phone]);
  if (values.message) rows.push([s.message, values.message]);

  resultList.replaceChildren(
    ...rows.flatMap(([label, content]) => {
      const term = document.createElement('dt');
      term.textContent = label;
      const description = document.createElement('dd');
      description.textContent = content;
      return [term, description];
    }),
  );

  form.hidden = true;
  result.hidden = false;
  result.focus({ preventScroll: true });
  result.scrollIntoView({ block: 'center' });
}

function showForm() {
  result.hidden = true;
  form.hidden = false;
}

form.addEventListener('input', (event) => {
  clearError((event.target as HTMLInputElement).name);
  updatePreview();
});
form.addEventListener('change', updatePreview);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();
  const values = collectValues();
  const errors: string[] = validateRequest(values, today());
  if (errors.length === 0) {
    showResult(values);
    return;
  }
  errors.forEach(showError);
  const first = controlsFor(errors[0])[0];
  first.focus({ preventScroll: true });
  first.scrollIntoView({ block: 'center' });
});

result.querySelector('[data-result-again]')!.addEventListener('click', () => {
  form.reset();
  clearErrors();
  showForm();
  updatePreview();
  form.scrollIntoView({ block: 'start' });
  checked('occasion')!.focus({ preventScroll: true });
});

/* The occasion links above the form pick that occasion, then the page scrolls down to it. */
document.querySelectorAll<HTMLAnchorElement>('[data-pick-occasion]').forEach((link) => {
  link.addEventListener('click', () => {
    const radio = form.querySelector<HTMLInputElement>(`input[name="occasion"][value="${link.dataset.pickOccasion}"]`);
    if (radio) {
      showForm();
      radio.checked = true;
      updatePreview();
    }
  });
});

dateInput.min = today();
updatePreview();
submit.disabled = false;
