// App-Start, Routing, Tab-Leiste, laufende Einheit.
import { store } from './store.js';
import { setRouterImpl, navigate } from './router.js';
import { applyTheme } from './theme.js';
import { toast, icon } from './ui.js';
import { registerServiceWorker } from './pwa.js';
import { esc, formatClock } from './util.js';
import { WORKOUTS } from './exercises.js';
import * as dashboard from './views/dashboard.js';
import * as planView from './views/plan.js';
import * as training from './views/training.js';
import * as historyView from './views/history.js';
import * as progress from './views/progress.js';
import * as settings from './views/settings.js';
import * as safety from './views/safety.js';
import * as onboarding from './views/onboarding.js';

const ROUTES = [
  { re: /^heute$/, view: dashboard, tab: 'heute', title: 'Heute' },
  { re: /^plan$/, view: planView, tab: 'plan', title: 'Plan' },
  { re: /^uebung\/([a-z_]+)$/, view: planView, tab: 'plan', title: 'Übung', params: (m) => ({ exercise: m[1] }) },
  { re: /^training$/, view: training, tab: 'training', title: 'Training' },
  { re: /^verlauf$/, view: historyView, tab: 'verlauf', title: 'Verlauf' },
  { re: /^verlauf\/neu$/, view: historyView, tab: 'verlauf', title: 'Einheit nachtragen', params: () => ({ mode: 'edit', isNew: true }) },
  { re: /^verlauf\/([\w-]+)\/bearbeiten$/, view: historyView, tab: 'verlauf', title: 'Einheit bearbeiten', params: (m) => ({ mode: 'edit', id: m[1] }) },
  { re: /^verlauf\/([\w-]+)$/, view: historyView, tab: 'verlauf', title: 'Einheit', params: (m) => ({ id: m[1] }) },
  { re: /^fortschritt$/, view: progress, tab: 'fortschritt', title: 'Fortschritt' },
  { re: /^einstellungen$/, view: settings, tab: null, title: 'Einstellungen' },
  { re: /^sicherheit$/, view: safety, tab: null, title: 'Sicherheit' },
  { re: /^willkommen$/, view: onboarding, tab: null, title: 'Willkommen', bare: true },
];

let active = null;
let rendering = false;

const currentPath = () => (location.hash || '#/heute').replace(/^#\/?/, '').split('?')[0] || 'heute';

function updateTabs(tab) {
  document.querySelectorAll('.tab').forEach((a) => {
    const on = a.dataset.tab === tab;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

function updateLive() {
  const pill = document.getElementById('live-pill');
  if (!pill) return;
  const d = store.state.draft;
  const show = !!d && currentPath() !== 'training' && !document.body.classList.contains('bare');
  pill.hidden = !show;
  document.body.classList.toggle('has-live', show);
  if (!show) return;
  const start = Date.parse(d.startedAt);
  const sec = Number.isFinite(start) ? (Date.now() - start) / 1000 : 0;
  pill.querySelector('[data-live-text]').textContent = `${WORKOUTS[d.type].name} läuft`;
  pill.querySelector('[data-live-time]').textContent = formatClock(sec);
}

function renderRoute({ keepScroll = false } = {}) {
  if (rendering) return;
  rendering = true;
  try {
    const path = currentPath();
    const s = store.state;
    if (!s.profile.onboarded && path !== 'willkommen') { navigate('#/willkommen', { replace: true }); return; }
    if (s.profile.onboarded && path === 'willkommen') { navigate('#/heute', { replace: true }); return; }
    let route = null;
    let match = null;
    for (const r of ROUTES) {
      match = path.match(r.re);
      if (match) { route = r; break; }
    }
    if (!route) { navigate('#/heute', { replace: true }); return; }
    const params = route.params ? route.params(match) : {};
    const samePath = !!active && active.path === path;
    const y = window.scrollY;
    if (active && typeof active.cleanup === 'function') {
      try { active.cleanup({ leaving: !samePath }); } catch (e) { console.error(e); }
    }
    const root = document.getElementById('view');
    let html;
    try {
      html = route.view.render(params);
    } catch (e) {
      console.error(e);
      html = `<section class="empty"><span class="empty-icon">${icon('alert')}</span>
        <p class="empty-title">Diese Ansicht konnte nicht geladen werden</p>
        <p class="empty-text">${esc(e && e.message ? e.message : 'Unbekannter Fehler')}</p>
        <a class="btn btn-primary" href="#/heute">Zur Übersicht</a></section>`;
    }
    root.innerHTML = html;
    root.classList.toggle('view-enter', !samePath);
    document.body.classList.toggle('bare', !!route.bare);
    document.title = route.tab === 'heute' ? 'Athletic Longevity' : `${route.title} – Athletic Longevity`;
    updateTabs(route.tab);
    let cleanup = null;
    try {
      cleanup = route.view.mount ? route.view.mount(root, params) : null;
    } catch (e) {
      console.error(e);
    }
    active = { path, cleanup };
    if (samePath && keepScroll) window.scrollTo(0, y);
    else if (!samePath) window.scrollTo(0, 0);
    updateLive();
  } finally {
    rendering = false;
  }
}

function bindChrome() {
  document.querySelector('.tabbar').addEventListener('click', (e) => {
    const tab = e.target.closest('.tab');
    if (tab && tab.classList.contains('active') && location.hash === tab.getAttribute('href')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  document.getElementById('view').addEventListener('animationend', (e) => {
    if (e.target.id === 'view') e.target.classList.remove('view-enter');
  });
}

async function boot() {
  try {
    await store.load();
  } catch (e) {
    console.error(e);
  }
  applyTheme(store.state.settings.theme);
  store.onSaveError = () => toast('Speichern im Gerätespeicher ist fehlgeschlagen. Bitte erstelle eine Sicherung.', { type: 'error', duration: 8000 });
  setRouterImpl({ rerender: () => renderRoute({ keepScroll: true }) });
  store.subscribe(() => renderRoute({ keepScroll: true }));
  window.addEventListener('hashchange', () => renderRoute());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') store.saveNow();
  });
  window.addEventListener('pagehide', () => store.saveNow());
  if (!location.hash) window.history.replaceState(null, '', '#/heute');
  bindChrome();
  renderRoute();
  document.documentElement.classList.add('app-ready');
  setInterval(updateLive, 1000);
  registerServiceWorker();
  if (store.state.profile.onboarded) store.requestPersistence();
}

boot();
