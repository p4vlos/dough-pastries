// Words for the live open/closed badge. Plain JS so it stays out of the Astro build and can be tested.

const TEXT = {
  en: {
    open: 'Open now',
    until: 'until {time}',
    closed: 'Closed',
    opensToday: 'opens today at {time}',
    opensTomorrow: 'opens tomorrow at {time}',
    opensOn: 'opens {day} at {time}',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  },
  el: {
    open: 'Ανοιχτά τώρα',
    until: 'μέχρι τις {time}',
    closed: 'Κλειστά',
    opensToday: 'ανοίγουμε σήμερα στις {time}',
    opensTomorrow: 'ανοίγουμε αύριο στις {time}',
    opensOn: 'ανοίγουμε {day} στις {time}',
    days: ['την Κυριακή', 'τη Δευτέρα', 'την Τρίτη', 'την Τετάρτη', 'την Πέμπτη', 'την Παρασκευή', 'το Σάββατο'],
  },
};

export function describeStatus(status, lang) {
  const text = TEXT[lang] ?? TEXT.en;
  if (!status) return { open: false, label: text.closed, detail: '' };
  if (status.open) {
    return { open: true, label: text.open, detail: text.until.replace('{time}', status.closes) };
  }
  const template =
    status.daysAway === 0 ? text.opensToday : status.daysAway === 1 ? text.opensTomorrow : text.opensOn;
  return {
    open: false,
    label: text.closed,
    detail: template.replace('{time}', status.opens).replace('{day}', text.days[status.day]),
  };
}
