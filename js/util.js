// Hilfsfunktionen: DOM, Datum, Zahlen. Keine Abhängigkeiten, kein DOM-Zugriff beim Laden.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
/** Text sicher für HTML maskieren (alle Nutzereingaben laufen hier durch). */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export const pad2 = (n) => String(n).padStart(2, '0');

/* ---------- Datum (immer lokale Kalendertage als 'JJJJ-MM-TT') ---------- */

export function toISODate(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

/** Tagesnummer seit 1970 – sommerzeitsicher, da über UTC gerechnet. */
export function dayNumber(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
}

export function fromDayNumber(n) {
  const d = new Date(n * 86400000);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function isISODate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const n = dayNumber(s);
  return Number.isFinite(n) && fromDayNumber(n) === s;
}

export const addDays = (iso, n) => fromDayNumber(dayNumber(iso) + n);
export const daysBetween = (a, b) => dayNumber(b) - dayNumber(a);

/** Wochentag mit Montag = 0 … Sonntag = 6 */
export function weekdayIndex(iso) {
  return (((dayNumber(iso) + 3) % 7) + 7) % 7; // 01.01.1970 war ein Donnerstag
}

export function mondayOf(iso) {
  return addDays(iso, -weekdayIndex(iso));
}

/** Lokales Datum (12 Uhr mittags, damit Sommerzeit keine Rolle spielt). */
export function localDate(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

const fmtCache = new Map();
function dtf(opts) {
  const key = JSON.stringify(opts);
  if (!fmtCache.has(key)) fmtCache.set(key, new Intl.DateTimeFormat('de-DE', opts));
  return fmtCache.get(key);
}

const DATE_STYLES = {
  short: { day: 'numeric', month: 'short' }, // 30. Okt.
  medium: { weekday: 'short', day: 'numeric', month: 'short' }, // Fr., 30. Okt.
  long: { weekday: 'long', day: 'numeric', month: 'long' }, // Freitag, 30. Oktober
  full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  numeric: { day: '2-digit', month: '2-digit', year: 'numeric' }, // 30.10.2026
  dayMonth: { day: '2-digit', month: '2-digit' }, // 30.10.
  monthYear: { month: 'long', year: 'numeric' }, // Oktober 2026
  weekdayShort: { weekday: 'short' }, // Fr.
};

export function formatDate(iso, style = 'medium') {
  if (!iso || !isISODate(iso)) return '–';
  return dtf(DATE_STYLES[style] || DATE_STYLES.medium).format(localDate(iso));
}

export function relativeDay(iso, today = todayISO()) {
  if (!iso) return '–';
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'heute';
  if (diff === 1) return 'gestern';
  if (diff === -1) return 'morgen';
  if (diff > 1) return `vor ${diff} Tagen`;
  return `in ${-diff} Tagen`;
}

export function nowTimeHM(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Gute Nacht';
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
}

/* ---------- Zahlen ---------- */

export function fmtNum(n, maxDigits = 1) {
  if (n == null || !Number.isFinite(Number(n))) return '–';
  return new Intl.NumberFormat('de-DE', { maximumFractionDigits: maxDigits }).format(Number(n));
}

/** Akzeptiert „12,5“ und „12.5“. Leere Eingabe → null. */
export function parseNum(v) {
  if (v == null) return null;
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function formatDuration(min) {
  if (min == null || !Number.isFinite(min)) return '–';
  const total = Math.max(0, Math.round(min));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m} Min.`;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

export function formatClock(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(r)}` : `${m}:${pad2(r)}`;
}

export function plural(n, one, many) {
  return `${fmtNum(n, 0)} ${n === 1 ? one : many}`;
}

export function debounce(fn, ms) {
  let t = null;
  let lastArgs = null;
  const d = (...args) => {
    lastArgs = args;
    clearTimeout(t);
    t = setTimeout(() => {
      t = null;
      fn(...lastArgs);
    }, ms);
  };
  d.flush = () => {
    if (t) {
      clearTimeout(t);
      t = null;
      fn(...(lastArgs || []));
    }
  };
  return d;
}

export function deepClone(obj) {
  return obj == null ? obj : JSON.parse(JSON.stringify(obj));
}

export function average(nums) {
  const vals = nums.filter((n) => typeof n === 'number' && Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
