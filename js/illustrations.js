// Selbst gezeichnete Übungsillustrationen (SVG). Blasse Figur = Ausgangsposition,
// kräftige Figur = Endposition, grüner Pfeil = Bewegungsrichtung.
import { esc } from './util.js';

const r1 = (n) => Math.round(n * 10) / 10;
const P = (p) => `${r1(p[0])},${r1(p[1])}`;

const line = (a, b, cls) => `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}" class="${cls}"/>`;
const poly = (pts, cls) => `<polyline points="${pts.map(P).join(' ')}" class="${cls}"/>`;
const circle = (c, r, cls) => `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="${r}" class="${cls}"/>`;
const rect = (x, y, w, h, rx, cls) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" class="${cls}"/>`;

function head(tip, from, size = 7) {
  const ang = Math.atan2(tip[1] - from[1], tip[0] - from[0]);
  const a1 = ang + Math.PI * 0.8;
  const a2 = ang - Math.PI * 0.8;
  const p1 = [tip[0] + size * Math.cos(a1), tip[1] + size * Math.sin(a1)];
  const p2 = [tip[0] + size * Math.cos(a2), tip[1] + size * Math.sin(a2)];
  return `<path d="M${P(p1)} L${P(tip)} L${P(p2)}" class="ill-arrow"/>`;
}
const arrow = (a, b) => line(a, b, 'ill-arrow') + head(b, a);
const curve = (a, c, b) => `<path d="M${P(a)} Q${P(c)} ${P(b)}" class="ill-arrow"/>` + head(b, c);

/**
 * Figur zeichnen. Seitenansicht: Rumpf als Linie (shoulder→hip).
 * Frontansicht: Rumpf als abgerundetes Rechteck (torso: {cx, top, bottom, w}).
 */
function figure(p, { ghost = false, accent = [] } = {}) {
  // accent: 'arm0' (ganzer Arm) oder 'arm0:1' (erst ab Gelenk 1, z. B. nur der Unterarm)
  const limb = (pts, key) => {
    if (ghost) return poly(pts, 'ill-limb');
    const hit = accent.find((a) => a === key || a.startsWith(`${key}:`));
    if (!hit) return poly(pts, 'ill-limb');
    const from = hit.includes(':') ? Number(hit.split(':')[1]) : 0;
    if (!from) return poly(pts, 'ill-limb ill-accent');
    return poly(pts.slice(0, from + 1), 'ill-limb') + poly(pts.slice(from), 'ill-limb ill-accent');
  };
  let out = '';
  (p.farLegs || []).forEach((leg) => { out += poly(leg, 'ill-limb ill-far'); });
  (p.farArms || []).forEach((arm) => { out += poly(arm, 'ill-limb ill-far'); });
  (p.legs || []).forEach((leg, i) => { out += limb(leg, `leg${i}`); });
  if (p.torso) {
    const t = p.torso;
    out += rect(t.cx - t.w / 2, t.top, t.w, t.bottom - t.top, t.w / 2.4, 'ill-fill');
  } else if (p.shoulder && p.hip) {
    out += line(p.shoulder, p.hip, 'ill-torso');
  }
  if (p.shoulderBar) out += line(p.shoulderBar[0], p.shoulderBar[1], 'ill-torso');
  (p.arms || []).forEach((arm, i) => { out += limb(arm, `arm${i}`); });
  if (p.head) out += circle(p.head, p.headR || 9.5, 'ill-head');
  return ghost ? `<g class="ill-ghost">${out}</g>` : `<g>${out}</g>`;
}

const padLine = (a, b) => line(a, b, 'ill-pad');
const mach = (a, b) => line(a, b, 'ill-mach');
const thin = (a, b) => line(a, b, 'ill-thin');
const ground = '<line x1="14" y1="146" x2="226" y2="146" class="ill-ground"/>';
const label = (x, y, text) => `<text x="${x}" y="${y}" class="ill-label">${esc(text)}</text>`;

/* ---------- Szenen ---------- */

const SCENES = {
  legpress() {
    const hip = [78, 108];
    const shoulder = [60, 64];
    const top = { head: [54, 48.5], shoulder, hip, arms: [[shoulder, [70, 86], [84, 104]]] };
    return `<g transform="translate(18 0)">
      ${line([30, 138], [196, 138], 'ill-thin')}
      ${padLine([58, 112], [45, 60])}${padLine([62, 117], [100, 117])}
      ${mach([82, 120], [82, 138])}
      ${line([86, 104], [94, 114], 'ill-thin')}
      <g class="ill-ghost">${padLine([134, 80], [134, 126])}</g>
      ${figure({ ...top, legs: [[hip, [100, 80], [128, 104]]] }, { ghost: true })}
      ${padLine([153, 80], [153, 126])}${mach([153, 126], [153, 138])}
      ${figure({ ...top, legs: [[hip, [112, 100], [147, 103]]] }, { accent: ['leg0'] })}
      ${arrow([130, 66], [160, 66])}
    </g>`;
  },

  chestpress() {
    const hip = [80, 110];
    const shoulder = [78, 64];
    const base = { head: [77, 48], shoulder, hip, legs: [[hip, [114, 112], [114, 142]]] };
    return `<g transform="translate(6 0)">
      ${padLine([66, 58], [66, 112])}${padLine([68, 117], [104, 117])}${mach([86, 120], [86, 142])}
      ${mach([176, 28], [176, 142])}
      <g class="ill-ghost">${thin([176, 34], [104, 72])}${line([104, 64], [104, 80], 'ill-grip')}</g>
      ${figure({ ...base, arms: [[shoulder, [84, 88], [104, 72]]] }, { ghost: true })}
      ${thin([176, 34], [128, 70])}${line([128, 62], [128, 78], 'ill-grip')}
      ${figure({ ...base, arms: [[shoulder, [103, 68], [128, 70]]] }, { accent: ['arm0'] })}
      ${arrow([108, 46], [138, 46])}
    </g>`;
  },

  row() {
    const hip = [72, 112];
    const shoulder = [74, 66];
    const base = { head: [75, 50], shoulder, hip, legs: [[hip, [106, 102], [138, 114]]] };
    return `<g transform="translate(4 0)">
      ${padLine([52, 119], [100, 119])}${mach([76, 122], [76, 142])}
      ${padLine([143, 100], [143, 130])}
      ${mach([204, 40], [204, 142])}${circle([199, 100], 5, 'ill-pulley')}
      <g class="ill-ghost">${line([122, 78], [199, 100], 'ill-cable')}</g>
      ${figure({ ...base, arms: [[shoulder, [98, 72], [122, 78]]] }, { ghost: true })}
      ${line([80, 90], [199, 100], 'ill-cable')}
      ${figure({ ...base, arms: [[shoulder, [54, 82], [78, 90]]] }, { accent: ['arm0'] })}
      ${arrow([124, 50], [94, 50])}
    </g>`;
  },

  legcurl() {
    const hip = [80, 102];
    const knee = [116, 102];
    const shoulder = [70, 58];
    const base = { head: [67, 42], shoulder, hip, arms: [[shoulder, [78, 82], [92, 98]]] };
    return `<g transform="translate(6 0)">
      ${padLine([59, 52], [64, 100])}${padLine([66, 109], [110, 109])}${mach([90, 112], [90, 142])}
      ${padLine([90, 92], [114, 92])}
      <g class="ill-ghost">${thin(knee, [147, 107])}${circle([147, 107], 6, 'ill-roller')}</g>
      ${figure({ ...base, legs: [[hip, knee, [150, 98]]] }, { ghost: true })}
      ${thin(knee, [100, 122])}${circle([100, 122], 6, 'ill-roller')}
      ${figure({ ...base, legs: [[hip, knee, [104, 135]]] }, { accent: ['leg0:1'] })}
      ${circle(knee, 3.5, 'ill-pivot')}
      ${curve([160, 106], [158, 134], [126, 140])}
    </g>`;
  },

  lateralraise() {
    const torso = { cx: 120, top: 44, bottom: 92, w: 26 };
    const legs = [[[114, 90], [112, 116], [111, 142]], [[126, 90], [128, 116], [129, 142]]];
    const base = { head: [120, 30], torso, legs };
    return `
      ${figure({ ...base, arms: [[[109, 50], [103, 72], [101, 94]], [[131, 50], [137, 72], [139, 94]]] }, { ghost: true })}
      <g class="ill-ghost">${circle([101, 96], 4.5, 'ill-weight')}${circle([139, 96], 4.5, 'ill-weight')}</g>
      ${figure({ ...base, arms: [[[109, 50], [85, 52], [61, 54]], [[131, 50], [155, 52], [179, 54]]] }, { accent: ['arm0', 'arm1'] })}
      ${circle([58, 54], 5, 'ill-weight')}${circle([182, 54], 5, 'ill-weight')}
      ${curve([88, 106], [62, 102], [56, 72])}${curve([152, 106], [178, 102], [184, 72])}
    `;
  },

  calfraise() {
    const hip = [82, 96];
    const shoulder = [82, 50];
    const base = { head: [82, 34], shoulder, hip, arms: [[shoulder, [92, 72], [106, 84]]] };
    return `<g transform="translate(8 0)">
      ${padLine([60, 101], [100, 101])}${mach([80, 104], [80, 142])}
      ${rect(122, 129, 30, 13, 3, 'ill-block')}
      <g class="ill-ghost">${padLine([96, 89], [120, 89])}</g>
      ${figure({ ...base, legs: [[hip, [116, 96], [116, 130], [140, 128]]] }, { ghost: true })}
      ${padLine([96, 82], [120, 78])}
      ${figure({ ...base, legs: [[hip, [116, 88], [118, 121], [140, 128]]] }, { accent: ['leg0:1'] })}
      ${arrow([100, 140], [100, 114])}
    </g>`;
  },

  legext() {
    const hip = [80, 102];
    const knee = [116, 102];
    const shoulder = [70, 58];
    const base = { head: [67, 42], shoulder, hip, arms: [[shoulder, [78, 82], [92, 98]]] };
    return `<g transform="translate(6 0)">
      ${padLine([59, 52], [64, 100])}${padLine([66, 109], [110, 109])}${mach([90, 112], [90, 142])}
      <g class="ill-ghost">${thin(knee, [126, 129])}${circle([126, 129], 6, 'ill-roller')}</g>
      ${figure({ ...base, legs: [[hip, knee, [118, 136]]] }, { ghost: true })}
      ${thin(knee, [141, 89])}${circle([141, 89], 6, 'ill-roller')}
      ${figure({ ...base, legs: [[hip, knee, [150, 96]]] }, { accent: ['leg0:1'] })}
      ${circle(knee, 3.5, 'ill-pivot')}
      ${curve([136, 142], [166, 134], [164, 104])}
    </g>`;
  },

  latpull() {
    const hip = [80, 108];
    const shoulder = [77, 63];
    const base = { head: [74, 47], shoulder, hip, legs: [[hip, [114, 104], [116, 142]]] };
    return `<g transform="translate(14 0)">
      ${mach([180, 14], [180, 142])}${mach([180, 14], [110, 14])}${circle([110, 19], 5, 'ill-pulley')}
      ${padLine([62, 113], [104, 113])}${mach([84, 116], [84, 142])}
      ${padLine([100, 95], [120, 95])}
      <g class="ill-ghost">${line([102, 22], [110, 19], 'ill-cable')}${circle([102, 22], 4.5, 'ill-weight')}</g>
      ${figure({ ...base, arms: [[shoulder, [90, 42], [102, 22]]] }, { ghost: true })}
      ${line([96, 70], [110, 19], 'ill-cable')}
      ${figure({ ...base, arms: [[shoulder, [72, 87], [96, 70]]] }, { accent: ['arm0'] })}
      ${circle([96, 70], 4.5, 'ill-weight')}
      ${arrow([128, 26], [128, 60])}
    </g>`;
  },

  abduction() {
    const torso = { cx: 120, top: 44, bottom: 94, w: 26 };
    const arms = [[[109, 50], [101, 72], [99, 92]], [[131, 50], [139, 72], [141, 92]]];
    const base = { head: [120, 30], torso, arms };
    return `
      ${rect(100, 48, 40, 54, 9, 'ill-padfill')}
      ${padLine([92, 101], [148, 101])}${mach([120, 104], [120, 142])}
      <g class="ill-ghost">${padLine([100, 104], [100, 122])}${padLine([140, 104], [140, 122])}</g>
      ${figure({ ...base, legs: [[[114, 94], [111, 112], [111, 142]], [[126, 94], [129, 112], [129, 142]]] }, { ghost: true })}
      ${padLine([80, 102], [80, 122])}${padLine([160, 102], [160, 122])}
      ${figure({ ...base, legs: [[[114, 94], [90, 110], [95, 142]], [[126, 94], [150, 110], [145, 142]]] }, { accent: ['leg0', 'leg1'] })}
      ${arrow([96, 132], [72, 132])}${arrow([144, 132], [168, 132])}
    `;
  },

  reversefly() {
    // Ansicht von oben: Kopf, Schultern, Arme; Polster vor der Brust.
    const sh = { head: [120, 96], headR: 11, shoulderBar: [[101, 96], [139, 96]] };
    return `
      ${padLine([106, 74], [134, 74])}
      ${figure({ ...sh, arms: [[[101, 96], [98, 72], [107, 50]], [[139, 96], [142, 72], [133, 50]]] }, { ghost: true })}
      <g class="ill-ghost">${circle([107, 47], 4.5, 'ill-weight')}${circle([133, 47], 4.5, 'ill-weight')}</g>
      ${figure({ ...sh, arms: [[[101, 96], [77, 90], [54, 94]], [[139, 96], [163, 90], [186, 94]]] }, { accent: ['arm0', 'arm1'] })}
      ${circle([51, 94], 5, 'ill-weight')}${circle([189, 94], 5, 'ill-weight')}
      ${curve([96, 44], [62, 46], [54, 78])}${curve([144, 44], [178, 46], [186, 78])}
      ${label(120, 140, 'Ansicht von oben')}
    `;
  },

  triceps() {
    const hip = [110, 94];
    const shoulder = [114, 48];
    const base = {
      head: [116, 32], shoulder, hip,
      legs: [[hip, [116, 118], [116, 142]]], farLegs: [[hip, [104, 118], [99, 142]]],
    };
    return `<g transform="translate(-6 0)">
      ${mach([178, 14], [178, 142])}${circle([173, 22], 5, 'ill-pulley')}
      <g class="ill-ghost">${line([134, 66], [173, 22], 'ill-cable')}</g>
      ${figure({ ...base, arms: [[shoulder, [110, 72], [134, 66]]] }, { ghost: true })}
      ${line([116, 96], [173, 22], 'ill-cable')}
      ${figure({ ...base, arms: [[shoulder, [110, 72], [116, 96]]] }, { accent: ['arm0:1'] })}
      ${curve([144, 70], [150, 94], [128, 106])}
    </g>`;
  },

  biceps() {
    const hip = [110, 94];
    const shoulder = [114, 48];
    const base = {
      head: [116, 32], shoulder, hip,
      legs: [[hip, [116, 118], [116, 142]]], farLegs: [[hip, [104, 118], [99, 142]]],
    };
    return `<g transform="translate(-6 0)">
      ${mach([178, 14], [178, 142])}${circle([173, 132], 5, 'ill-pulley')}
      <g class="ill-ghost">${line([118, 96], [173, 132], 'ill-cable')}</g>
      ${figure({ ...base, arms: [[shoulder, [112, 72], [118, 96]]] }, { ghost: true })}
      ${line([130, 56], [173, 132], 'ill-cable')}
      ${figure({ ...base, arms: [[shoulder, [112, 72], [130, 56]]] }, { accent: ['arm0:1'] })}
      ${curve([132, 104], [152, 88], [140, 58])}
    </g>`;
  },

  bike() {
    const hip = [96, 84];
    const shoulder = [118, 46];
    return `<g transform="translate(6 0)">
      ${mach([58, 140], [176, 140])}
      ${mach([96, 140], [98, 92])}${line([86, 90], [106, 90], 'ill-pad')}
      ${mach([156, 140], [146, 76])}${line([138, 72], [154, 70], 'ill-grip')}
      ${circle([156, 122], 15, 'ill-wheel')}
      ${circle([112, 120], 11, 'ill-wheel')}
      ${figure({
        head: [125, 31], shoulder, hip,
        arms: [[shoulder, [131, 60], [144, 72]]],
        farLegs: [[hip, [126, 80], [113, 108]]],
        legs: [[hip, [123, 102], [111, 132]]],
      })}
    </g>`;
  },
};

export function illustration(id, title = '') {
  const key = id === 'chestpress_light' ? 'chestpress' : id;
  const scene = SCENES[key];
  if (!scene) return '';
  const aria = title ? ` role="img" aria-label="${esc(title)}"` : ' aria-hidden="true"';
  return `<svg class="ill" viewBox="0 0 240 160"${aria} focusable="false">${ground}${scene()}</svg>`;
}

export const ILLUSTRATION_IDS = Object.keys(SCENES);
