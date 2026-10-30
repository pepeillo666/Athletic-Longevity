// Protokoll: Liste, Details, Bearbeiten und Nachtragen von Einheiten.
import { store } from '../store.js';
import { esc, todayISO, formatDate, formatDuration, fmtNum, deepClone, isISODate, nowTimeHM } from '../util.js';
import {
  sortSessionsDesc, sessionProgress, sessionAvgRpe, weekInfo, createSession, TOTAL_WEEKS,
  freeExercise, lastFreeSelection, phaseForWeek,
} from '../plan.js';
import { WORKOUTS, exerciseDef } from '../exercises.js';
import { openExercisePicker } from './picker.js';
import { icon, pageHead, confirmDialog, toast, segmented, banner } from '../ui.js';
import { navigate } from '../router.js';
import {
  wellbeingPicker, toggleWb, wellbeingText, rpeOptions, numStr, numOrNull, intOrNull,
} from './common.js';

const STATUS = { completed: 'Abgeschlossen', aborted: 'Abgebrochen' };

/* ---------- Liste ---------- */

function listItem(s) {
  const p = sessionProgress(s);
  const avg = sessionAvgRpe(s);
  const meta = [formatDate(s.date, 'medium')];
  if (s.durationMin) meta.push(formatDuration(s.durationMin));
  meta.push(`${p.handled} von ${p.total} Übungen`);
  return `<li><a class="log-item" href="#/verlauf/${esc(s.id)}">
    <span class="log-badge${s.status === 'aborted' ? ' is-aborted' : s.type === 'F' ? ' is-free' : ''}" aria-hidden="true">${esc(s.type)}</span>
    <span class="log-text">
      <strong>${esc(WORKOUTS[s.type].name)}<span class="log-week">Woche ${s.planWeek}</span></strong>
      <span>${esc(meta.join(', '))}</span>
      ${s.status === 'aborted' ? `<span class="log-flag">${icon('alert')}Abgebrochen${s.abortReason ? `: ${esc(s.abortReason)}` : ''}</span>` : ''}
      ${s.symptoms && s.status !== 'aborted' ? `<span class="log-flag">${icon('alert')}Beschwerden notiert</span>` : ''}
    </span>
    ${avg != null ? `<span class="log-rpe"><small>Ø RPE</small>${fmtNum(avg, 1)}</span>` : ''}
    ${icon('chevronRight', 'chev')}
  </a></li>`;
}

function renderList() {
  const sessions = sortSessionsDesc(store.state.sessions);
  const add = `<a class="icon-btn icon-btn-lg" href="#/verlauf/neu" aria-label="Einheit nachtragen">${icon('plus')}</a>`;
  if (!sessions.length) {
    return `${pageHead({ title: 'Verlauf', actions: add })}
      <section class="empty">
        <span class="empty-icon">${icon('history')}</span>
        <p class="empty-title">Noch keine Einheiten</p>
        <p class="empty-text">Nach deinem ersten Training erscheint es hier – mit allen Sätzen, Gewichten und Notizen.</p>
        <a class="btn btn-primary" href="#/training">${icon('play')}Zum Training</a>
        <a class="text-link center" href="#/verlauf/neu">Einheit nachträglich eintragen</a>
      </section>`;
  }
  const groups = new Map();
  for (const s of sessions) {
    const key = s.date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  let html = '';
  for (const [key, list] of groups) {
    html += `<section class="log-group"><h2 class="section-title">${esc(formatDate(`${key}-01`, 'monthYear'))}<span class="count">${list.length}</span></h2>
      <ul class="log-list">${list.map(listItem).join('')}</ul></section>`;
  }
  return `${pageHead({ title: 'Verlauf', subtitle: `${sessions.length} ${sessions.length === 1 ? 'Einheit' : 'Einheiten'} protokolliert`, actions: add })}${html}`;
}

/* ---------- Details ---------- */

function renderDetail(id) {
  const s = store.state.sessions.find((x) => x.id === id);
  if (!s) {
    return `${pageHead({ title: 'Nicht gefunden', back: { href: '#/verlauf', label: 'Verlauf' } })}
      <p class="body-text">Diese Einheit gibt es nicht mehr.</p>`;
  }
  const p = sessionProgress(s);
  const avg = sessionAvgRpe(s);
  const exHTML = s.exercises.map((ex) => {
    const def = exerciseDef(ex.id, ex.name);
    const rows = ex.sets.map((st, j) => `<tr class="${st.done ? '' : 'is-off'}">
      <td>${j + 1}${st.optional ? '<small> opt.</small>' : ''}</td><td>${st.weight != null ? esc(numStr(st.weight)) : '–'}</td>
      <td>${st.reps ?? '–'}</td><td>${st.rpe ?? '–'}</td><td>${st.done ? icon('check', 'ok') : '–'}</td></tr>`).join('');
    return `<section class="card card-tight">
      <div class="card-row"><h3 class="card-title">${esc(def.name)}</h3>
        ${ex.skipped ? '<span class="pill">Übersprungen</span>' : ex.optional && !ex.sets.some((x) => x.done) ? '<span class="pill">Optional, nicht gemacht</span>' : ''}</div>
      <table class="sets-table"><thead><tr><th>Satz</th><th>${esc(def.weightLabel)}</th><th>Wdh.</th><th>RPE</th><th>Fertig</th></tr></thead><tbody>${rows}</tbody></table>
      ${ex.notes ? `<p class="note-text">${icon('note')}<span>${esc(ex.notes)}</span></p>` : ''}
    </section>`;
  }).join('');
  const extras = [];
  extras.push(`Aufwärmen ${s.warmupDone ? 'erledigt' : 'nicht markiert'}`);
  extras.push(`Abwärmen ${s.cooldownDone ? 'erledigt' : 'nicht markiert'}`);
  if (s.cardioMin) extras.push(`Ausdauer ${s.cardioMin} Minuten`);
  return `
    ${pageHead({
      title: WORKOUTS[s.type].name,
      subtitle: esc(`${formatDate(s.date, 'full')}, ${s.startTime} Uhr`),
      back: { href: '#/verlauf', label: 'Verlauf' },
      actions: `<a class="icon-btn icon-btn-lg" href="#/verlauf/${esc(s.id)}/bearbeiten" aria-label="Bearbeiten">${icon('edit')}</a>`,
    })}
    <div class="pills"><span class="pill">Woche ${s.planWeek}</span><span class="pill${s.status === 'aborted' ? ' pill-bad' : ' pill-good'}">${STATUS[s.status]}</span></div>
    ${s.status === 'aborted' && s.abortReason ? `<p class="body-text">Grund: ${esc(s.abortReason)}</p>` : ''}
    ${s.symptoms ? banner({ type: 'danger', title: 'Beschwerden notiert', text: 'Bitte vor dem nächsten Training ärztlich abklären lassen.' }) : ''}
    <section class="tiles">
      <div class="tile"><span class="tile-label">Dauer</span><span class="tile-value tile-value-sm">${esc(formatDuration(s.durationMin))}</span></div>
      <div class="tile"><span class="tile-label">Übungen</span><span class="tile-value tile-value-sm">${p.handled} von ${p.total}</span></div>
      <div class="tile"><span class="tile-label">Ø Belastung</span><span class="tile-value tile-value-sm">${avg != null ? `RPE ${fmtNum(avg, 1)}` : '–'}</span></div>
      <div class="tile"><span class="tile-label">Wohlbefinden</span><span class="tile-value tile-value-xs">${esc(wellbeingText(s.wellbeingBefore))} → ${esc(wellbeingText(s.wellbeingAfter))}</span></div>
    </section>
    <p class="body-text muted">${esc(extras.join('. '))}.</p>
    ${s.notes ? `<section class="card card-quiet"><p class="card-title">Notiz</p><p class="body-text">${esc(s.notes)}</p></section>` : ''}
    ${exHTML}
    <div class="btn-stack">
      <a class="btn btn-secondary" href="#/verlauf/${esc(s.id)}/bearbeiten">${icon('edit')}Bearbeiten</a>
      <button type="button" class="btn btn-quiet text-danger" data-act="delete" data-id="${esc(s.id)}">${icon('trash')}Einheit löschen</button>
    </div>`;
}

/* ---------- Bearbeiten / Nachtragen ---------- */

let editing = null; // { key, session, isNew }

function ensureEditing(params) {
  const key = params.isNew ? 'new' : params.id;
  if (editing && editing.key === key) return editing;
  if (params.isNew) {
    const s = store.state;
    const today = todayISO();
    const week = weekInfo(s.plan.anchors, today).week;
    const session = createSession({ type: 'A', planWeek: week, date: today, startTime: nowTimeHM(), state: s, status: 'completed' });
    markRequiredDone(session);
    session.durationMin = 50;
    editing = { key, session, isNew: true };
  } else {
    const found = store.state.sessions.find((x) => x.id === params.id);
    editing = found ? { key, session: deepClone(found), isNew: false } : null;
  }
  return editing;
}

/** Übungen zum Nachtragen oder Bearbeiten hinzufügen – die Sätze gelten als erledigt. */
async function addExercises(session) {
  const ids = await openExercisePicker({
    exclude: session.exercises.map((e) => e.id), title: 'Übung hinzufügen', confirmLabel: 'Hinzufügen',
  });
  if (!ids || !ids.length || !editing || editing.session !== session) return;
  const phase = phaseForWeek(session.planWeek);
  const counts = session.exercises.map((e) => e.sets.length).filter(Boolean);
  const count = counts.length ? counts[counts.length - 1] : phase.setsMax;
  for (const id of ids) {
    if (session.exercises.some((e) => e.id === id)) continue;
    const others = store.state.sessions.filter((x) => x.id !== session.id);
    const ex = freeExercise(id, phase, others, count);
    ex.sets.forEach((st) => { st.done = true; });
    session.exercises.push(ex);
  }
  navigate(location.hash);
}

function markRequiredDone(session) {
  session.exercises.forEach((ex) => ex.sets.forEach((st) => { if (!st.optional) st.done = true; }));
}

function rebuildNew() {
  const cur = editing.session;
  // Freies Training: mit den Übungen der letzten freien Einheit vorbelegen
  const last = cur.type === 'F' ? lastFreeSelection(store.state.sessions) : null;
  const fresh = createSession({
    type: cur.type, planWeek: cur.planWeek, date: cur.date, startTime: cur.startTime, state: store.state, status: 'completed',
    exerciseIds: last ? last.ids : null, setCount: last ? last.sets : null,
  });
  markRequiredDone(fresh);
  Object.assign(fresh, {
    id: cur.id, durationMin: cur.durationMin, wellbeingBefore: cur.wellbeingBefore, wellbeingAfter: cur.wellbeingAfter,
    warmupDone: cur.warmupDone, cooldownDone: cur.cooldownDone, cardioMin: cur.cardioMin, symptoms: cur.symptoms, notes: cur.notes,
  });
  editing.session = fresh;
}

function editSetRow(i, j, st, def) {
  const n = j + 1;
  return `<div class="set-row set-row-edit${st.done ? ' is-done' : ''}" data-set="${i}-${j}">
    <span class="set-n">${n}</span>
    <input class="input input-num" type="text" inputmode="decimal" data-f="weight" value="${esc(numStr(st.weight))}" placeholder="–" aria-label="Satz ${n}: Gewicht in ${esc(def.weightLabel)}">
    <input class="input input-num" type="text" inputmode="numeric" data-f="reps" value="${esc(numStr(st.reps))}" placeholder="–" aria-label="Satz ${n}: Wiederholungen">
    <label class="rpe-pick${st.rpe ? ' has-value' : ''}"><span class="rpe-val" aria-hidden="true">${st.rpe ?? 'RPE'}</span>
      <select data-f="rpe" aria-label="Satz ${n}: RPE">${rpeOptions(st.rpe)}</select></label>
    <button type="button" class="set-check" data-f-done aria-pressed="${st.done}" aria-label="Satz ${n} erledigt">${icon('check')}</button>
  </div>`;
}

function renderEdit(params) {
  const e = ensureEditing(params);
  if (!e) return renderDetail(params.id);
  const s = e.session;
  const back = e.isNew ? { href: '#/verlauf', label: 'Verlauf' } : { href: `#/verlauf/${s.id}`, label: 'Zurück' };
  const weekOpts = Array.from({ length: TOTAL_WEEKS }, (_, k) => k + 1)
    .map((w) => `<option value="${w}"${w === s.planWeek ? ' selected' : ''}>Woche ${w}</option>`).join('');
  const exHTML = s.exercises.map((ex, i) => {
    const def = exerciseDef(ex.id, ex.name);
    return `<section class="card card-tight" data-edit-ex="${i}">
      <div class="card-row"><h3 class="card-title">${esc(def.name)}${ex.optional ? ' <span class="tag">optional</span>' : ''}</h3>
        <label class="mini-toggle"><input type="checkbox" data-ex-skipped="${i}" ${ex.skipped ? 'checked' : ''}><span>Übersprungen</span></label></div>
      <div class="set-grid">
        <div class="set-head" aria-hidden="true"><span>Satz</span><span>${esc(def.weightLabel)}</span><span>Wdh.</span><span>RPE</span><span>Fertig</span></div>
        ${ex.sets.map((st, j) => editSetRow(i, j, st, def)).join('')}
      </div>
      <div class="ex-actions">
        <button type="button" class="btn btn-sm btn-secondary" data-add-set="${i}"${ex.sets.length >= 6 ? ' disabled' : ''}>${icon('plus')}Satz</button>
        <button type="button" class="btn btn-sm btn-secondary" data-remove-set="${i}"${ex.sets.length <= 1 ? ' disabled' : ''}>${icon('minus')}Satz</button>
        <button type="button" class="btn btn-sm btn-quiet text-danger" data-edit-remove="${i}">${icon('trash')}Übung entfernen</button>
      </div>
      <label class="field field-compact"><span class="sr-only">Notiz</span><textarea class="input" rows="1" data-ex-note="${i}" placeholder="Notiz zur Übung">${esc(ex.notes)}</textarea></label>
    </section>`;
  }).join('');

  return `
    ${pageHead({ title: e.isNew ? 'Einheit nachtragen' : 'Einheit bearbeiten', back })}
    <form class="form" data-edit-form novalidate>
      ${e.isNew ? `<div class="field"><span class="field-label">Training</span>${segmented('etype', [{ value: 'A', label: 'Training A' }, { value: 'B', label: 'Training B' }, { value: 'F', label: 'Frei' }], s.type)}</div>` : ''}
      <div class="field-grid">
        <label class="field"><span class="field-label">Datum</span><input class="input" type="date" data-k="date" value="${esc(s.date)}" max="${todayISO()}" required></label>
        <label class="field"><span class="field-label">Startzeit</span><input class="input" type="time" data-k="startTime" value="${esc(s.startTime)}"></label>
        <label class="field"><span class="field-label">Dauer (Min.)</span><input class="input" type="text" inputmode="numeric" data-k="durationMin" value="${esc(numStr(s.durationMin))}"></label>
        <label class="field"><span class="field-label">Planwoche</span><select class="input" data-k="planWeek">${weekOpts}</select></label>
      </div>
      ${e.isNew ? '' : `<div class="field"><span class="field-label">Status</span>${segmented('estatus', [{ value: 'completed', label: 'Abgeschlossen' }, { value: 'aborted', label: 'Abgebrochen' }], s.status)}</div>`}
      <div class="field"><span class="field-label">Wohlbefinden vorher</span>${wellbeingPicker('before', s.wellbeingBefore)}</div>
      <div class="field"><span class="field-label">Wohlbefinden nachher</span>${wellbeingPicker('after', s.wellbeingAfter)}</div>
      <div class="list">
        <label class="row row-toggle"><span class="row-main"><span class="row-title">Aufwärmen erledigt</span></span><input type="checkbox" class="switch" data-k="warmupDone" ${s.warmupDone ? 'checked' : ''}></label>
        <label class="row row-toggle"><span class="row-main"><span class="row-title">Abwärmen erledigt</span></span><input type="checkbox" class="switch" data-k="cooldownDone" ${s.cooldownDone ? 'checked' : ''}></label>
        <label class="row row-toggle"><span class="row-main"><span class="row-title">Beschwerden während des Trainings</span></span><input type="checkbox" class="switch" data-k="symptoms" ${s.symptoms ? 'checked' : ''}></label>
      </div>
      <label class="field"><span class="field-label">Ausdauer (Min.)</span><input class="input" type="text" inputmode="numeric" data-k="cardioMin" value="${esc(numStr(s.cardioMin))}"></label>
      <label class="field"><span class="field-label">Notiz</span><textarea class="input" rows="3" data-k="notes">${esc(s.notes)}</textarea></label>
      <h2 class="section-title">Übungen</h2>
      ${s.exercises.length ? exHTML : '<p class="body-text muted">Füge die Übungen hinzu, die du gemacht hast.</p>'}
      <button type="button" class="btn btn-secondary" data-act="edit-addex">${icon('plus')}Übung hinzufügen</button>
      <div class="btn-stack sticky-actions">
        <button type="submit" class="btn btn-primary btn-lg">${icon('check')}Speichern</button>
        <a class="btn btn-secondary" href="${back.href}" data-cancel>Abbrechen</a>
      </div>
    </form>`;
}

/* ---------- Export ---------- */

export function render(params = {}) {
  if (params.mode === 'edit') return renderEdit(params);
  if (params.id) return renderDetail(params.id);
  return renderList();
}

export function mount(root, params = {}) {
  if (params.mode === 'edit') return mountEdit(root, params);
  const onClick = async (e) => {
    const del = e.target.closest('[data-act="delete"]');
    if (!del) return;
    const ok = await confirmDialog({
      title: 'Einheit löschen?', message: 'Die Einheit wird endgültig aus dem Verlauf entfernt.', confirmLabel: 'Löschen', danger: true,
    });
    if (!ok) return;
    const id = del.dataset.id;
    store.update((s) => { s.sessions = s.sessions.filter((x) => x.id !== id); }, { now: true, render: false });
    toast('Einheit gelöscht');
    navigate('#/verlauf');
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}

function mountEdit(root, params) {
  if (!editing) return null;
  const form = root.querySelector('[data-edit-form]');
  if (!form) return null;
  const sess = () => editing.session;

  const onInput = (e) => {
    const t = e.target;
    const s = sess();
    const row = t.closest('[data-set]');
    if (row && t.dataset.f) {
      const [i, j] = row.dataset.set.split('-').map(Number);
      const st = s.exercises[i].sets[j];
      if (t.dataset.f === 'weight') st.weight = numOrNull(t.value, 0, 1000);
      else if (t.dataset.f === 'reps') st.reps = intOrNull(t.value, 0, 500);
      else if (t.dataset.f === 'rpe') {
        st.rpe = t.value ? Number(t.value) : null;
        const label = row.querySelector('.rpe-pick');
        label.classList.toggle('has-value', !!t.value);
        label.querySelector('.rpe-val').textContent = t.value || 'RPE';
      }
      return;
    }
    if (t.dataset.exNote !== undefined) { s.exercises[Number(t.dataset.exNote)].notes = t.value.slice(0, 2000); return; }
    if (t.dataset.exSkipped !== undefined) { s.exercises[Number(t.dataset.exSkipped)].skipped = t.checked; return; }
    const k = t.dataset.k;
    if (!k) return;
    if (k === 'date') {
      if (!isISODate(t.value)) return;
      s.date = t.value;
      if (editing.isNew) {
        const w = weekInfo(store.state.plan.anchors, s.date).week;
        if (w !== s.planWeek) {
          s.planWeek = w;
          const sel = root.querySelector('[data-k="planWeek"]');
          if (sel) sel.value = String(w);
        }
      }
    }
    else if (k === 'startTime') { if (/^\d{2}:\d{2}$/.test(t.value)) s.startTime = t.value; }
    else if (k === 'durationMin') s.durationMin = intOrNull(t.value, 1, 600);
    else if (k === 'cardioMin') s.cardioMin = intOrNull(t.value, 0, 600);
    else if (k === 'planWeek') {
      s.planWeek = Number(t.value);
      if (editing.isNew) { rebuildNew(); navigate(location.hash); }
    } else if (k === 'notes') s.notes = t.value.slice(0, 4000);
    else if (['warmupDone', 'cooldownDone', 'symptoms'].includes(k)) s[k] = t.checked;
  };

  const onClick = (e) => {
    const t = e.target;
    const s = sess();
    const wb = t.closest('[data-wb]');
    if (wb) {
      const v = toggleWb(root, wb);
      if (wb.dataset.wb === 'before') s.wellbeingBefore = v; else s.wellbeingAfter = v;
      return;
    }
    const seg = t.closest('[data-seg]');
    if (seg) {
      if (seg.dataset.seg === 'etype' && seg.dataset.value !== s.type) {
        s.type = seg.dataset.value;
        rebuildNew();
        navigate(location.hash);
      } else if (seg.dataset.seg === 'estatus') {
        s.status = seg.dataset.value;
        root.querySelectorAll('[data-seg="estatus"]').forEach((b) => {
          const on = b === seg;
          b.classList.toggle('active', on);
          b.setAttribute('aria-checked', String(on));
        });
      }
      return;
    }
    const done = t.closest('[data-f-done]');
    if (done) {
      const row = done.closest('[data-set]');
      const [i, j] = row.dataset.set.split('-').map(Number);
      const st = s.exercises[i].sets[j];
      st.done = !st.done;
      row.classList.toggle('is-done', st.done);
      done.setAttribute('aria-pressed', String(st.done));
      return;
    }
    const add = t.closest('[data-add-set]');
    if (add) {
      const ex = s.exercises[Number(add.dataset.addSet)];
      const lastSet = ex.sets[ex.sets.length - 1] || {};
      ex.sets.push({ weight: lastSet.weight ?? null, reps: lastSet.reps ?? null, rpe: null, done: true, optional: s.type !== 'F' });
      navigate(location.hash);
      return;
    }
    const rem = t.closest('[data-remove-set]');
    if (rem) {
      const ex = s.exercises[Number(rem.dataset.removeSet)];
      if (ex.sets.length > 1) ex.sets.pop();
      navigate(location.hash);
      return;
    }
    const exRem = t.closest('[data-edit-remove]');
    if (exRem) {
      s.exercises.splice(Number(exRem.dataset.editRemove), 1);
      navigate(location.hash);
      return;
    }
    if (t.closest('[data-act="edit-addex"]')) {
      addExercises(s);
      return;
    }
    if (t.closest('[data-cancel]')) editing = null;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const s = sess();
    if (!isISODate(s.date)) { toast('Bitte ein gültiges Datum eingeben.', { type: 'error' }); return; }
    if (s.date > todayISO()) { toast('Das Datum liegt in der Zukunft.', { type: 'error' }); return; }
    s.exercises.forEach((ex) => {
      const req = ex.sets.filter((st) => !st.optional);
      ex.done = req.length > 0 && req.every((st) => st.done) && !ex.skipped;
    });
    s.updatedAt = new Date().toISOString();
    if (!s.durationMin) s.durationMin = null;
    const isNew = editing.isNew;
    store.update((st) => {
      if (isNew) st.sessions.push(s);
      else st.sessions = st.sessions.map((x) => (x.id === s.id ? s : x));
    }, { now: true, render: false });
    editing = null;
    toast(isNew ? 'Einheit eingetragen' : 'Änderungen gespeichert');
    navigate(`#/verlauf/${s.id}`, { replace: true });
  };

  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  form.addEventListener('submit', onSubmit);
  return (opts) => {
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
    root.removeEventListener('click', onClick);
    form.removeEventListener('submit', onSubmit);
    if (opts && opts.leaving && !location.hash.includes('/bearbeiten') && !location.hash.includes('/neu')) editing = null;
  };
}
