// Eigene Gerätefotos: aufnehmen oder auswählen, verkleinern, lokal speichern und anzeigen.
// Die Fotos verlassen das Gerät nie (außer in deiner eigenen Sicherung).
import { store, machineKey } from './store.js';
import { exerciseDef } from './exercises.js';
import { esc } from './util.js';
import { icon, toast, openSheet, confirmDialog } from './ui.js';

const urlCache = new Map(); // Gerät → { url, stamp }

export { machineKey };

export function hasPhoto(exId) {
  return !!store.state.photos[machineKey(exId)];
}

export function machineNote(exId) {
  return store.state.machineNotes[machineKey(exId)] || '';
}

async function photoURL(key) {
  const stamp = store.state.photos[key];
  if (!stamp) return null;
  const cached = urlCache.get(key);
  if (cached && cached.stamp === stamp) return cached.url;
  if (cached) URL.revokeObjectURL(cached.url);
  const blob = await store.getPhoto(key);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, { url, stamp });
  return url;
}

/** Alle <img data-photo="…"> in einem Bereich mit den gespeicherten Fotos füllen. */
export function hydratePhotos(root) {
  if (!root) return;
  root.querySelectorAll('img[data-photo]').forEach(async (img) => {
    try {
      const url = await photoURL(img.dataset.photo);
      if (url && img.isConnected) {
        img.src = url;
        const holder = img.closest('.photo, .ex-thumb, .ex-visual');
        if (holder) holder.classList.add('has-photo-loaded');
      }
    } catch { /* Foto nicht lesbar – Platzhalter bleibt */ }
  });
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Bild konnte nicht gelesen werden')); };
    img.src = url;
  });
}

/** Foto auf höchstens 1400 px verkleinern und als JPEG speichern (spart Platz). */
export async function processImage(file, maxSide = 1400, quality = 0.82) {
  const { img, url } = await loadImage(file);
  try {
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    if (!w0 || !h0) throw new Error('Leeres Bild');
    const scale = Math.min(1, maxSide / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Bild konnte nicht gespeichert werden'))), 'image/jpeg', quality);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function savePhoto(exId, file) {
  const key = machineKey(exId);
  const blob = await processImage(file);
  await store.putPhoto(key, blob);
  store.update((s) => { s.photos[key] = new Date().toISOString(); }, { now: true });
}

export async function removePhoto(exId) {
  const key = machineKey(exId);
  await store.deletePhoto(key);
  const cached = urlCache.get(key);
  if (cached) { URL.revokeObjectURL(cached.url); urlCache.delete(key); }
  store.update((s) => { delete s.photos[key]; }, { now: true });
}

/** Kamera oder Fotomediathek öffnen (iOS zeigt beides zur Auswahl). */
export function pickPhoto(exId) {
  if (!store.photosSupported) {
    toast('Fotos werden in diesem Browser nicht unterstützt.', { type: 'error' });
    return;
  }
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    input.remove();
    if (!file) return;
    try {
      await savePhoto(exId, file);
      toast('Foto gespeichert');
    } catch (e) {
      toast(`Foto konnte nicht gespeichert werden${e && e.message ? `: ${e.message}` : ''}.`, { type: 'error', duration: 6000 });
    }
  });
  input.click();
}

export function openPhotoViewer(exId) {
  const key = machineKey(exId);
  const def = exerciseDef(key);
  const name = def ? def.name : '';
  openSheet({
    title: name || 'Foto',
    className: 'sheet-photo',
    body: `<div class="photo-full"><img data-photo="${esc(key)}" alt="Dein Foto vom Gerät ${esc(name)}"></div>`,
    onMount: (sheet) => hydratePhotos(sheet),
  });
}

/** Foto-Bereich mit dauerhafter Geräteeinstellung. */
export function machineBlockHTML(exId, { compact = false } = {}) {
  const key = machineKey(exId);
  const def = exerciseDef(key);
  const name = def ? def.name : '';
  const note = store.state.machineNotes[key] || '';
  const photo = store.state.photos[key]
    ? `<figure class="photo">
        <button type="button" class="photo-btn" data-photo-view="${esc(exId)}" aria-label="Foto von ${esc(name)} vergrößern">
          <img data-photo="${esc(key)}" alt="Dein Foto vom Gerät ${esc(name)}">
        </button>
        <figcaption class="photo-actions">
          <button type="button" class="btn btn-sm btn-secondary" data-photo-add="${esc(exId)}">${icon('camera')}Neues Foto</button>
          <button type="button" class="btn btn-sm btn-quiet text-danger" data-photo-del="${esc(exId)}">${icon('trash')}Löschen</button>
        </figcaption>
      </figure>`
    : `<button type="button" class="photo-empty" data-photo-add="${esc(exId)}">
        <span class="photo-empty-icon">${icon('camera')}</span>
        <span class="photo-empty-text"><strong>Foto von deinem Gerät hinzufügen</strong>
        <span>So erkennst du das Gerät in deinem Studio sofort wieder. Das Foto bleibt auf diesem iPhone.</span></span>
      </button>`;
  return `<section class="machine${compact ? ' machine-compact' : ''}" data-machine="${esc(key)}">
    ${photo}
    <label class="field"><span class="field-label">Meine Einstellung am Gerät</span>
      <input class="input" data-machine-note="${esc(key)}" value="${esc(note)}" maxlength="300" autocomplete="off" placeholder="z. B. Sitz 4, Rückenlehne 2"></label>
    ${store.state.photos[key] ? '' : '<p class="field-hint">Bitte keine anderen Personen mitfotografieren – manche Studios erlauben Fotos nur eingeschränkt.</p>'}
  </section>`;
}

/** Ereignisse für Foto-Bereiche in einem Container. Gibt eine Aufräumfunktion zurück. */
export function bindMachineBlocks(root) {
  const onClick = async (e) => {
    const add = e.target.closest('[data-photo-add]');
    if (add) { pickPhoto(add.dataset.photoAdd); return; }
    const view = e.target.closest('[data-photo-view]');
    if (view) { openPhotoViewer(view.dataset.photoView); return; }
    const del = e.target.closest('[data-photo-del]');
    if (del) {
      const ok = await confirmDialog({ title: 'Foto löschen?', message: 'Das Foto wird von diesem Gerät entfernt.', confirmLabel: 'Löschen', danger: true });
      if (ok) {
        await removePhoto(del.dataset.photoDel);
        toast('Foto gelöscht');
      }
    }
  };
  const onInput = (e) => {
    const t = e.target;
    if (t.dataset.machineNote === undefined) return;
    const key = t.dataset.machineNote;
    const value = t.value.slice(0, 300);
    store.update((s) => {
      if (value.trim()) s.machineNotes[key] = value;
      else delete s.machineNotes[key];
    }, { render: false });
  };
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  hydratePhotos(root);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onInput);
  };
}

/** Vorschaubild: eigenes Foto, sonst die Zeichnung. */
export function thumbHTML(exId, drawing) {
  const key = machineKey(exId);
  if (store.state.photos[key]) {
    return `<span class="ex-thumb has-photo"><img data-photo="${esc(key)}" alt=""></span>`;
  }
  return `<span class="ex-thumb">${drawing}</span>`;
}
