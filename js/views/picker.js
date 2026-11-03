// Übungsauswahl für das freie Training und Verwaltung eigener Übungen.
import { store, cleanCustomExercise } from '../store.js';
import { esc, uid } from '../util.js';
import { icon, openSheet, toast, segmented, confirmDialog } from '../ui.js';
import { pickerGroups, exerciseDef, isSelectable, WEIGHT_LABELS } from '../exercises.js';
import { illustration } from '../illustrations.js';
import { thumbHTML, hydratePhotos, removePhoto, hasPhoto } from '../photos.js';

const MAX_CUSTOM = 100;

/* ---------- Auswahl ---------- */

function pickRow(id, checked, inSession) {
  const def = exerciseDef(id);
  const sub = inSession ? 'Schon in dieser Einheit' : def.muscles || 'Eigene Übung';
  return `<label class="pick-row${inSession ? ' is-disabled' : ''}">
    <input type="checkbox" data-pick="${esc(id)}"${checked || inSession ? ' checked' : ''}${inSession ? ' disabled' : ''}>
    ${thumbHTML(id, illustration(id))}
    <span class="pick-text"><strong>${esc(def.name)}</strong><span>${esc(sub)}</span></span>
  </label>`;
}

function groupsHTML(chosen, exclude) {
  return pickerGroups().map((g) => `
    <section class="pick-group">
      <h3 class="sub-title">${esc(g.title)}</h3>
      ${g.ids.length ? `<div class="pick-list">${g.ids.map((id) => pickRow(id, chosen.has(id), exclude.has(id))).join('')}</div>` : ''}
      ${g.key === 'custom' ? `${g.ids.length ? '' : '<p class="sheet-hint">Fehlt ein Gerät aus deinem Studio? Lege es hier als eigene Übung an.</p>'}
        <button type="button" class="btn btn-secondary" data-pick-new>${icon('plus')}Eigene Übung anlegen</button>` : ''}
    </section>`).join('');
}

/**
 * Übungen auswählen. Ergebnis: Liste der IDs in Auswahlreihenfolge oder null (abgebrochen).
 * exclude: Übungen, die schon in der laufenden Einheit sind.
 */
export function openExercisePicker({ selected = [], exclude = [], title = 'Übungen auswählen', confirmLabel = 'Übernehmen' } = {}) {
  const order = [...new Set(selected)].filter(isSelectable);
  const chosen = new Set(order);
  const excluded = new Set(exclude);
  const { promise } = openSheet({
    title,
    className: 'sheet-tall sheet-picker',
    body: `
      <p class="sheet-hint">Die Reihenfolge in der Einheit entspricht der Reihenfolge, in der du die Übungen antippst.</p>
      <div class="pick-groups" data-pick-groups>${groupsHTML(chosen, excluded)}</div>
      <div class="sheet-footer">
        <button type="button" class="btn btn-primary" data-pick-ok><span>${esc(confirmLabel)} (<span data-pick-count>${chosen.size}</span>)</span></button>
      </div>`,
    onMount(sheet, close) {
      hydratePhotos(sheet);
      const count = sheet.querySelector('[data-pick-count]');
      const ok = sheet.querySelector('[data-pick-ok]');
      const sync = () => {
        count.textContent = String(chosen.size);
        ok.disabled = chosen.size === 0;
      };
      sync();
      sheet.addEventListener('change', (e) => {
        const cb = e.target.closest('[data-pick]');
        if (!cb) return;
        const id = cb.dataset.pick;
        if (cb.checked && !chosen.has(id)) {
          chosen.add(id);
          order.push(id);
        } else if (!cb.checked) {
          chosen.delete(id);
          const k = order.indexOf(id);
          if (k >= 0) order.splice(k, 1);
        }
        sync();
      });
      sheet.addEventListener('click', async (e) => {
        if (e.target.closest('[data-pick-new]')) {
          const id = await openCustomExerciseSheet();
          if (!id) return;
          chosen.add(id);
          order.push(id);
          const box = sheet.querySelector('[data-pick-groups]');
          box.innerHTML = groupsHTML(chosen, excluded);
          hydratePhotos(box);
          sync();
          const row = box.querySelector(`[data-pick="${id}"]`);
          if (row) row.closest('.pick-row').scrollIntoView({ block: 'center' });
          return;
        }
        if (e.target.closest('[data-pick-ok]')) close(order.filter((id) => chosen.has(id)));
      });
    },
  });
  return promise;
}

/* ---------- Eigene Übung anlegen oder bearbeiten ---------- */

/** Ergebnis: ID der gespeicherten Übung oder null. */
export function openCustomExerciseSheet({ id = null } = {}) {
  const existing = id ? store.state.customExercises.find((c) => c.id === id) : null;
  if (!existing && store.state.customExercises.length >= MAX_CUSTOM) {
    toast(`Es sind höchstens ${MAX_CUSTOM} eigene Übungen möglich.`, { type: 'error' });
    return Promise.resolve(null);
  }
  const c = existing || { name: '', muscles: '', weightLabel: 'kg', note: '' };
  const { promise } = openSheet({
    title: existing ? 'Übung bearbeiten' : 'Eigene Übung',
    body: `
      <label class="field"><span class="field-label">Name</span>
        <input class="input" data-cx="name" maxlength="60" value="${esc(c.name)}" placeholder="z. B. Beinbeuger (Teca)" autocomplete="off"></label>
      <label class="field"><span class="field-label">Körperbereich <span class="muted">(optional)</span></span>
        <input class="input" data-cx="muscles" maxlength="80" value="${esc(c.muscles)}" placeholder="z. B. Beine, Rücken, Arme" autocomplete="off"></label>
      <div class="field"><span class="field-label">Gewicht angeben in</span>
        ${segmented('cxw', WEIGHT_LABELS.map((w) => ({ value: w, label: w })), c.weightLabel)}</div>
      <label class="field"><span class="field-label">Notiz <span class="muted">(optional)</span></span>
        <textarea class="input" rows="2" data-cx="note" maxlength="300" placeholder="z. B. Marke, Standort im Studio">${esc(c.note)}</textarea></label>
      <p class="sheet-hint">Für eigene Übungen gibt es keine Schritt-für-Schritt-Anleitung. Lass dir die Ausführung beim ersten Mal vom Trainingspersonal zeigen. Auch hier gilt: gleichmäßig atmen, nie pressen, Belastungsziel einhalten.</p>
      <div class="btn-stack">
        <button type="button" class="btn btn-primary" data-cx-save>${existing ? 'Speichern' : 'Übung anlegen'}</button>
        <button type="button" class="btn btn-secondary" data-sheet-close>Abbrechen</button>
      </div>`,
    onMount(sheet, close) {
      let weightLabel = c.weightLabel;
      const nameInput = sheet.querySelector('[data-cx="name"]');
      if (!existing) setTimeout(() => nameInput.focus({ preventScroll: true }), 350);
      sheet.addEventListener('click', (e) => {
        const seg = e.target.closest('[data-seg="cxw"]');
        if (seg) {
          weightLabel = seg.dataset.value;
          sheet.querySelectorAll('[data-seg="cxw"]').forEach((b) => {
            const on = b === seg;
            b.classList.toggle('active', on);
            b.setAttribute('aria-checked', String(on));
          });
          return;
        }
        if (!e.target.closest('[data-cx-save]')) return;
        const name = nameInput.value.trim();
        if (!name) {
          toast('Bitte gib einen Namen ein.', { type: 'error' });
          nameInput.focus();
          return;
        }
        const lower = name.toLocaleLowerCase('de');
        const dup = store.state.customExercises.some((x) => x.id !== id && !x.archived && x.name.toLocaleLowerCase('de') === lower);
        if (dup) {
          toast('Eine eigene Übung mit diesem Namen gibt es schon.', { type: 'error' });
          return;
        }
        const now = new Date().toISOString();
        const next = cleanCustomExercise({
          ...(existing || { id: `c_${uid()}`, createdAt: now, archived: false }),
          name,
          muscles: sheet.querySelector('[data-cx="muscles"]').value,
          note: sheet.querySelector('[data-cx="note"]').value,
          weightLabel,
          updatedAt: now,
        });
        store.update((s) => {
          if (existing) s.customExercises = s.customExercises.map((x) => (x.id === next.id ? next : x));
          else s.customExercises.push(next);
        }, { now: true });
        close(next.id);
        toast(existing ? 'Übung gespeichert' : 'Übung angelegt');
      });
    },
  });
  return promise;
}

/* ---------- Ausblenden oder löschen ---------- */

/** In wie vielen Einheiten (inkl. laufender) kommt die Übung vor? */
export function customUsage(id) {
  const s = store.state;
  const inSessions = s.sessions.filter((x) => x.exercises.some((e) => e.id === id)).length;
  const inDraft = s.draft && s.draft.exercises.some((e) => e.id === id) ? 1 : 0;
  return inSessions + inDraft;
}

/** Benutzte Übungen werden nur ausgeblendet (der Verlauf bleibt vollständig), unbenutzte gelöscht. */
export async function removeCustomExercise(id) {
  const c = store.state.customExercises.find((x) => x.id === id);
  if (!c) return null;
  const used = customUsage(id);
  if (used) {
    const ok = await confirmDialog({
      title: `„${c.name}“ ausblenden?`,
      message: `Die Übung kommt in ${used} ${used === 1 ? 'Einheit' : 'Einheiten'} vor und bleibt dort erhalten. Für neue Einheiten steht sie nicht mehr zur Auswahl.`,
      confirmLabel: 'Ausblenden',
    });
    if (!ok) return null;
    const now = new Date().toISOString();
    store.update((s) => {
      s.customExercises = s.customExercises.map((x) => (x.id === id ? { ...x, archived: true, updatedAt: now } : x));
    }, { now: true });
    toast('Übung ausgeblendet');
    return 'archived';
  }
  const ok = await confirmDialog({
    title: `„${c.name}“ löschen?`,
    message: 'Die Übung wird mit Foto und Geräteeinstellung entfernt.',
    confirmLabel: 'Löschen',
    danger: true,
  });
  if (!ok) return null;
  if (hasPhoto(id)) await removePhoto(id).catch(() => {});
  store.update((s) => {
    s.customExercises = s.customExercises.filter((x) => x.id !== id);
    delete s.machineNotes[id];
    delete s.photos[id];
  }, { now: true });
  toast('Übung gelöscht');
  return 'deleted';
}

export function restoreCustomExercise(id) {
  const now = new Date().toISOString();
  store.update((s) => {
    s.customExercises = s.customExercises.map((x) => (x.id === id ? { ...x, archived: false, updatedAt: now } : x));
  }, { now: true });
  toast('Übung wieder verfügbar');
}
