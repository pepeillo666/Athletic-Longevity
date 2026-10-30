// Fortschritt: Häufigkeit, Konstanz, Gewicht und Wiederholungen je Übung, Belastung, Körpergewicht.
import { store } from '../store.js';
import { esc, todayISO, formatDate, fmtNum, uid, isISODate, debounce } from '../util.js';
import {
  programStats, consistencyStats, calendarWeeks, weekInfo, isCompleted, sortSessionsDesc, exerciseTopWeight,
  exerciseTotalReps, sessionAvgRpe, phaseForWeek, rpeTarget, TOTAL_WEEKS,
} from '../plan.js';
import { EXERCISE_ORDER, exerciseDef, customExerciseIds } from '../exercises.js';
import { icon, pageHead, settingsButton, toast, confirmDialog } from '../ui.js';
import { lineChart, barChart, dotCalendar, valueTable } from '../charts.js';
import { bodyWeightCsvFile, shareOrDownload } from '../backup.js';
import { numStr, numOrNull } from './common.js';

const ui = { ex: null, showAllWeights: false };

function exerciseSeries(sessions, exId) {
  const rows = [];
  for (const s of [...sessions].filter(isCompleted).reverse()) {
    const ex = s.exercises.find((e) => e.id === exId);
    if (!ex) continue;
    const w = exerciseTopWeight(ex);
    const r = exerciseTotalReps(ex);
    if (w == null && r == null) continue;
    rows.push({ date: s.date, weight: w, reps: r });
  }
  return rows;
}

/** Übungen mit erledigten Sätzen: erst der Katalog in Planreihenfolge, dann eigene Übungen. */
function exercisesWithData(sessions) {
  const set = new Set();
  for (const s of sessions) {
    if (!isCompleted(s)) continue;
    for (const ex of s.exercises) if (ex.sets.some((st) => st.done)) set.add(ex.id);
  }
  const custom = customExerciseIds({ includeArchived: true });
  return [...EXERCISE_ORDER, ...custom].filter((id) => set.has(id));
}

export function render() {
  const s = store.state;
  const today = todayISO();
  const stats = programStats(s.sessions);
  const cons = consistencyStats(s.sessions, s.plan.anchors, today);
  const info = weekInfo(s.plan.anchors, today);
  const withData = exercisesWithData(s.sessions);
  if (!ui.ex || !withData.includes(ui.ex)) ui.ex = withData[0] || null;
  const sorted = sortSessionsDesc(s.sessions);
  const exRows = ui.ex ? exerciseSeries(sorted, ui.ex) : [];
  const weights = [...s.bodyWeights].sort((a, b) => (a.date < b.date ? 1 : -1));

  const tiles = `
    <section class="tiles">
      <div class="tile"><span class="tile-label">Absolvierte Einheiten</span><span class="tile-value">${stats.totalSessions}</span></div>
      <div class="tile"><span class="tile-label">Abgeschlossene Wochen</span><span class="tile-value">${stats.weeksComplete}<small> von ${TOTAL_WEEKS}</small></span></div>
      <div class="tile"><span class="tile-label">Konstanz</span><span class="tile-value">${cons.percent != null ? `${cons.percent}<small> %</small>` : '–'}</span>
        <span class="tile-sub">${cons.weeks ? `${cons.met} von ${cons.weeks} Kalenderwochen mit 2+ Einheiten` : 'Ab der ersten vollen Woche'}</span></div>
      <div class="tile"><span class="tile-label">Serie</span><span class="tile-value">${cons.streak}<small> ${cons.streak === 1 ? 'Woche' : 'Wochen'}</small></span>
        <span class="tile-sub">in Folge im Wochenziel</span></div>
    </section>`;

  const weeksTable = valueTable(['Planwoche', 'Einheiten', 'Ziel'], stats.weeks.map((w) => [`Woche ${w.week}`, String(w.done), `${w.min}${w.max > w.min ? `–${w.max}` : ''}`]));

  const exChips = withData.length ? `<div class="chips" role="tablist" aria-label="Übung wählen">${withData.map((id) => `
      <button type="button" class="chip${id === ui.ex ? ' active' : ''}" role="tab" aria-selected="${id === ui.ex}" data-ex="${id}">${esc(exerciseDef(id).shortName)}</button>`).join('')}</div>` : '';
  const exDef = ui.ex ? exerciseDef(ui.ex) : null;

  const exSection = ui.ex ? `
    <section class="card">
      <h2 class="card-title">Gewicht je Übung</h2>
      <p class="card-sub">Höchstes Gewicht pro Einheit in ${esc(exDef.weightLabel)}</p>
      ${exChips}
      <div class="chart-box" data-chart="weight"></div>
      ${valueTable(['Datum', exDef.weightLabel, 'Wdh. gesamt'], exRows.map((r) => [formatDate(r.date, 'numeric'), r.weight != null ? numStr(r.weight) : '–', r.reps != null ? String(r.reps) : '–']))}
    </section>
    <section class="card">
      <h2 class="card-title">Wiederholungen</h2>
      <p class="card-sub">${esc(exDef.name)}: Summe aller erledigten Sätze pro Einheit</p>
      <div class="chart-box" data-chart="reps"></div>
    </section>` : `
    <section class="card">
      <h2 class="card-title">Gewicht und Wiederholungen je Übung</h2>
      <p class="chart-empty">Sobald du Sätze als erledigt markierst, siehst du hier deine Entwicklung.</p>
    </section>`;

  const weightList = weights.slice(0, ui.showAllWeights ? weights.length : 5).map((w) => `
    <li class="mini-row"><span>${esc(formatDate(w.date, 'medium'))}</span><strong>${esc(fmtNum(w.kg, 1))} kg</strong>
      <button type="button" class="icon-btn icon-btn-sm" data-del-weight="${esc(w.id)}" aria-label="Eintrag vom ${esc(formatDate(w.date, 'numeric'))} löschen">${icon('trash')}</button></li>`).join('');

  return `
    ${pageHead({ title: 'Fortschritt', subtitle: esc(`Woche ${info.week} von ${TOTAL_WEEKS}, ${stats.percent} % des Programms`), actions: settingsButton() })}
    ${tiles}
    <section class="card">
      <h2 class="card-title">Trainingshäufigkeit</h2>
      <p class="card-sub">Einheiten pro Planwoche. Die Linie zeigt das Mindestziel von 2 Einheiten.</p>
      <div class="chart-box" data-chart="weeks"></div>
      ${weeksTable}
    </section>
    <section class="card">
      <h2 class="card-title">Trainingskonstanz</h2>
      <p class="card-sub">Die letzten 12 Kalenderwochen. Jeder grüne Punkt ist ein Trainingstag.</p>
      ${dotCalendar(calendarWeeks(s.sessions, today, 12))}
      <p class="cal-caption" data-cal-caption aria-live="polite">Tippe auf einen Tag für Details.</p>
    </section>
    ${exSection}
    <section class="card">
      <h2 class="card-title">Belastung</h2>
      <p class="card-sub">Durchschnittliches RPE pro Einheit. Grau hinterlegt: Zielbereich der jeweiligen Woche.</p>
      <div class="chart-box" data-chart="rpe"></div>
    </section>
    <section class="card" id="koerpergewicht">
      <h2 class="card-title">Körpergewicht <span class="muted">(optional)</span></h2>
      <form class="inline-form" data-weight-form>
        <label class="field"><span class="field-label">Datum</span><input class="input" type="date" name="date" value="${today}" max="${today}" required></label>
        <label class="field"><span class="field-label">Gewicht in kg</span><input class="input" type="text" inputmode="decimal" name="kg" placeholder="z. B. 85" required></label>
        <button type="submit" class="btn btn-secondary">${icon('plus')}Eintragen</button>
      </form>
      <div class="chart-box" data-chart="body"></div>
      ${weights.length ? `<ul class="mini-list">${weightList}</ul>
        ${weights.length > 5 ? `<button type="button" class="text-link" data-act="allweights">${ui.showAllWeights ? 'Weniger anzeigen' : `Alle ${weights.length} Einträge anzeigen`}</button>` : ''}
        <button type="button" class="btn btn-sm btn-quiet" data-act="weightcsv">${icon('download')}Als CSV exportieren</button>` : ''}
    </section>
    <p class="footnote">Die Diagramme zeigen deinen bisherigen Verlauf. Sie sind keine Prognose und keine medizinische Bewertung.</p>`;
}

function drawCharts(root) {
  const s = store.state;
  const sorted = sortSessionsDesc(s.sessions);
  const stats = programStats(s.sessions);
  const info = weekInfo(s.plan.anchors, todayISO());

  const weeksEl = root.querySelector('[data-chart="weeks"]');
  if (weeksEl) {
    barChart(weeksEl, {
      bars: stats.weeks.map((w) => ({ label: String(w.week), value: w.done, week: w.week, min: w.min, strong: w.week === info.week })),
      target: 2,
      ariaLabel: 'Einheiten pro Planwoche',
      tipValue: (b) => `${b.value} ${b.value === 1 ? 'Einheit' : 'Einheiten'}`,
      tipLabel: (b) => `Woche ${b.week}${b.week === info.week ? ' (aktuell)' : ''}, Ziel ${b.min}`,
    });
  }

  if (ui.ex) {
    const def = exerciseDef(ui.ex);
    const rows = exerciseSeries(sorted, ui.ex);
    const wEl = root.querySelector('[data-chart="weight"]');
    if (wEl) {
      lineChart(wEl, {
        points: rows.filter((r) => r.weight != null).map((r) => ({ date: r.date, y: r.weight })),
        unit: def.weightLabel, decimals: 1, ariaLabel: `Gewichtsverlauf ${def.name}`,
        emptyText: 'Noch keine Gewichte eingetragen.',
      });
    }
    const rEl = root.querySelector('[data-chart="reps"]');
    if (rEl) {
      lineChart(rEl, {
        points: rows.filter((r) => r.reps != null).map((r) => ({ date: r.date, y: r.reps })),
        unit: 'Wdh.', decimals: 0, ariaLabel: `Wiederholungen ${def.name}`,
        emptyText: 'Noch keine Wiederholungen eingetragen.',
      });
    }
  }

  const rpeEl = root.querySelector('[data-chart="rpe"]');
  if (rpeEl) {
    const rows = [...sorted].reverse().filter(isCompleted)
      .map((x) => ({ x, avg: sessionAvgRpe(x) })).filter((r) => r.avg != null);
    lineChart(rpeEl, {
      points: rows.map(({ x, avg }) => {
        const t = rpeTarget(phaseForWeek(x.planWeek), s.profile);
        return { date: x.date, y: Math.round(avg * 10) / 10, bandMin: t.min, bandMax: t.max, week: x.planWeek, label: t.label };
      }),
      band: true, domain: [0, 10], tickStep: 2, decimals: 1,
      valueText: (p) => `RPE ${fmtNum(p.y, 1)}`,
      labelText: (p) => `${formatDate(p.date, 'medium')}, Woche ${p.week}, Ziel: ${p.label}`,
      ariaLabel: 'Durchschnittliche Belastung pro Einheit',
      emptyText: 'Trage beim Training ein RPE ein, um deine Belastung zu sehen.',
    });
  }

  const bodyEl = root.querySelector('[data-chart="body"]');
  if (bodyEl) {
    const pts = [...s.bodyWeights].sort((a, b) => (a.date < b.date ? -1 : 1)).map((w) => ({ date: w.date, y: w.kg }));
    if (pts.length) {
      lineChart(bodyEl, { points: pts, unit: 'kg', decimals: 1, yFloor: null, ariaLabel: 'Körpergewicht' });
    } else {
      bodyEl.innerHTML = '<p class="chart-empty">Optional: Trage dein Körpergewicht ein, um den Verlauf zu sehen.</p>';
    }
  }
}

export function mount(root) {
  drawCharts(root);
  const onResize = debounce(() => drawCharts(root), 200);
  window.addEventListener('resize', onResize);

  const onClick = async (e) => {
    const chip = e.target.closest('[data-ex]');
    if (chip) {
      ui.ex = chip.dataset.ex;
      store.emit();
      return;
    }
    const cal = e.target.closest('[data-cal]');
    if (cal) {
      root.querySelector('[data-cal-caption]').textContent = cal.dataset.cal;
      root.querySelectorAll('.cal-cell.is-picked').forEach((c) => c.classList.remove('is-picked'));
      cal.classList.add('is-picked');
      return;
    }
    const del = e.target.closest('[data-del-weight]');
    if (del) {
      const ok = await confirmDialog({ title: 'Eintrag löschen?', confirmLabel: 'Löschen', danger: true });
      if (ok) store.update((s) => { s.bodyWeights = s.bodyWeights.filter((w) => w.id !== del.dataset.delWeight); }, { now: true });
      return;
    }
    const act = e.target.closest('[data-act]');
    if (!act) return;
    if (act.dataset.act === 'allweights') {
      ui.showAllWeights = !ui.showAllWeights;
      store.emit();
    } else if (act.dataset.act === 'weightcsv') {
      const r = await shareOrDownload(bodyWeightCsvFile(store.state));
      if (r !== 'cancelled') toast('Körpergewicht exportiert');
    }
  };
  const form = root.querySelector('[data-weight-form]');
  const onSubmit = (e) => {
    e.preventDefault();
    const date = form.elements.date.value;
    const kg = numOrNull(form.elements.kg.value, 20, 400);
    if (!isISODate(date) || date > todayISO()) { toast('Bitte ein gültiges Datum wählen.', { type: 'error' }); return; }
    if (kg == null) { toast('Bitte ein Gewicht zwischen 20 und 400 kg eingeben.', { type: 'error' }); return; }
    store.update((s) => {
      s.bodyWeights = s.bodyWeights.filter((w) => w.date !== date);
      s.bodyWeights.push({ id: uid(), date, kg });
    }, { now: true });
    toast('Körpergewicht eingetragen');
  };
  root.addEventListener('click', onClick);
  if (form) form.addEventListener('submit', onSubmit);
  return () => {
    window.removeEventListener('resize', onResize);
    root.removeEventListener('click', onClick);
    if (form) form.removeEventListener('submit', onSubmit);
  };
}
