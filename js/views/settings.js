// Einstellungen: Profil, ärztliche Vorgaben, Plan, Darstellung, Datensicherung, Zurücksetzen.
import { store } from '../store.js';
import { esc, todayISO, formatDate, isISODate } from '../util.js';
import {
  weekInfo, startDateOf, anchorsFromStart, anchorsSetWeek, anchorsRepeatWeek, anchorsCancelRepeat, repeatPlanned, TOTAL_WEEKS,
} from '../plan.js';
import { icon, pageHead, segmented, toggle, toast, confirmDialog } from '../ui.js';
import { applyTheme } from '../theme.js';
import { navigate } from '../router.js';
import { APP_VERSION } from '../version.js';
import { checkForUpdate, offlineReady } from '../pwa.js';
import {
  doBackup, doCsvExport, lastBackupText, importFromFile, filePicker, openInstallSheet, isStandalone,
} from './dialogs.js';
import { numStr, intOrNull } from './common.js';
import { SKIP_WEEKS_NOTE } from '../content.js';

function field(label, inner, hint = '') {
  return `<label class="field"><span class="field-label">${esc(label)}</span>${inner}${hint ? `<span class="field-hint">${esc(hint)}</span>` : ''}</label>`;
}

export function render() {
  const s = store.state;
  const p = s.profile;
  const today = todayISO();
  const info = weekInfo(s.plan.anchors, today);
  const repeat = repeatPlanned(s.plan.anchors, today);
  const restOpts = [[null, 'Wie im Plan'], [60, '60 Sekunden'], [90, '90 Sekunden'], [120, '120 Sekunden'], [150, '150 Sekunden'], [180, '180 Sekunden']];
  const rpeOpts = [[null, 'Keine Vorgabe'], [3, 'RPE 3'], [4, 'RPE 4'], [5, 'RPE 5'], [6, 'RPE 6']];
  const opt = (list, val) => list.map(([v, l]) => `<option value="${v ?? ''}"${(v ?? null) === (val ?? null) ? ' selected' : ''}>${esc(l)}</option>`).join('');
  const backend = store.backend === 'indexeddb' ? 'IndexedDB (mit Spiegelkopie)' : store.backend === 'localstorage' ? 'Lokaler Browserspeicher' : 'Nur im Arbeitsspeicher';

  return `
    ${pageHead({ title: 'Einstellungen', back: { href: '#/heute', label: 'Heute' } })}

    <section class="card card-backup" id="sicherung">
      <div class="card-row"><h2 class="card-title">${icon('download')}Datensicherung</h2></div>
      <p class="body-text">Deine Trainingsdaten liegen nur auf diesem Gerät. Werden Websitedaten gelöscht, sind sie weg – sichere sie deshalb regelmäßig, zum Beispiel in „Dateien“ oder per Mail an dich selbst.</p>
      <p class="backup-status">${esc(lastBackupText())}</p>
      <div class="btn-stack">
        <button type="button" class="btn btn-primary" data-act="backup">${icon('download')}Sicherung erstellen (JSON)</button>
        <button type="button" class="btn btn-secondary" data-act="restore">${icon('upload')}Sicherung wiederherstellen</button>
        <button type="button" class="btn btn-secondary" data-act="csv">${icon('note')}Protokoll exportieren (CSV)</button>
      </div>
      <p class="field-hint">Öffnet sich kein Teilen-Menü, wird die Datei heruntergeladen. <button type="button" class="link-btn" data-act="backup-dl">Sicherung direkt herunterladen</button></p>
    </section>

    <h2 class="section-title">Trainingsplan</h2>
    <section class="card">
      ${field('Startdatum des Plans', `<input class="input" type="date" data-plan="start" value="${esc(startDateOf(s.plan.anchors))}">`, 'Ändern setzt die Wochenzählung neu ab diesem Datum.')}
      ${field('Aktuelle Woche', `<select class="input" data-plan="week">${Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => `<option value="${w}"${w === info.week ? ' selected' : ''}>Woche ${w}</option>`).join('')}</select>`,
        `${info.beforeStart ? `Der Plan beginnt am ${formatDate(info.weekStart, 'long')}.` : `Diese Woche läuft bis ${formatDate(info.weekEnd, 'long')}.`} ${SKIP_WEEKS_NOTE}`)}
      ${repeat
        ? `<p class="inline-note good">${icon('repeat')}<span>Woche ${info.week} wird nächste Woche wiederholt.</span></p><button type="button" class="btn btn-secondary" data-act="unrepeat">Wiederholung zurücknehmen</button>`
        : info.beforeStart || info.finished ? '' : `<button type="button" class="btn btn-secondary" data-act="repeat">${icon('repeat')}Woche ${info.week} wiederholen</button>`}
    </section>
    <section class="card list">
      ${toggle('includeBiceps', s.plan.includeBiceps, 'Bizepscurls anbieten', `Optional in Training B ab Woche ${s.plan.bicepsFromWeek}`)}
      <label class="row"><span class="row-main"><span class="row-title">Bizepscurls ab Woche</span></span>
        <select class="input input-inline" data-plan="bicepsFrom">${Array.from({ length: 12 }, (_, i) => i + 1).map((w) => `<option value="${w}"${w === s.plan.bicepsFromWeek ? ' selected' : ''}>${w}</option>`).join('')}</select></label>
      <label class="row"><span class="row-main"><span class="row-title">Pause zwischen Sätzen</span></span>
        <select class="input input-inline" data-set="restSec">${opt(restOpts, s.settings.restSec)}</select></label>
      ${toggle('sound', s.settings.sound, 'Ton am Ende der Pause', 'Ein kurzer Signalton; folgt dem Lautlos-Schalter')}
      ${toggle('keepAwake', s.settings.keepAwake, 'Bildschirm während des Trainings anlassen', 'Wenn vom Gerät unterstützt')}
    </section>

    <h2 class="section-title">Ärztliche Freigabe und Vorgaben</h2>
    <section class="card">
      <p class="body-text">Alles hier bleibt auf diesem Gerät und wird nur dir angezeigt.</p>
      <div class="list list-inset">${toggle('clearance', p.clearance, 'Ärztliche Trainingsfreigabe liegt vor')}</div>
      <div class="field-grid">
        ${field('Datum der Freigabe', `<input class="input" type="date" data-p="clearanceDate" value="${esc(p.clearanceDate)}">`)}
        ${field('Freigabe durch', `<input class="input" data-p="clearanceBy" value="${esc(p.clearanceBy)}" autocomplete="off">`)}
      </div>
      ${field('Maximale Belastung laut Ärztin oder Arzt', `<select class="input" data-p="maxRpeDoctor">${opt(rpeOpts, p.maxRpeDoctor)}</select>`, 'Skala 1–10. Liegt die Vorgabe unter dem Plan, gilt die niedrigere Grenze. Werte der Borg-Skala (6–20) bitte ärztlich übertragen lassen.')}
      ${field('Puls-Obergrenze laut Ärztin oder Arzt (optional)', `<input class="input" type="text" inputmode="numeric" data-p="hrLimit" value="${esc(numStr(p.hrLimit))}" placeholder="nur falls festgelegt">`, 'Nur eintragen, wenn ärztlich festgelegt. Nicht überschreiten – zusätzlich gelten RPE-Ziel und Sprechtest; es gilt immer die vorsichtigere Grenze.')}
      ${field('Weitere ärztliche Vorgaben', `<textarea class="input" rows="3" data-p="doctorNotes" placeholder="z. B. keine Übungen über Kopf">${esc(p.doctorNotes)}</textarea>`)}
      ${field('Medikamente (eigene Notiz)', `<textarea class="input" rows="3" data-p="medications">${esc(p.medications)}</textarea>`)}
      <div class="field-grid">
        ${field('Notfallkontakt', `<input class="input" data-p="emergencyName" value="${esc(p.emergencyName)}" autocomplete="off" placeholder="Name">`)}
        ${field('Telefon', `<input class="input" type="tel" data-p="emergencyPhone" value="${esc(p.emergencyPhone)}" autocomplete="off">`)}
      </div>
    </section>

    <h2 class="section-title">Profil</h2>
    <section class="card">
      ${field('Vorname', `<input class="input" data-p="name" value="${esc(p.name)}" autocomplete="given-name">`)}
      <div class="field-grid">
        ${field('Alter', `<input class="input" type="text" inputmode="numeric" data-p="age" value="${esc(numStr(p.age))}">`)}
        ${field('Größe in cm', `<input class="input" type="text" inputmode="numeric" data-p="heightCm" value="${esc(numStr(p.heightCm))}">`)}
      </div>
      ${field('Ziel', `<textarea class="input" rows="2" data-p="goal" placeholder="z. B. kräftiger und beweglicher werden">${esc(p.goal)}</textarea>`)}
      <a class="text-link" href="#/fortschritt">Körpergewicht im Bereich Fortschritt eintragen</a>
    </section>

    <h2 class="section-title">Darstellung</h2>
    <section class="card">
      ${segmented('theme', [
        { value: 'dark', html: `${icon('moon')}Dunkel` },
        { value: 'light', html: `${icon('sun')}Hell` },
        { value: 'system', label: 'Wie iPhone' },
      ], s.settings.theme)}
    </section>

    <h2 class="section-title">Hilfe</h2>
    <section class="card list">
      <a class="row" href="#/sicherheit"><span class="row-main"><span class="row-title">Sicherheit und Warnzeichen</span></span>${icon('chevronRight', 'chev')}</a>
      ${isStandalone() ? '' : `<button type="button" class="row" data-act="install"><span class="row-main"><span class="row-title">Zum Home-Bildschirm hinzufügen</span></span>${icon('chevronRight', 'chev')}</button>`}
    </section>

    <h2 class="section-title">App</h2>
    <section class="card">
      <dl class="kv">
        <div><dt>Version</dt><dd>${esc(APP_VERSION)}</dd></div>
        <div><dt>Offline nutzbar</dt><dd>${offlineReady() ? 'Ja' : 'Nach dem nächsten Start'}</dd></div>
        <div><dt>Speicher</dt><dd>${esc(backend)}</dd></div>
        <div><dt>Dauerhafter Speicher</dt><dd>${store.persisted === true ? 'Ja' : store.persisted === false ? 'Vom Browser nicht bestätigt' : 'Unbekannt'}</dd></div>
      </dl>
      <button type="button" class="btn btn-secondary" data-act="update">${icon('refresh')}Nach Updates suchen</button>
      <p class="field-hint">Keine Registrierung, kein Server, kein Tracking. Es werden keine Daten übertragen.</p>
    </section>

    <section class="card card-danger">
      <h2 class="card-title">Alle Daten zurücksetzen</h2>
      <p class="body-text">Löscht Profil, Plan, Verlauf und Körpergewicht auf diesem Gerät. Erstelle vorher eine Sicherung.</p>
      <button type="button" class="btn btn-danger" data-act="reset">${icon('trash')}Alle Daten löschen</button>
    </section>`;
}

export function mount(root) {
  const onInput = (e) => {
    const t = e.target;
    if (t.dataset.p) {
      const k = t.dataset.p;
      store.update((s) => {
        if (k === 'age') s.profile.age = intOrNull(t.value, 1, 120);
        else if (k === 'heightCm') s.profile.heightCm = intOrNull(t.value, 50, 250);
        else if (k === 'hrLimit') s.profile.hrLimit = intOrNull(t.value, 40, 220);
        else if (k === 'maxRpeDoctor') s.profile.maxRpeDoctor = t.value ? Number(t.value) : null;
        else if (k === 'clearanceDate') s.profile.clearanceDate = isISODate(t.value) ? t.value : '';
        else s.profile[k] = t.value.slice(0, 2000);
      }, { render: false });
      return;
    }
    if (t.dataset.toggle) {
      const k = t.dataset.toggle;
      store.update((s) => {
        if (k === 'includeBiceps') s.plan.includeBiceps = t.checked;
        else if (k === 'clearance') s.profile.clearance = t.checked;
        else s.settings[k] = t.checked;
      }, { render: false });
      return;
    }
    if (t.dataset.set === 'restSec') {
      store.update((s) => { s.settings.restSec = t.value ? Number(t.value) : null; }, { render: false });
    }
  };

  const onChange = (e) => {
    const t = e.target;
    const today = todayISO();
    if (t.dataset.plan === 'start') {
      if (!isISODate(t.value)) return;
      store.update((s) => { s.plan.anchors = anchorsFromStart(t.value); }, { now: true });
      const w = weekInfo(store.state.plan.anchors, today);
      toast(w.beforeStart ? `Plan startet am ${formatDate(t.value, 'long')}` : `Plan neu ausgerichtet: Woche ${w.week}`);
    } else if (t.dataset.plan === 'week') {
      const w = Number(t.value);
      store.update((s) => { s.plan.anchors = anchorsSetWeek(s.plan.anchors, w, today); }, { now: true });
      toast(`Aktuelle Woche: ${w}`);
    } else if (t.dataset.plan === 'bicepsFrom') {
      store.update((s) => { s.plan.bicepsFromWeek = Number(t.value); }, { now: true });
    }
  };

  const onClick = async (e) => {
    const seg = e.target.closest('[data-seg="theme"]');
    if (seg) {
      const theme = seg.dataset.value;
      store.update((s) => { s.settings.theme = theme; }, { now: true });
      applyTheme(theme);
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const today = todayISO();
    if (act === 'backup') await doBackup();
    else if (act === 'backup-dl') await doBackup({ preferDownload: true });
    else if (act === 'csv') await doCsvExport();
    else if (act === 'restore') filePicker((f) => importFromFile(f));
    else if (act === 'install') openInstallSheet();
    else if (act === 'repeat') {
      store.update((s) => { s.plan.anchors = anchorsRepeatWeek(s.plan.anchors, today); }, { now: true });
      toast('Woche wird nächste Woche wiederholt');
    } else if (act === 'unrepeat') {
      store.update((s) => { s.plan.anchors = anchorsCancelRepeat(s.plan.anchors, today); }, { now: true });
      toast('Wiederholung zurückgenommen');
    } else if (act === 'update') {
      const r = await checkForUpdate();
      const msg = { update: 'Update gefunden – es wird gleich angeboten.', current: 'Du nutzt die aktuelle Version.', offline: 'Keine Verbindung. Bitte später erneut versuchen.', unsupported: 'Updates werden hier nicht unterstützt.' };
      toast(msg[r] || 'Fertig');
    } else if (act === 'reset') {
      const ok = await confirmDialog({
        title: 'Wirklich alles löschen?',
        message: 'Profil, Plan, Verlauf und Körpergewicht werden auf diesem Gerät gelöscht. Das lässt sich nur mit einer Sicherung rückgängig machen.',
        confirmLabel: 'Endgültig löschen', danger: true, requireText: 'LÖSCHEN',
      });
      if (!ok) return;
      store.reset();
      toast('Alle Daten wurden gelöscht');
      navigate('#/willkommen', { replace: true });
    }
  };

  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('change', onChange);
  root.addEventListener('click', onClick);
  return () => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
    root.removeEventListener('change', onChange);
    root.removeEventListener('click', onClick);
  };
}
