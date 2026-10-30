// Trainingsmodus: Auswahl, Vorab-Check, Sätze erfassen, Pausen, Abschluss oder Abbruch.
import { store } from '../store.js';
import { esc, todayISO, nowTimeHM, relativeDay, formatClock, formatDuration, fmtNum } from '../util.js';
import {
  weekInfo, phaseForWeek, nextWorkoutType, createSession, rpeTarget, rpeSpec, setsLabel, repsLabel, lastPerformance,
  progressionHint, rpeFeedback, isExerciseDone, sessionProgress, sessionAvgRpe, durationFromStart,
  sessionsInWeek, workoutExerciseIds, TOTAL_WEEKS, recoveryStatus, countByPlanWeek,
} from '../plan.js';
import { EXERCISES, WORKOUTS } from '../exercises.js';
import { illustration } from '../illustrations.js';
import { WARMUP, COOLDOWN, PRECHECK_ITEMS, ABORT_REASONS, TALK_TEST, EMERGENCY_SHORT } from '../content.js';
import {
  icon, pageHead, openSheet, confirmDialog, toast, segmented, timer, unlockAudio, keepScreenOn, banner,
} from '../ui.js';
import { navigate } from '../router.js';
import {
  openWarningSheet, openExerciseSheet, openRpeSheet, doBackup, backupAgeDays,
} from './dialogs.js';
import {
  wellbeingPicker, toggleWb, wellbeingText, rpeOptions, numStr, numOrNull, intOrNull, lastNoteFor, lastText,
} from './common.js';

const ui = { type: null, week: null, open: null, finished: null };
const CARDIO_TIMER = { 1: 10, 2: 10, 3: 15, 4: 15, 5: 20 };
const SYMPTOM_REASONS = [ABORT_REASONS[0], ABORT_REASONS[1]];

const elapsedSec = (d) => {
  const start = Date.parse(d.startedAt);
  return Number.isFinite(start) ? Math.max(0, (Date.now() - start) / 1000) : 0;
};

/* ---------- Start: Vorab-Check ---------- */

export function startFlow(type, planWeek = null) {
  const s = store.state;
  if (s.draft) { navigate('#/training'); return; }
  const today = todayISO();
  const week = planWeek || weekInfo(s.plan.anchors, today).week;
  const needClear = !s.profile.clearance;
  const body = `
    ${needClear ? `<div class="callout callout-warn">
      <p class="callout-title">Ärztliche Freigabe</p>
      <p>Trainiere erst, wenn deine Kardiologin oder dein Kardiologe bzw. deine Ärztin oder dein Arzt dieses Training individuell freigegeben hat.</p>
      <label class="check-row"><input type="checkbox" data-clear><span>Eine individuelle ärztliche Trainingsfreigabe liegt vor.</span></label>
    </div>` : ''}
    <p class="field-label">Wie fühlst du dich gerade? <span class="muted">(optional)</span></p>
    ${wellbeingPicker('before', null)}
    <p class="field-label">Kurzer Check</p>
    <div class="check-list">${PRECHECK_ITEMS.map((t, i) => `<label class="check-row"><input type="checkbox" data-pc="${i}"><span>${esc(t)}</span></label>`).join('')}</div>
    <p class="sheet-hint">Trifft ein Punkt nicht zu, verzichte heute auf das Training und lass Beschwerden ärztlich abklären. <strong>Hast du gerade Brustschmerzen, Druck in der Brust oder starke Atemnot: Notruf 112.</strong></p>
    <div class="btn-stack">
      <button type="button" class="btn btn-primary btn-lg" data-go disabled>${icon('play')}${esc(WORKOUTS[type].name)} starten</button>
      <button type="button" class="btn btn-secondary" data-sheet-close>Heute nicht trainieren</button>
    </div>`;
  openSheet({
    title: 'Vor dem Training',
    body,
    className: 'sheet-tall',
    onMount(sheet, close) {
      let wb = null;
      const go = sheet.querySelector('[data-go]');
      const check = () => {
        const all = [...sheet.querySelectorAll('[data-pc]')].every((c) => c.checked);
        const clear = !needClear || sheet.querySelector('[data-clear]').checked;
        go.disabled = !(all && clear);
      };
      sheet.addEventListener('change', check);
      sheet.addEventListener('click', (e) => {
        const b = e.target.closest('[data-wb]');
        if (b) wb = toggleWb(sheet, b);
      });
      go.addEventListener('click', () => {
        unlockAudio();
        const draft = createSession({ type, planWeek: week, date: todayISO(), startTime: nowTimeHM(), state: store.state });
        draft.wellbeingBefore = wb;
        draft.precheck = true;
        store.update((x) => {
          if (needClear) x.profile.clearance = true;
          x.draft = draft;
        }, { now: true, render: false });
        ui.open = null;
        ui.finished = null;
        if (store.state.settings.keepAwake) keepScreenOn(true);
        close(true);
        navigate('#/training');
        window.scrollTo(0, 0);
      });
    },
  });
}

/* ---------- Ansicht: Auswahl ---------- */

function renderStart() {
  const s = store.state;
  const today = todayISO();
  const info = weekInfo(s.plan.anchors, today);
  const suggested = nextWorkoutType(s.sessions);
  const type = ui.type || suggested;
  if (ui.week && ui.week > info.week) ui.week = null;
  const week = ui.week || info.week;
  const phase = phaseForWeek(week);
  const target = rpeTarget(phase, s.profile);
  const ids = workoutExerciseIds(type, week, s.plan);
  const recovery = recoveryStatus(s.sessions, s.plan.anchors, today);
  const thisWeek = sessionsInWeek(s.sessions, info).length;
  const curPhase = phaseForWeek(info.week);

  const typeOpt = (t) => ({
    value: t,
    html: `${esc(WORKOUTS[t].name)}${suggested === t ? '<small>als Nächstes</small>' : ''}`,
  });
  const notes = [];
  if (recovery.kind === 'rest') notes.push(banner({ type: 'info', iconName: 'moon', title: recovery.title, text: esc(recovery.text) }));
  else if (thisWeek >= curPhase.sessionsMax) notes.push(banner({ type: 'info', iconName: 'check', title: 'Wochenziel erreicht', text: 'Du hast diese Woche schon alle geplanten Einheiten absolviert. Zusätzliche Bewegung am besten als lockerer Spaziergang.' }));

  return `
    ${pageHead({ title: 'Training', subtitle: esc(`Woche ${info.week} von ${TOTAL_WEEKS}: ${curPhase.name}`) })}
    ${notes.length ? `<div class="stack">${notes.join('')}</div>` : ''}
    <section class="card">
      ${segmented('type', [typeOpt('A'), typeOpt('B')], type, 'seg-lg')}
      <div class="spec">
        <div><strong>${esc(setsLabel(phase).replace(/ Sätze| Satz/, ''))}</strong><span>${phase.setsMax === 1 ? 'Satz' : 'Sätze'}</span></div>
        <div><strong>${esc(repsLabel(phase).replace(' Wdh.', ''))}</strong><span><span class="lbl-long">Wiederholungen</span><span class="lbl-short">Wdh.</span></span></div>
        <div><strong>${esc(rpeSpec(phase, target).value)}</strong><span>${esc(rpeSpec(phase, target).caption)}</span></div>
      </div>
      <ul class="ex-preview">${ids.map((id) => `
        <li><a class="ex-preview-item" href="#/uebung/${id}">
          <span class="ex-thumb">${illustration(id)}</span>
          <span class="ex-preview-text"><strong>${esc(EXERCISES[id].name)}</strong><span>${esc(EXERCISES[id].optional ? 'Optional' : EXERCISES[id].muscles)}</span></span>
          ${icon('chevronRight', 'chev')}</a></li>`).join('')}
      </ul>
    </section>
    <details class="card disclosure"${ui.week && ui.week !== info.week ? ' open' : ''}>
      <summary>Verpasste Einheit nachholen</summary>
      <p class="body-text">Wähle die Planwoche, zu der diese Einheit zählen soll. Es gelten dann deren Vorgaben.</p>
      <label class="field"><span class="field-label">Zählt zu</span>
        <select class="input" data-week-select>${Array.from({ length: Math.min(TOTAL_WEEKS, info.week) }, (_, i) => i + 1)
          .map((w) => `<option value="${w}"${w === week ? ' selected' : ''}>Woche ${w}${w === info.week ? ' (aktuell)' : ''}</option>`).join('')}</select>
      </label>
    </details>
    <button type="button" class="btn btn-primary btn-lg" data-act="begin">${icon('play')}Weiter zum Vorab-Check</button>
    <a class="text-link center" href="#/verlauf/neu">Bereits trainiert? Einheit nachträglich eintragen</a>`;
}

/* ---------- Ansicht: laufende Einheit ---------- */

function setRow(i, j, st, target, def) {
  const fb = rpeFeedback(st.rpe, target);
  const n = j + 1;
  return `<div class="set-row${st.done ? ' is-done' : ''}${st.optional ? ' is-optional' : ''}" data-set="${i}-${j}">
      <span class="set-n">${n}${st.optional ? '<small>optional</small>' : ''}</span>
      <input class="input input-num" type="text" inputmode="decimal" autocomplete="off" data-f="weight" value="${esc(numStr(st.weight))}" placeholder="–" aria-label="Satz ${n}: Gewicht in ${esc(def.weightLabel)}">
      <input class="input input-num" type="text" inputmode="numeric" autocomplete="off" data-f="reps" value="${esc(numStr(st.reps))}" placeholder="–" aria-label="Satz ${n}: Wiederholungen">
      <label class="rpe-pick${st.rpe ? ' has-value' : ''}"><span class="rpe-val" aria-hidden="true">${st.rpe ?? 'RPE'}</span>
        <select data-f="rpe" aria-label="Satz ${n}: Belastung (RPE)">${rpeOptions(st.rpe)}</select></label>
      <button type="button" class="set-check" data-set-done aria-pressed="${st.done}" aria-label="Satz ${n} erledigt">${icon('check')}</button>
    </div>
    <p class="set-fb${fb ? ` fb-${fb.level}` : ''}" data-fb="${i}-${j}"${fb ? '' : ' hidden'}>${fb ? esc(fb.text) : ''}</p>`;
}

function exerciseStatus(ex, phase) {
  if (ex.skipped) return 'Übersprungen';
  if (isExerciseDone(ex)) return 'Erledigt';
  const done = ex.sets.filter((s) => s.done && !s.optional).length;
  const req = ex.sets.filter((s) => !s.optional).length;
  const base = `${setsLabel(phase)} × ${repsLabel(phase)}`;
  return done ? `${done} von ${req} Sätzen erledigt` : base;
}

function exerciseCard(d, ex, i, phase, target) {
  const def = EXERCISES[ex.id];
  const done = isExerciseDone(ex);
  const open = ui.open === i;
  const sessions = store.state.sessions;
  const last = lastPerformance(sessions, ex.id);
  const ref = !last && ex.id === 'chestpress_light' ? lastPerformance(sessions, 'chestpress') : null;
  const hint = progressionHint(last, phase, target);
  const note = lastNoteFor(sessions, ex.id);
  let lastLine;
  if (last) lastLine = `Zuletzt (${esc(relativeDay(last.date))}): <strong>${esc(lastText(last, def))}</strong>`;
  else if (ref) lastLine = `In Training A zuletzt <strong>${esc(lastText(ref, EXERCISES.chestpress))}</strong> – hier etwas leichter wählen.`;
  else lastLine = 'Zum ersten Mal: Wähle ein sehr leichtes Gewicht und lerne die Bewegung kennen.';

  return `<li class="ex-card${done ? ' is-done' : ''}${ex.skipped ? ' is-skipped' : ''}${open ? ' is-open' : ''}" data-ex="${i}">
    <button type="button" class="ex-head" data-toggle-ex="${i}" aria-expanded="${open}">
      <span class="ex-num" aria-hidden="true">${done ? icon('check') : ex.skipped ? icon('skip') : i + 1}</span>
      <span class="ex-head-text"><span class="ex-name">${esc(def.name)}${ex.optional ? ' <span class="tag">optional</span>' : ''}</span>
        <span class="ex-meta">${esc(exerciseStatus(ex, phase))}</span></span>
      ${icon('chevronDown', 'chev')}
    </button>
    <div class="ex-body">
      <button type="button" class="ex-visual" data-ex-info="${ex.id}" aria-label="Anleitung für ${esc(def.name)} öffnen">
        ${illustration(ex.id)}<span class="ex-visual-cta">${icon('book')}Anleitung</span>
      </button>
      ${def.note ? `<p class="inline-note">${icon('info')}<span>${esc(def.note)}</span></p>` : ''}
      <p class="ex-cue">${esc(def.breathing)}</p>
      <p class="ex-last">${lastLine}</p>
      ${note ? `<p class="ex-last">Deine Notiz: <em>${esc(note)}</em></p>` : ''}
      ${hint ? `<p class="inline-note good">${icon('info')}<span>${esc(hint)}</span></p>` : ''}
      <div class="set-grid" role="group" aria-label="Sätze ${esc(def.name)}">
        <div class="set-head" aria-hidden="true"><span>Satz</span><span>${esc(def.weightLabel)}</span><span>Wdh.</span><span>RPE</span><span>Fertig</span></div>
        ${ex.sets.map((st, j) => setRow(i, j, st, target, def)).join('')}
      </div>
      <label class="field field-compact"><span class="sr-only">Notiz zur Übung</span>
        <textarea class="input" rows="1" data-ex-notes="${i}" placeholder="Notiz, z. B. Sitzeinstellung">${esc(ex.notes)}</textarea></label>
      <div class="ex-actions">
        <button type="button" class="btn btn-sm ${done ? 'btn-good' : 'btn-secondary'}" data-ex-done="${i}" aria-pressed="${done}">${icon('check')}${done ? 'Erledigt' : 'Übung erledigt'}</button>
        <button type="button" class="btn btn-sm btn-quiet" data-ex-skip="${i}" aria-pressed="${ex.skipped}">${ex.skipped ? 'Doch machen' : 'Überspringen'}</button>
      </div>
    </div>
  </li>`;
}

function blockCard(kind, def, done) {
  return `<section class="block${done ? ' is-done' : ''}" data-block="${kind}">
    <div class="block-ill">${illustration('bike')}</div>
    <div class="block-body">
      <p class="block-title">${esc(def.title)}<span class="block-dur">${esc(def.duration)}</span></p>
      <p class="block-text">${esc(def.text)}</p>
      <p class="block-text muted">${esc(def.extra)}</p>
      <div class="block-actions">
        <button type="button" class="btn btn-sm btn-secondary" data-timer-start="${kind}">${icon('timer')}${def.timerMin} Min.</button>
        <button type="button" class="btn btn-sm ${done ? 'btn-good' : 'btn-secondary'}" data-block-done="${kind}" aria-pressed="${done}">${icon('check')}${done ? 'Erledigt' : 'Erledigt?'}</button>
      </div>
    </div>
  </section>`;
}

function cardioCard(d, phase) {
  return `<section class="block block-cardio">
    <div class="block-body">
      <p class="block-title">Ausdauer<span class="block-dur">optional</span></p>
      <p class="block-text">${esc(phase.cardio)}, danach abwärmen. ${esc(TALK_TEST.split('. ')[0])}.</p>
      <div class="block-actions">
        <button type="button" class="btn btn-sm btn-secondary" data-timer-start="cardio">${icon('timer')}${CARDIO_TIMER[phase.id]} Min.</button>
        <label class="mini-field"><input class="input input-num" type="text" inputmode="numeric" data-cardio value="${esc(numStr(d.cardioMin))}" placeholder="0" aria-label="Ausdauer in Minuten"><span>Min.</span></label>
      </div>
    </div>
  </section>`;
}

function progText(p) {
  return `${p.handled} von ${p.total} Übungen${p.optionalDone ? ` (+${p.optionalDone} optional)` : ''}`;
}

function firstOpenIndex(d) {
  const idx = d.exercises.findIndex((ex) => !isExerciseDone(ex) && !ex.skipped);
  return idx;
}

function renderSession(d) {
  if (ui.open === null) ui.open = firstOpenIndex(d);
  const s = store.state;
  const phase = phaseForWeek(d.planWeek);
  const target = rpeTarget(phase, s.profile);
  const prog = sessionProgress(d);
  const pct = prog.total ? prog.handled / prog.total : 0;
  const hr = s.profile.hrLimit;
  return `<div class="session">
    <header class="session-head">
      <div class="session-id">
        <p class="session-title">${esc(WORKOUTS[d.type].name)}</p>
        <p class="session-sub">Woche ${d.planWeek}: ${esc(phase.name)}</p>
      </div>
      <span class="session-clock" data-elapsed aria-label="Trainingsdauer">${formatClock(elapsedSec(d))}</span>
      <button type="button" class="icon-btn icon-btn-danger" data-act="warn" aria-label="Warnzeichen und Training beenden">${icon('alert')}</button>
    </header>
    <div class="session-progress" aria-hidden="true"><span data-progbar style="transform:scaleX(${pct.toFixed(3)})"></span></div>
    <p class="session-count" data-progtext>${progText(prog)}</p>
    <div class="targets">
      <span class="target">${esc(setsLabel(phase))}</span>
      <span class="target">${esc(repsLabel(phase))}</span>
      <button type="button" class="target target-btn" data-act="rpe">${esc(target.label)}${icon('info')}</button>
    </div>
    ${hr ? `<p class="inline-note">${icon('heart')}<span><strong>Ärztliche Pulsobergrenze: ${hr} Schläge pro Minute – nicht überschreiten.</strong> Zusätzlich gelten RPE-Ziel und Sprechtest.</span></p>` : ''}
    ${blockCard('warmup', WARMUP, d.warmupDone)}
    <ol class="ex-list">${d.exercises.map((ex, i) => exerciseCard(d, ex, i, phase, target)).join('')}</ol>
    ${cardioCard(d, phase)}
    ${blockCard('cooldown', COOLDOWN, d.cooldownDone)}
    <div class="session-actions">
      <button type="button" class="btn btn-primary btn-lg" data-act="finish">${icon('check')}Training abschließen</button>
      <button type="button" class="btn btn-quiet text-danger" data-act="discard">Training verwerfen</button>
    </div>
  </div>`;
}

/* ---------- Ansicht: Abschluss ---------- */

function renderCompletion(session) {
  const s = store.state;
  const aborted = session.status === 'aborted';
  const prog = sessionProgress(session);
  const avg = sessionAvgRpe(session);
  const phase = phaseForWeek(session.planWeek);
  const count = countByPlanWeek(s.sessions)[session.planWeek] || 0;
  const age = backupAgeDays();
  const wb = session.wellbeingBefore || session.wellbeingAfter
    ? `${wellbeingText(session.wellbeingBefore)} → ${wellbeingText(session.wellbeingAfter)}` : '–';
  return `
    <section class="done-hero${aborted ? ' is-aborted' : ''}">
      <div class="done-badge">${icon(aborted ? 'stop' : 'check')}</div>
      <h1 class="large-title">${aborted ? 'Training beendet' : 'Training gespeichert'}</h1>
      <p class="page-sub">${aborted
        ? (session.symptoms ? 'Gut, dass du auf deinen Körper hörst. Die bisherigen Sätze sind gespeichert.' : 'Die bisherigen Sätze sind gespeichert.')
        : `${esc(WORKOUTS[session.type].name)}, Woche ${session.planWeek}: ${count} von ${phase.sessionsMin} Einheiten`}</p>
    </section>
    ${session.symptoms ? banner({
      type: 'danger', title: 'Beschwerden ärztlich abklären',
      text: `Ruhe dich aus und lass die Beschwerden vor dem nächsten Training ärztlich abklären. ${esc(EMERGENCY_SHORT)}`,
      actions: `<a class="btn btn-sm btn-emergency" href="tel:112">${icon('phone')}Notruf 112</a>`,
    }) : ''}
    <section class="tiles">
      <div class="tile"><span class="tile-label">Dauer</span><span class="tile-value tile-value-sm">${esc(formatDuration(session.durationMin))}</span></div>
      <div class="tile"><span class="tile-label">Übungen</span><span class="tile-value tile-value-sm">${prog.handled} von ${prog.total}</span></div>
      <div class="tile"><span class="tile-label">Ø Belastung</span><span class="tile-value tile-value-sm">${avg != null ? `RPE ${fmtNum(avg, 1)}` : '–'}</span></div>
      <div class="tile"><span class="tile-label">Wohlbefinden</span><span class="tile-value tile-value-xs">${esc(wb)}</span></div>
    </section>
    ${aborted ? '' : `<section class="card card-quiet"><div class="coach"><span class="coach-icon">${icon('moon')}</span>
      <div><p class="coach-title">Jetzt erholen</p><p class="coach-text">Gönn dir morgen einen Ruhetag. Ein lockerer Spaziergang unterstützt die Erholung.</p></div></div></section>`}
    ${age == null || age >= 7 ? `<section class="card">
      <p class="card-title">Daten sichern</p>
      <p class="body-text">Eine Sicherung dauert nur einen Moment und schützt deinen Verlauf.</p>
      <button type="button" class="btn btn-secondary" data-act="backup">${icon('download')}Sicherung erstellen</button>
    </section>` : ''}
    <div class="btn-stack">
      <a class="btn btn-primary" href="#/heute">Zur Übersicht</a>
      <a class="btn btn-secondary" href="#/verlauf/${esc(session.id)}">Einheit ansehen</a>
    </div>`;
}

export function render() {
  const s = store.state;
  if (s.draft) return renderSession(s.draft);
  if (ui.finished) {
    const session = s.sessions.find((x) => x.id === ui.finished.id);
    if (session) return renderCompletion(session);
    ui.finished = null;
  }
  return renderStart();
}

/* ---------- Interaktion ---------- */

function refreshCard(root, i) {
  const d = store.state.draft;
  const phase = phaseForWeek(d.planWeek);
  const target = rpeTarget(phase, store.state.profile);
  const old = root.querySelector(`.ex-card[data-ex="${i}"]`);
  if (!old) return;
  const tmp = document.createElement('ol');
  tmp.innerHTML = exerciseCard(d, d.exercises[i], i, phase, target);
  old.replaceWith(tmp.firstElementChild);
}

function refreshProgress(root) {
  const prog = sessionProgress(store.state.draft);
  const bar = root.querySelector('[data-progbar]');
  const txt = root.querySelector('[data-progtext]');
  if (bar) bar.style.transform = `scaleX(${(prog.total ? prog.handled / prog.total : 0).toFixed(3)})`;
  if (txt) txt.textContent = progText(prog);
}

function setOpen(root, idx, scroll = true) {
  ui.open = idx;
  root.querySelectorAll('.ex-card').forEach((c) => {
    const on = Number(c.dataset.ex) === idx;
    c.classList.toggle('is-open', on);
    c.querySelector('.ex-head').setAttribute('aria-expanded', String(on));
  });
  if (scroll && idx >= 0) {
    const card = root.querySelector(`.ex-card[data-ex="${idx}"]`);
    if (card) setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
  }
}

function advance(root, from) {
  const d = store.state.draft;
  let next = -1;
  for (let k = from + 1; k < d.exercises.length; k++) {
    const ex = d.exercises[k];
    if (!isExerciseDone(ex) && !ex.skipped) { next = k; break; }
  }
  setOpen(root, next, next >= 0);
}

function lastRequiredIndex(d) {
  let idx = -1;
  d.exercises.forEach((e, i) => { if (!e.optional) idx = i; });
  return idx;
}

function finishSheet() {
  const d = store.state.draft;
  const prog = sessionProgress(d);
  const dur = durationFromStart(d) || 1;
  const suggested = Math.min(dur, 600);
  const body = `
    ${prog.handled < prog.total ? `<p class="callout">Noch nicht alle Übungen erledigt (${prog.handled} von ${prog.total}). Du kannst trotzdem abschließen.</p>` : ''}
    ${!d.cooldownDone ? '<p class="callout">Denk ans Abwärmen: 5–10 Minuten locker ausradeln oder gehen – nicht abrupt aufhören.</p>' : ''}
    <label class="field"><span class="field-label">Dauer in Minuten</span>
      <input class="input" type="text" inputmode="numeric" data-fin="duration" value="${suggested}"></label>
    ${dur > 180 ? '<p class="sheet-hint">Die Einheit lief ungewöhnlich lange – bitte prüfe die Dauer.</p>' : ''}
    <p class="field-label">Wie fühlst du dich jetzt? <span class="muted">(optional)</span></p>
    ${wellbeingPicker('after', d.wellbeingAfter)}
    <label class="field"><span class="field-label">Ausdauer im Anschluss in Minuten <span class="muted">(optional)</span></span>
      <input class="input" type="text" inputmode="numeric" data-fin="cardio" value="${esc(numStr(d.cardioMin))}"></label>
    <label class="check-row"><input type="checkbox" data-fin="symptoms"><span>Ich hatte während des Trainings ungewöhnliche Beschwerden.</span></label>
    <div class="callout callout-danger" data-symptom-note hidden>Bitte lass die Beschwerden vor dem nächsten Training ärztlich abklären. ${esc(EMERGENCY_SHORT)}</div>
    <label class="field"><span class="field-label">Notiz <span class="muted">(optional)</span></span>
      <textarea class="input" rows="3" data-fin="notes" placeholder="Wie lief es? Gab es Auffälligkeiten?">${esc(d.notes)}</textarea></label>
    <div class="btn-stack">
      <button type="button" class="btn btn-primary btn-lg" data-fin-save>${icon('check')}Training speichern</button>
      <button type="button" class="btn btn-secondary" data-sheet-close>Zurück zum Training</button>
    </div>`;
  openSheet({
    title: 'Training abschließen',
    body,
    className: 'sheet-tall',
    onMount(sheet, close) {
      let wb = d.wellbeingAfter;
      sheet.addEventListener('click', (e) => {
        const b = e.target.closest('[data-wb]');
        if (b) wb = toggleWb(sheet, b);
      });
      const sym = sheet.querySelector('[data-fin="symptoms"]');
      sym.addEventListener('change', () => { sheet.querySelector('[data-symptom-note]').hidden = !sym.checked; });
      sheet.querySelector('[data-fin-save]').addEventListener('click', () => {
        const val = (k) => sheet.querySelector(`[data-fin="${k}"]`);
        const now = new Date().toISOString();
        const session = {
          ...store.state.draft,
          status: 'completed',
          endedAt: now,
          durationMin: intOrNull(val('duration').value, 1, 600) ?? dur,
          wellbeingAfter: wb,
          cardioMin: intOrNull(val('cardio').value, 0, 600),
          symptoms: sym.checked,
          notes: val('notes').value.trim().slice(0, 4000),
          updatedAt: now,
        };
        close(true);
        saveFinished(session);
      });
    },
  });
}

function saveFinished(session) {
  timer.stop();
  keepScreenOn(false);
  ui.finished = { id: session.id };
  ui.open = null;
  ui.type = null;
  ui.week = null;
  store.update((s) => {
    s.sessions.push(session);
    s.draft = null;
  }, { now: true });
  window.scrollTo(0, 0);
}

function abortSession(reason) {
  const d = store.state.draft;
  const now = new Date().toISOString();
  saveFinished({
    ...d,
    status: 'aborted',
    abortReason: reason,
    symptoms: d.symptoms || SYMPTOM_REASONS.includes(reason),
    endedAt: now,
    durationMin: durationFromStart(d),
    updatedAt: now,
  });
}

function mountSession(root) {
  const draft = () => store.state.draft;
  const clock = root.querySelector('[data-elapsed]');
  const iv = setInterval(() => {
    if (draft() && clock) clock.textContent = formatClock(elapsedSec(draft()));
  }, 1000);
  timer.sound = store.state.settings.sound;
  if (store.state.settings.keepAwake) keepScreenOn(true);

  const onInput = (e) => {
    const t = e.target;
    const row = t.closest('[data-set]');
    if (row && t.dataset.f) {
      const [i, j] = row.dataset.set.split('-').map(Number);
      const f = t.dataset.f;
      store.update((s) => {
        const st = s.draft.exercises[i].sets[j];
        if (f === 'weight') st.weight = numOrNull(t.value, 0, 1000);
        else if (f === 'reps') st.reps = intOrNull(t.value, 0, 500);
        else if (f === 'rpe') st.rpe = t.value ? Number(t.value) : null;
        s.draft.updatedAt = new Date().toISOString();
      }, { render: false });
      if (f === 'rpe') {
        const label = row.querySelector('.rpe-pick');
        label.classList.toggle('has-value', !!t.value);
        label.querySelector('.rpe-val').textContent = t.value || 'RPE';
        const d = draft();
        const target = rpeTarget(phaseForWeek(d.planWeek), store.state.profile);
        const fb = rpeFeedback(d.exercises[i].sets[j].rpe, target);
        const p = root.querySelector(`[data-fb="${i}-${j}"]`);
        if (p) {
          p.hidden = !fb;
          p.className = `set-fb${fb ? ` fb-${fb.level}` : ''}`;
          p.textContent = fb ? fb.text : '';
        }
      }
      return;
    }
    if (t.dataset.exNotes !== undefined) {
      const i = Number(t.dataset.exNotes);
      store.update((s) => { s.draft.exercises[i].notes = t.value.slice(0, 2000); }, { render: false });
      return;
    }
    if (t.dataset.cardio !== undefined) {
      store.update((s) => { s.draft.cardioMin = intOrNull(t.value, 0, 600); }, { render: false });
    }
  };

  const onClick = async (e) => {
    const t = e.target;
    let el = t.closest('[data-set-done]');
    if (el) {
      const row = el.closest('[data-set]');
      const [i, j] = row.dataset.set.split('-').map(Number);
      const wasDone = isExerciseDone(draft().exercises[i]);
      let nowDone = false;
      store.update((s) => {
        const ex = s.draft.exercises[i];
        const st = ex.sets[j];
        st.done = !st.done;
        nowDone = st.done;
        if (nowDone) ex.skipped = false;
        if (!nowDone) ex.done = false;
      }, { render: false });
      row.classList.toggle('is-done', nowDone);
      el.setAttribute('aria-pressed', String(nowDone));
      const isDone = isExerciseDone(draft().exercises[i]);
      if (nowDone) {
        const restSec = store.state.settings.restSec || phaseForWeek(draft().planWeek).restSec;
        const finishedAll = isDone && i >= lastRequiredIndex(draft());
        if (!finishedAll) timer.start('Pause', restSec);
      }
      if (isDone !== wasDone) {
        refreshCard(root, i);
        if (isDone) advance(root, i);
      } else {
        const meta = root.querySelector(`.ex-card[data-ex="${i}"] .ex-meta`);
        if (meta) meta.textContent = exerciseStatus(draft().exercises[i], phaseForWeek(draft().planWeek));
      }
      refreshProgress(root);
      return;
    }
    el = t.closest('[data-toggle-ex]');
    if (el) {
      const i = Number(el.dataset.toggleEx);
      setOpen(root, ui.open === i ? -1 : i);
      return;
    }
    el = t.closest('[data-ex-done]');
    if (el) {
      const i = Number(el.dataset.exDone);
      const was = isExerciseDone(draft().exercises[i]);
      store.update((s) => {
        const ex = s.draft.exercises[i];
        if (was) {
          ex.done = false;
          ex.sets.forEach((st) => { st.done = false; });
        } else {
          ex.done = true;
          ex.skipped = false;
          ex.sets.forEach((st) => { if (!st.optional) st.done = true; });
        }
      }, { render: false });
      refreshCard(root, i);
      refreshProgress(root);
      if (!was) advance(root, i);
      return;
    }
    el = t.closest('[data-ex-skip]');
    if (el) {
      const i = Number(el.dataset.exSkip);
      store.update((s) => {
        const ex = s.draft.exercises[i];
        ex.skipped = !ex.skipped;
        if (ex.skipped) ex.done = false;
      }, { render: false });
      refreshCard(root, i);
      refreshProgress(root);
      if (draft().exercises[i].skipped) advance(root, i);
      return;
    }
    el = t.closest('[data-ex-info]');
    if (el) { openExerciseSheet(el.dataset.exInfo); return; }
    el = t.closest('[data-timer-start]');
    if (el) {
      const k = el.dataset.timerStart;
      const phase = phaseForWeek(draft().planWeek);
      const map = { warmup: ['Aufwärmen', WARMUP.timerMin], cooldown: ['Abwärmen', COOLDOWN.timerMin], cardio: ['Ausdauer', CARDIO_TIMER[phase.id]] };
      timer.sound = store.state.settings.sound;
      timer.start(map[k][0], map[k][1] * 60);
      return;
    }
    el = t.closest('[data-block-done]');
    if (el) {
      const key = el.dataset.blockDone === 'warmup' ? 'warmupDone' : 'cooldownDone';
      store.update((s) => { s.draft[key] = !s.draft[key]; }, { render: false });
      const on = draft()[key];
      el.setAttribute('aria-pressed', String(on));
      el.classList.toggle('btn-good', on);
      el.classList.toggle('btn-secondary', !on);
      el.innerHTML = `${icon('check')}${on ? 'Erledigt' : 'Erledigt?'}`;
      el.closest('.block').classList.toggle('is-done', on);
      return;
    }
    el = t.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'warn') {
      const r = await openWarningSheet({ inSession: true });
      if (r && r.abort && store.state.draft) abortSession(r.reason);
    } else if (act === 'finish') {
      finishSheet();
    } else if (act === 'rpe') {
      openRpeSheet();
    } else if (act === 'discard') {
      const ok = await confirmDialog({
        title: 'Training verwerfen?',
        message: 'Alle Eingaben dieser Einheit werden gelöscht. Bereits gespeicherte Einheiten bleiben erhalten.',
        confirmLabel: 'Verwerfen', danger: true,
      });
      if (ok) {
        timer.stop();
        keepScreenOn(false);
        ui.open = null;
        store.update((s) => { s.draft = null; }, { now: true });
        toast('Training verworfen');
      }
    }
  };

  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
  root.addEventListener('click', onClick);
  return () => {
    clearInterval(iv);
    root.removeEventListener('input', onInput);
    root.removeEventListener('change', onInput);
    root.removeEventListener('click', onClick);
  };
}

function mountStart(root) {
  const onClick = (e) => {
    const seg = e.target.closest('[data-seg="type"]');
    if (seg) { ui.type = seg.dataset.value; navigate('#/training'); return; }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'begin') {
      const s = store.state;
      startFlow(ui.type || nextWorkoutType(s.sessions), ui.week || null);
    } else if (act.dataset.act === 'backup') {
      doBackup();
    }
  };
  const onChange = (e) => {
    if (e.target.matches('[data-week-select]')) {
      ui.week = Number(e.target.value);
      navigate('#/training');
    }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('change', onChange);
  };
}

export function mount(root) {
  if (store.state.draft) return mountSession(root);
  const off = mountStart(root);
  return (opts) => {
    off();
    if (opts && opts.leaving) {
      ui.finished = null;
      ui.week = null;
    }
  };
}
