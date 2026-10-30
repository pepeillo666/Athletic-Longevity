// Plan: 12-Wochen-Übersicht, Phasen, Trainings A/B, Ablauf; außerdem die Übungs-Detailseite.
import { store } from '../store.js';
import { esc, todayISO, formatDate, relativeDay, addDays } from '../util.js';
import {
  PHASES, TOTAL_WEEKS, weekInfo, programStats, phaseWeeksLabel, sessionsLabel, setsLabel, repsLabel, rpeTarget,
  repeatPlanned, anchorsRepeatWeek, anchorsCancelRepeat, startDateOf, lastPerformance,
} from '../plan.js';
import { EXERCISES, WORKOUTS } from '../exercises.js';
import { illustration } from '../illustrations.js';
import { SESSION_FLOW, REST_DAYS, TALK_TEST } from '../content.js';
import { icon, pageHead, settingsButton, toast, confirmDialog } from '../ui.js';
import { openRpeSheet, exerciseDetailHTML } from './dialogs.js';
import { startFlow } from './training.js';
import { lastText } from './common.js';

function weekChip(w, info) {
  const cls = ['wk'];
  let label = '';
  if (w.complete) { cls.push('is-done'); label = 'geschafft'; }
  else if (w.week === info.week && !info.beforeStart) { cls.push('is-current'); label = 'aktuell'; }
  else if (w.done > 0) { cls.push('is-partial'); label = 'begonnen'; }
  return `<li class="${cls.join(' ')}" aria-label="Woche ${w.week}: ${w.done} von ${w.min} Einheiten${label ? `, ${label}` : ''}">
    <span class="wk-num">${w.week}</span><span class="wk-count">${w.complete ? icon('check') : `${w.done}/${w.min}`}</span></li>`;
}

function renderPlan() {
  const s = store.state;
  const today = todayISO();
  const info = weekInfo(s.plan.anchors, today);
  const stats = programStats(s.sessions);
  const repeat = repeatPlanned(s.plan.anchors, today);

  const current = `
    <section class="card card-hero-quiet">
      <p class="card-eyebrow">${info.beforeStart ? 'Startet bald' : info.finished ? 'Programm abgeschlossen' : 'Aktuelle Woche'}</p>
      <h2 class="card-title-lg">Woche ${info.week} von ${TOTAL_WEEKS}</h2>
      <p class="body-text">Plan begonnen am ${esc(formatDate(startDateOf(s.plan.anchors), 'full'))}${info.beforeStart ? '' : `. Diese Woche läuft bis ${esc(formatDate(info.weekEnd, 'long'))}.`}</p>
      ${repeat
        ? `<p class="inline-note good">${icon('repeat')}<span>Woche ${info.week} wird nächste Woche wiederholt.</span></p>
           <button type="button" class="btn btn-secondary" data-act="unrepeat">Wiederholung zurücknehmen</button>`
        : info.beforeStart || info.finished ? ''
          : `<button type="button" class="btn btn-secondary" data-act="repeat">${icon('repeat')}Woche ${info.week} wiederholen</button>`}
      <a class="text-link" href="#/einstellungen">Startdatum oder Woche anpassen</a>
    </section>`;

  const phases = PHASES.map((p) => {
    const t = rpeTarget(p, s.profile);
    const weeks = stats.weeks.filter((w) => w.week >= p.from && w.week <= p.to);
    const isCurrent = info.week >= p.from && info.week <= p.to;
    return `<section class="card phase${isCurrent ? ' is-current' : ''}">
      <div class="card-row">
        <div><p class="card-eyebrow">${esc(phaseWeeksLabel(p))}</p><h3 class="card-title">Phase ${p.id}: ${esc(p.name)}</h3></div>
        ${isCurrent ? '<span class="pill pill-good">jetzt</span>' : ''}
      </div>
      <ol class="wk-row">${weeks.map((w) => weekChip(w, info)).join('')}</ol>
      <dl class="facts">
        <div><dt>Trainingstage</dt><dd>${esc(sessionsLabel(p))}</dd></div>
        <div><dt>Sätze pro Übung</dt><dd>${esc(setsLabel(p))}</dd></div>
        <div><dt>Wiederholungen</dt><dd>${esc(repsLabel(p))}</dd></div>
        <div><dt>Belastung</dt><dd>${esc(t.label)}</dd></div>
        <div><dt>Pause zwischen Sätzen</dt><dd>${p.restSec} Sekunden</dd></div>
        <div><dt>Ausdauer</dt><dd>${esc(p.cardio)}</dd></div>
      </dl>
      <p class="body-text">${esc(p.focus)}</p>
    </section>`;
  }).join('');

  const workout = (type) => {
    const w = WORKOUTS[type];
    return `<section class="card">
      <div class="card-row"><h3 class="card-title">${esc(w.name)}</h3>
        <button type="button" class="btn btn-sm btn-secondary" data-act="start" data-type="${type}">${icon('play')}Starten</button></div>
      <ul class="ex-preview">${w.exercises.map((id) => `
        <li><a class="ex-preview-item" href="#/uebung/${id}">
          <span class="ex-thumb">${illustration(id)}</span>
          <span class="ex-preview-text"><strong>${esc(EXERCISES[id].name)}</strong>
            <span>${esc(EXERCISES[id].optional ? `Optional, ab Woche ${s.plan.bicepsFromWeek}` : EXERCISES[id].muscles)}</span></span>
          ${icon('chevronRight', 'chev')}</a></li>`).join('')}</ul>
    </section>`;
  };

  return `
    ${pageHead({ title: 'Plan', subtitle: '12 Wochen mit zwei Ganzkörpereinheiten im Wechsel', actions: settingsButton() })}
    ${current}
    <h2 class="section-title">Ablauf jeder Einheit</h2>
    <section class="card">
      <ol class="flow">${SESSION_FLOW.map((f) => `<li><strong>${esc(f.title)}</strong><span>${esc(f.text)}</span></li>`).join('')}</ol>
      <p class="body-text muted">${esc(REST_DAYS)}</p>
    </section>
    <h2 class="section-title">Die Trainings</h2>
    ${workout('A')}
    ${workout('B')}
    <h2 class="section-title">Die fünf Phasen</h2>
    <p class="body-text">Gesteigert wird nur bei guter Verträglichkeit, sauberer Technik und im Rahmen deiner ärztlichen Freigabe. Die App erhöht Gewichte nie automatisch – du kannst Wochen jederzeit wiederholen.</p>
    ${phases}
    <section class="card card-quiet">
      <h3 class="card-title">Belastung richtig steuern</h3>
      <p class="body-text">${esc(TALK_TEST)}</p>
      <button type="button" class="btn btn-secondary" data-act="rpe">${icon('info')}Belastungsskala (RPE) ansehen</button>
    </section>`;
}

function renderExercise(id) {
  const ex = EXERCISES[id];
  if (!ex) {
    return `${pageHead({ title: 'Übung nicht gefunden', back: { href: '#/plan', label: 'Plan' } })}`;
  }
  const last = lastPerformance(store.state.sessions, id);
  return `
    ${pageHead({ title: ex.name, subtitle: esc(ex.muscles), back: { href: '#/plan', label: 'Plan' } })}
    ${last ? `<p class="inline-note">${icon('history')}<span>Zuletzt ${esc(relativeDay(last.date))}: ${esc(lastText(last, ex))}</span></p>` : ''}
    <article class="card exercise-detail">${exerciseDetailHTML(id)}</article>`;
}

export function render(params = {}) {
  if (params.exercise) return renderExercise(params.exercise);
  return renderPlan();
}

export function mount(root) {
  const onClick = async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const today = todayISO();
    const act = el.dataset.act;
    if (act === 'repeat') {
      const info = weekInfo(store.state.plan.anchors, today);
      const ok = await confirmDialog({
        title: `Woche ${info.week} wiederholen?`,
        message: `Ab ${esc(formatDate(addDays(info.weekStart, 7), 'long'))} geht es nicht mit Woche ${info.week + 1} weiter, sondern noch einmal mit Woche ${info.week}. Das ist sinnvoll, wenn sich die aktuelle Belastung noch anstrengend anfühlt.`,
        confirmLabel: 'Wiederholen',
      });
      if (!ok) return;
      store.update((s) => { s.plan.anchors = anchorsRepeatWeek(s.plan.anchors, today); }, { now: true });
      toast(`Woche ${info.week} wird wiederholt`);
    } else if (act === 'unrepeat') {
      store.update((s) => { s.plan.anchors = anchorsCancelRepeat(s.plan.anchors, today); }, { now: true });
      toast('Wiederholung zurückgenommen');
    } else if (act === 'rpe') {
      openRpeSheet();
    } else if (act === 'start') {
      startFlow(el.dataset.type);
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
