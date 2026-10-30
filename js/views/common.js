// Kleine gemeinsame Bausteine für Training und Protokoll.
import { esc, parseNum } from '../util.js';
import { WELLBEING, RPE_SCALE } from '../content.js';
import { sortKey } from '../plan.js';

export function wellbeingPicker(name, value) {
  return `<div class="wb" role="radiogroup" aria-label="Wohlbefinden">${WELLBEING.map((w) => {
    const on = value === w.value;
    return `<button type="button" class="wb-btn${on ? ' active' : ''}" role="radio" aria-checked="${on}" data-wb="${esc(name)}" data-value="${w.value}">
      <span class="wb-emoji" aria-hidden="true">${w.emoji}</span><span class="wb-label">${esc(w.label)}</span></button>`;
  }).join('')}</div>`;
}

/** Auswahl umschalten; erneutes Antippen hebt die Auswahl auf. Gibt den neuen Wert zurück. */
export function toggleWb(container, btn) {
  const name = btn.dataset.wb;
  const wasActive = btn.classList.contains('active');
  container.querySelectorAll(`[data-wb="${name}"]`).forEach((b) => {
    const on = b === btn && !wasActive;
    b.classList.toggle('active', on);
    b.setAttribute('aria-checked', String(on));
  });
  return wasActive ? null : Number(btn.dataset.value);
}

export function wellbeingText(v) {
  const w = WELLBEING.find((x) => x.value === v);
  return w ? `${w.emoji} ${w.label}` : '–';
}

export function rpeOptions(selected) {
  return `<option value="">–</option>${RPE_SCALE.map((r) => `<option value="${r.value}"${selected === r.value ? ' selected' : ''}>${r.value} – ${esc(r.label)}</option>`).join('')}`;
}

export function numStr(n) {
  return n == null ? '' : String(n).replace('.', ',');
}

export function numOrNull(v, min, max) {
  const n = parseNum(v);
  if (n == null || n < min || n > max) return null;
  return Math.round(n * 100) / 100;
}

export function intOrNull(v, min, max) {
  const n = numOrNull(v, min, max);
  return n == null ? null : Math.round(n);
}

/** Letzte Notiz zu einer Übung (z. B. Sitzeinstellung). */
export function lastNoteFor(sessions, exId, excludeId = null) {
  let best = null;
  for (const s of sessions) {
    if (s.id === excludeId) continue;
    const ex = (s.exercises || []).find((e) => e.id === exId && e.notes && e.notes.trim());
    if (ex && (!best || sortKey(s) > sortKey(best.s))) best = { s, note: ex.notes.trim() };
  }
  return best ? best.note : '';
}

export function lastText(last, def) {
  const parts = [];
  if (last.weight != null) parts.push(`${numStr(last.weight)} ${def.weightLabel}`);
  if (last.reps != null) parts.push(`${last.reps} Wdh.`);
  let t = parts.join(' × ') || 'erledigt';
  if (last.maxRpe != null) t += `, RPE ${last.maxRpe}`;
  return t;
}
