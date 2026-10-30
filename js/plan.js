// Trainingsplan-Logik: Phasen, Wochenberechnung, Statistiken. Reine Funktionen ohne DOM.
import { addDays, daysBetween, todayISO, clamp, uid, mondayOf, average, isISODate, dayNumber } from './util.js';
import { EXERCISES, WORKOUTS } from './exercises.js';
import { TIPS, PAUSE_CLEARANCE_NOTE } from './content.js';

export const TOTAL_WEEKS = 12;

export const PHASES = [
  {
    id: 1, from: 1, to: 2, name: 'Sanfter Einstieg',
    sessionsMin: 2, sessionsMax: 2, setsMin: 1, setsMax: 1, repsMin: 15, repsMax: 15,
    rpeMin: 2, rpeMax: 3, rpeLabel: 'RPE 2–3', restSec: 90,
    cardio: 'Optional 5–10 Min. locker, RPE 2–3',
    focus: 'Geräte kennenlernen, Sitzpositionen einstellen, Technik und ruhige Atmung üben. Das Gewicht ist bewusst sehr leicht – am Satzende könntest du noch sehr viele Wiederholungen schaffen.',
  },
  {
    id: 2, from: 3, to: 4, name: 'Gewöhnung',
    sessionsMin: 2, sessionsMax: 2, setsMin: 1, setsMax: 2, repsMin: 12, repsMax: 15,
    rpeMin: 3, rpeMax: 4, rpeLabel: 'RPE 3–4', restSec: 90,
    cardio: 'Optional 5–10 Min., RPE 3',
    focus: 'Der Körper gewöhnt sich an die Belastung. Ein zweiter Satz ist möglich, wenn sich der erste gut angefühlt hat.',
  },
  {
    id: 3, from: 5, to: 6, name: 'Aufbau',
    sessionsMin: 2, sessionsMax: 2, setsMin: 2, setsMax: 2, repsMin: 12, repsMax: 15,
    rpeMin: 4, rpeMax: 5, rpeLabel: 'RPE 4–5', restSec: 90,
    cardio: 'Optional 10–15 Min., RPE 3–4',
    focus: 'Zwei Sätze pro Übung. Die Belastung ist spürbar, bleibt aber gut kontrollierbar – Sprechen in ganzen Sätzen ist weiter möglich.',
  },
  {
    id: 4, from: 7, to: 8, name: 'Festigung',
    sessionsMin: 2, sessionsMax: 3, setsMin: 2, setsMax: 2, repsMin: 12, repsMax: 15,
    rpeMin: 4, rpeMax: 5, rpeLabel: 'RPE 4–5', restSec: 90,
    cardio: 'Optional 10–15 Min., RPE 3–4',
    focus: 'Bei guter Verträglichkeit ist ein dritter Trainingstag pro Woche möglich. Zwischen zwei Krafteinheiten liegt immer mindestens ein Ruhetag.',
  },
  {
    id: 5, from: 9, to: 12, name: 'Kräftigung',
    sessionsMin: 2, sessionsMax: 3, setsMin: 2, setsMax: 3, repsMin: 10, repsMax: 15,
    rpeMin: 4, rpeMax: 6, rpeLabel: 'RPE max. 5–6', restSec: 120,
    cardio: 'Optional 15–20 Min., RPE 3–4',
    focus: 'Bis zu drei Trainingstage und bis zu drei Sätze. Die Obergrenze liegt bei RPE 5–6 – kein Satz bis zur Erschöpfung.',
  },
];

export function phaseForWeek(week) {
  const w = clamp(Math.round(Number(week) || 1), 1, TOTAL_WEEKS);
  return PHASES.find((p) => w >= p.from && w <= p.to);
}

export function phaseWeeksLabel(p) {
  return p.from === p.to ? `Woche ${p.from}` : `Wochen ${p.from}–${p.to}`;
}

export function sessionsLabel(p) {
  return p.sessionsMin === p.sessionsMax ? `${p.sessionsMin}× pro Woche` : `${p.sessionsMin}–${p.sessionsMax}× pro Woche`;
}

export function setsLabel(p) {
  if (p.setsMin === p.setsMax) return p.setsMin === 1 ? '1 Satz' : `${p.setsMin} Sätze`;
  return `${p.setsMin}–${p.setsMax} Sätze`;
}

export function repsLabel(p) {
  return p.repsMin === p.repsMax ? `${p.repsMin} Wdh.` : `${p.repsMin}–${p.repsMax} Wdh.`;
}

/** Belastungsziel inkl. einer eventuell ärztlich festgelegten RPE-Obergrenze. */
export function rpeTarget(phase, profile) {
  const doc = Number(profile && profile.maxRpeDoctor);
  const hasDoc = Number.isFinite(doc) && doc >= 1;
  const max = hasDoc ? Math.min(phase.rpeMax, doc) : phase.rpeMax;
  const min = Math.min(phase.rpeMin, max);
  const doctorLimited = hasDoc && doc < phase.rpeMax;
  const range = min === max ? `${max}` : `${min}–${max}`;
  return { min, max, doctorLimited, label: doctorLimited ? `RPE ${range} (ärztliche Grenze)` : phase.rpeLabel };
}

/** Kurzform für Kacheln: Wert und Beschriftung. */
export function rpeSpec(phase, target) {
  if (target.doctorLimited) {
    return { value: target.min === target.max ? `${target.max}` : `${target.min}–${target.max}`, caption: 'RPE (ärztlich)' };
  }
  if (phase.id === 5) return { value: '5–6', caption: 'RPE höchstens' };
  return { value: `${phase.rpeMin}–${phase.rpeMax}`, caption: 'RPE' };
}

/* ---------- Wochenberechnung über „Anker“ ----------
 * Ein Anker sagt: „Ab diesem Datum beginnt Planwoche n.“ Danach zählt jede 7-Tage-Spanne eine Woche weiter.
 * Wiederholen, Verschieben und Neu-Ausrichten fügen einfach einen neuen Anker hinzu.
 */

export function normalizeAnchors(anchors) {
  const map = new Map();
  for (const a of Array.isArray(anchors) ? anchors : []) {
    if (!a || !isISODate(a.date)) continue;
    const week = Math.round(Number(a.week));
    if (!Number.isFinite(week) || week < 1) continue;
    map.set(a.date, { date: a.date, week: Math.min(week, TOTAL_WEEKS) });
  }
  return [...map.values()].sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : 0));
}

export function startDateOf(anchors) {
  const list = normalizeAnchors(anchors);
  return list.length ? list[0].date : todayISO();
}

export function weekInfo(anchors, date = todayISO()) {
  const list = normalizeAnchors(anchors);
  const first = list[0] || { date, week: 1 };
  if (date < first.date) {
    return {
      raw: 0, week: first.week, beforeStart: true, finished: false,
      daysUntilStart: daysBetween(date, first.date), dayInWeek: 0,
      weekStart: first.date, weekEnd: addDays(first.date, 6),
    };
  }
  let anchor = first;
  let next = null;
  for (const a of list) {
    if (a.date <= date) anchor = a;
    else { next = a; break; }
  }
  const diff = daysBetween(anchor.date, date);
  const k = Math.floor(diff / 7);
  const raw = anchor.week + k;
  const weekStart = addDays(anchor.date, k * 7);
  let weekEnd = addDays(weekStart, 6);
  if (next && next.date <= weekEnd) weekEnd = addDays(next.date, -1);
  return {
    raw, week: clamp(raw, 1, TOTAL_WEEKS), beforeStart: false, finished: raw > TOTAL_WEEKS,
    daysUntilStart: 0, dayInWeek: (diff % 7) + 1, weekStart, weekEnd,
  };
}

/** „Diese Woche wiederholen“: Die nächste 7-Tage-Spanne bekommt dieselbe Planwoche. */
export function anchorsRepeatWeek(anchors, today = todayISO()) {
  const info = weekInfo(anchors, today);
  const list = normalizeAnchors(anchors);
  if (info.beforeStart) return list;
  const next = addDays(info.weekStart, 7);
  const kept = list.filter((a) => a.date < next);
  kept.push({ date: next, week: info.week });
  return normalizeAnchors(kept);
}

/** Ist für die kommende Woche bereits eine Wiederholung geplant? */
export function repeatPlanned(anchors, today = todayISO()) {
  const info = weekInfo(anchors, today);
  if (info.beforeStart || info.finished) return false;
  const next = addDays(info.weekStart, 7);
  return normalizeAnchors(anchors).some((a) => a.date === next && a.week === info.week);
}

export function anchorsCancelRepeat(anchors, today = todayISO()) {
  const info = weekInfo(anchors, today);
  const next = addDays(info.weekStart, 7);
  return normalizeAnchors(anchors).filter((a) => !(a.date === next && a.week === info.week));
}

/**
 * Aktuelle Woche festlegen. Standard: ab Beginn der laufenden 7-Tage-Spanne (Rhythmus bleibt).
 * fromToday: ab heute neu ausrichten (sinnvoll nach einer Pause).
 */
export function anchorsSetWeek(anchors, targetWeek, today = todayISO(), { fromToday = false } = {}) {
  const t = clamp(Math.round(targetWeek), 1, TOTAL_WEEKS);
  const list = normalizeAnchors(anchors);
  const info = weekInfo(list, today);
  if (info.beforeStart) {
    return normalizeAnchors([{ date: list.length ? list[0].date : today, week: t }]);
  }
  const date = fromToday ? today : info.weekStart;
  const kept = list.filter((a) => a.date < date);
  kept.push({ date, week: t });
  return normalizeAnchors(kept);
}

export function anchorsFromStart(date) {
  return [{ date, week: 1 }];
}

/* ---------- Einheiten ---------- */

export const isCompleted = (s) => !!s && s.status === 'completed';
export const sortKey = (s) => `${s.date || ''}T${s.startTime || '00:00'}`;

export function sortSessionsDesc(sessions) {
  return [...sessions].sort((a, b) => (sortKey(a) < sortKey(b) ? 1 : sortKey(a) > sortKey(b) ? -1 : 0));
}

export function latestSession(sessions, pred = isCompleted) {
  let best = null;
  for (const s of sessions || []) {
    if (pred(s) && (!best || sortKey(s) > sortKey(best))) best = s;
  }
  return best;
}

export function nextWorkoutType(sessions) {
  const last = latestSession(sessions);
  return last ? (last.type === 'A' ? 'B' : 'A') : 'A';
}

export function countByPlanWeek(sessions) {
  const counts = {};
  for (const s of sessions || []) if (isCompleted(s)) counts[s.planWeek] = (counts[s.planWeek] || 0) + 1;
  return counts;
}

export function sessionsInWeek(sessions, info) {
  return (sessions || []).filter(
    (s) => isCompleted(s) && s.planWeek === info.week && s.date >= info.weekStart && s.date <= info.weekEnd,
  );
}

export function programStats(sessions) {
  const counts = countByPlanWeek(sessions);
  let capped = 0;
  let total = 0;
  let weeksComplete = 0;
  const weeks = [];
  for (let w = 1; w <= TOTAL_WEEKS; w++) {
    const p = phaseForWeek(w);
    const done = counts[w] || 0;
    capped += Math.min(done, p.sessionsMin);
    total += p.sessionsMin;
    const complete = done >= p.sessionsMin;
    if (complete) weeksComplete++;
    weeks.push({ week: w, done, min: p.sessionsMin, max: p.sessionsMax, complete });
  }
  const completed = (sessions || []).filter(isCompleted);
  const totalMinutes = completed.reduce((sum, s) => sum + (Number(s.durationMin) || 0), 0);
  return {
    percent: Math.round((capped / total) * 100),
    weeksComplete, weeks, totalSessions: completed.length, totalMinutes,
  };
}

/** Konstanz über Kalenderwochen (Mo–So): Ziel sind mindestens 2 Einheiten pro Woche. */
export function consistencyStats(sessions, anchors, today = todayISO(), target = 2) {
  const completed = (sessions || []).filter(isCompleted);
  const counts = {};
  let earliest = startDateOf(anchors);
  for (const s of completed) {
    const m = mondayOf(s.date);
    counts[m] = (counts[m] || 0) + 1;
    if (s.date < earliest) earliest = s.date;
  }
  const from = mondayOf(earliest);
  const thisMonday = mondayOf(today);
  let weeks = 0;
  let met = 0;
  for (let m = from; m < thisMonday; m = addDays(m, 7)) {
    weeks++;
    if ((counts[m] || 0) >= target) met++;
  }
  const currentMet = (counts[thisMonday] || 0) >= target;
  if (currentMet && from <= thisMonday) { weeks++; met++; }
  let streak = 0;
  let m = currentMet ? thisMonday : addDays(thisMonday, -7);
  while (m >= from && (counts[m] || 0) >= target) { streak++; m = addDays(m, -7); }
  return { weeks, met, percent: weeks ? Math.round((met / weeks) * 100) : null, streak, counts };
}

/** Raster der letzten Kalenderwochen (Mo–So) mit Trainingstagen. */
export function calendarWeeks(sessions, today = todayISO(), count = 12) {
  const perDay = {};
  for (const s of sessions || []) if (isCompleted(s)) perDay[s.date] = (perDay[s.date] || 0) + 1;
  const thisMonday = mondayOf(today);
  const weeks = [];
  for (let i = count - 1; i >= 0; i--) {
    const monday = addDays(thisMonday, -7 * i);
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(monday, d);
      days.push({ date, count: perDay[date] || 0, future: date > today, today: date === today });
    }
    weeks.push({ monday, days });
  }
  return weeks;
}

/* ---------- Hinweise für das Dashboard ---------- */

export function pauseSuggestion(sessions, anchors, today = todayISO()) {
  const info = weekInfo(anchors, today);
  if (info.beforeStart) return null;
  const last = latestSession(sessions);
  if (!last) {
    if (info.raw > 1) return { kind: 'noSessions', currentWeek: info.week, suggestWeek: 1, key: `nosess-${info.weekStart}` };
    return null;
  }
  const days = daysBetween(last.date, today);
  if (days >= 14 && info.week > last.planWeek) {
    // 2–4 Wochen Pause: letzte Woche wiederholen; 4–8 Wochen: zwei Wochen zurück; ab 8 Wochen: neu mit Woche 1
    const suggestWeek = days >= 56 ? 1 : days >= 28 ? Math.max(1, last.planWeek - 2) : last.planWeek;
    return { kind: 'pause', days, lastWeek: last.planWeek, currentWeek: info.week, suggestWeek, key: `pause-${last.id}-${info.week}` };
  }
  return null;
}

export function previousWeekIncomplete(sessions, anchors, today = todayISO()) {
  const info = weekInfo(anchors, today);
  if (info.beforeStart || info.finished || info.week <= 1 || info.dayInWeek > 3) return null;
  if (!latestSession(sessions)) return null;
  const prev = info.week - 1;
  const done = countByPlanWeek(sessions)[prev] || 0;
  const min = phaseForWeek(prev).sessionsMin;
  if (done >= min) return null;
  return { week: prev, done, min, key: `incomplete-${prev}-${info.weekStart}` };
}

export function recoveryStatus(sessions, anchors, today = todayISO()) {
  const last = latestSession(sessions);
  if (!last) {
    return { kind: 'first', title: 'Bereit für den Start', text: 'Starte ganz leicht und lerne die Geräte in Ruhe kennen.' };
  }
  const days = daysBetween(last.date, today);
  const info = weekInfo(anchors, today);
  const phase = phaseForWeek(info.week);
  const thisWeek = sessionsInWeek(sessions, info).length;
  if (days <= 0) return { kind: 'rest', title: 'Heute schon trainiert', text: 'Gönn dir Erholung. Ein lockerer Spaziergang ist ideal.' };
  if (days === 1) return { kind: 'rest', title: 'Heute ist Erholungstag', text: 'Zwischen zwei Krafteinheiten liegt mindestens ein Ruhetag – so kann sich die Muskulatur anpassen.' };
  if (thisWeek >= phase.sessionsMax) return { kind: 'done', title: 'Wochenziel erreicht', text: 'Weitere Bewegung diese Woche am besten als lockerer Spaziergang.' };
  if (thisWeek >= phase.sessionsMin) return { kind: 'done', title: 'Wochenziel erreicht', text: 'Eine dritte Einheit ist möglich, wenn du dich gut erholt fühlst – kein Muss.' };
  if (days <= 4) return { kind: 'ready', title: 'Bereit für die nächste Einheit', text: 'Wenn du dich gut fühlst, ist heute ein guter Trainingstag.' };
  if (days < 14) return { kind: 'ready', title: 'Schön, dass du weitermachst', text: `Dein letztes Training ist ${days} Tage her. Starte ruhig und achte auf dein Körpergefühl.` };
  return { kind: 'pause', title: 'Nach einer Pause', text: `Starte bewusst leichter als zuletzt und steigere erst wieder, wenn sich alles gut anfühlt. ${PAUSE_CLEARANCE_NOTE}` };
}

export function tipOfDay(today = todayISO()) {
  return TIPS[((dayNumber(today) % TIPS.length) + TIPS.length) % TIPS.length];
}

/* ---------- Einheit aufbauen ---------- */

export function workoutExerciseIds(type, planWeek, plan) {
  const w = WORKOUTS[type];
  if (!w) return [];
  return w.exercises.filter((id) => {
    const ex = EXERCISES[id];
    if (!ex.optional) return true;
    if (plan && plan.includeBiceps === false) return false;
    const from = (plan && plan.bicepsFromWeek) || ex.optionalFromWeek || 5;
    return planWeek >= from;
  });
}

/** Letzte durchgeführte Sätze einer Übung (abgeschlossene oder abgebrochene Einheiten). */
export function lastPerformance(sessions, exId, excludeId = null) {
  let best = null;
  let bestKey = '';
  for (const s of sessions || []) {
    if (!s || s.id === excludeId || (s.status !== 'completed' && s.status !== 'aborted')) continue;
    const ex = (s.exercises || []).find((e) => e.id === exId);
    if (!ex) continue;
    const done = (ex.sets || []).filter((st) => st.done);
    if (!done.length) continue;
    const key = sortKey(s);
    if (key > bestKey) { bestKey = key; best = { session: s, sets: done }; }
  }
  if (!best) return null;
  const weighted = best.sets.filter((st) => typeof st.weight === 'number');
  const top = weighted.length ? weighted.reduce((a, b) => (b.weight > a.weight ? b : a)) : best.sets[best.sets.length - 1];
  const rpes = best.sets.map((st) => st.rpe).filter((r) => typeof r === 'number');
  return {
    date: best.session.date,
    sessionId: best.session.id,
    weight: typeof top.weight === 'number' ? top.weight : null,
    reps: typeof top.reps === 'number' ? top.reps : null,
    maxRpe: rpes.length ? Math.max(...rpes) : null,
    sets: best.sets,
  };
}

export function buildSets(exId, phase, sessions) {
  const last = lastPerformance(sessions, exId);
  const weight = last ? last.weight : null;
  const reps = last && last.reps != null && last.reps >= phase.repsMin && last.reps <= phase.repsMax ? last.reps : phase.repsMax;
  return Array.from({ length: phase.setsMax }, (_, i) => ({
    weight, reps, rpe: null, done: false, optional: i >= phase.setsMin,
  }));
}

export function createSession({ type, planWeek, date, startTime, state, status = 'draft' }) {
  const phase = phaseForWeek(planWeek);
  const ids = workoutExerciseIds(type, planWeek, state.plan);
  const now = new Date().toISOString();
  return {
    id: uid(), type, planWeek, date, startTime,
    startedAt: now, endedAt: null, durationMin: null, status,
    wellbeingBefore: null, wellbeingAfter: null,
    warmupDone: false, cooldownDone: false, cardioMin: null, symptoms: false,
    precheck: false, abortReason: '', notes: '',
    exercises: ids.map((id) => ({
      id, done: false, skipped: false, optional: !!EXERCISES[id].optional, notes: '',
      sets: buildSets(id, phase, state.sessions),
    })),
    createdAt: now, updatedAt: now,
  };
}

export const requiredSets = (ex) => (ex.sets || []).filter((s) => !s.optional);

export function isExerciseDone(ex) {
  if (!ex || ex.skipped) return false;
  if (ex.done) return true;
  const req = requiredSets(ex);
  return req.length > 0 && req.every((s) => s.done);
}

export function sessionProgress(session) {
  const required = (session.exercises || []).filter((e) => !e.optional);
  return {
    done: required.filter(isExerciseDone).length,
    handled: required.filter((e) => isExerciseDone(e) || e.skipped).length,
    total: required.length,
    optionalDone: (session.exercises || []).filter((e) => e.optional && isExerciseDone(e)).length,
  };
}

export function doneSets(session) {
  const out = [];
  for (const ex of session.exercises || []) for (const st of ex.sets || []) if (st.done) out.push(st);
  return out;
}

export function sessionAvgRpe(session) {
  return average(doneSets(session).map((s) => s.rpe));
}

export function exerciseTopWeight(ex) {
  const w = (ex.sets || []).filter((s) => s.done && typeof s.weight === 'number').map((s) => s.weight);
  return w.length ? Math.max(...w) : null;
}

export function exerciseTotalReps(ex) {
  const r = (ex.sets || []).filter((s) => s.done && typeof s.reps === 'number').map((s) => s.reps);
  return r.length ? r.reduce((a, b) => a + b, 0) : null;
}

/** Rückmeldung, wenn ein Satz intensiver war als geplant. */
export function rpeFeedback(rpe, target) {
  if (rpe == null) return null;
  if (rpe >= 8 || rpe > target.max + 1) {
    return { level: 'danger', text: `Deutlich intensiver als geplant (Ziel: ${target.label}). Gewicht reduzieren, Pause verlängern und auf Warnzeichen achten.` };
  }
  if (rpe > target.max) {
    return { level: 'warn', text: `Etwas intensiver als geplant (Ziel: ${target.label}). Wähle für den nächsten Satz ein leichteres Gewicht.` };
  }
  return null;
}

/** Freiwilliger Hinweis – es wird nie automatisch gesteigert. */
export function progressionHint(last, phase, target) {
  if (!last || last.weight == null || !last.sets.length) return null;
  const allRated = last.sets.every((s) => typeof s.rpe === 'number');
  if (!allRated) return null;
  const easy = last.sets.every((s) => s.rpe < target.min && (s.reps ?? 0) >= phase.repsMax);
  return easy ? 'Zuletzt leichter als das aktuelle Ziel. Wenn Technik und Befinden gut sind und es zu deiner ärztlichen Freigabe passt, ist eine kleine Steigerung möglich – kein Muss.' : null;
}

export function durationFromStart(session, now = Date.now()) {
  if (!session.startedAt) return null;
  const start = Date.parse(session.startedAt);
  if (!Number.isFinite(start)) return null;
  return Math.max(1, Math.round((now - start) / 60000));
}
