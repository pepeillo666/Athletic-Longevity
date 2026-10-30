// Gemeinsam genutzte Dialoge und Aktionen.
import { store, dataURLToBlob } from '../store.js';
import { esc, todayISO, formatDate, daysBetween } from '../util.js';
import { icon, openSheet, toast } from '../ui.js';
import { exerciseDef, GENERAL_CUES } from '../exercises.js';
import { illustration } from '../illustrations.js';
import {
  WARNING_SIGNS, EMERGENCY_STEPS, ABORT_REASONS, RPE_SCALE, RPE_EXPLAINER, TALK_TEST, HEART_RATE_NOTE,
} from '../content.js';
import { backupFile, sessionsCsvFile, shareOrDownload, parseBackup, mergeStates } from '../backup.js';
import { APP_VERSION } from '../version.js';
import { rerender } from '../router.js';
import { machineBlockHTML, bindMachineBlocks, hydratePhotos } from '../photos.js';

/* ---------- Warnzeichen ---------- */

export function warningSheetBody({ inSession = false } = {}) {
  const p = store.state.profile;
  const contact = p.emergencyPhone
    ? `<a class="btn btn-secondary" href="tel:${esc(p.emergencyPhone.replace(/[^\d+]/g, ''))}">${icon('phone')}${esc(p.emergencyName || 'Notfallkontakt')} anrufen</a>`
    : '';
  return `
    <p class="sheet-text strong">Sofort aufhören bei:</p>
    <ul class="warn-list">${WARNING_SIGNS.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
    <p class="sheet-text strong">Dann:</p>
    <ol class="steps-list">${EMERGENCY_STEPS.map((w) => `<li>${esc(w)}</li>`).join('')}</ol>
    <div class="btn-stack">
      <a class="btn btn-emergency" href="tel:112">${icon('phone')}Notruf 112 anrufen</a>
      ${contact}
      ${inSession ? `
        <label class="field"><span class="field-label">Grund für den Abbruch</span>
          <select class="input" data-abort-reason>${ABORT_REASONS.map((r) => `<option>${esc(r)}</option>`).join('')}</select>
        </label>
        <button type="button" class="btn btn-danger" data-abort>${icon('stop')}Training beenden und speichern</button>
        <button type="button" class="btn btn-secondary" data-sheet-close>Zurück zum Training – ich hatte keines dieser Warnzeichen</button>` : ''}
    </div>`;
}

/** Ergebnis: null (geschlossen) oder { abort: true, reason } */
export function openWarningSheet({ inSession = false } = {}) {
  const { promise } = openSheet({
    title: 'Warnzeichen',
    className: 'sheet-warning',
    body: warningSheetBody({ inSession }),
    onMount(sheet, close) {
      const btn = sheet.querySelector('[data-abort]');
      if (btn) {
        btn.addEventListener('click', () => {
          close({ abort: true, reason: sheet.querySelector('[data-abort-reason]').value });
        });
      }
    },
  });
  return promise;
}

/* ---------- Ärztliche Freigabe ---------- */

export function openClearanceSheet() {
  const p = store.state.profile;
  return openSheet({
    title: 'Ärztliche Freigabe',
    body: `
      <p class="sheet-text">Bestätige nur, wenn deine Kardiologin oder dein Kardiologe bzw. deine betreuende Ärztin oder dein betreuender Arzt dieses Krafttraining individuell freigegeben hat.</p>
      <label class="check-row"><input type="checkbox" data-c="clearance" ${p.clearance ? 'checked' : ''}><span>Eine individuelle ärztliche Trainingsfreigabe liegt vor.</span></label>
      <label class="field"><span class="field-label">Datum der Freigabe (optional)</span><input class="input" type="date" data-c="clearanceDate" value="${esc(p.clearanceDate)}"></label>
      <label class="field"><span class="field-label">Freigabe durch (optional)</span><input class="input" data-c="clearanceBy" value="${esc(p.clearanceBy)}" placeholder="z. B. Praxis Dr. Muster" autocomplete="off"></label>
      <p class="sheet-hint">Ärztlich festgelegte Grenzen (z. B. eine maximale Belastungsstufe) trägst du unter Einstellungen ein. Alle Angaben bleiben auf diesem Gerät.</p>
      <div class="btn-stack"><button type="button" class="btn btn-primary" data-save>Speichern</button></div>`,
    onMount(sheet, close) {
      sheet.querySelector('[data-save]').addEventListener('click', () => {
        const get = (k) => sheet.querySelector(`[data-c="${k}"]`);
        store.update((s) => {
          s.profile.clearance = get('clearance').checked;
          s.profile.clearanceDate = get('clearanceDate').value || '';
          s.profile.clearanceBy = get('clearanceBy').value.trim();
        }, { now: true });
        close(true);
        toast(store.state.profile.clearance ? 'Freigabe gespeichert' : 'Gespeichert');
      });
    },
  }).promise;
}

/* ---------- Zum Home-Bildschirm ---------- */

export function isStandalone() {
  return window.navigator.standalone === true || (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function openInstallSheet() {
  return openSheet({
    title: 'Zum Home-Bildschirm',
    body: `
      <ol class="steps-list">
        <li>Diese Seite in <strong>Safari</strong> öffnen.</li>
        <li>Auf das Teilen-Symbol ${icon('share', 'inline-icon')} tippen – bei neueren iOS-Versionen zuerst auf „…“.</li>
        <li><strong>„Zum Home-Bildschirm“</strong> wählen. Falls angezeigt, „Als Web-App öffnen“ eingeschaltet lassen.</li>
        <li>Auf <strong>„Hinzufügen“</strong> tippen und die App künftig über das neue Symbol starten.</li>
      </ol>
      <p class="sheet-hint">Wichtig: Safari und die Home-Bildschirm-App speichern ihre Daten getrennt. Hast du schon im Browser trainiert, erstelle hier eine Sicherung und stelle sie in der Home-Bildschirm-App wieder her.</p>
      <div class="btn-stack"><button type="button" class="btn btn-secondary" data-sheet-close>Verstanden</button></div>`,
  }).promise;
}

/* ---------- Belastungsskala ---------- */

export function openRpeSheet() {
  return openSheet({
    title: 'Belastung richtig einschätzen',
    body: `
      <p class="sheet-text">${esc(RPE_EXPLAINER)}</p>
      <ul class="rpe-table">${RPE_SCALE.map((r) => `<li class="${r.value >= 7 ? 'is-off' : ''}"><span class="rpe-num">${r.value}</span><span><strong>${esc(r.label)}</strong><small>${esc(r.hint)}</small></span></li>`).join('')}</ul>
      <p class="sheet-text strong">Sprechtest</p><p class="sheet-text">${esc(TALK_TEST)}</p>
      <p class="sheet-text strong">Herzfrequenz</p><p class="sheet-text">${esc(HEART_RATE_NOTE)}</p>`,
  }).promise;
}

/* ---------- Übungsanleitung ---------- */

export function exerciseDetailHTML(id, { compact = false, machine = true } = {}) {
  const ex = exerciseDef(id);
  if (!ex) return '';
  const list = (items) => items && items.length ? `<ul class="bullets">${items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  const machineHTML = machine ? `<div data-machine-slot="${esc(id)}">${machineBlockHTML(id, { compact })}</div>` : '';
  if (ex.custom) {
    // Eigene Übung: keine Schritt-für-Schritt-Anleitung, aber die allgemeinen Regeln
    return `
      ${machineHTML}
      ${ex.note ? `<p class="callout">${esc(ex.note)}</p>` : ''}
      <dl class="ex-facts"><div><dt>Körperbereich</dt><dd>${esc(ex.muscles || '–')}</dd></div><div><dt>Gewicht in</dt><dd>${esc(ex.weightLabel)}</dd></div></dl>
      <h3 class="sub-title">Ausführung</h3>
      <p class="body-text">Für eigene Übungen gibt es keine Schritt-für-Schritt-Anleitung. Lass dir die Ausführung beim ersten Mal vom Trainingspersonal zeigen und notiere oben deine Einstellung am Gerät.</p>
      <h3 class="sub-title">Atmung</h3><p class="body-text">${esc(ex.breathing)} Nie die Luft anhalten.</p>
      <h3 class="sub-title">Gilt für alle Übungen</h3>${list(GENERAL_CUES)}`;
  }
  return `
    ${machine ? `${machineHTML}<h3 class="sub-title">So geht die Übung</h3>` : ''}
    <div class="ex-figure">${illustration(id, `Illustration ${ex.name}`)}</div>
    <p class="ex-legend">Blasse Figur: Ausgangsposition. Kräftige Figur: Endposition. Der Pfeil zeigt die Bewegung.</p>
    ${ex.note ? `<p class="callout">${esc(ex.note)}</p>` : ''}
    <dl class="ex-facts"><div><dt>Muskeln</dt><dd>${esc(ex.muscles)}</dd></div><div><dt>Gerät</dt><dd>${esc(ex.equipment)}</dd></div></dl>
    <h3 class="sub-title">Einstellen</h3>${list(ex.setup)}
    <h3 class="sub-title">Ausführung</h3><ol class="steps-list">${ex.steps.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
    <h3 class="sub-title">Atmung</h3><p class="body-text">${esc(ex.breathing)} Nie die Luft anhalten.</p>
    <h3 class="sub-title">Darauf achten</h3>${list(ex.focus)}
    ${ex.safety && ex.safety.length ? `<h3 class="sub-title">Sicherheit</h3>${list(ex.safety)}` : ''}
    ${ex.alternative ? `<p class="callout">${esc(ex.alternative)}</p>` : ''}
    ${compact ? '' : `<h3 class="sub-title">Gilt für alle Übungen</h3>${list(GENERAL_CUES)}`}`;
}

export function openExerciseSheet(id) {
  const ex = exerciseDef(id);
  let off = null;
  let unsub = null;
  const { promise } = openSheet({
    title: ex ? ex.name : 'Übung',
    body: exerciseDetailHTML(id, { compact: true }),
    className: 'sheet-tall',
    onMount(sheet) {
      off = bindMachineBlocks(sheet);
      // Nach neuem oder gelöschtem Foto den Gerätebereich im Sheet aktualisieren
      unsub = store.subscribe(() => {
        const slot = sheet.querySelector('[data-machine-slot]');
        const focused = document.activeElement && slot && slot.contains(document.activeElement);
        if (slot && !focused) {
          slot.innerHTML = machineBlockHTML(id, { compact: true });
          hydratePhotos(slot);
        }
      });
    },
  });
  return promise.finally(() => { if (off) off(); if (unsub) unsub(); });
}

/* ---------- Sicherung ---------- */

export async function doBackup({ preferDownload = false } = {}) {
  const file = backupFile(store.state, APP_VERSION, store.photoData);
  let result;
  try {
    result = await shareOrDownload(file, { preferDownload });
  } catch {
    toast('Die Sicherung konnte nicht erstellt werden.', { type: 'error' });
    return false;
  }
  if (result === 'cancelled') return false;
  store.update((s) => { s.meta.lastBackupAt = new Date().toISOString(); }, { now: true });
  toast(result === 'shared' ? 'Sicherung erstellt' : 'Sicherung heruntergeladen');
  return true;
}

export async function doCsvExport({ preferDownload = false } = {}) {
  if (!store.state.sessions.length) {
    toast('Noch keine Einheiten zum Exportieren.');
    return;
  }
  try {
    const r = await shareOrDownload(sessionsCsvFile(store.state), { preferDownload });
    if (r !== 'cancelled') toast('Protokoll exportiert');
  } catch {
    toast('Export fehlgeschlagen.', { type: 'error' });
  }
}

export function backupAgeDays() {
  const last = store.state.meta.lastBackupAt;
  if (!last) return null;
  const d = new Date(last);
  if (Number.isNaN(d.getTime())) return null;
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return daysBetween(iso, todayISO());
}

export function lastBackupText() {
  const last = store.state.meta.lastBackupAt;
  if (!last) return 'Noch keine Sicherung erstellt';
  const age = backupAgeDays();
  const d = new Date(last);
  const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `Letzte Sicherung: ${formatDate(iso, 'numeric')}${age === 0 ? ' (heute)' : age === 1 ? ' (gestern)' : age != null ? ` (vor ${age} Tagen)` : ''}`;
}

/** Datei aus einer Sicherung einlesen und nachfragen, wie sie übernommen werden soll. */
export async function importFromFile(file) {
  let text;
  try {
    text = await file.text();
  } catch {
    toast('Die Datei konnte nicht gelesen werden.', { type: 'error' });
    return;
  }
  const parsed = parseBackup(text);
  if (!parsed.ok) {
    toast(parsed.error, { type: 'error', duration: 6000 });
    return;
  }
  const sm = parsed.summary;
  const hasData = store.state.sessions.length > 0 || store.state.bodyWeights.length > 0;
  const range = !sm.first ? 'keine Einheiten'
    : sm.first === sm.last ? formatDate(sm.first, 'numeric') : `${formatDate(sm.first, 'numeric')} bis ${formatDate(sm.last, 'numeric')}`;
  if (sm.partial) {
    importSessionsSheet(parsed, range);
    return;
  }
  openSheet({
    title: 'Sicherung wiederherstellen',
    body: `
      <dl class="kv">
        <div><dt>Erstellt</dt><dd>${sm.exportedAt ? esc(new Date(sm.exportedAt).toLocaleString('de-DE')) : 'unbekannt'}</dd></div>
        <div><dt>Einheiten</dt><dd>${sm.sessions}</dd></div>
        <div><dt>Zeitraum</dt><dd>${esc(range)}</dd></div>
        <div><dt>Körpergewicht</dt><dd>${sm.bodyWeights} Einträge</dd></div>
        <div><dt>Gerätefotos</dt><dd>${sm.photos}</dd></div>
        ${sm.customExercises ? `<div><dt>Eigene Übungen</dt><dd>${sm.customExercises}</dd></div>` : ''}
      </dl>
      ${hasData ? '<p class="sheet-text">Auf diesem Gerät sind bereits Daten vorhanden. „Ersetzen“ überschreibt alles mit der Sicherung, „Zusammenführen“ ergänzt nur fehlende Einheiten.</p>' : ''}
      <div class="btn-stack">
        <button type="button" class="btn btn-primary" data-imp="replace">${hasData ? 'Ersetzen' : 'Wiederherstellen'}</button>
        ${hasData ? '<button type="button" class="btn btn-secondary" data-imp="merge">Zusammenführen</button>' : ''}
        <button type="button" class="btn btn-quiet" data-sheet-close>Abbrechen</button>
      </div>`,
    onMount(sheet, close) {
      sheet.querySelectorAll('[data-imp]').forEach((b) => b.addEventListener('click', async () => {
        sheet.querySelectorAll('[data-imp]').forEach((x) => { x.disabled = true; });
        const replace = b.dataset.imp === 'replace';
        if (replace) {
          const next = parsed.state;
          next.draft = null;
          next.photos = {};
          next.meta.lastBackupAt = store.state.meta.lastBackupAt;
          next.profile.onboarded = true;
          store.replace(next);
        } else {
          const { state } = mergeStates(store.state, parsed.state);
          state.draft = store.state.draft;
          state.photos = { ...store.state.photos };
          store.replace(state);
        }
        const written = await restorePhotos(parsed.photos, replace);
        close(true);
        toast(replace
          ? `Wiederhergestellt: ${sm.sessions} Einheiten${written ? `, ${written} Fotos` : ''}`
          : `Zusammengeführt${written ? ` (+${written} Fotos)` : ''}`);
        rerender();
      }));
    },
  });
}

/**
 * Datei mit einzelnen Einheiten (z. B. ein nachgetragenes Training): wird nur hinzugefügt,
 * Profil, Plan und Einstellungen bleiben unverändert. Ersetzen ist hier bewusst nicht möglich.
 */
function importSessionsSheet(parsed, range) {
  const sm = parsed.summary;
  openSheet({
    title: 'Einheiten hinzufügen',
    body: `
      <dl class="kv">
        <div><dt>Einheiten</dt><dd>${sm.sessions}</dd></div>
        <div><dt>${sm.first && sm.first === sm.last ? 'Datum' : 'Zeitraum'}</dt><dd>${esc(range)}</dd></div>
        ${sm.customExercises ? `<div><dt>Eigene Übungen</dt><dd>${sm.customExercises}</dd></div>` : ''}
      </dl>
      ${sm.note ? `<p class="sheet-text">${esc(sm.note)}</p>` : ''}
      <p class="sheet-text">Die Einheiten werden zu deinem Verlauf hinzugefügt. Profil, Plan, Einstellungen und vorhandene Einheiten bleiben unverändert. Die Planwoche richtet sich nach deinem Plan.</p>
      <div class="btn-stack">
        <button type="button" class="btn btn-primary" data-imp="add"${sm.sessions ? '' : ' disabled'}>Hinzufügen</button>
        <button type="button" class="btn btn-quiet" data-sheet-close>Abbrechen</button>
      </div>`,
    onMount(sheet, close) {
      sheet.querySelector('[data-imp="add"]').addEventListener('click', async (e) => {
        e.currentTarget.disabled = true;
        const { state, added, updated } = mergeStates(store.state, parsed.state, { assignWeeks: true });
        state.draft = store.state.draft;
        state.photos = { ...store.state.photos };
        store.replace(state);
        const written = await restorePhotos(parsed.photos, false);
        close(true);
        const n = added + updated;
        toast(n
          ? `${n} ${n === 1 ? 'Einheit' : 'Einheiten'} hinzugefügt${written ? ` (+${written} Fotos)` : ''}`
          : 'Diese Einheiten sind schon in deinem Verlauf.');
        rerender();
      });
    },
  });
}

/** Fotos aus einer Sicherung zurückschreiben. Ersetzen: alle; Zusammenführen: nur fehlende. */
async function restorePhotos(photos, replace) {
  const entries = Object.entries(photos || {});
  if (replace) await store.clearPhotos().catch(() => {});
  if (!entries.length || !store.photosSupported) return 0;
  const now = new Date().toISOString();
  const added = {};
  for (const [key, url] of entries) {
    if (!replace && store.state.photos[key]) continue;
    try {
      const blob = dataURLToBlob(url);
      if (!blob) continue;
      await store.putPhoto(key, blob);
      added[key] = now;
    } catch { /* einzelnes Foto überspringen */ }
  }
  store.update((s) => { s.photos = { ...(replace ? {} : s.photos), ...added }; }, { now: true });
  return Object.keys(added).length;
}

export function filePicker(onFile) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    const f = input.files && input.files[0];
    input.remove();
    if (f) onFile(f);
  });
  input.click();
}
