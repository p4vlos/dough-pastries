// Opening hours logic. Plain JS so `node --test` can run it without a build.

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Day of week and minutes past midnight at the shop, whatever the visitor's own timezone is. */
export function shopTime(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return {
    day: WEEKDAYS.indexOf(value('weekday')),
    minutes: Number(value('hour')) * 60 + Number(value('minute')),
  };
}

/**
 * hours: { "0": null, "1": { open: "08:30", close: "17:00" }, ... } keyed by day, Sunday = 0.
 * Returns { open: true, closes } or { open: false, opens, daysAway, day }, or null if never open.
 */
export function getStatus(hours, { day, minutes }) {
  const today = hours[day];
  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { open: true, closes: today.close };
  }
  if (today && minutes < toMinutes(today.open)) {
    return { open: false, opens: today.open, daysAway: 0, day };
  }
  for (let daysAway = 1; daysAway <= 7; daysAway += 1) {
    const next = (day + daysAway) % 7;
    if (hours[next]) return { open: false, opens: hours[next].open, daysAway, day: next };
  }
  return null;
}
