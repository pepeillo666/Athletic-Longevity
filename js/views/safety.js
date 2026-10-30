// Sicherheit: Freigabe, Warnzeichen, Belastungssteuerung, Grundregeln, Medikamente.
import { store } from '../store.js';
import { esc, formatDate } from '../util.js';
import {
  DISCLAIMER, WARNING_SIGNS, EMERGENCY_STEPS, PRINCIPLES, HEART_RATE_NOTE, TALK_TEST, MEDICATION_NOTES,
  MEDICATION_FOOTER, SORENESS_NOTE, RPE_SCALE, RPE_EXPLAINER,
} from '../content.js';
import { icon, pageHead, banner } from '../ui.js';
import { openClearanceSheet } from './dialogs.js';

export function render() {
  const p = store.state.profile;
  const limits = [];
  if (p.maxRpeDoctor) limits.push(`Maximale Belastung: RPE ${p.maxRpeDoctor}`);
  if (p.hrLimit) limits.push(`Puls-Obergrenze: ${p.hrLimit} Schläge pro Minute – nicht überschreiten`);
  if (p.doctorNotes) limits.push(p.doctorNotes);

  return `
    ${pageHead({ title: 'Sicherheit', subtitle: 'Bitte einmal in Ruhe lesen', back: { href: '#/heute', label: 'Heute' } })}

    ${banner({ type: 'warn', title: 'Keine ärztliche Freigabe durch die App', text: esc(DISCLAIMER) })}

    <section class="card">
      <div class="card-row">
        <h2 class="card-title">Deine Freigabe</h2>
        <span class="pill ${p.clearance ? 'pill-good' : 'pill-bad'}">${p.clearance ? 'bestätigt' : 'offen'}</span>
      </div>
      <p class="body-text">${p.clearance
        ? `Freigabe bestätigt${p.clearanceDate ? ` am ${esc(formatDate(p.clearanceDate, 'numeric'))}` : ''}${p.clearanceBy ? ` durch ${esc(p.clearanceBy)}` : ''}.`
        : 'Noch nicht bestätigt. Bitte trainiere erst nach einer individuellen ärztlichen Freigabe.'}</p>
      ${limits.length ? `<p class="field-label">Deine ärztlichen Vorgaben</p><ul class="bullets">${limits.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
      <button type="button" class="btn btn-secondary" data-act="clearance">${icon('shield')}Freigabe bearbeiten</button>
    </section>

    <section class="card card-alarm">
      <h2 class="card-title">${icon('alert')}Sofort aufhören bei</h2>
      <ul class="warn-list">${WARNING_SIGNS.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <h3 class="sub-title">Dann</h3>
      <ol class="steps-list">${EMERGENCY_STEPS.map((w) => `<li>${esc(w)}</li>`).join('')}</ol>
      <a class="btn btn-emergency" href="tel:112">${icon('phone')}Notruf 112 anrufen</a>
      ${p.emergencyPhone ? `<a class="btn btn-secondary" href="tel:${esc(p.emergencyPhone.replace(/[^\d+]/g, ''))}">${icon('phone')}${esc(p.emergencyName || 'Notfallkontakt')} anrufen</a>` : ''}
    </section>

    <section class="card">
      <h2 class="card-title">Belastung steuern</h2>
      <p class="body-text">${esc(RPE_EXPLAINER)}</p>
      <ul class="rpe-table">${RPE_SCALE.map((r) => `<li class="${r.value >= 7 ? 'is-off' : ''}"><span class="rpe-num">${r.value}</span><span><strong>${esc(r.label)}</strong><small>${esc(r.hint)}</small></span></li>`).join('')}</ul>
      <h3 class="sub-title">Sprechtest</h3>
      <p class="body-text">${esc(TALK_TEST)}</p>
      <h3 class="sub-title">Warum nicht allein nach Puls?</h3>
      <p class="body-text">${esc(HEART_RATE_NOTE)}</p>
    </section>

    <section class="card">
      <h2 class="card-title">Grundregeln</h2>
      <ul class="bullets">${PRINCIPLES.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>

    <section class="card">
      <h2 class="card-title">Medikamente und Training</h2>
      <dl class="med-list">${MEDICATION_NOTES.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      ${p.medications ? `<p class="field-label">Deine Notiz</p><p class="body-text">${esc(p.medications)}</p>` : ''}
      <p class="field-hint">${esc(MEDICATION_FOOTER)}</p>
    </section>

    <section class="card">
      <h2 class="card-title">Muskelkater oder Warnsignal?</h2>
      <p class="body-text">${esc(SORENESS_NOTE)}</p>
    </section>`;
}

export function mount(root) {
  const onClick = (e) => {
    if (e.target.closest('[data-act="clearance"]')) openClearanceSheet();
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}
