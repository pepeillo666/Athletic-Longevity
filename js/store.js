// Datenhaltung: IndexedDB als Hauptspeicher, localStorage als Spiegel. Keine Übertragung an Server.
import { todayISO, uid, isISODate, debounce } from './util.js';
import { normalizeAnchors } from './plan.js';
import { EXERCISES } from './exercises.js';

export const SCHEMA = 1;
const DB_NAME = 'athletic-longevity';
const DB_VERSION = 2;
const DB_STORE = 'kv';
const PHOTO_STORE = 'photos';
const DB_KEY = 'state';

/** Geräte, zu denen ein Foto gehören kann (Varianten wie „Brustpresse leicht“ teilen sich das Gerät). */
export const MACHINE_KEYS = Object.keys(EXERCISES).filter((id) => !EXERCISES[id].baseId);
export const machineKey = (exId) => (EXERCISES[exId] && EXERCISES[exId].baseId) || exId;
const LS_KEY = 'al-state-mirror-v1';
export const THEME_KEY = 'al-theme';

export function defaultState(today = todayISO()) {
  return {
    schema: SCHEMA,
    createdAt: new Date().toISOString(),
    profile: {
      name: '', age: null, heightCm: null, goal: '',
      onboarded: false, safetyAck: false,
      clearance: false, clearanceDate: '', clearanceBy: '',
      maxRpeDoctor: null, hrLimit: null, doctorNotes: '', medications: '',
      emergencyName: '', emergencyPhone: '',
    },
    plan: { anchors: [{ date: today, week: 1 }], includeBiceps: true, bicepsFromWeek: 5 },
    settings: { theme: 'dark', restSec: null, sound: true, keepAwake: true },
    sessions: [],
    bodyWeights: [],
    photos: {},
    machineNotes: {},
    draft: null,
    meta: { lastBackupAt: null, savedAt: null, dismissed: {} },
  };
}

/* ---------- Bereinigung (auch für importierte Sicherungen) ---------- */

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x, max = 4000) => (typeof x === 'string' ? x.slice(0, max) : '');
function num(x, min, max) {
  if (x === null || x === undefined || x === '') return null;
  const n = Number(x);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 100) / 100;
}
function int(x, min, max) {
  const n = num(x, min, max);
  return n == null ? null : Math.round(n);
}

function cleanSet(st) {
  if (!isObj(st)) return null;
  return {
    weight: num(st.weight, 0, 1000),
    reps: int(st.reps, 0, 500),
    rpe: int(st.rpe, 1, 10),
    done: !!st.done,
    optional: !!st.optional,
  };
}

function cleanExercise(e) {
  if (!isObj(e) || typeof e.id !== 'string' || !EXERCISES[e.id]) return null;
  return {
    id: e.id,
    done: !!e.done,
    skipped: !!e.skipped,
    optional: !!e.optional,
    notes: str(e.notes),
    sets: Array.isArray(e.sets) ? e.sets.map(cleanSet).filter(Boolean).slice(0, 12) : [],
  };
}

export function cleanSession(x, isDraft = false) {
  if (!isObj(x) || !isISODate(x.date) || !['A', 'B'].includes(x.type)) return null;
  const now = new Date().toISOString();
  return {
    id: str(x.id, 64) || uid(),
    type: x.type,
    planWeek: int(x.planWeek, 1, 99) ?? 1,
    date: x.date,
    startTime: typeof x.startTime === 'string' && /^\d{2}:\d{2}$/.test(x.startTime) ? x.startTime : '00:00',
    startedAt: str(x.startedAt, 40) || null,
    endedAt: str(x.endedAt, 40) || null,
    durationMin: num(x.durationMin, 0, 1440),
    status: isDraft ? 'draft' : ['completed', 'aborted'].includes(x.status) ? x.status : 'completed',
    wellbeingBefore: int(x.wellbeingBefore, 1, 5),
    wellbeingAfter: int(x.wellbeingAfter, 1, 5),
    warmupDone: !!x.warmupDone,
    cooldownDone: !!x.cooldownDone,
    cardioMin: num(x.cardioMin, 0, 600),
    symptoms: !!x.symptoms,
    precheck: !!x.precheck,
    abortReason: str(x.abortReason, 200),
    notes: str(x.notes),
    exercises: Array.isArray(x.exercises) ? x.exercises.map(cleanExercise).filter(Boolean) : [],
    createdAt: str(x.createdAt, 40) || now,
    updatedAt: str(x.updatedAt, 40) || now,
  };
}

function cleanWeight(w) {
  if (!isObj(w) || !isISODate(w.date)) return null;
  const kg = num(w.kg, 20, 400);
  if (kg == null) return null;
  return { id: str(w.id, 64) || uid(), date: w.date, kg };
}

export function migrate(raw) {
  const base = defaultState();
  if (!isObj(raw)) return base;
  const s = base;
  s.createdAt = str(raw.createdAt, 40) || base.createdAt;
  const p = isObj(raw.profile) ? raw.profile : {};
  s.profile = {
    ...base.profile,
    name: str(p.name, 80),
    age: int(p.age, 1, 120),
    heightCm: int(p.heightCm, 50, 250),
    goal: str(p.goal, 500),
    onboarded: !!p.onboarded,
    safetyAck: !!p.safetyAck,
    clearance: !!p.clearance,
    clearanceDate: isISODate(p.clearanceDate) ? p.clearanceDate : '',
    clearanceBy: str(p.clearanceBy, 120),
    maxRpeDoctor: int(p.maxRpeDoctor, 1, 10),
    hrLimit: int(p.hrLimit, 40, 220),
    doctorNotes: str(p.doctorNotes, 2000),
    medications: str(p.medications, 2000),
    emergencyName: str(p.emergencyName, 80),
    emergencyPhone: str(p.emergencyPhone, 40),
  };
  const pl = isObj(raw.plan) ? raw.plan : {};
  const anchors = normalizeAnchors(pl.anchors);
  s.plan = {
    anchors: anchors.length ? anchors : base.plan.anchors,
    includeBiceps: pl.includeBiceps !== false,
    bicepsFromWeek: int(pl.bicepsFromWeek, 1, 12) ?? 5,
  };
  const st = isObj(raw.settings) ? raw.settings : {};
  s.settings = {
    theme: ['dark', 'light', 'system'].includes(st.theme) ? st.theme : 'dark',
    restSec: int(st.restSec, 15, 600),
    sound: st.sound !== false,
    keepAwake: st.keepAwake !== false,
  };
  s.sessions = Array.isArray(raw.sessions) ? raw.sessions.map((x) => cleanSession(x)).filter(Boolean) : [];
  // doppelte IDs vermeiden
  const seen = new Set();
  s.sessions = s.sessions.filter((x) => (seen.has(x.id) ? false : seen.add(x.id)));
  s.bodyWeights = Array.isArray(raw.bodyWeights) ? raw.bodyWeights.map(cleanWeight).filter(Boolean) : [];
  s.draft = raw.draft ? cleanSession(raw.draft, true) : null;
  s.photos = {};
  if (isObj(raw.photos)) {
    for (const [k, v] of Object.entries(raw.photos)) if (MACHINE_KEYS.includes(k) && typeof v === 'string') s.photos[k] = v.slice(0, 40);
  }
  s.machineNotes = {};
  if (isObj(raw.machineNotes)) {
    for (const [k, v] of Object.entries(raw.machineNotes)) if (MACHINE_KEYS.includes(k) && typeof v === 'string' && v.trim()) s.machineNotes[k] = v.slice(0, 300);
  }
  const m = isObj(raw.meta) ? raw.meta : {};
  s.meta = {
    lastBackupAt: str(m.lastBackupAt, 40) || null,
    savedAt: str(m.savedAt, 40) || null,
    dismissed: isObj(m.dismissed) ? { ...m.dismissed } : {},
  };
  return s;
}

/* ---------- IndexedDB ---------- */

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(new Error('IndexedDB nicht verfügbar')); return; }
    let req;
    try { req = indexedDB.open(DB_NAME, DB_VERSION); } catch (e) { reject(e); return; }
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      if (!req.result.objectStoreNames.contains(PHOTO_STORE)) req.result.createObjectStore(PHOTO_STORE);
    };
    req.onsuccess = () => {
      const db = req.result;
      // Bei einem späteren Datenbank-Update andere offene Fenster nicht blockieren
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error || new Error('IndexedDB-Fehler'));
    req.onblocked = () => reject(new Error('IndexedDB blockiert'));
  });
}

function idbGet(db, key, storeName = DB_STORE) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db, key, value, storeName = DB_STORE) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaktion abgebrochen'));
  });
}

function idbDelete(db, key, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    if (key === null) tx.objectStore(storeName).clear();
    else tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Transaktion abgebrochen'));
  });
}

function idbAll(db, storeName) {
  return new Promise((resolve, reject) => {
    const out = new Map();
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).openCursor();
    req.onsuccess = () => {
      const cur = req.result;
      if (cur) { out.set(cur.key, cur.value); cur.continue(); } else resolve(out);
    };
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Fotos: als ArrayBuffer + Typ gespeichert (robust in Safari) ---------- */

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export function dataURLToBlob(dataURL) {
  const m = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataURL || '');
  if (!m || !m[2]) return null;
  const bin = atob(m[3]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: m[1] || 'image/jpeg' });
}

function withTimeout(promise, ms) {
  return Promise.race([promise, new Promise((_, rej) => setTimeout(() => rej(new Error('Zeitüberschreitung')), ms))]);
}

/* ---------- Store ---------- */

class Store {
  constructor() {
    this.state = defaultState();
    this.listeners = new Set();
    this.db = null;
    this.backend = 'memory';
    this.persisted = null;
    this.isFresh = true;
    this.saveFailed = false;
    this.onSaveError = null;
    this.saveSoon = debounce(() => this.save(), 250);
    this.photoData = new Map(); // Gerät → Data-URL, für Sicherungen ohne Wartezeit
  }

  get photosSupported() {
    return !!this.db;
  }

  async getPhoto(key) {
    if (!this.db) return null;
    const rec = await idbGet(this.db, key, PHOTO_STORE);
    if (!rec || !rec.data) return null;
    return new Blob([rec.data], { type: rec.type || 'image/jpeg' });
  }

  async putPhoto(key, blob) {
    if (!this.db) throw new Error('Fotos werden in diesem Browser nicht unterstützt.');
    const data = blob.arrayBuffer ? await blob.arrayBuffer() : await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(blob);
    });
    await idbPut(this.db, key, { type: blob.type || 'image/jpeg', data }, PHOTO_STORE);
    this.photoData.set(key, await blobToDataURL(blob));
  }

  async deletePhoto(key) {
    if (this.db) await idbDelete(this.db, key, PHOTO_STORE);
    this.photoData.delete(key);
  }

  async clearPhotos() {
    if (this.db) await idbDelete(this.db, null, PHOTO_STORE);
    this.photoData.clear();
  }

  /** Alle Fotos als Data-URLs vorhalten (für Sicherungen). */
  async loadPhotoData() {
    if (!this.db) return;
    try {
      const all = await idbAll(this.db, PHOTO_STORE);
      this.photoData.clear();
      for (const [key, rec] of all) {
        if (rec && rec.data) this.photoData.set(key, await blobToDataURL(new Blob([rec.data], { type: rec.type || 'image/jpeg' })));
      }
    } catch { /* Fotos sind optional */ }
  }

  async load() {
    let fromIdb = null;
    let fromLs = null;
    try {
      this.db = await withTimeout(openDB(), 4000);
      fromIdb = await withTimeout(idbGet(this.db, DB_KEY), 4000);
      this.backend = 'indexeddb';
    } catch {
      this.db = null;
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) fromLs = JSON.parse(raw);
      if (!this.db) this.backend = 'localstorage';
    } catch { /* localStorage gesperrt */ }
    let chosen = fromIdb;
    const savedAt = (x) => (x && x.meta && x.meta.savedAt) || '';
    if (fromLs && (!chosen || savedAt(fromLs) > savedAt(chosen))) chosen = fromLs;
    this.isFresh = !chosen;
    this.state = migrate(chosen);
    try { localStorage.setItem(THEME_KEY, this.state.settings.theme); } catch { /* egal */ }
    return this.state;
  }

  /** Zustand ändern. render:false für Eingaben, die kein Neuzeichnen brauchen. */
  update(mutator, { render = true, now = false } = {}) {
    mutator(this.state);
    if (now) this.saveNow();
    else this.saveSoon();
    if (render) this.emit();
  }

  saveNow() {
    this.saveSoon.flush();
    return this.save();
  }

  async save() {
    this.state.meta.savedAt = new Date().toISOString();
    let ok = false;
    if (this.db) {
      try { await idbPut(this.db, DB_KEY, this.state); ok = true; } catch { /* Spiegel versuchen */ }
    }
    try { localStorage.setItem(LS_KEY, JSON.stringify(this.state)); ok = true; } catch { /* voll oder gesperrt */ }
    try { localStorage.setItem(THEME_KEY, this.state.settings.theme); } catch { /* egal */ }
    if (!ok && !this.saveFailed) {
      this.saveFailed = true;
      if (this.onSaveError) this.onSaveError();
    }
    if (ok) this.saveFailed = false;
    return ok;
  }

  replace(next) {
    this.state = migrate(next);
    this.saveNow();
    this.emit();
  }

  reset() {
    const theme = this.state.settings.theme;
    this.state = defaultState();
    this.state.settings.theme = theme;
    this.clearPhotos().catch(() => {});
    this.saveNow();
    this.emit();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const fn of this.listeners) fn(this.state);
  }

  async requestPersistence() {
    try {
      if (navigator.storage && navigator.storage.persist) {
        this.persisted = navigator.storage.persisted ? await navigator.storage.persisted() : false;
        if (!this.persisted) this.persisted = await navigator.storage.persist();
      }
    } catch { /* nicht unterstützt */ }
    return this.persisted;
  }
}

export const store = new Store();
