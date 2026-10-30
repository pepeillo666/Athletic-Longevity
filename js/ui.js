// Oberflächen-Bausteine: Icons, Sheets, Dialoge, Toasts, Steuerelemente, Timer.
import { esc, formatClock } from './util.js';

/* ---------- Icons (24 × 24, Linienstil) ---------- */

const ICONS = {
  home: '<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>',
  plan: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
  dumbbell: '<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>',
  history: '<path d="M4.3 13a8 8 0 1 0 2.1-6.7"/><path d="M4 4.5V8.5h4"/><path d="M12 8v4.2l3 1.8"/>',
  chart: '<path d="M5 20v-6M12 20V6M19 20v-10"/>',
  sliders: '<path d="M4 7h8.5M17.5 7H20M4 17h2.5M11.5 17H20"/><circle cx="15" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
  chevronRight: '<path d="m9.5 6 6 6-6 6"/>',
  chevronLeft: '<path d="m14.5 6-6 6 6 6"/>',
  chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="m6.5 6.5 11 11M17.5 6.5l-11 11"/>',
  alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.4v.1"/>',
  heart: '<path d="M12 19.5s-7-4.3-7-10a4 4 0 0 1 7-2.6 4 4 0 0 1 7 2.6c0 5.7-7 10-7 10z"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.9v.1"/>',
  download: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 19.5h14"/>',
  trash: '<path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 13h9l1-13"/>',
  edit: '<path d="M5 19h3.5L19 8.5 15.5 5 5 15.5z"/><path d="m13.5 7 3.5 3.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" class="icon-fill"/>',
  timer: '<circle cx="12" cy="13.5" r="7"/><path d="M12 10v3.5l2.5 1.5M9.5 3.5h5"/>',
  repeat: '<path d="M4.5 11a7.5 7.5 0 0 1 13-4.5L19.5 9"/><path d="M19.5 4v5h-5"/><path d="M19.5 13a7.5 7.5 0 0 1-13 4.5L4.5 15"/><path d="M4.5 20v-5h5"/>',
  shield: '<path d="M12 3.5 19 6v5.5c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
  phone: '<path d="M6.5 4h3l1.5 4-2 1.5a11 11 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A15.5 15.5 0 0 1 4.5 6a2 2 0 0 1 2-2z"/>',
  moon: '<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  note: '<path d="M6 4h8.5L18 7.5V20H6z"/><path d="M9 11.5h6M9 15.5h6"/>',
  scale: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10.5a3.5 3.5 0 0 1 7 0"/><path d="m12 10.5 1.3-1.8"/>',
  refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3"/><path d="M19.5 4.5V9H15"/>',
  skip: '<path d="M6.5 6.5v11l8-5.5z"/><path d="M17.5 6.5v11"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>',
  book: '<path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5z"/><path d="M5 20.5A2.5 2.5 0 0 1 7.5 18H19v3H7.5"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  wifiOff: '<path d="M3.5 3.5l17 17"/><path d="M8.5 16a5 5 0 0 1 7 0M5 12.5a10 10 0 0 1 4.3-2.4M19 12.5a10 10 0 0 0-3-2"/><path d="M12 19.5v.1"/>',
  share: '<path d="M12 3.5v11M8 7.5l4-4 4 4"/><path d="M7 11H5.5v9h13v-9H17"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/>',
  bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l4-7h5l3 7M10 9l3 7h-3M14 5.5h2"/>',
};

export function icon(name, cls = '') {
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

/* ---------- Sheets (Bottom Sheets) ---------- */

let sheetCounter = 0;

export function openSheet({ title, body = '', onMount, dismissible = true, className = '' }) {
  const id = `sheet-${++sheetCounter}`;
  const root = document.getElementById('sheet-root');
  const wrap = document.createElement('div');
  wrap.className = 'sheet-wrap';
  wrap.innerHTML = `
    <div class="sheet-backdrop"${dismissible ? ' data-sheet-close' : ''}></div>
    <section class="sheet ${className}" role="dialog" aria-modal="true" aria-labelledby="${id}-t" tabindex="-1">
      <div class="sheet-grabber" aria-hidden="true"></div>
      <header class="sheet-head">
        <h2 class="sheet-title" id="${id}-t">${esc(title)}</h2>
        ${dismissible ? `<button type="button" class="icon-btn" data-sheet-close aria-label="Schließen">${icon('close')}</button>` : ''}
      </header>
      <div class="sheet-body">${body}</div>
    </section>`;
  root.appendChild(wrap);
  document.body.classList.add('sheet-open');
  const prevFocus = document.activeElement;
  const sheet = wrap.querySelector('.sheet');
  let resolveFn;
  const promise = new Promise((res) => { resolveFn = res; });
  let closed = false;

  const close = (result = null) => {
    if (closed) return;
    closed = true;
    wrap.classList.remove('open');
    document.removeEventListener('keydown', onKey);
    const done = () => {
      wrap.remove();
      if (!root.querySelector('.sheet-wrap')) document.body.classList.remove('sheet-open');
      if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus({ preventScroll: true });
    };
    setTimeout(done, 260);
    resolveFn(result);
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && dismissible) close(null);
  };
  document.addEventListener('keydown', onKey);
  wrap.addEventListener('click', (e) => {
    if (e.target.closest('[data-sheet-close]')) close(null);
  });
  requestAnimationFrame(() => {
    wrap.classList.add('open');
    sheet.focus({ preventScroll: true });
  });
  if (onMount) onMount(sheet, close);
  return { el: sheet, close, promise };
}

export function confirmDialog({
  title, message = '', confirmLabel = 'Bestätigen', cancelLabel = 'Abbrechen', danger = false, requireText = null,
}) {
  const body = `
    ${message ? `<p class="sheet-text">${message}</p>` : ''}
    ${requireText ? `<label class="field"><span class="field-label">Zur Bestätigung „${esc(requireText)}“ eingeben</span>
      <input class="input" data-confirm-input autocomplete="off" autocapitalize="characters" spellcheck="false"></label>` : ''}
    <div class="btn-stack">
      <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-confirm-yes ${requireText ? 'disabled' : ''}>${esc(confirmLabel)}</button>
      <button type="button" class="btn btn-secondary" data-sheet-close>${esc(cancelLabel)}</button>
    </div>`;
  const { promise } = openSheet({
    title, body,
    onMount(sheet, close) {
      const yes = sheet.querySelector('[data-confirm-yes]');
      const input = sheet.querySelector('[data-confirm-input]');
      if (input) {
        input.addEventListener('input', () => {
          yes.disabled = input.value.trim().toUpperCase() !== requireText.toUpperCase();
        });
      }
      yes.addEventListener('click', () => close(true));
    },
  });
  return promise.then((r) => r === true);
}

/* ---------- Toasts ---------- */

export function toast(message, { type = 'info', actionLabel = '', onAction = null, duration = 3500 } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return () => {};
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span class="toast-text">${esc(message)}</span>${actionLabel ? `<button type="button" class="toast-action">${esc(actionLabel)}</button>` : ''}`;
  root.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  const remove = () => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  };
  if (actionLabel) {
    el.querySelector('.toast-action').addEventListener('click', () => {
      if (onAction) onAction();
      remove();
    });
  }
  if (duration) setTimeout(remove, duration);
  return remove;
}

/* ---------- Steuerelemente ---------- */

export function segmented(name, options, value, extraClass = '') {
  return `<div class="seg ${extraClass}" role="radiogroup">${options
    .map((o) => {
      const active = String(o.value) === String(value);
      return `<button type="button" class="seg-btn${active ? ' active' : ''}" role="radio" aria-checked="${active}" data-seg="${esc(name)}" data-value="${esc(o.value)}">${o.html || esc(o.label)}</button>`;
    })
    .join('')}</div>`;
}

export function toggle(name, checked, label, hint = '') {
  return `<label class="row row-toggle">
    <span class="row-main"><span class="row-title">${esc(label)}</span>${hint ? `<span class="row-sub">${esc(hint)}</span>` : ''}</span>
    <input type="checkbox" class="switch" data-toggle="${esc(name)}" ${checked ? 'checked' : ''}>
  </label>`;
}

export function pageHead({ title, subtitle = '', back = '', actions = '' }) {
  return `<header class="page-head">
    ${back ? `<a class="back-link" href="${esc(back.href)}">${icon('chevronLeft')}<span>${esc(back.label)}</span></a>` : ''}
    <div class="page-head-row">
      <div class="page-head-text">
        <h1 class="large-title">${esc(title)}</h1>
        ${subtitle ? `<p class="page-sub">${subtitle}</p>` : ''}
      </div>
      ${actions ? `<div class="page-actions">${actions}</div>` : ''}
    </div>
  </header>`;
}

export function settingsButton() {
  return `<a class="icon-btn icon-btn-lg" href="#/einstellungen" aria-label="Einstellungen">${icon('sliders')}</a>`;
}

export function banner({ type = 'info', title = '', text = '', actions = '', iconName = null, dismiss = '' }) {
  const ic = iconName || (type === 'danger' || type === 'warn' ? 'alert' : 'info');
  return `<div class="banner banner-${type}" role="${type === 'danger' ? 'alert' : 'note'}">
    <div class="banner-icon">${icon(ic)}</div>
    <div class="banner-body">
      ${title ? `<p class="banner-title">${esc(title)}</p>` : ''}
      ${text ? `<p class="banner-text">${text}</p>` : ''}
      ${actions ? `<div class="banner-actions">${actions}</div>` : ''}
    </div>
    ${dismiss ? `<button type="button" class="icon-btn banner-x" data-dismiss="${esc(dismiss)}" aria-label="Hinweis ausblenden">${icon('close')}</button>` : ''}
  </div>`;
}

/* ---------- Wochen-Ring: 12 Segmente, eines pro Planwoche ---------- */

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx, cy, r, a0, a1) {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export function weekRing({ weeks, current, animate = false, size = 232 }) {
  const c = size / 2;
  const sw = 13;
  const r = c - sw / 2 - 3;
  const gap = 5.2;
  let segs = '';
  weeks.forEach((w, i) => {
    const a0 = i * 30 + gap / 2;
    const a1 = (i + 1) * 30 - gap / 2;
    const isCurrent = w.week === current;
    const style = animate ? ` style="--i:${i}"` : '';
    segs += `<path d="${arcPath(c, c, r, a0, a1)}" class="ring-seg${w.complete ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}"${style}/>`;
    if (isCurrent && !w.complete && w.done > 0) {
      const frac = Math.min(1, w.done / w.min);
      segs += `<path d="${arcPath(c, c, r, a0, a0 + (a1 - a0) * frac)}" class="ring-seg is-partial"${style}/>`;
    }
  });
  return `<svg class="week-ring${animate ? ' animate' : ''}" viewBox="0 0 ${size} ${size}" aria-hidden="true">${segs}</svg>`;
}

/* ---------- Pausen-Timer, Ton, Bildschirm anlassen ---------- */

let audioCtx = null;

export function unlockAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'ambient';
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audioCtx = audioCtx || new AC();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* kein Ton möglich */ }
}

export function beep() {
  if (!audioCtx) return;
  try {
    const t = audioCtx.currentTime;
    [0, 0.28].forEach((offset) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t + offset);
      g.gain.exponentialRampToValueAtTime(0.22, t + offset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.22);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + offset);
      o.stop(t + offset + 0.25);
    });
  } catch { /* egal */ }
}

let wakeLock = null;
let wakeWanted = false;

export async function keepScreenOn(on) {
  wakeWanted = on;
  try {
    if (on && !wakeLock && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && wakeWanted) keepScreenOn(true);
});

/** Ein globaler Countdown (Pause, Aufwärmen …), unten über der Tab-Leiste. */
export const timer = {
  state: null,
  interval: null,
  sound: true,
  listeners: new Set(),

  start(label, seconds) {
    unlockAudio();
    this.state = { label, total: seconds, endsAt: Date.now() + seconds * 1000, finished: false };
    this.tick();
    clearInterval(this.interval);
    this.interval = setInterval(() => this.tick(), 250);
  },
  add(seconds) {
    if (!this.state) return;
    if (this.state.finished) {
      this.state.finished = false;
      this.state.endsAt = Date.now();
      clearInterval(this.interval);
      this.interval = setInterval(() => this.tick(), 250);
    }
    this.state.endsAt += seconds * 1000;
    this.state.total += seconds;
    this.tick();
  },
  stop() {
    clearInterval(this.interval);
    this.interval = null;
    this.state = null;
    this.render();
  },
  remaining() {
    return this.state ? Math.max(0, (this.state.endsAt - Date.now()) / 1000) : 0;
  },
  tick() {
    if (!this.state) return;
    if (!this.state.finished && this.remaining() <= 0) {
      this.state.finished = true;
      clearInterval(this.interval);
      if (this.sound) beep();
      setTimeout(() => { if (this.state && this.state.finished) this.stop(); }, 6000);
    }
    this.render();
  },
  render() {
    const root = document.getElementById('timer-root');
    if (!root) return;
    document.body.classList.toggle('has-timer', !!this.state);
    if (!this.state) {
      root.innerHTML = '';
      root.classList.remove('active');
      return;
    }
    const s = this.state;
    const rem = this.remaining();
    const pct = s.total ? Math.min(100, ((s.total - rem) / s.total) * 100) : 100;
    root.classList.add('active');
    if (!root.firstElementChild) {
      root.innerHTML = `<div class="timerbar" role="timer" aria-live="off">
        <div class="timerbar-fill"></div>
        <div class="timerbar-text"><span class="timerbar-label"></span><span class="timerbar-time"></span></div>
        <div class="timerbar-actions">
          <button type="button" class="chip-btn" data-timer="add">+15 s</button>
          <button type="button" class="chip-btn" data-timer="stop">Fertig</button>
        </div></div>`;
      root.querySelector('[data-timer="add"]').addEventListener('click', () => this.add(15));
      root.querySelector('[data-timer="stop"]').addEventListener('click', () => this.stop());
    }
    root.querySelector('.timerbar').classList.toggle('done', s.finished);
    root.querySelector('.timerbar-fill').style.transform = `scaleX(${(pct / 100).toFixed(3)})`;
    root.querySelector('.timerbar-label').textContent = s.finished ? `${s.label} vorbei` : s.label;
    root.querySelector('.timerbar-time').textContent = s.finished ? 'Weiter geht’s' : formatClock(rem);
  },
};
