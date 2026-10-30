// Service Worker registrieren, Updates anbieten.
import { toast } from './ui.js';
import { store } from './store.js';

export const pwa = { registration: null, controlled: false, updateReady: false };

let acceptedUpdate = false;
let reloading = false;

function offerUpdate(worker) {
  pwa.updateReady = true;
  toast('Eine neue Version ist bereit.', {
    actionLabel: 'Aktualisieren',
    duration: 0,
    onAction: () => {
      acceptedUpdate = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    },
  });
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });
    pwa.registration = reg;
    pwa.controlled = !!navigator.serviceWorker.controller;
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state !== 'installed') return;
        if (navigator.serviceWorker.controller) offerUpdate(w);
        else if (!document.body.classList.contains('bare')) toast('Die App ist jetzt auch offline nutzbar.');
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      pwa.controlled = true;
      if (!acceptedUpdate || reloading) return;
      reloading = true;
      Promise.resolve(store.saveNow()).finally(() => location.reload());
    });
    let lastCheck = Date.now();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > 30 * 60 * 1000) {
        lastCheck = Date.now();
        reg.update().catch(() => {});
      }
    });
  } catch {
    /* z. B. ohne HTTPS – App funktioniert trotzdem online */
  }
}

export async function checkForUpdate() {
  if (!pwa.registration) return 'unsupported';
  try {
    await pwa.registration.update();
  } catch {
    return 'offline';
  }
  if (pwa.registration.waiting || pwa.registration.installing) return 'update';
  return 'current';
}

export function offlineReady() {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
}
