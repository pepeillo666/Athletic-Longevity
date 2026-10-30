// Erster Start: Willkommen, Sicherheitshinweise, Startdatum.
import { store } from '../store.js';
import { esc, todayISO, uid, isISODate } from '../util.js';
import { anchorsFromStart } from '../plan.js';
import { DISCLAIMER, WARNING_SIGNS, EMERGENCY_SHORT } from '../content.js';
import { icon, toast } from '../ui.js';
import { navigate } from '../router.js';
import { importFromFile, filePicker } from './dialogs.js';
import { numOrNull } from './common.js';

const ui = { step: 0, ack: false, clearance: false };

function dots() {
  return `<ol class="ob-dots" aria-label="Schritt ${ui.step + 1} von 3">${[0, 1, 2].map((i) => `<li class="${i === ui.step ? 'on' : ''}"></li>`).join('')}</ol>`;
}

function stepWelcome() {
  return `
    <div class="ob-hero">
      <svg class="ob-mark" viewBox="0 0 120 120" aria-hidden="true">
        <circle cx="60" cy="60" r="44" class="ob-mark-track"/>
        <circle cx="60" cy="60" r="44" class="ob-mark-arc" transform="rotate(-90 60 60)"/>
        <path d="M43 76 60 42l17 34" class="ob-mark-a"/><path d="M50 65h20" class="ob-mark-bar"/>
      </svg>
      <h1 class="ob-title">Athletic Longevity</h1>
      <p class="ob-lead">Dein 12-Wochen-Plan für einen behutsamen Wiedereinstieg ins Krafttraining.</p>
    </div>
    <ul class="ob-points">
      <li>${icon('dumbbell')}<span><strong>Zwei Ganzkörpereinheiten im Wechsel</strong>Vorsichtig gesteigert, ohne Maximalversuche.</span></li>
      <li>${icon('heart')}<span><strong>Steuerung nach Empfinden</strong>Belastungsskala, Sprechtest und ärztliche Vorgaben – nicht der Puls allein.</span></li>
      <li>${icon('lock')}<span><strong>Deine Daten bleiben bei dir</strong>Kein Konto, kein Server, funktioniert offline.</span></li>
    </ul>
    <div class="btn-stack">
      <button type="button" class="btn btn-primary btn-lg" data-ob="next">Los geht’s</button>
      <button type="button" class="btn btn-quiet" data-ob="restore">${icon('upload')}Sicherung wiederherstellen</button>
    </div>`;
}

function stepSafety() {
  return `
    <h1 class="ob-title-sm">Bevor du startest</h1>
    <div class="callout callout-warn"><p>${esc(DISCLAIMER)}</p></div>
    <p class="field-label">Beende das Training sofort bei</p>
    <ul class="warn-list compact">${WARNING_SIGNS.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
    <p class="body-text"><strong>${esc(EMERGENCY_SHORT)}</strong> Alle Hinweise findest du jederzeit unter „Sicherheit“.</p>
    <label class="check-row"><input type="checkbox" data-ob-ack ${ui.ack ? 'checked' : ''}><span>Ich habe die Hinweise gelesen und verstanden.</span></label>
    <label class="check-row"><input type="checkbox" data-ob-clear ${ui.clearance ? 'checked' : ''}><span>Eine individuelle ärztliche Trainingsfreigabe liegt vor. <span class="muted">Falls noch nicht: später bestätigen.</span></span></label>
    <div class="btn-stack">
      <button type="button" class="btn btn-primary btn-lg" data-ob="next" ${ui.ack ? '' : 'disabled'}>Weiter</button>
      <button type="button" class="btn btn-quiet" data-ob="back">Zurück</button>
    </div>`;
}

function stepSetup() {
  const today = todayISO();
  return `
    <h1 class="ob-title-sm">Dein Plan</h1>
    <p class="body-text">Woche 1 beginnt am Startdatum. Danach zählt die App jede Woche weiter – du kannst Wochen jederzeit wiederholen oder verschieben.</p>
    <form class="form" data-ob-form>
      <label class="field"><span class="field-label">Startdatum</span><input class="input" type="date" name="start" value="${today}" required></label>
      <label class="field"><span class="field-label">Vorname <span class="muted">(optional)</span></span><input class="input" name="name" autocomplete="given-name"></label>
      <label class="field"><span class="field-label">Aktuelles Körpergewicht in kg <span class="muted">(optional)</span></span><input class="input" name="kg" type="text" inputmode="decimal" placeholder="z. B. 85"></label>
      <div class="btn-stack">
        <button type="submit" class="btn btn-primary btn-lg">${icon('check')}Plan starten</button>
        <button type="button" class="btn btn-quiet" data-ob="back">Zurück</button>
      </div>
    </form>`;
}

export function render() {
  const body = ui.step === 0 ? stepWelcome() : ui.step === 1 ? stepSafety() : stepSetup();
  return `<div class="onboarding">${dots()}${body}</div>`;
}

export function mount(root) {
  const go = (n) => {
    ui.step = Math.max(0, Math.min(2, n));
    navigate('#/willkommen');
    window.scrollTo(0, 0);
  };
  const onClick = (e) => {
    const b = e.target.closest('[data-ob]');
    if (!b) return;
    const a = b.dataset.ob;
    if (a === 'next') go(ui.step + 1);
    else if (a === 'back') go(ui.step - 1);
    else if (a === 'restore') filePicker((f) => importFromFile(f));
  };
  const onChange = (e) => {
    if (e.target.matches('[data-ob-ack]')) {
      ui.ack = e.target.checked;
      const next = root.querySelector('[data-ob="next"]');
      if (next) next.disabled = !ui.ack;
    }
    if (e.target.matches('[data-ob-clear]')) ui.clearance = e.target.checked;
  };
  const form = root.querySelector('[data-ob-form]');
  const onSubmit = (e) => {
    e.preventDefault();
    const start = form.elements.start.value;
    if (!isISODate(start)) { toast('Bitte ein gültiges Startdatum wählen.', { type: 'error' }); return; }
    const name = form.elements.name.value.trim().slice(0, 80);
    const kg = numOrNull(form.elements.kg.value, 20, 400);
    store.update((s) => {
      s.profile.onboarded = true;
      s.profile.safetyAck = true;
      s.profile.clearance = ui.clearance;
      s.profile.name = name;
      s.plan.anchors = anchorsFromStart(start);
      if (kg != null) s.bodyWeights.push({ id: uid(), date: todayISO(), kg });
    }, { now: true, render: false });
    ui.step = 0;
    store.requestPersistence();
    navigate('#/heute', { replace: true });
  };
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  if (form) form.addEventListener('submit', onSubmit);
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('change', onChange);
    if (form) form.removeEventListener('submit', onSubmit);
  };
}
