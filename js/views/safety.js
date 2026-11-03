// Sicherheit: Warnzeichen und Notfall, Belastung steuern, Grundregeln, Muskelkater, Hinweis.
import { store } from '../store.js';
import { esc } from '../util.js';
import {
  DISCLAIMER, WARNING_SIGNS, EMERGENCY_STEPS, PRINCIPLES, FEEL_NOTE, TALK_TEST, SORENESS_NOTE, RPE_SCALE, RPE_EXPLAINER,
} from '../content.js';
import { icon, pageHead } from '../ui.js';

export function render() {
  const p = store.state.profile;
  const contact = p.emergencyPhone
    ? `<a class="btn btn-secondary" href="tel:${esc(p.emergencyPhone.replace(/[^\d+]/g, ''))}">${icon('phone')}${esc(p.emergencyName || 'Notfallkontakt')} anrufen</a>`
    : '';
  return `
    ${pageHead({ title: 'Sicherheit', subtitle: 'Wichtig für jedes Training', back: { href: '#/heute', label: 'Heute' } })}

    <section class="card card-stop">
      <h2 class="card-title">${icon('alert')}Sofort aufhören bei</h2>
      <ul class="warn-list">${WARNING_SIGNS.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
      <h3 class="sub-title">Dann</h3>
      <ol class="steps-list">${EMERGENCY_STEPS.map((w) => `<li>${esc(w)}</li>`).join('')}</ol>
      <div class="btn-stack">
        <a class="btn btn-emergency" href="tel:112">${icon('phone')}Notruf 112 anrufen</a>
        ${contact}
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Belastung steuern</h2>
      <p class="body-text">${esc(RPE_EXPLAINER)}</p>
      <ul class="rpe-table">${RPE_SCALE.map((r) => `<li class="${r.value >= 7 ? 'is-off' : ''}"><span class="rpe-num">${r.value}</span><span><strong>${esc(r.label)}</strong><small>${esc(r.hint)}</small></span></li>`).join('')}</ul>
      <h3 class="sub-title">Sprechtest</h3>
      <p class="body-text">${esc(TALK_TEST)}</p>
      <h3 class="sub-title">Warum nach Gefühl?</h3>
      <p class="body-text">${esc(FEEL_NOTE)}</p>
    </section>

    <section class="card">
      <h2 class="card-title">Grundregeln</h2>
      <ul class="bullets">${PRINCIPLES.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </section>

    <section class="card">
      <h2 class="card-title">Muskelkater oder Warnsignal?</h2>
      <p class="body-text">${esc(SORENESS_NOTE)}</p>
    </section>

    <section class="card card-quiet">
      <h2 class="card-title">Hinweis</h2>
      <p class="body-text">${esc(DISCLAIMER)}</p>
    </section>`;
}

export function mount() {
  return null;
}
