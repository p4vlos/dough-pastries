// Rules for the cake and occasions request form. Plain JS so `node --test` can run them without a build.

/** Today's date as YYYY-MM-DD in the shop's timezone, which is also how date inputs format values. */
export function todayInZone(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export const isValidPhone = (phone) => (phone ?? '').replace(/\D/g, '').length >= 8;

const MAX_PEOPLE = 2000;
export const isValidPeople = (people) =>
  /^\d+$/.test(String(people ?? '').trim()) && Number(people) >= 1 && Number(people) <= MAX_PEOPLE;

const filled = (value) => (value ?? '').trim() !== '';

/** Returns the keys of everything that still needs fixing, in the order the fields appear. */
export function validateRequest(values, today) {
  const errors = [];
  const { mode } = values;

  if (mode === 'cake') {
    if (!values.flavour) errors.push('flavour');
    if (!values.size) errors.push('size');
  }
  if (mode === 'sweets' && !values.sweets?.length) errors.push('sweets');
  if ((mode === 'sweets' || mode === 'people') && !isValidPeople(values.people)) errors.push('people');

  if (!values.date || values.date < today) errors.push('date');
  if (values.location !== 'collect' && !filled(values.address)) errors.push('address');
  if (!filled(values.firstName)) errors.push('firstName');
  if (!filled(values.lastName)) errors.push('lastName');
  if (!isValidPhone(values.phone)) errors.push('phone');

  return errors;
}
