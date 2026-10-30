// Schlanke SVG-Diagramme ohne externe Bibliotheken: Linie, Säulen, Kalender.
// Dünne Linien, Haarlinien-Raster, Wert-Tooltips per Antippen, Tabellenansicht als Alternative.
import { esc, fmtNum, formatDate, dayNumber, clamp } from './util.js';

function niceScale(min, max, count = 4) {
  if (!(max > min)) {
    const pad = Math.abs(max) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 1000; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return { lo, hi: hi === lo ? lo + step : hi, ticks };
}

function width(container) {
  const w = Math.floor(container.getBoundingClientRect().width || container.clientWidth || 320);
  return Math.max(240, w);
}

function svgEl(W, H, inner, extraClass = '') {
  return `<svg class="ch-svg ${extraClass}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">${inner}</svg>`;
}

function roundTopRect(x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h));
  return `M${x} ${y + h}V${y + rr}Q${x} ${y} ${x + rr} ${y}H${x + w - rr}Q${x + w} ${y} ${x + w} ${y + rr}V${y + h}Z`;
}

function tooltipHTML() {
  return '<div class="ch-tip" hidden><strong class="ch-tip-value"></strong><span class="ch-tip-label"></span></div>';
}

function placeTip(container, tip, x, W) {
  tip.hidden = false;
  const tw = tip.offsetWidth || 120;
  const scale = container.getBoundingClientRect().width / W || 1;
  const left = clamp(x * scale - tw / 2, 0, Math.max(0, container.clientWidth - tw));
  tip.style.transform = `translateX(${left}px)`;
}

/**
 * Liniendiagramm.
 * points: [{ date:'JJJJ-MM-TT', y:Zahl, bandMin?, bandMax? }]
 */
export function lineChart(container, opts) {
  const {
    points, unit = '', decimals = 1, band = false, domain = null, yFloor = 0,
    valueText = (p) => `${fmtNum(p.y, decimals)}${unit ? ` ${unit}` : ''}`,
    labelText = (p) => formatDate(p.date, 'medium'),
    ariaLabel = 'Diagramm',
  } = opts;
  if (!points.length) {
    container.innerHTML = `<p class="chart-empty">${esc(opts.emptyText || 'Noch keine Daten.')}</p>`;
    return;
  }
  const W = width(container);
  const H = 196;
  const m = { top: 30, right: 20, bottom: 26, left: 38 };
  const pw = W - m.left - m.right;
  const ph = H - m.top - m.bottom;

  const days = points.map((p) => dayNumber(p.date));
  let d0 = Math.min(...days);
  let d1 = Math.max(...days);
  if (d0 === d1) { d0 -= 3; d1 += 3; }

  let sc;
  if (domain) {
    const step = opts.tickStep || 2;
    const ticks = [];
    for (let v = domain[0]; v <= domain[1] + 1e-9; v += step) ticks.push(v);
    sc = { lo: domain[0], hi: domain[1], ticks };
  } else {
    const vals = points.map((p) => p.y);
    let lo = Math.min(...vals);
    let hi = Math.max(...vals);
    const pad = (hi - lo) * 0.15 || Math.max(1, Math.abs(hi) * 0.15);
    lo = yFloor == null ? lo - pad : Math.max(yFloor, lo - pad);
    hi += pad;
    sc = niceScale(lo, hi, 4);
  }
  const X = (d) => m.left + ((d - d0) / (d1 - d0)) * pw;
  const Y = (v) => m.top + (1 - (v - sc.lo) / (sc.hi - sc.lo)) * ph;

  let g = '';
  for (const t of sc.ticks) {
    const y = Y(t).toFixed(1);
    g += `<line x1="${m.left}" x2="${W - m.right}" y1="${y}" y2="${y}" class="ch-grid"/>`;
    g += `<text x="${m.left - 8}" y="${y}" class="ch-ytick" dy="0.35em">${esc(fmtNum(t, 1))}</text>`;
  }

  const coords = points.map((p, i) => ({ x: X(days[i]), y: Y(p.y) }));

  if (band) {
    const top = points.map((p, i) => `${coords[i].x.toFixed(1)},${Y(p.bandMax).toFixed(1)}`);
    const bottom = points.map((p, i) => `${coords[i].x.toFixed(1)},${Y(p.bandMin).toFixed(1)}`).reverse();
    if (points.length === 1) {
      const x = coords[0].x;
      g += `<rect x="${(x - 14).toFixed(1)}" width="28" y="${Y(points[0].bandMax).toFixed(1)}" height="${(Y(points[0].bandMin) - Y(points[0].bandMax)).toFixed(1)}" class="ch-band" rx="3"/>`;
    } else {
      g += `<polygon points="${[...top, ...bottom].join(' ')}" class="ch-band"/>`;
    }
  }

  g += `<line class="ch-cross" x1="0" x2="0" y1="${m.top - 6}" y2="${H - m.bottom}"/>`;
  if (points.length > 1) {
    g += `<path d="${coords.map((c, i) => `${i ? 'L' : 'M'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join('')}" class="ch-line"/>`;
  }
  const showAllDots = points.length <= 24;
  coords.forEach((c, i) => {
    if (showAllDots || i === coords.length - 1) g += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="4" class="ch-dot"/>`;
  });
  g += '<circle class="ch-hover" cx="0" cy="0" r="6"/>';

  // Endwert beschriften
  const last = coords[coords.length - 1];
  const lastAnchor = last.x > W - m.right - 30 ? 'end' : 'middle';
  g += `<text x="${last.x.toFixed(1)}" y="${(last.y - 12).toFixed(1)}" class="ch-endlabel" text-anchor="${lastAnchor}">${esc(valueText(points[points.length - 1]))}</text>`;

  // x-Achse: erstes und letztes Datum
  g += `<text x="${coords[0].x.toFixed(1)}" y="${H - 6}" class="ch-xtick" text-anchor="${points.length > 1 ? 'start' : 'middle'}">${esc(formatDate(points[0].date, 'short'))}</text>`;
  if (points.length > 1 && points[points.length - 1].date !== points[0].date) {
    g += `<text x="${last.x.toFixed(1)}" y="${H - 6}" class="ch-xtick" text-anchor="end">${esc(formatDate(points[points.length - 1].date, 'short'))}</text>`;
  }

  container.classList.add('chart');
  container.setAttribute('tabindex', '0');
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', ariaLabel);
  container.innerHTML = svgEl(W, H, g) + tooltipHTML();

  const svg = container.querySelector('svg');
  const tip = container.querySelector('.ch-tip');
  const cross = svg.querySelector('.ch-cross');
  const hover = svg.querySelector('.ch-hover');
  let idx = -1;
  const show = (i) => {
    idx = i;
    const c = coords[i];
    cross.setAttribute('x1', c.x);
    cross.setAttribute('x2', c.x);
    cross.classList.add('on');
    hover.setAttribute('cx', c.x);
    hover.setAttribute('cy', c.y);
    hover.classList.add('on');
    tip.querySelector('.ch-tip-value').textContent = valueText(points[i]);
    tip.querySelector('.ch-tip-label').textContent = labelText(points[i]);
    placeTip(container, tip, c.x, W);
  };
  const hide = () => {
    idx = -1;
    cross.classList.remove('on');
    hover.classList.remove('on');
    tip.hidden = true;
  };
  const nearest = (clientX) => {
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bd = Infinity;
    coords.forEach((c, i) => {
      const d = Math.abs(c.x - x);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  };
  svg.addEventListener('pointermove', (e) => show(nearest(e.clientX)));
  svg.addEventListener('pointerdown', (e) => show(nearest(e.clientX)));
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(points.length - 1, idx + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx < 0 ? points.length - 1 : Math.max(0, idx - 1)); }
    else if (e.key === 'Escape') hide();
  });
  container.addEventListener('blur', hide);
}

/**
 * Säulendiagramm (z. B. Einheiten pro Planwoche).
 * bars: [{ label, value, tip, strong }]
 */
export function barChart(container, { bars, target = null, ariaLabel = 'Diagramm', tipValue, tipLabel }) {
  const W = width(container);
  const H = 176;
  const m = { top: 26, right: 12, bottom: 26, left: 28 };
  const pw = W - m.left - m.right;
  const ph = H - m.top - m.bottom;
  const maxV = Math.max(target || 0, ...bars.map((b) => b.value), 1);
  const ticks = [];
  const step = maxV <= 5 ? 1 : Math.ceil(maxV / 4);
  const hi = Math.ceil(maxV / step) * step;
  for (let v = 0; v <= hi; v += step) ticks.push(v);
  const Y = (v) => m.top + (1 - v / hi) * ph;
  const slot = pw / bars.length;
  const bw = Math.min(24, Math.max(6, slot - 6));

  let g = '';
  for (const t of ticks) {
    const y = Y(t).toFixed(1);
    g += `<line x1="${m.left}" x2="${W - m.right}" y1="${y}" y2="${y}" class="ch-grid${t === 0 ? ' ch-base' : ''}"/>`;
    g += `<text x="${m.left - 8}" y="${y}" class="ch-ytick" dy="0.35em">${t}</text>`;
  }
  if (target) {
    const y = Y(target).toFixed(1);
    g += `<line x1="${m.left}" x2="${W - m.right}" y1="${y}" y2="${y}" class="ch-target"/>`;
    g += `<text x="${W - m.right}" y="${(Y(target) - 6).toFixed(1)}" class="ch-targetlabel" text-anchor="end">Ziel</text>`;
  }
  bars.forEach((b, i) => {
    const cx = m.left + slot * i + slot / 2;
    if (b.value > 0) {
      const y = Y(b.value);
      g += `<path d="${roundTopRect(cx - bw / 2, y, bw, Y(0) - y, 4)}" class="ch-bar" data-i="${i}"/>`;
    }
    g += `<text x="${cx.toFixed(1)}" y="${H - 7}" class="ch-xtick${b.strong ? ' strong' : ''}" text-anchor="middle">${esc(b.label)}</text>`;
    g += `<rect x="${(cx - slot / 2).toFixed(1)}" y="${m.top - 10}" width="${slot.toFixed(1)}" height="${ph + 10}" class="ch-hit" data-i="${i}"/>`;
  });

  container.classList.add('chart');
  container.setAttribute('tabindex', '0');
  container.setAttribute('role', 'img');
  container.setAttribute('aria-label', ariaLabel);
  container.innerHTML = svgEl(W, H, g) + tooltipHTML();

  const svg = container.querySelector('svg');
  const tip = container.querySelector('.ch-tip');
  let idx = -1;
  const show = (i) => {
    idx = i;
    svg.querySelectorAll('.ch-bar').forEach((el) => el.classList.toggle('on', Number(el.dataset.i) === i));
    tip.querySelector('.ch-tip-value').textContent = tipValue(bars[i]);
    tip.querySelector('.ch-tip-label').textContent = tipLabel(bars[i]);
    placeTip(container, tip, m.left + slot * i + slot / 2, W);
  };
  const hide = () => {
    idx = -1;
    svg.querySelectorAll('.ch-bar.on').forEach((el) => el.classList.remove('on'));
    tip.hidden = true;
  };
  svg.addEventListener('pointerdown', (e) => {
    const hit = e.target.closest('[data-i]');
    if (hit) show(Number(hit.dataset.i));
  });
  svg.addEventListener('pointermove', (e) => {
    const hit = e.target.closest('[data-i]');
    if (hit) show(Number(hit.dataset.i));
  });
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') hide(); });
  container.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(Math.min(bars.length - 1, idx + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx < 0 ? bars.length - 1 : Math.max(0, idx - 1)); }
    else if (e.key === 'Escape') hide();
  });
  container.addEventListener('blur', hide);
}

/** Kalender der letzten Wochen: eine Spalte pro Woche, eine Zeile pro Wochentag. */
export function dotCalendar(weeks) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  let cells = '';
  for (let d = 0; d < 7; d++) {
    cells += `<span class="cal-day">${d % 2 === 0 ? days[d] : ''}</span>`;
    for (const w of weeks) {
      const day = w.days[d];
      const cls = ['cal-cell'];
      if (day.count > 0) cls.push('is-on');
      if (day.future) cls.push('is-future');
      if (day.today) cls.push('is-today');
      const text = `${formatDate(day.date, 'medium')}: ${day.count > 0 ? (day.count > 1 ? `${day.count} Einheiten` : 'trainiert') : day.future ? 'liegt in der Zukunft' : 'kein Training'}`;
      cells += `<button type="button" class="${cls.join(' ')}" data-cal="${esc(text)}" aria-label="${esc(text)}"${day.future ? ' tabindex="-1"' : ''}></button>`;
    }
  }
  return `<div class="cal" style="--weeks:${weeks.length}">${cells}</div>
    <div class="cal-foot"><span>${esc(formatDate(weeks[0].monday, 'short'))}</span><span>heute</span></div>`;
}

export function valueTable(headers, rows) {
  return `<details class="ch-table"><summary>Werte als Tabelle</summary>
    <table><thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
}
