/* Athletic Longevity – Service Worker
 * Speichert alle App-Dateien beim ersten Laden, damit die App danach offline funktioniert.
 * Bei jeder Veröffentlichung CACHE_VERSION erhöhen (und APP_VERSION in js/version.js).
 * Alle Pfade sind relativ – funktioniert unter https://pepeillo666.github.io/athletic-longevity/
 */
const CACHE_VERSION = 'al-v1.2.0';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/backup.js',
  './js/charts.js',
  './js/content.js',
  './js/exercises.js',
  './js/illustrations.js',
  './js/photos.js',
  './js/plan.js',
  './js/pwa.js',
  './js/router.js',
  './js/store.js',
  './js/theme.js',
  './js/ui.js',
  './js/util.js',
  './js/version.js',
  './js/views/common.js',
  './js/views/dashboard.js',
  './js/views/dialogs.js',
  './js/views/history.js',
  './js/views/onboarding.js',
  './js/views/picker.js',
  './js/views/plan.js',
  './js/views/progress.js',
  './js/views/safety.js',
  './js/views/settings.js',
  './js/views/training.js',
  './icons/icon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
];

// Safari mag keine umgeleiteten Antworten aus dem Cache – deshalb „saubere“ Kopie speichern.
async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_VERSION);
    await Promise.all(ASSETS.map(async (url) => {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (!res.ok) throw new Error(`Konnte ${url} nicht laden (${res.status})`);
      await cache.put(url, await cleanResponse(res));
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('al-') && k !== CACHE_VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // App-Hülle aus dem Cache – funktioniert auch ohne Netz.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = (await cache.match('./index.html')) || (await cache.match('./'));
      if (cached) return cached;
      try {
        return await fetch(req);
      } catch {
        return new Response('<!doctype html><meta charset="utf-8"><title>Offline</title><p style="font-family:system-ui;padding:24px">Athletic Longevity ist gerade offline und noch nicht vollständig gespeichert. Bitte einmal mit Internetverbindung öffnen.</p>', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});
