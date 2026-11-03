// Marke: Logo (Ring aus 12 Segmenten – eines je Planwoche – mit „A“) und Schriftzug.
import { esc } from './util.js';

const C = 60;
const R = 46;
const GAP = 14.1; // Grad; berücksichtigt die runden Enden, sichtbare Lücke ≈ 3,5°

function polar(deg, r = R) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [C + r * Math.cos(rad), C + r * Math.sin(rad)];
}

function seg(i) {
  const a0 = i * 30 + GAP / 2;
  const a1 = (i + 1) * 30 - GAP / 2;
  const [x0, y0] = polar(a0);
  const [x1, y1] = polar(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

/** Logo als SVG. filled: wie viele der 12 Segmente farbig sind. */
export function logoMark({ size = 96, title = '', filled = 9, className = '' } = {}) {
  let ring = '';
  for (let i = 0; i < 12; i++) {
    ring += `<path d="${seg(i)}" class="lm-seg${i < filled ? ' is-on' : ''}" style="--i:${i}"/>`;
  }
  const a11y = title ? `role="img" aria-label="${esc(title)}"` : 'aria-hidden="true"';
  return `<svg class="logo-mark ${className}" viewBox="0 0 120 120" width="${size}" height="${size}" ${a11y} focusable="false">
    ${ring}
    <path d="M42 80 60 38l18 42" class="lm-a"/>
    <path d="M49.5 66h21" class="lm-bar"/>
  </svg>`;
}

/** Logo mit Schriftzug, z. B. für „Über die App“. */
export function brandLockup({ size = 44, sub = '' } = {}) {
  return `<div class="brand">
    ${logoMark({ size })}
    <div class="brand-text"><span class="brand-name">Athletic Longevity</span>${sub ? `<span class="brand-sub">${esc(sub)}</span>` : ''}</div>
  </div>`;
}
