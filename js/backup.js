// Datensicherung: Export als JSON und CSV, Import aus einer Sicherung.
import { todayISO, formatDate } from './util.js';
import { migrate, cleanSession, MACHINE_KEYS } from './store.js';
import { exerciseName } from './exercises.js';
import { sortSessionsDesc } from './plan.js';

export const APP_ID = 'athletic-longevity';
export const BACKUP_FORMAT = 1;

/** photos: Map Gerät → Data-URL (optional) */
export function buildBackup(state, appVersion, photos = null) {
  const out = {
    app: APP_ID,
    format: BACKUP_FORMAT,
    appVersion,
    exportedAt: new Date().toISOString(),
    data: {
      schema: state.schema,
      createdAt: state.createdAt,
      profile: state.profile,
      plan: state.plan,
      settings: state.settings,
      sessions: state.sessions,
      bodyWeights: state.bodyWeights,
      machineNotes: state.machineNotes,
    },
  };
  if (photos && photos.size) out.photos = Object.fromEntries(photos);
  return out;
}

export function backupFile(state, appVersion, photos = null) {
  const json = JSON.stringify(buildBackup(state, appVersion, photos), null, 2);
  return new File([json], `athletic-longevity-sicherung-${todayISO()}.json`, { type: 'application/json' });
}

/* ---------- CSV (Semikolon + Dezimalkomma für deutsches Excel/Numbers) ---------- */

function csvCell(v) {
  if (v === null || v === undefined) return '';
  let s;
  if (typeof v === 'number') s = String(v).replace('.', ',');
  else {
    s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // keine Formeln einschleusen
  }
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

const STATUS_DE = { completed: 'abgeschlossen', aborted: 'abgebrochen' };

export function sessionsCsv(state) {
  const header = [
    'Datum', 'Startzeit', 'Training', 'Planwoche', 'Status', 'Dauer (Min.)',
    'Wohlbefinden vorher (1-5)', 'Wohlbefinden nachher (1-5)', 'Übung', 'Satz',
    'Gewicht (kg)', 'Wiederholungen', 'RPE', 'Satz erledigt', 'Übung übersprungen',
    'Notiz Übung', 'Ausdauer (Min.)', 'Beschwerden', 'Notiz Einheit',
  ];
  const rows = [header];
  const sessions = sortSessionsDesc(state.sessions).reverse();
  for (const s of sessions) {
    const base = [
      formatDate(s.date, 'numeric'), s.startTime, s.type, s.planWeek, STATUS_DE[s.status] || s.status,
      s.durationMin, s.wellbeingBefore, s.wellbeingAfter,
    ];
    const tail = [s.cardioMin, s.symptoms ? 'ja' : 'nein', s.notes];
    let wrote = false;
    for (const ex of s.exercises) {
      const sets = ex.sets.length ? ex.sets : [null];
      sets.forEach((st, i) => {
        rows.push([
          ...base, exerciseName(ex.id), st ? i + 1 : '',
          st ? st.weight : null, st ? st.reps : null, st ? st.rpe : null,
          st ? (st.done ? 'ja' : 'nein') : '', ex.skipped ? 'ja' : 'nein', ex.notes, ...tail,
        ]);
        wrote = true;
      });
    }
    if (!wrote) rows.push([...base, '', '', null, null, null, '', '', '', ...tail]);
  }
  return rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
}

export function sessionsCsvFile(state) {
  return new File(['﻿' + sessionsCsv(state)], `athletic-longevity-protokoll-${todayISO()}.csv`, { type: 'text/csv;charset=utf-8' });
}

export function bodyWeightCsvFile(state) {
  const rows = [['Datum', 'Körpergewicht (kg)']];
  for (const w of [...state.bodyWeights].sort((a, b) => (a.date < b.date ? -1 : 1))) rows.push([formatDate(w.date, 'numeric'), w.kg]);
  const csv = rows.map((r) => r.map(csvCell).join(';')).join('\r\n');
  return new File(['﻿' + csv], `athletic-longevity-koerpergewicht-${todayISO()}.csv`, { type: 'text/csv;charset=utf-8' });
}

/* ---------- Teilen oder herunterladen ---------- */

export function downloadFile(file) {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 4000);
}

/**
 * Auf dem iPhone öffnet sich das Teilen-Menü („In Dateien sichern“, AirDrop, Mail …).
 * Ohne Teilen-Unterstützung wird die Datei heruntergeladen.
 * Ergebnis: 'shared' | 'downloaded' | 'cancelled'
 */
export async function shareOrDownload(file, { preferDownload = false } = {}) {
  if (!preferDownload && navigator.canShare) {
    let can = false;
    try { can = navigator.canShare({ files: [file] }); } catch { can = false; }
    if (can) {
      try {
        await navigator.share({ files: [file], title: file.name });
        return 'shared';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelled';
        // sonst: herunterladen
      }
    }
  }
  downloadFile(file);
  return 'downloaded';
}

/* ---------- Import ---------- */

export function parseBackup(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Die Datei ist keine gültige Sicherung (kein lesbares JSON).' };
  }
  const data = obj && obj.app === APP_ID && obj.data ? obj.data : obj && obj.sessions && obj.plan ? obj : null;
  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Diese Datei stammt nicht aus Athletic Longevity.' };
  }
  if (obj.format && obj.format > BACKUP_FORMAT) {
    return { ok: false, error: 'Diese Sicherung stammt aus einer neueren App-Version. Bitte aktualisiere die App zuerst.' };
  }
  const state = migrate({ ...data, photos: {}, draft: null });
  const photos = {};
  if (obj.photos && typeof obj.photos === 'object' && !Array.isArray(obj.photos)) {
    for (const [k, v] of Object.entries(obj.photos)) {
      if (MACHINE_KEYS.includes(k) && typeof v === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(v) && v.length < 8000000) photos[k] = v;
    }
  }
  const sessions = state.sessions.length;
  const dates = state.sessions.map((s) => s.date).sort();
  return {
    ok: true,
    state,
    photos,
    summary: {
      exportedAt: obj.exportedAt || null,
      sessions,
      bodyWeights: state.bodyWeights.length,
      photos: Object.keys(photos).length,
      first: dates[0] || null,
      last: dates[dates.length - 1] || null,
    },
  };
}

/** Zusammenführen: vorhandene Daten bleiben, neue Einheiten/Einträge kommen hinzu. */
export function mergeStates(current, incoming) {
  const merged = migrate(JSON.parse(JSON.stringify(current)));
  const byId = new Map(merged.sessions.map((s) => [s.id, s]));
  let added = 0;
  let updated = 0;
  for (const s of incoming.sessions) {
    const clean = cleanSession(s);
    if (!clean) continue;
    const existing = byId.get(clean.id);
    if (!existing) { byId.set(clean.id, clean); added++; }
    else if ((clean.updatedAt || '') > (existing.updatedAt || '')) { byId.set(clean.id, clean); updated++; }
  }
  merged.sessions = [...byId.values()];
  const weights = new Map(merged.bodyWeights.map((w) => [w.id, w]));
  const dates = new Set(merged.bodyWeights.map((w) => w.date));
  for (const w of incoming.bodyWeights) {
    if (!weights.has(w.id) && !dates.has(w.date)) { weights.set(w.id, w); dates.add(w.date); }
  }
  merged.bodyWeights = [...weights.values()];
  for (const [k, v] of Object.entries(incoming.machineNotes || {})) if (!merged.machineNotes[k]) merged.machineNotes[k] = v;
  return { state: merged, added, updated };
}
