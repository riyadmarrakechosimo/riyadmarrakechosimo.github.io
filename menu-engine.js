(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RiyadMenu = factory();
})(globalThis, function () {
  'use strict';
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const stopWords = new Set(['di', 'con', 'e', 'il', 'la', 'un', 'una', 'del', 'dei', 'al', 'ai']);
  function filterDishes(dishes, query = '', category = 'tutti') {
    const terms = normalize(query).split(/\s+/).filter(term => term && !stopWords.has(term));
    return dishes.filter(dish => {
      if (category === 'vegetariano' ? !dish.vegetarian : category !== 'tutti' && dish.category !== category) return false;
      const words = normalize([dish.name, dish.description, ...(dish.aliases || []), dish.vegetarian ? 'vegetariano vegetariana vegetariani vegetariane' : ''].join(' '));
      return terms.every(term => words.includes(term));
    });
  }
  function openingState(date, site) {
    const parts = new Intl.DateTimeFormat('en-GB', {timeZone: site.timezone || 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).formatToParts(date);
    const part = type => parts.find(p => p.type === type).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'));
    const key = part('year') + '-' + part('month') + '-' + part('day');
    const previous = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) - 1)).toISOString().slice(0, 10);
    const special = site.specialHours || {};
    const intervals = (index, dayKey) => Object.prototype.hasOwnProperty.call(special, dayKey) ? special[dayKey] : site.weeklyHours[index];
    const minute = Number(part('hour')) * 60 + Number(part('minute'));
    const today = intervals(day, key) || [];
    const format = value => String(Math.floor(value / 60) % 24).padStart(2, '0') + ':' + String(value % 60).padStart(2, '0');
    const closedSpecialDay = Object.prototype.hasOwnProperty.call(special, key) && !today.length;
    if (!closedSpecialDay) {
      for (const [start, end] of intervals((day + 6) % 7, previous) || []) {
        if (end < start && minute < end) return {day, open: true, label: 'Oggi aperti fino alle ' + format(end)};
      }
      for (const [start, end] of today) {
        if (minute >= start && (end < start || minute < end)) return {day, open: true, label: 'Oggi aperti fino alle ' + format(end)};
      }
    }
    const next = today.filter(([start]) => start > minute).sort((a, b) => a[0] - b[0])[0];
    return {day, open: false, label: next ? 'Oggi apriamo alle ' + format(next[0]) : today.length ? 'Ora chiuso · Consulta gli orari' : 'Oggi chiuso · Consulta gli orari'};
  }
  return {normalize, filterDishes, openingState};
});
