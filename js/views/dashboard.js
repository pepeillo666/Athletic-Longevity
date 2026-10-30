// Startseite „Heute“: aktuelle Woche, nächste Einheit, Fortschritt, Erholung.
import { store } from '../store.js';
import {
  esc, todayISO, formatDate, relativeDay, greeting, formatDuration, addDays, mondayOf,
} from '../util.js';
import {
  weekInfo, phaseForWeek, programStats, nextWorkoutType, latestSession, sessionsInWeek, pauseSuggestion,
  previousWeekIncomplete, recoveryStatus, tipOfDay, rpeTarget, rpeSpec, setsLabel, repsLabel, anchorsSetWeek,
  workoutExerciseIds, TOTAL_WEEKS, isCompleted,
} from '../plan.js';
import { WORKOUTS, exerciseName } from '../exercises.js';
import { PAUSE_CLEARANCE_NOTE } from '../content.js';
import { icon, pageHead, settingsButton, banner, weekRing, toast } from '../ui.js';
import {
  openClearanceSheet, openInstallSheet, doBackup, backupAgeDays, isStandalone, isIOS,
} from './dialogs.js';
import { startFlow } from './training.js';

let ringAnimated = false;

function weekStrip(info, sessions, today) {
  const trained = new Set(sessions.filter(isCompleted).map((s) => s.date));
  let out = '';
  for (let i = 0; i < 7; i++) {
    const date = addDays(info.weekStart, i);
    const cls = ['strip-day'];
    if (trained.has(date)) cls.push('is-on');
    if (date === today) cls.push('is-today');
    if (date > today) cls.push('is-future');
    const label = formatDate(date, 'weekdayShort').replace('.', '');
    out += `<li class="${cls.join(' ')}" aria-label="${esc(formatDate(date, 'long'))}${trained.has(date) ? ': trainiert' : ''}">
      <span class="strip-wd">${esc(label)}</span><span class="strip-dot" aria-hidden="true"></span></li>`;
  }
  return `<ol class="strip">${out}</ol>`;
}

export function render() {
  const s = store.state;
  const today = todayISO();
  const info = weekInfo(s.plan.anchors, today);
  const phase = phaseForWeek(info.week);
  const stats = programStats(s.sessions);
  const nextType = nextWorkoutType(s.sessions);
  const last = latestSession(s.sessions);
  const thisWeek = sessionsInWeek(s.sessions, info).length;
  const target = rpeTarget(phase, s.profile);
  const rpe = rpeSpec(phase, target);
  const recovery = recoveryStatus(s.sessions, s.plan.anchors, today);
  const dismissed = s.meta.dismissed || {};
  const name = (s.profile.name || '').trim();
  const animate = !ringAnimated;
  ringAnimated = true;

  /* Hinweise */
  const notes = [];
  if (s.draft) {
    notes.push(`<a class="live-card" href="#/training">
      <span class="live-pulse" aria-hidden="true"></span>
      <span class="live-text"><strong>${esc(WORKOUTS[s.draft.type].name)} läuft</strong><span>Gestartet um ${esc(s.draft.startTime)} Uhr</span></span>
      <span class="live-go">Fortsetzen ${icon('chevronRight')}</span></a>`);
  }
  if (!s.profile.clearance) {
    notes.push(banner({
      type: 'warn', title: 'Ärztliche Freigabe noch nicht bestätigt',
      text: 'Bitte trainiere erst nach einer individuellen Freigabe durch deine kardiologische oder hausärztliche Praxis.',
      actions: '<button type="button" class="btn btn-sm btn-secondary" data-act="clearance">Freigabe bestätigen</button>',
    }));
  }
  if (info.finished) {
    notes.push(banner({
      type: 'success', iconName: 'check', title: '12 Wochen geschafft',
      text: 'Du kannst mit den Vorgaben von Woche 12 weitertrainieren. Besprich die nächsten Schritte mit deiner Ärztin oder deinem Arzt.',
    }));
  }
  const pause = pauseSuggestion(s.sessions, s.plan.anchors, today);
  if (pause && !dismissed[pause.key]) {
    const text = pause.kind === 'noSessions'
      ? `Laut Plan wäre jetzt Woche ${pause.currentWeek}, du hast aber noch keine Einheit eingetragen. Beginne lieber mit Woche 1.`
      : `Dein letztes Training ist ${pause.days} Tage her. Statt mit Woche ${pause.currentWeek} weiterzumachen, ist ein Neueinstieg mit Woche ${pause.suggestWeek} sicherer. ${PAUSE_CLEARANCE_NOTE}`;
    notes.push(banner({
      type: 'warn', title: pause.kind === 'noSessions' ? 'Plan neu ausrichten?' : 'Längere Pause erkannt', text,
      actions: `<button type="button" class="btn btn-sm btn-primary" data-act="setweek" data-week="${pause.suggestWeek}">Ab heute mit Woche ${pause.suggestWeek}</button>`,
      dismiss: pause.key,
    }));
  } else {
    const inc = previousWeekIncomplete(s.sessions, s.plan.anchors, today);
    if (inc && !dismissed[inc.key]) {
      notes.push(banner({
        type: 'info', title: `Woche ${inc.week} war unvollständig`,
        text: `Du hast ${inc.done} von ${inc.min} Einheiten absolviert. Du kannst die Woche wiederholen oder normal weitermachen.`,
        actions: `<button type="button" class="btn btn-sm btn-secondary" data-act="repeatprev" data-week="${inc.week}">Woche ${inc.week} wiederholen</button>`,
        dismiss: inc.key,
      }));
    }
  }
  const age = backupAgeDays();
  const backupKey = `backup-${mondayOf(today)}`;
  if (s.sessions.length && (age == null || age >= 14) && !dismissed[backupKey]) {
    notes.push(banner({
      type: 'info', iconName: 'download', title: age == null ? 'Noch keine Datensicherung' : 'Zeit für eine Sicherung',
      text: 'Deine Daten liegen nur auf diesem iPhone. Eine Sicherung schützt sie, falls Websitedaten gelöscht werden.',
      actions: '<button type="button" class="btn btn-sm btn-secondary" data-act="backup">Sicherung erstellen</button>',
      dismiss: backupKey,
    }));
  }
  if (isIOS() && !isStandalone() && !dismissed.install) {
    notes.push(banner({
      type: 'info', iconName: 'share', title: 'Als App installieren',
      text: 'Auf dem Home-Bildschirm läuft die App offline und speichert deine Daten dauerhafter.',
      actions: '<button type="button" class="btn btn-sm btn-secondary" data-act="install">So geht’s</button>',
      dismiss: 'install',
    }));
  }

  /* Wochenkarte */
  const subtitle = info.beforeStart
    ? `Dein Plan startet ${info.daysUntilStart === 1 ? 'morgen' : `am ${formatDate(info.weekStart, 'long')}`}.`
    : `${formatDate(today, 'long')}`;
  const weekLine = info.beforeStart
    ? 'Du kannst trotzdem schon heute starten.'
    : info.finished ? 'Programm abgeschlossen' : `Tag ${info.dayInWeek} von 7 in dieser Woche`;

  const hero = `
    <section class="hero" aria-label="Programmfortschritt">
      <div class="hero-ring">
        ${weekRing({ weeks: stats.weeks, current: info.week, animate })}
        <div class="hero-ring-center">
          <span class="hero-kicker">Woche</span>
          <span class="hero-number">${info.week}</span>
          <span class="hero-of">von ${TOTAL_WEEKS}</span>
        </div>
      </div>
      <div class="hero-text">
        <h2 class="hero-phase">${esc(phase.name)}</h2>
        <p class="hero-sub">Phase ${phase.id} von 5, ${stats.percent} % des Programms geschafft</p>
        <p class="hero-sub muted">${esc(weekLine)}</p>
      </div>
      ${info.beforeStart ? '' : weekStrip(info, s.sessions, today)}
    </section>`;

  /* Nächste Einheit */
  const exIds = workoutExerciseIds(nextType, info.week, s.plan);
  const restAdvice = recovery.kind === 'rest'
    ? `<p class="inline-note">${icon('moon')}<span><strong>${esc(recovery.title)}.</strong> ${esc(recovery.text)}</span></p>` : '';
  const next = `
    <section class="card card-next">
      <div class="card-row">
        <div>
          <p class="card-eyebrow">Nächste Einheit</p>
          <h2 class="card-title-lg">${esc(WORKOUTS[nextType].name)}</h2>
        </div>
        <span class="pill${thisWeek >= phase.sessionsMin ? ' pill-good' : ''}">${thisWeek} von ${phase.sessionsMin}${phase.sessionsMax > phase.sessionsMin ? `–${phase.sessionsMax}` : ''} diese Woche</span>
      </div>
      <p class="ex-names">${exIds.map((id) => esc(exerciseName(id, true))).join(', ')}</p>
      <div class="spec">
        <div><strong>${esc(setsLabel(phase).replace(' Sätze', '').replace(' Satz', ''))}</strong><span>${phase.setsMax === 1 ? 'Satz' : 'Sätze'}</span></div>
        <div><strong>${esc(repsLabel(phase).replace(' Wdh.', ''))}</strong><span><span class="lbl-long">Wiederholungen</span><span class="lbl-short">Wdh.</span></span></div>
        <div><strong>${esc(rpe.value)}</strong><span>${esc(rpe.caption)}</span></div>
      </div>
      ${restAdvice}
      <button type="button" class="btn btn-primary btn-lg" data-act="start" data-type="${nextType}">${icon('play')}${esc(WORKOUTS[nextType].name)} starten</button>
      <a class="text-link" href="#/training">Andere Einheit wählen</a>
    </section>`;

  /* Kennzahlen */
  const lastText = last ? relativeDay(last.date, today) : '–';
  const lastSub = last ? `${WORKOUTS[last.type].name}${last.durationMin ? `, ${formatDuration(last.durationMin)}` : ''}` : 'Noch kein Training';
  const tiles = `
    <section class="tiles" aria-label="Kennzahlen">
      <div class="tile"><span class="tile-label">Einheiten absolviert</span><span class="tile-value">${stats.totalSessions}</span></div>
      <div class="tile"><span class="tile-label">Wochen abgeschlossen</span><span class="tile-value">${stats.weeksComplete}<small> von ${TOTAL_WEEKS}</small></span></div>
      ${last ? `<a class="tile tile-link" href="#/verlauf/${esc(last.id)}">` : '<div class="tile">'}
        <span class="tile-label">Letztes Training</span><span class="tile-value tile-value-sm">${esc(lastText)}</span><span class="tile-sub">${esc(lastSub)}</span>
      ${last ? '</a>' : '</div>'}
      <div class="tile"><span class="tile-label">Trainingszeit gesamt</span><span class="tile-value tile-value-sm">${stats.totalMinutes ? esc(formatDuration(stats.totalMinutes)) : '–'}</span></div>
    </section>`;

  const coach = `
    <section class="card card-quiet">
      ${recovery.kind === 'rest' ? '' : `<div class="coach">
        <span class="coach-icon">${icon('heart')}</span>
        <div><p class="coach-title">${esc(recovery.title)}</p><p class="coach-text">${esc(recovery.text)}</p></div>
      </div>`}
      <div class="coach">
        <span class="coach-icon">${icon('info')}</span>
        <div><p class="coach-title">Tipp des Tages</p><p class="coach-text">${esc(tipOfDay(today))}</p></div>
      </div>
    </section>`;

  const safety = `
    <a class="row-card" href="#/sicherheit">
      <span class="row-card-icon danger">${icon('alert')}</span>
      <span class="row-card-text"><strong>Sicherheit und Warnzeichen</strong><span>Wann du sofort aufhören solltest</span></span>
      ${icon('chevronRight', 'chev')}
    </a>`;

  return `
    ${pageHead({ title: name ? `${greeting()}, ${name}` : greeting(), subtitle: esc(subtitle), actions: settingsButton() })}
    ${notes.length ? `<div class="stack">${notes.join('')}</div>` : ''}
    ${hero}
    ${next}
    ${tiles}
    ${coach}
    ${safety}
    <p class="footnote">Athletic Longevity ersetzt keine ärztliche Beratung. Alle Daten bleiben auf diesem Gerät.</p>`;
}

export function mount(root) {
  const onClick = async (e) => {
    const dismissBtn = e.target.closest('[data-dismiss]');
    if (dismissBtn) {
      const key = dismissBtn.dataset.dismiss;
      store.update((s) => { s.meta.dismissed[key] = todayISO(); });
      return;
    }
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const today = todayISO();
    if (act === 'start') startFlow(el.dataset.type);
    else if (act === 'clearance') openClearanceSheet();
    else if (act === 'install') openInstallSheet();
    else if (act === 'backup') doBackup();
    else if (act === 'setweek') {
      const w = Number(el.dataset.week);
      store.update((s) => { s.plan.anchors = anchorsSetWeek(s.plan.anchors, w, today, { fromToday: true }); }, { now: true });
      toast(`Ab heute: Woche ${w}`);
    } else if (act === 'repeatprev') {
      const w = Number(el.dataset.week);
      store.update((s) => { s.plan.anchors = anchorsSetWeek(s.plan.anchors, w, today); }, { now: true });
      toast(`Woche ${w} wird wiederholt`);
    }
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
