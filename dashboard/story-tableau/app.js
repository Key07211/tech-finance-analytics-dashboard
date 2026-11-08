'use strict';
/* Market Yearbook 2025–26 — Tableau-style story dashboard. Dependency-free; everything is
   computed from the embedded daily Close series so the page and the data cannot drift apart. */

/* ---------------------------------------------------------------- data */
const RAW = JSON.parse(document.getElementById('market-data').textContent);
const DATES = RAW.dates;
const LAST = DATES.length - 1;
const RDATES = DATES.slice(1); // dates of the daily returns

const META = {NVDA:['NVIDIA','Accelerated computing and AI chips'],MSFT:['Microsoft','Software and cloud services'],GOOGL:['Alphabet','Search, advertising and cloud'],META:['Meta','Social platforms and AI'],AMZN:['Amazon','E-commerce and cloud services'],CRM:['Salesforce','Customer relationship software'],PLTR:['Palantir','Data analytics software'],AI:['C3.ai','Enterprise AI software'],SNOW:['Snowflake','Cloud data platform'],IBM:['IBM','Enterprise technology and consulting'],SMCI:['Super Micro Computer','Servers and computing systems'],ORCL:['Oracle','Databases and cloud services'],AMD:['AMD','Processors and computing chips'],INTC:['Intel','Processors and chip manufacturing'],TSM:['TSMC','Semiconductor foundry'],AVGO:['Broadcom','Semiconductors and infrastructure software'],QCOM:['Qualcomm','Wireless communications chips'],TXN:['Texas Instruments','Analog and embedded chips'],MU:['Micron','Memory chips'],MRVL:['Marvell','Data infrastructure chips'],ARM:['Arm','Processor architecture and licensing'],ASML:['ASML','Chipmaking equipment'],TSLA:['Tesla','EVs and energy storage'],ENPH:['Enphase Energy','Solar inverters and storage'],SEDG:['SolarEdge','Solar power electronics'],FSLR:['First Solar','Solar modules'],RUN:['Sunrun','Residential solar and storage'],PLUG:['Plug Power','Hydrogen and fuel cells'],BE:['Bloom Energy','Fuel-cell power systems'],NEE:['NextEra Energy','Electricity and renewable energy'],RIVN:['Rivian','Electric vehicles'],LCID:['Lucid','Electric vehicles'],NIO:['NIO','Electric vehicles'],LI:['Li Auto','Electric vehicles'],XPEV:['XPeng','Electric vehicles'],GSPC:['S&P 500','Market price index']};

const THEMES = [
  {id:'AI', name:'AI', short:'AI', color:'#2b6cb0', desc:'Computing infrastructure, cloud services and enterprise software.', tickers:'NVDA MSFT GOOGL META AMZN CRM PLTR AI SNOW IBM SMCI ORCL'.split(' ')},
  {id:'Chip', name:'Semiconductors', short:'Semis', color:'#e67e22', desc:'Chip designers, manufacturers and equipment suppliers.', tickers:'AMD INTC TSM AVGO QCOM TXN MU MRVL ARM ASML'.split(' ')},
  {id:'NewEnergy', name:'New Energy', short:'New Energy', color:'#16a085', desc:'Solar, fuel cells and electric vehicles.', tickers:'TSLA ENPH SEDG FSLR RUN PLUG BE NEE RIVN LCID NIO LI XPEV'.split(' ')}
];
const [AI, CHIP, NE] = THEMES;
const SPX_COLOR = '#7f7f7f', INK = '#1f2a37', NEUTRAL = '#5b6b7c';

/* ---------------------------------------------------------------- math */
const sum = a => a.reduce((x, y) => x + y, 0);
const mean = a => sum(a) / a.length;
function median(a) { const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
function pearson(a, b) {
  if (a.length !== b.length || a.length < 2) return null;
  const ma = mean(a), mb = mean(b);
  let num = 0, va = 0, vb = 0;
  for (let i = 0; i < a.length; i++) { const da = a[i] - ma, db = b[i] - mb; num += da * db; va += da * da; vb += db * db; }
  if (!va || !vb) return null;
  return Math.max(-1, Math.min(1, num / Math.sqrt(va * vb)));
}
function rolling(a, b, w) { return a.map((_, i) => i < w - 1 ? null : pearson(a.slice(i - w + 1, i + 1), b.slice(i - w + 1, i + 1))); }
const dayDiff = (d1, d2) => Math.round((Date.parse(d2) - Date.parse(d1)) / 86400000);
function ddStats(close) {
  let high = close[0], hi = 0, dd = 0, peak = 0, trough = 0;
  close.forEach((v, i) => { if (v > high) { high = v; hi = i; } const d = v / high - 1; if (d < dd) { dd = d; peak = hi; trough = i; } });
  let recovery = -1;
  if (dd < 0) for (let i = trough + 1; i < close.length; i++) if (close[i] >= close[peak]) { recovery = i; break; }
  return {ret: (close[close.length - 1] / close[0] - 1) * 100, dd: dd * 100, peak, trough, recovery,
    ddDays: dayDiff(DATES[peak], DATES[trough]), recDays: recovery < 0 ? null : dayDiff(DATES[trough], DATES[recovery])};
}
function underwater(close) { let hi = -Infinity; return close.map(v => { hi = Math.max(hi, v); return (v / hi - 1) * 100; }); }

/* ---------------------------------------------------------------- formatting */
const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtN = (n, d = 0) => n.toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d}).replace('-', '−');
const pct = (n, d = 1) => (n > 0 ? '+' : '') + fmtN(n, d) + '%';
const coef = v => v == null ? 'n/a' : (v < 0 ? '−' : '') + Math.abs(v).toFixed(2);
function fdate(iso, year = true) { const [y, m, d] = iso.split('-'); return MON[+m - 1] + ' ' + (+d) + (year ? ', ' + y : ''); }
function monthLabel(iso) { const [y, m] = iso.split('-'); return m === '01' ? "Jan '" + y.slice(2) : MON[+m - 1]; }
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------------------------------------------------------------- derived series */
const STOCKS = {};
Object.keys(RAW.close).forEach(t => {
  const close = RAW.close[t];
  STOCKS[t] = {ticker: t, name: META[t][0], business: META[t][1], close,
    normal: close.map(v => v / close[0] * 100), daily: close.slice(1).map((v, i) => v / close[i] - 1), stats: ddStats(close),
    theme: THEMES.find(g => g.tickers.includes(t)) || null};
});
THEMES.forEach(g => {
  g.stocks = g.tickers.map(t => STOCKS[t]);
  g.values = DATES.map((_, i) => mean(g.stocks.map(s => s.normal[i])));
  g.daily = RDATES.map((_, i) => mean(g.stocks.map(s => s.daily[i])));
  g.rets = g.stocks.map(s => s.stats.ret);
  g.mean = mean(g.rets); g.median = median(g.rets); g.gainers = g.rets.filter(r => r > 0).length;
});
const ALL = THEMES.flatMap(g => g.stocks);
const SPX = STOCKS.GSPC;

const CORR = {};
function corr(a, b) { const k = a + '|' + b; if (!(k in CORR)) CORR[k] = pearson(STOCKS[a].daily, STOCKS[b].daily); return CORR[k]; }
function sameDir(a, b) { const A = STOCKS[a].daily, B = STOCKS[b].daily; return A.filter((v, i) => v * B[i] > 0).length / A.length * 100; }
const CROSS = AI.tickers.flatMap(a => CHIP.tickers.map(b => ({a, b, r: corr(a, b)})));
function withinMean(g) { const rs = []; for (let i = 0; i < g.tickers.length; i++) for (let j = i + 1; j < g.tickers.length; j++) rs.push(corr(g.tickers[i], g.tickers[j])); return mean(rs); }
const C = {cross: mean(CROSS.map(p => p.r)), ai: withinMean(AI), chip: withinMean(CHIP), group: pearson(AI.daily, CHIP.daily),
  max: CROSS.reduce((m, p) => p.r > m.r ? p : m), min: CROSS.reduce((m, p) => p.r < m.r ? p : m)};
const HM_SCALE = Math.ceil(Math.max(...CROSS.map(p => Math.abs(p.r))) * 10) / 10;
const PRESETS = [{a: 'NVDA', b: 'AMD', label: 'NVIDIA × AMD · the obvious pair'},
  {a: C.max.a, b: C.max.b, label: `Strongest pair · ${STOCKS[C.max.a].name} × ${STOCKS[C.max.b].name}`},
  {a: C.min.a, b: C.min.b, label: `Most negative pair · ${STOCKS[C.min.a].name} × ${STOCKS[C.min.b].name}`}];

const MILESTONES = [
  {date: '2025-10-29', title: 'Autumn: all three themes ahead', text: 'The AI basket reaches its high for the year. Every theme is above its starting line.'},
  {date: '2026-03-30', title: 'Spring: a shared trough', text: 'The AI and semiconductor baskets both bottom out on the same day. AI is now below its start.'},
  {date: '2026-05-11', title: 'The finish: the rebound widens the gap', text: 'From March 30 the semiconductor basket rises sharply. AI and New Energy recover too, but the themes end far apart.'}
];
const CASES = [['BE', 'A big gain, a deep setback'], ['SMCI', 'Same endpoints, an uneven path'], ['LCID', 'Still below its former high']];

/* ---------------------------------------------------------------- state */
const S = {point: 1, company: 'NVDA', themeFilter: 'All', distTheme: 'NewEnergy', exclude: false, showMean: true, showMedian: true,
  dateIdx: LAST, overlay: false, pairA: 'NVDA', pairB: 'AMD', win: 30, checkpoint: 0, fullPath: true, tables: new Set()};
const TABLES = {};
const $ = id => document.getElementById(id);
{ const p = parseInt(location.hash.slice(1), 10); if (p >= 1 && p <= 8) S.point = p; }

/* ---------------------------------------------------------------- tooltip */
const tipEl = $('tip');
function moveTip(x, y) {
  const pad = 14, w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let left = x + pad, top = y + pad;
  if (left + w > window.innerWidth - 8) left = x - w - pad;
  if (top + h > window.innerHeight - 8) top = y - h - pad;
  tipEl.style.left = Math.max(4, left) + 'px'; tipEl.style.top = Math.max(4, top) + 'px';
}
function showTip(html, ev) { tipEl.innerHTML = html; tipEl.style.display = 'block'; moveTip(ev.clientX, ev.clientY); }
function showTipAt(html, el) { const r = el.getBoundingClientRect(); tipEl.innerHTML = html; tipEl.style.display = 'block'; moveTip(r.left + r.width / 2, r.top + r.height / 2); }
function hideTip() { tipEl.style.display = 'none'; }
function tipHTML(head, rows) {
  return `<div class="t-head">${esc(head)}</div>` + rows.map(([label, val, color]) =>
    `<div class="t-row"><span>${color ? `<i style="background:${color}"></i>` : ''}${esc(label)}</span><b>${esc(val)}</b></div>`).join('');
}
function hoverable(el, html, onActivate) {
  el.addEventListener('pointermove', ev => showTip(typeof html === 'function' ? html() : html, ev));
  el.addEventListener('pointerleave', hideTip);
  el.addEventListener('focus', () => showTipAt(typeof html === 'function' ? html() : html, el));
  el.addEventListener('blur', hideTip);
  if (onActivate) {
    el.addEventListener('click', onActivate);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(); } });
  }
}

/* ---------------------------------------------------------------- scales */
function niceTicks(lo, hi, n = 5) {
  const raw = (hi - lo) / n, p = Math.pow(10, Math.floor(Math.log10(raw)));
  let step = 10 * p;
  for (const s of [1, 2, 2.5, 5, 10]) if (raw <= s * p) { step = s * p; break; }
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}
function monthStarts(dates) { const t = []; for (let i = 1; i < dates.length; i++) if (dates[i].slice(0, 7) !== dates[i - 1].slice(0, 7)) t.push(i); return t; }
function monthEnds(dates) { const t = []; for (let i = 0; i < dates.length - 1; i++) if (dates[i].slice(0, 7) !== dates[i + 1].slice(0, 7)) t.push(i); t.push(dates.length - 1); return t; }
const width = el => Math.max(300, el.clientWidth || el.parentElement.clientWidth || 600);

/* ---------------------------------------------------------------- line chart */
function lineChart(el, o) {
  const W = width(el), H = o.height || 300, dates = o.dates || DATES, n = dates.length;
  const end = o.end == null ? n - 1 : o.end, hoverEnd = o.hoverEnd == null ? end : o.hoverEnd;
  const L = o.left || 46, R = o.endLabels ? 118 : 16, T = 16, B = 26, PW = W - L - R, PH = H - T - B;
  const fmt = o.tipFmt || (v => fmtN(v, 1));
  const vals = [];
  o.series.forEach(s => { const upto = o.scaleAll ? n : end + 1; for (let i = 0; i < upto; i++) { const v = s.values[i]; if (v != null && isFinite(v)) vals.push(v); } });
  let lo, hi;
  if (o.yDomain) { [lo, hi] = o.yDomain; }
  else {
    lo = Math.min(...vals); hi = Math.max(...vals);
    if (o.baseline != null) { lo = Math.min(lo, o.baseline); hi = Math.max(hi, o.baseline); }
    const pad = (hi - lo) * 0.08 || 1; lo -= pad; hi += pad;
    if (o.capTop != null) hi = Math.min(hi, o.capTop);
  }
  const x = i => L + (n === 1 ? 0 : i / (n - 1)) * PW, y = v => T + (hi - v) / (hi - lo) * PH;
  let g = '';
  const ticks = niceTicks(lo, hi, 5);
  ticks.forEach(v => {
    const yy = y(v), base = o.baseline != null && Math.abs(v - o.baseline) < 1e-9;
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="${base ? '#9aa0a6' : '#e6e8eb'}"/><text x="${L - 6}" y="${yy + 3.5}" text-anchor="end">${esc((o.yFmt || (v => fmtN(v)))(v))}</text>`;
  });
  if (o.baseline != null && !ticks.some(v => Math.abs(v - o.baseline) < 1e-9) && o.baseline >= lo && o.baseline <= hi)
    g += `<line x1="${L}" x2="${W - R}" y1="${y(o.baseline)}" y2="${y(o.baseline)}" stroke="#9aa0a6"/>`;
  const ms = monthStarts(dates), every = PW < 520 ? 2 : 1;
  ms.forEach((i, k) => { if (k % every) return; g += `<line x1="${x(i)}" x2="${x(i)}" y1="${T + PH}" y2="${T + PH + 4}" stroke="#c0c4c9"/><text x="${x(i)}" y="${H - 7}" text-anchor="middle">${monthLabel(dates[i])}</text>`; });
  g += `<line x1="${L}" x2="${W - R}" y1="${T + PH}" y2="${T + PH}" stroke="#c0c4c9"/>`;
  if (o.shade) {
    const x1 = x(o.shade.from), x2 = x(o.shade.to);
    g += `<rect x="${x1}" y="${T}" width="${Math.max(1, x2 - x1)}" height="${PH}" fill="${o.shade.color}" fill-opacity=".12"/>`;
    if (o.shade.label) g += `<text x="${(x1 + x2) / 2}" y="${T + PH - 6}" text-anchor="middle" fill="#555" font-size="10.5">${esc(o.shade.label)}</text>`;
  }
  const pathOf = (values, upto) => { let d = '', pen = false; for (let i = 0; i <= upto; i++) { const v = values[i]; if (v == null || !isFinite(v)) { pen = false; continue; } d += (pen ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(v).toFixed(1) + ' '; pen = true; } return d; };
  o.series.forEach(s => {
    const upto = o.fadeFrom != null ? n - 1 : end;
    const d = s.straight ? `M${x(0).toFixed(1)},${y(s.values[0]).toFixed(1)} L${x(end).toFixed(1)},${y(s.values[end]).toFixed(1)}` : pathOf(s.values, upto);
    if (o.area) { const b = y(o.baseline == null ? 0 : o.baseline); g += `<path d="${d}L${x(upto).toFixed(1)},${b} L${x(0).toFixed(1)},${b} Z" fill="${s.color}" fill-opacity=".12"/>`; }
    g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2}" stroke-linejoin="round" stroke-linecap="round"${s.dash ? ' stroke-dasharray="6 4"' : ''}/>`;
  });
  if (o.fadeFrom != null && o.fadeFrom < n - 1) g += `<rect x="${x(o.fadeFrom)}" y="${T}" width="${W - R - x(o.fadeFrom)}" height="${PH}" fill="#fff" fill-opacity=".78"/>`;
  (o.refX || []).forEach(r => {
    const xx = x(r.at);
    g += `<line x1="${xx}" x2="${xx}" y1="${T}" y2="${T + PH}" stroke="${r.strong ? INK : '#b8bdc4'}" stroke-width="${r.strong ? 1.5 : 1}"${r.dash ? ' stroke-dasharray="4 3"' : ''}/>`;
    if (r.label) g += `<circle cx="${xx}" cy="${T + 2}" r="8" fill="${r.strong ? INK : '#b8bdc4'}"/><text x="${xx}" y="${T + 5.5}" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">${esc(r.label)}</text>`;
  });
  (o.refY || []).forEach(r => {
    const yy = y(r.value);
    g += `<line x1="${L}" x2="${W - R}" y1="${yy}" y2="${yy}" stroke="#555"${r.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
    if (r.label) g += `<text x="${W - R - 4}" y="${yy - 4}" text-anchor="end" fill="#444" font-size="10.5">${esc(r.label)}</text>`;
  });
  (o.markers || []).forEach(m => {
    g += `<circle cx="${x(m.at)}" cy="${y(m.value)}" r="4.5" fill="${m.color}" stroke="#fff" stroke-width="2"/>`;
    if (m.label) g += `<text x="${x(m.at) + (m.anchor === 'end' ? -7 : 7)}" y="${y(m.value) + (m.dy == null ? -8 : m.dy)}" text-anchor="${m.anchor || 'start'}" fill="#333" font-size="10.5" font-weight="600">${esc(m.label)}</text>`;
  });
  if (o.endLabels) {
    const items = o.series.filter(s => !s.noLabel).map(s => ({s, v: s.values[end]})).filter(it => it.v != null && isFinite(it.v)).map(it => ({...it, y0: y(it.v), y: y(it.v)})).sort((a, b) => a.y - b.y);
    for (let i = 1; i < items.length; i++) if (items[i].y - items[i - 1].y < 14) items[i].y = items[i - 1].y + 14;
    const over = items.length ? items[items.length - 1].y - (T + PH) : 0;
    if (over > 0) items.forEach(it => it.y -= over);
    items.forEach(it => {
      const xx = x(end);
      g += `<circle cx="${xx}" cy="${it.y0}" r="4" fill="${it.s.color}" stroke="#fff" stroke-width="2"/>`;
      if (Math.abs(it.y - it.y0) > 1) g += `<line x1="${xx + 5}" x2="${xx + 12}" y1="${it.y0}" y2="${it.y}" stroke="#b8bdc4"/>`;
      g += `<text x="${xx + 14}" y="${it.y + 3.5}" fill="#333" font-size="11"><tspan font-weight="600">${esc((o.labelFmt || (v => fmtN(v, 1)))(it.v))}</tspan> <tspan fill="#777">${esc(it.s.short || it.s.name)}</tspan></text>`;
    });
  }
  g += `<g class="xh" style="display:none"><line y1="${T}" y2="${T + PH}" stroke="#555" stroke-dasharray="3 3"/>${o.series.map(s => `<circle r="4" fill="${s.color}" stroke="#fff" stroke-width="2"/>`).join('')}</g>`;
  g += `<rect class="hit" x="${L}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${g}</svg>`;
  const svg = el.firstElementChild, xh = svg.querySelector('.xh'), xl = xh.querySelector('line'), dots = [...xh.querySelectorAll('circle')], hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width);
    const i = Math.max(0, Math.min(hoverEnd, Math.round((px - L) / PW * (n - 1))));
    xh.style.display = ''; xl.setAttribute('x1', x(i)); xl.setAttribute('x2', x(i));
    const rows = [];
    o.series.forEach((s, k) => {
      const v = s.straight ? null : s.values[i];
      if (v == null || !isFinite(v)) { dots[k].style.display = 'none'; return; }
      dots[k].style.display = ''; dots[k].setAttribute('cx', x(i)); dots[k].setAttribute('cy', y(v));
      rows.push([s.name, fmt(v), s.color]);
    });
    showTip(tipHTML(fdate(dates[i]), rows), ev);
  });
  hit.addEventListener('pointerleave', () => { xh.style.display = 'none'; hideTip(); });
  const rowsIdx = monthEnds(dates).filter(i => i <= end);
  return {table: {columns: ['Date', ...o.series.map(s => s.name)], rows: rowsIdx.map(i => [dates[i], ...o.series.map(s => s.values[i] == null ? '' : fmt(s.values[i]))])}};
}

/* ---------------------------------------------------------------- horizontal bars */
function barChartH(el, o) {
  const W = width(el), items = o.items, rowH = o.rowH || 24;
  const T = o.refs && o.refs.length ? 24 : 8, B = 26, L = W < 520 ? 96 : 150, R = 64, H = T + items.length * rowH + B, PW = W - L - R;
  const vals = items.map(d => d.value).concat((o.refs || []).map(r => r.value), o.domainValues || []);
  let lo = Math.min(0, ...vals), hi = Math.max(0, ...vals);
  const pad = (hi - lo) * 0.14 || 1; hi += pad;
  if (lo < 0) lo -= Math.max(pad, 50 / PW * (hi - lo));
  const x = v => L + (v - lo) / (hi - lo) * PW;
  let g = '';
  niceTicks(lo, hi, PW < 420 ? 4 : 6).forEach(v => {
    g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + items.length * rowH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle">${esc((o.tickFmt || (v => pct(v, 0)))(v))}</text>`;
  });
  items.forEach((d, i) => {
    const yTop = T + i * rowH + (rowH - 16) / 2, x0 = x(0), x1 = x(d.value), sel = d.id === o.selectedId;
    g += `<g class="bar" tabindex="0" role="button" data-id="${esc(d.id)}" aria-label="${esc(d.label + ', ' + pct(d.value))}" aria-pressed="${sel}">
<rect x="0" y="${T + i * rowH}" width="${W}" height="${rowH}" fill="transparent"/>
<rect class="mark" x="${Math.min(x0, x1)}" y="${yTop}" width="${Math.max(1, Math.abs(x1 - x0))}" height="16" fill="${d.color}"${sel ? ` stroke="${INK}" stroke-width="2"` : ''}/>
<text x="${L - 8}" y="${yTop + 12}" text-anchor="end" fill="${sel ? INK : '#444'}"${sel ? ' font-weight="700"' : ''}>${esc(d.label)}</text>
<text x="${d.value >= 0 ? x1 + 5 : x1 - 5}" y="${yTop + 12}" text-anchor="${d.value >= 0 ? 'start' : 'end'}" fill="#333">${esc(pct(d.value))}</text></g>`;
  });
  const refs = [...(o.refs || [])].sort((a, b) => a.value - b.value);
  refs.forEach((r, k) => {
    const xx = x(r.value), left = refs.length > 1 && k === 0;
    g += `<line x1="${xx}" x2="${xx}" y1="${T - 4}" y2="${T + items.length * rowH}" stroke="#444"${r.dash ? ' stroke-dasharray="5 4"' : ''}/><text x="${xx + (left ? -4 : 4)}" y="${T - 9}" text-anchor="${left ? 'end' : 'start'}" fill="#333" font-size="10.5" font-weight="600">${esc(r.label)}</text>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.aria || '')}">${g}</svg>`;
  el.querySelectorAll('g.bar').forEach(gEl => {
    const d = items.find(it => it.id === gEl.dataset.id);
    hoverable(gEl, () => tipHTML(d.label + (d.sub ? ' (' + d.sub + ')' : ''), [[o.valueLabel || 'Full-period return', pct(d.value), d.color], ...(d.extra || [])]), () => o.onSelect && o.onSelect(d.id));
  });
  return {table: {columns: ['Company', 'Ticker', o.valueLabel || 'Full-period return', 'Max drawdown'], rows: items.map(d => [d.label, d.sub || '', pct(d.value), d.extra ? d.extra[0][1] : ''])}};
}

/* ---------------------------------------------------------------- heatmap */
function mix(a, b, t) { return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'; }
const NEUT = [247, 247, 247], POS = [33, 102, 172], NEG = [214, 96, 77];
function divColor(v, scale) { const t = Math.min(1, Math.abs(v) / scale); return mix(NEUT, v >= 0 ? POS : NEG, t); }
function heatmap(el, o) {
  let html = `<div class="hm" style="grid-template-columns:52px repeat(${o.cols.length},minmax(0,1fr))"><div></div>`;
  o.cols.forEach(c => html += `<div class="hd">${c}</div>`);
  o.rows.forEach(r => {
    html += `<div class="rh">${r}</div>`;
    o.cols.forEach(c => {
      const v = corr(r, c), bg = divColor(v, o.scale), t = Math.abs(v) / o.scale, sel = r === o.selA && c === o.selB;
      html += `<button data-a="${r}" data-b="${c}" aria-pressed="${sel}" style="background:${bg};color:${t > 0.55 ? '#fff' : INK}" aria-label="${esc(STOCKS[r].name + ' and ' + STOCKS[c].name + ', correlation ' + coef(v))}">${coef(v)}</button>`;
    });
  });
  html += `</div><div class="color-key"><span>−${o.scale.toFixed(1)}</span><i style="background:linear-gradient(90deg,${divColor(-o.scale, o.scale)},#f7f7f7,${divColor(o.scale, o.scale)})"></i><span>+${o.scale.toFixed(1)}</span><span style="margin-left:auto">Scale set to the largest |r| in the matrix</span></div>`;
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(b => {
    const a = b.dataset.a, c = b.dataset.b;
    hoverable(b, () => tipHTML(STOCKS[a].name + ' × ' + STOCKS[c].name, [['Daily-return correlation', coef(corr(a, c))], ['Same-direction days', fmtN(sameDir(a, c), 1) + '%'], [a + ' full-period return', pct(STOCKS[a].stats.ret), AI.color], [c + ' full-period return', pct(STOCKS[c].stats.ret), CHIP.color]]));
    b.addEventListener('click', () => { S.pairA = a; S.pairB = c; render(); });
  });
}

/* ---------------------------------------------------------------- scatter */
function scatter(el, o) {
  const W = width(el), H = o.height || 250, L = 50, R = 12, T = 12, B = 34, PW = W - L - R, PH = H - T - B, a = o.a, b = o.b;
  const bound = Math.ceil(Math.max(...a.daily.map(Math.abs), ...b.daily.map(Math.abs)) * 100) + 1;
  const x = v => L + (v + bound) / (2 * bound) * PW, y = v => T + (bound - v) / (2 * bound) * PH;
  let g = '';
  [-bound, -bound / 2, 0, bound / 2, bound].forEach(v => {
    const col = v === 0 ? '#9aa0a6' : '#e6e8eb';
    g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + PH}" stroke="${col}"/><line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="${col}"/><text x="${x(v)}" y="${T + PH + 14}" text-anchor="middle">${fmtN(v, 0)}%</text><text x="${L - 6}" y="${y(v) + 3.5}" text-anchor="end">${fmtN(v, 0)}%</text>`;
  });
  g += `<text x="${W - R - 4}" y="${T + 11}" text-anchor="end" fill="#999" font-size="10">both up</text><text x="${L + 4}" y="${T + PH - 5}" fill="#999" font-size="10">both down</text>`;
  const pts = a.daily.map((v, i) => ({i, px: x(v * 100), py: y(b.daily[i] * 100)}));
  pts.forEach(p => g += `<circle cx="${p.px.toFixed(1)}" cy="${p.py.toFixed(1)}" r="3" fill="${o.color}" fill-opacity=".55"/>`);
  g += `<circle class="hl" r="5.5" fill="none" stroke="${INK}" stroke-width="2" style="display:none"/>`;
  g += `<text x="${L + PW / 2}" y="${H - 4}" text-anchor="middle">${esc(a.ticker)} daily return</text><text transform="translate(12 ${T + PH / 2}) rotate(-90)" text-anchor="middle">${esc(b.ticker)} daily return</text>`;
  g += `<rect class="hit" x="${L}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(a.name + ' versus ' + b.name + ' daily returns')}">${g}</svg>`;
  const svg = el.firstElementChild, hl = svg.querySelector('.hl'), hit = svg.querySelector('.hit');
  hit.addEventListener('pointermove', ev => {
    const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * (W / r.width), my = (ev.clientY - r.top) * (H / r.height);
    let best = null, bd = Infinity;
    pts.forEach(p => { const d = (p.px - mx) ** 2 + (p.py - my) ** 2; if (d < bd) { bd = d; best = p; } });
    if (best && bd <= 22 * 22) {
      hl.style.display = ''; hl.setAttribute('cx', best.px); hl.setAttribute('cy', best.py);
      showTip(tipHTML(fdate(RDATES[best.i]), [[a.ticker, pct(a.daily[best.i] * 100, 2), o.colorA], [b.ticker, pct(b.daily[best.i] * 100, 2), o.colorB]]), ev);
    } else { hl.style.display = 'none'; hideTip(); }
  });
  hit.addEventListener('pointerleave', () => { hl.style.display = 'none'; hideTip(); });
}

/* ---------------------------------------------------------------- dumbbell */
function dumbbell(el, o) {
  const W = width(el), rowH = 44, L = W < 520 ? 92 : 130, R = 96, T = 30, B = 26, H = T + o.rows.length * rowH + B, PW = W - L - R;
  const vals = o.rows.flatMap(r => [r.mean, r.median]);
  const minV = Math.min(0, ...vals), maxV = Math.max(...vals), frac = 86 / PW;
  let hi = maxV + (maxV - minV) * 0.2, lo = minV - frac * (hi - minV) / (1 - frac);
  const x = v => L + (v - lo) / (hi - lo) * PW;
  let g = '';
  niceTicks(lo, hi, 6).forEach(v => g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + o.rows.length * rowH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle">${pct(v, 0)}</text>`);
  g += `<circle cx="${L + 6}" cy="12" r="5" fill="#555"/><text x="${L + 16}" y="16" fill="#555">Mean</text><circle cx="${L + 68}" cy="12" r="5" fill="#fff" stroke="#555" stroke-width="2"/><text x="${L + 78}" y="16" fill="#555">Median</text>`;
  o.rows.forEach((r, i) => {
    const cy = T + i * rowH + rowH / 2, right = r.mean >= r.median;
    g += `<g class="bar" tabindex="0" data-i="${i}" aria-label="${esc(r.name + ': mean ' + pct(r.mean) + ', median ' + pct(r.median))}"><rect x="0" y="${T + i * rowH}" width="${W}" height="${rowH}" fill="transparent"/>
<text x="${L - 10}" y="${cy + 4}" text-anchor="end" fill="#333" font-weight="600">${esc(r.name)}</text>
<line x1="${x(r.median)}" x2="${x(r.mean)}" y1="${cy}" y2="${cy}" stroke="${r.color}" stroke-width="3" stroke-opacity=".45"/>
<circle cx="${x(r.mean)}" cy="${cy}" r="7" fill="${r.color}" stroke="#fff" stroke-width="2"/><circle cx="${x(r.median)}" cy="${cy}" r="7" fill="#fff" stroke="${r.color}" stroke-width="2.5"/>
<text x="${x(r.mean) + (right ? 12 : -12)}" y="${cy + 4}" text-anchor="${right ? 'start' : 'end'}" fill="#333">Mean ${esc(pct(r.mean))}</text>
<text x="${x(r.median) + (right ? -12 : 12)}" y="${cy + 4}" text-anchor="${right ? 'end' : 'start'}" fill="#333">Median ${esc(pct(r.median))}</text></g>`;
  });
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mean versus median full-period return by theme">${g}</svg>`;
  el.querySelectorAll('g.bar').forEach(gEl => { const r = o.rows[+gEl.dataset.i]; hoverable(gEl, () => tipHTML(r.name, [['Companies', r.n], ['Gainers', r.gainers + ' / ' + r.n], ['Mean return', pct(r.mean), r.color], ['Median return', pct(r.median), r.color]])); });
  return {table: {columns: ['Theme', 'Companies', 'Gainers', 'Mean return', 'Median return'], rows: o.rows.map(r => [r.name, r.n, r.gainers, pct(r.mean), pct(r.median)])}};
}

/* ---------------------------------------------------------------- building blocks */
function sheet(o) {
  return `<section class="sheet${o.cls ? ' ' + o.cls : ''}" style="grid-column:span ${o.span || 12}"><header class="sheet-head"><div><h3>${esc(o.title)}</h3>${o.sub ? `<p>${esc(o.sub)}</p>` : ''}</div>${o.noTable ? '' : `<button class="tbl-btn" data-table="${o.id}" aria-pressed="${S.tables.has(o.id)}" aria-controls="${o.id}-table">⊞ Data</button>`}</header><div class="sheet-body" id="${o.id}"></div>${o.noTable ? '' : `<div class="sheet-table" id="${o.id}-table" hidden></div>`}</section>`;
}
function textObj(head, body) { return `<div class="text-obj"><strong>${esc(head)}</strong>${esc(body)}</div>`; }
function ban(label, value, sub, color) { return `<div class="ban" style="--c:${color || '#c7ccd3'}"><div class="ban-label">${esc(label)}</div><div class="ban-value">${esc(value)}</div>${sub ? `<div class="ban-sub">${esc(sub)}</div>` : ''}</div>`; }
function themeTile(g, headline, line, desc) {
  return `<section class="sheet tile" style="grid-column:span 4"><div class="tile-body"><div class="tile-kicker"><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</div><div class="tile-hero">${g.gainers}<small> / ${g.stocks.length} ended higher</small></div>${headline ? `<div class="tile-head">${esc(headline)}</div>` : ''}<div class="tile-line">${esc(line)}</div>${desc ? `<p class="tile-desc">${esc(desc)}</p>` : ''}</div></section>`;
}
function card(title, inner) { return `<div class="fcard"><h4>${esc(title)}</h4>${inner}</div>`; }
function radioHTML(name, options, value) { return `<div class="rlist" role="radiogroup">${options.map(([v, l]) => `<label><input type="radio" name="${name}" value="${esc(v)}"${v === value ? ' checked' : ''}><span>${esc(l)}</span></label>`).join('')}</div>`; }
function bindRadio(root, name, fn) { root.querySelectorAll(`input[name="${name}"]`).forEach(r => r.addEventListener('change', () => fn(r.value))); }
function chk(id, label, checked) { return `<label class="chk"><input type="checkbox" id="${id}"${checked ? ' checked' : ''}><span>${esc(label)}</span></label>`; }
function bindChk(root, id, fn) { root.querySelector('#' + id).addEventListener('change', e => fn(e.target.checked)); }
function selectHTML(id, stocks, value) { return `<select id="${id}">${stocks.map(s => `<option value="${s.ticker}"${s.ticker === value ? ' selected' : ''}>${esc(s.name)} (${s.ticker})</option>`).join('')}</select>`; }
function companySelect() { return `<select id="company" aria-label="Company to follow">${THEMES.map(g => `<optgroup label="${esc(g.name)}">${g.stocks.map(s => `<option value="${s.ticker}"${s.ticker === S.company ? ' selected' : ''}>${esc(s.name)} (${s.ticker})</option>`).join('')}</optgroup>`).join('')}</select>`; }
function bindCompany(root, extra) { const el = root.querySelector('#company'); el.addEventListener('change', () => { S.company = el.value; if (extra) extra(el.value); render(); }); }
function btnList(name, options, value) { return `<div class="btn-list" data-name="${name}">${options.map(([v, l]) => `<button data-v="${esc(v)}" aria-pressed="${v === value}">${esc(l)}</button>`).join('')}</div>`; }
function bindBtnList(root, name, fn) { root.querySelectorAll(`.btn-list[data-name="${name}"] button`).forEach(b => b.addEventListener('click', () => fn(b.dataset.v))); }
function legendCard(extra) { return card('Color · theme', `<div class="legend">${THEMES.map(g => `<span><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</span>`).join('')}${extra || ''}</div>`); }
function companyCard() { return card('Company to follow', companySelect()); }
const SPX_LEGEND = `<span><i class="sw" style="--c:${SPX_COLOR}"></i>S&amp;P 500 (reference)</span>`;

/* ---------------------------------------------------------------- story point 1 · watchlist */
function p1c(canvas) {
  const s = STOCKS[S.company], up = ALL.filter(x => x.stats.ret > 0).length;
  const shown = S.themeFilter === 'All' ? THEMES : THEMES.filter(g => g.id === S.themeFilter);
  canvas.innerHTML = textObj('35 companies. Three themes. One year.', `${up} of 35 ended the year above where they started. Select a company to follow it through the story; you are following ${s.name} (${s.ticker}).`)
    + THEMES.map(g => themeTile(g, '', `Mean ${pct(g.mean)} · Median ${pct(g.median)}`, g.desc)).join('')
    + sheet({id: 'watch', title: 'Watchlist', sub: 'Full-period return next to each company. Click a company to follow it.', span: 12});
  const body = $('watch');
  body.innerHTML = shown.map(g => `<div class="chip-group"><div class="chip-group-head"><i class="sw" style="--c:${g.color}"></i>${esc(g.name)}</div><div class="chips">${[...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret).map(st => `<button class="chip${st.ticker === S.company ? ' selected' : ''}" data-t="${st.ticker}" style="--c:${g.color}" aria-pressed="${st.ticker === S.company}"><span class="tk">${st.ticker}</span><span class="rt">${pct(st.stats.ret)}</span><span class="nm">${esc(st.name)}</span></button>`).join('')}</div></div>`).join('');
  body.querySelectorAll('.chip').forEach(b => { const st = STOCKS[b.dataset.t]; hoverable(b, () => tipHTML(st.name + ' (' + st.ticker + ')', [['Business', st.business], ['Full-period return', pct(st.stats.ret), st.theme.color], ['Max drawdown', pct(st.stats.dd)]])); b.addEventListener('click', () => { S.company = st.ticker; render(); }); });
  TABLES.watch = {columns: ['Company', 'Ticker', 'Theme', 'Business', 'Full-period return', 'Max drawdown'], rows: ALL.map(st => [st.name, st.ticker, st.theme.name, st.business, pct(st.stats.ret), pct(st.stats.dd)])};
}
function p1s(shelf) {
  shelf.innerHTML = card('Theme', radioHTML('themeFilter', [['All', 'All themes'], ...THEMES.map(g => [g.id, g.name])], S.themeFilter)) + companyCard() + legendCard();
  bindRadio(shelf, 'themeFilter', v => { S.themeFilter = v; renderCanvas(); }); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story point 2 · big picture */
function p2series() {
  const s = STOCKS[S.company];
  const series = [...THEMES.map(g => ({id: g.id, name: g.name, short: g.short, color: g.color, values: g.values})), {id: 'SPX', name: 'S&P 500', short: 'S&P 500', color: SPX_COLOR, values: SPX.normal}];
  if (S.overlay) series.push({id: s.ticker, name: s.name, short: s.ticker, color: INK, values: s.normal, dash: true});
  return series;
}
function p2c(canvas) {
  const i = S.dateIdx, series = p2series();
  const ranked = THEMES.map(g => ({name: g.name, v: g.values[i] - 100})).sort((a, b) => b.v - a.v);
  canvas.innerHTML = textObj('One starting line, very different destinations.', `Equal money in each theme's companies on May 12, 2025, then held. Through ${fdate(DATES[i])}: ${ranked.map(r => r.name + ' ' + pct(r.v)).join(', ')}; the S&P 500 ${pct(SPX.normal[i] - 100)}.`)
    + sheet({id: 'paths', title: 'Theme paths, rebased to 100', sub: 'Mean of the members’ rebased Close: equal initial money, no rebalancing. S&P 500 = price-index reference.', span: 9})
    + sheet({id: 'p2bans', title: 'Change since start · ' + fdate(DATES[i]), span: 3, noTable: true});
  TABLES.paths = lineChart($('paths'), {series, end: i, scaleAll: true, baseline: 100, height: 340, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')', aria: 'Theme paths rebased to 100 through ' + DATES[i]}).table;
  $('p2bans').innerHTML = `<div class="bans">${series.map(x => ban(x.name, pct(x.values[i] - 100), 'Index ' + fmtN(x.values[i], 1), x.color)).join('')}</div>`;
}
function p2s(shelf) {
  shelf.innerHTML = card('Through date', `<input type="range" id="date" min="0" max="${LAST}" value="${S.dateIdx}" aria-label="Through date"><output id="dateOut" for="date">${fdate(DATES[S.dateIdx])}</output>`)
    + card('Options', chk('overlay', 'Overlay the company I follow (dashed line)', S.overlay)) + companyCard() + legendCard(SPX_LEGEND + `<span><i class="sw dash"></i>Followed company (when overlaid)</span>`);
  shelf.querySelector('#date').addEventListener('input', e => { S.dateIdx = +e.target.value; shelf.querySelector('#dateOut').textContent = fdate(DATES[S.dateIdx]); renderCanvas(); });
  bindChk(shelf, 'overlay', v => { S.overlay = v; renderCanvas(); }); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story point 3 · beneath the average */
function p3c(canvas) {
  const g = THEMES.find(t => t.id === S.distTheme), sorted = [...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret);
  const shown = S.exclude ? sorted.slice(1) : sorted, rets = shown.map(s => s.stats.ret), m = mean(rets), md = median(rets);
  const lead = sorted[0], lag = sorted[sorted.length - 1], f = STOCKS[S.company], rank = sorted.indexOf(f) + 1;
  let sentence = `${g.name}: mean ${pct(g.mean)}, median ${pct(g.median)}. ${lead.name} leads at ${pct(lead.stats.ret)}; ${lag.name} finishes last at ${pct(lag.stats.ret)}.`;
  if (S.exclude) sentence += ` Without ${lead.name}, the mean becomes ${pct(m)} and the median ${pct(md)}.`;
  canvas.innerHTML = textObj('A theme’s average hides its members.', sentence)
    + sheet({id: 'bars', title: `Full-period return by company · ${g.name}`, sub: 'Sorted high to low. Reference lines: mean and median of the companies shown. Click a bar to follow that company.', span: 8})
    + sheet({id: 'p3side', title: 'Summary · ' + g.name, span: 4, noTable: true});
  const refs = [];
  if (S.showMean) refs.push({value: m, label: 'Mean ' + pct(m)});
  if (S.showMedian) refs.push({value: md, label: 'Median ' + pct(md), dash: true});
  TABLES.bars = barChartH($('bars'), {items: shown.map(s => ({id: s.ticker, label: s.name, sub: s.ticker, value: s.stats.ret, color: g.color, extra: [['Max drawdown', pct(s.stats.dd)]]})), refs, domainValues: [lead.stats.ret], selectedId: S.company, onSelect: id => { S.company = id; render(); }, aria: g.name + ' full-period return by company'}).table;
  $('p3side').innerHTML = `<div class="bans two">${ban('Companies', shown.length, S.exclude ? 'biggest winner removed' : '')}${ban('Ended higher', rets.filter(v => v > 0).length + ' / ' + shown.length)}${ban('Mean return', pct(m), S.exclude ? 'all ' + sorted.length + ': ' + pct(g.mean) : '', g.color)}${ban('Median return', pct(md), S.exclude ? 'all ' + sorted.length + ': ' + pct(g.median) : '', g.color)}</div>`
    + (rank ? `<div class="note"><b>${esc(f.name)}</b> (${f.ticker}): ${pct(f.stats.ret)}, rank ${rank} of ${sorted.length} in ${esc(g.name)}, ${f.stats.ret >= g.median ? 'at or above' : 'below'} the median.</div>`
      : `<div class="note">${esc(f.name)} belongs to ${esc(f.theme.name)}. Switch the theme filter to place it in this chart.</div>`);
}
function p3s(shelf) {
  shelf.innerHTML = card('Theme', radioHTML('distTheme', THEMES.map(g => [g.id, g.name]), S.distTheme))
    + card('Options', chk('exclude', 'Remove this theme’s biggest winner (sensitivity check)', S.exclude) + chk('showMean', 'Show mean line', S.showMean) + chk('showMedian', 'Show median line', S.showMedian)) + companyCard();
  bindRadio(shelf, 'distTheme', v => { S.distTheme = v; renderCanvas(); });
  bindChk(shelf, 'exclude', v => { S.exclude = v; renderCanvas(); }); bindChk(shelf, 'showMean', v => { S.showMean = v; renderCanvas(); }); bindChk(shelf, 'showMedian', v => { S.showMedian = v; renderCanvas(); });
  bindCompany(shelf, t => { S.distTheme = STOCKS[t].theme.id; });
}

/* ---------------------------------------------------------------- story point 4 · correlation */
function p4c(canvas) {
  const a = STOCKS[S.pairA], b = STOCKS[S.pairB], r = corr(a.ticker, b.ticker), same = sameDir(a.ticker, b.ticker);
  canvas.innerHTML = textObj('Connected businesses, loosely linked stocks.', `The 120 AI × semiconductor pairs average a daily-return correlation of ${coef(C.cross)} (within semiconductors ${coef(C.chip)}, within AI ${coef(C.ai)}). The two groups’ average daily returns correlate at ${coef(C.group)}: connected as groups, loosely linked stock by stock.`)
    + `<div class="kpis">${ban('AI × semis · mean pair r', coef(C.cross), '120 pairs')}${ban('Within AI · mean pair r', coef(C.ai), '66 pairs', AI.color)}${ban('Within semis · mean pair r', coef(C.chip), '45 pairs', CHIP.color)}${ban('Group-average daily returns · r', coef(C.group), 'equal-weight averages of each group')}</div>`
    + sheet({id: 'hm', title: 'Correlation of daily returns · AI (rows) × semiconductors (columns)', sub: 'Pearson r over 250 trading days. Click a cell to inspect the pair.', span: 7})
    + sheet({id: 'pair', title: `${a.name} × ${b.name}`, sub: 'One dot per trading day. Upper right: both rose; lower left: both fell.', span: 5})
    + sheet({id: 'roll', title: `Rolling ${S.win}-day correlation · ${a.ticker} × ${b.ticker}`, sub: 'Each point uses only the preceding window of daily returns. Dashed line: full-period correlation.', span: 12});
  heatmap($('hm'), {rows: AI.tickers, cols: CHIP.tickers, selA: a.ticker, selB: b.ticker, scale: HM_SCALE});
  TABLES.hm = {columns: ['AI \\ Semis', ...CHIP.tickers], rows: AI.tickers.map(x => [x, ...CHIP.tickers.map(y => coef(corr(x, y)))])};
  $('pair').innerHTML = `<div class="bans two small">${ban('Correlation', coef(r))}${ban('Same-direction days', fmtN(same, 1) + '%')}${ban(a.ticker + ' · full period', pct(a.stats.ret), '', AI.color)}${ban(b.ticker + ' · full period', pct(b.stats.ret), '', CHIP.color)}</div><div id="sc" style="margin-top:8px"></div>`;
  scatter($('sc'), {a, b, color: NEUTRAL, colorA: AI.color, colorB: CHIP.color, height: 250});
  TABLES.pair = {columns: ['Date', a.ticker + ' daily return', b.ticker + ' daily return'], rows: RDATES.map((d, i) => [d, pct(a.daily[i] * 100, 2), pct(b.daily[i] * 100, 2)])};
  const roll = rolling(a.daily, b.daily, S.win);
  TABLES.roll = lineChart($('roll'), {dates: RDATES, series: [{id: 'r', name: `${S.win}-day correlation`, color: NEUTRAL, values: roll}], yDomain: [-1, 1], baseline: 0, height: 200, refY: [{value: r, label: 'Full period ' + coef(r), dash: true}], yFmt: v => v.toFixed(1), tipFmt: v => coef(v), aria: 'Rolling correlation'}).table;
}
function p4s(shelf) {
  shelf.innerHTML = card('AI company', selectHTML('pairA', AI.stocks, S.pairA)) + card('Semiconductor company', selectHTML('pairB', CHIP.stocks, S.pairB))
    + card('Pairs worth a look', btnList('preset', PRESETS.map(p => [p.a + '|' + p.b, p.label]), S.pairA + '|' + S.pairB))
    + card('Rolling window', radioHTML('win', [['30', '30 trading days'], ['60', '60 trading days']], String(S.win)));
  shelf.querySelector('#pairA').addEventListener('change', e => { S.pairA = e.target.value; render(); });
  shelf.querySelector('#pairB').addEventListener('change', e => { S.pairB = e.target.value; render(); });
  bindBtnList(shelf, 'preset', v => { [S.pairA, S.pairB] = v.split('|'); render(); });
  bindRadio(shelf, 'win', v => { S.win = +v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 5 · turning points */
function p5c(canvas) {
  const m = MILESTONES[S.checkpoint], end = DATES.indexOf(m.date);
  canvas.innerHTML = textObj(m.title + '.', m.text)
    + sheet({id: 'turns', title: 'Theme paths through ' + fdate(m.date), sub: 'Rebased to 100. The faded part of the chart is the rest of the year, not yet revealed.', span: 8})
    + sheet({id: 'cps', title: 'Three checkpoints', sub: 'Change since start at each date', span: 4, noTable: true});
  TABLES.turns = lineChart($('turns'), {series: THEMES.map(g => ({id: g.id, name: g.name, short: g.short, color: g.color, values: g.values})), end, hoverEnd: end, scaleAll: true, fadeFrom: end, baseline: 100, height: 340, endLabels: true, labelFmt: v => pct(v - 100),
    refX: MILESTONES.map((mm, k) => ({at: DATES.indexOf(mm.date), label: String(k + 1), strong: k === S.checkpoint, dash: k !== S.checkpoint})), aria: 'Theme paths through ' + m.date}).table;
  $('cps').innerHTML = `<div class="cp-list">${MILESTONES.map((mm, k) => { const idx = DATES.indexOf(mm.date); return `<button class="cp${k === S.checkpoint ? ' selected' : ''}" data-k="${k}" aria-pressed="${k === S.checkpoint}"><span class="cp-n">${k + 1}</span><span class="cp-body"><b>${fdate(mm.date)}</b><span class="cp-title">${esc(mm.title)}</span><span class="cp-vals">${THEMES.map(g => `<span><i class="sw" style="--c:${g.color}"></i>${pct(g.values[idx] - 100)}</span>`).join('')}<span><i class="sw" style="--c:${SPX_COLOR}"></i>${pct(SPX.normal[idx] - 100)}</span></span></span></button>`; }).join('')}</div>`;
  canvas.querySelectorAll('.cp').forEach(b => b.addEventListener('click', () => { S.checkpoint = +b.dataset.k; render(); }));
}
function p5s(shelf) {
  shelf.innerHTML = card('Checkpoint', radioHTML('checkpoint', MILESTONES.map((m, k) => [String(k), (k + 1) + ' · ' + fdate(m.date)]), String(S.checkpoint))) + legendCard(SPX_LEGEND);
  bindRadio(shelf, 'checkpoint', v => { S.checkpoint = +v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 6 · the path matters */
function p6c(canvas) {
  const s = STOCKS[S.company], m = s.stats, g = s.theme, rec = m.recovery >= 0;
  canvas.innerHTML = textObj('The final return leaves out the path.', `${s.name}: ${pct(m.ret)} for the year. From ${fdate(DATES[m.peak])} to ${fdate(DATES[m.trough])} it fell ${pct(m.dd)} from its high${rec ? `, then regained that high on ${fdate(DATES[m.recovery])}, ${m.recDays} days after the trough.` : ', and had not regained that high by May 11, 2026.'}`)
    + sheet({id: 'journey', title: `${s.name} (${s.ticker}) · rebased to 100`, sub: S.fullPath ? 'Shading marks the deepest peak-to-trough decline.' : 'Endpoints only: the dashed line connects start and finish; it is not the actual path.', span: 8})
    + sheet({id: 'p6bans', title: 'The year in four numbers', span: 4, noTable: true})
    + sheet({id: 'uw', title: 'Drawdown from running high', sub: '0% = at a new high. The depth of the fall from the most recent peak, every day.', span: 12});
  const markers = S.fullPath ? [{at: m.peak, value: s.normal[m.peak], color: g.color, label: 'Peak · ' + fdate(DATES[m.peak], false)}, {at: m.trough, value: s.normal[m.trough], color: g.color, label: 'Trough ' + pct(m.dd), dy: 4}].concat(rec ? [{at: m.recovery, value: s.normal[m.recovery], color: INK, label: 'Recovered · ' + fdate(DATES[m.recovery], false), dy: 17, anchor: 'end'}] : []) : [];
  TABLES.journey = lineChart($('journey'), {series: [{id: s.ticker, name: s.name, short: s.ticker, color: g.color, values: s.normal, straight: !S.fullPath, dash: !S.fullPath}], scaleAll: true, baseline: 100, height: 320, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')',
    shade: S.fullPath ? {from: m.peak, to: m.trough, color: g.color, label: 'Deepest drawdown'} : null, markers, aria: s.name + ' rebased to 100'}).table;
  $('p6bans').innerHTML = `<div class="bans">${ban('Full-period return', pct(m.ret), '$1,000 at the start → $' + fmtN(1000 * s.normal[LAST] / 100), g.color)}${ban('Largest fall from a high', pct(m.dd), fdate(DATES[m.peak], false) + ' → ' + fdate(DATES[m.trough], false))}${ban('Peak to trough', m.ddDays + ' days', 'calendar days')}${ban('Regained that high', rec ? fdate(DATES[m.recovery]) : 'Not recovered', rec ? m.recDays + ' days after the trough' : 'through May 11, 2026')}</div>`;
  TABLES.uw = lineChart($('uw'), {series: [{id: 'uw', name: 'Drawdown', color: g.color, values: underwater(s.close)}], scaleAll: true, baseline: 0, area: true, height: 170, left: 50, yFmt: v => fmtN(v, 0) + '%', tipFmt: v => pct(v, 1), aria: s.name + ' drawdown from running high'}).table;
}
function p6s(shelf) {
  shelf.innerHTML = companyCard() + card('Three paths worth comparing', btnList('case', CASES.map(([t, l]) => [t, STOCKS[t].name + ' · ' + l]), S.company)) + card('View', chk('fullPath', 'Show the full-year path', S.fullPath));
  bindCompany(shelf); bindBtnList(shelf, 'case', v => { S.company = v; render(); }); bindChk(shelf, 'fullPath', v => { S.fullPath = v; renderCanvas(); });
}

/* ---------------------------------------------------------------- story point 7 · looking back */
function p7c(canvas) {
  const s = STOCKS[S.company], g = s.theme, sorted = [...g.stocks].sort((a, b) => b.stats.ret - a.stats.ret);
  const msgs = {AI: ['A divided year', `${AI.gainers} of ${AI.stocks.length} rose. The median return was ${pct(AI.median)}.`],
    Chip: ['Gains across the sample', `All ${CHIP.stocks.length} rose, with different gains and drawdowns along the way.`],
    NewEnergy: ['Big winners, and losers', `Mean ${pct(NE.mean)} vs median ${pct(NE.median)}: a few outsized winners lift the average.`]};
  canvas.innerHTML = textObj('Back to the question: what did the market show?', 'Three themes tied to expectations about the future left three different marks on the year.')
    + THEMES.map(t => themeTile(t, msgs[t.id][0], msgs[t.id][1])).join('')
    + sheet({id: 'db', title: 'Mean vs. median full-period return by theme', sub: 'When the mean sits far above the median, a few big winners carry the average.', span: 7})
    + sheet({id: 'corr7', title: 'Did AI and semiconductor stocks move together?', sub: 'Daily-return correlation', span: 5, noTable: true})
    + sheet({id: 'recap', title: `Your company’s year · ${s.name} (${s.ticker})`, span: 12, noTable: true});
  TABLES.db = dumbbell($('db'), {rows: THEMES.map(t => ({name: t.name, color: t.color, mean: t.mean, median: t.median, n: t.stocks.length, gainers: t.gainers}))}).table;
  $('corr7').innerHTML = `<div class="bans two">${ban('Average AI × semis pair', coef(C.cross), '120 pairs, stock by stock')}${ban('Group averages', coef(C.group), 'equal-weight daily returns of each group')}</div><p class="note">A shared business story did not mean uniform stock behaviour: pairs ranged from ${coef(C.min.r)} to ${coef(C.max.r)}, while the two groups moved together as averages.</p>`;
  $('recap').innerHTML = `<div class="bans four">${ban('Full-period return', pct(s.stats.ret), '$1,000 → $' + fmtN(1000 * s.normal[LAST] / 100), g.color)}${ban('Maximum drawdown', pct(s.stats.dd), fdate(DATES[s.stats.peak], false) + ' → ' + fdate(DATES[s.stats.trough], false))}${ban('Return rank in theme', (sorted.indexOf(s) + 1) + ' / ' + sorted.length, g.name)}${ban('Regained its high', s.stats.recovery >= 0 ? fdate(DATES[s.stats.recovery]) : 'Not recovered', s.stats.recovery >= 0 ? s.stats.recDays + ' days after the trough' : 'through May 11, 2026')}</div><blockquote>The final return tells the destination. The full path tells what the year felt like.</blockquote>`;
}
function p7s(shelf) {
  shelf.innerHTML = companyCard() + card('Read another story', `<div class="btn-list"><button id="restart">Back to the overview</button></div>`);
  bindCompany(shelf); shelf.querySelector('#restart').addEventListener('click', () => go(1));
}

/* ---------------------------------------------------------------- overview chart · return vs deepest drawdown */
function ddScatter(el, o) {
  const W = width(el), H = o.height || 280, L = 62, R = 18, T = 14, B = 42, PW = W - L - R, PH = H - T - B;
  const pts = ALL.map(s => ({s, mult: s.normal[LAST] / 100, dd: s.stats.dd}));
  const xlo = Math.floor(Math.min(...pts.map(p => p.dd)) / 10) * 10 - 2, xhi = 0;
  const ly = Math.log, ylo = ly(Math.min(...pts.map(p => p.mult))) - 0.28, yhi = ly(Math.max(...pts.map(p => p.mult))) + 0.28;
  const x = v => L + (v - xlo) / (xhi - xlo) * PW, y = m => T + (yhi - ly(m)) / (yhi - ylo) * PH;
  let g = '';
  for (let v = Math.ceil(xlo / 20) * 20; v <= 0; v += 20) g += `<line x1="${x(v)}" x2="${x(v)}" y1="${T}" y2="${T + PH}" stroke="${v === 0 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${x(v)}" y="${T + PH + 14}" text-anchor="middle">${fmtN(v, 0)}%</text>`;
  [0.25, 0.5, 1, 2, 4, 8, 16].filter(m => ly(m) >= ylo && ly(m) <= yhi).forEach(m => g += `<line x1="${L}" x2="${W - R}" y1="${y(m)}" y2="${y(m)}" stroke="${m === 1 ? '#9aa0a6' : '#e6e8eb'}"/><text x="${L - 6}" y="${y(m) + 3.5}" text-anchor="end">${pct((m - 1) * 100, 0)}</text>`);
  g += `<text x="${L + PW / 2}" y="${H - 4}" text-anchor="middle">Deepest fall from a high (max drawdown)</text><text transform="translate(12 ${T + PH / 2}) rotate(-90)" text-anchor="middle">Full-period return (log scale)</text>`;
  const LABELS = new Set(['BE', 'LCID', 'SMCI', 'MU', S.company]);
  pts.forEach(p => {
    const rec = p.s.stats.recovery >= 0, c = p.s.theme.color, sel = p.s.ticker === S.company, px = x(p.dd), py = y(p.mult);
    g += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${sel ? 6.5 : 5}" fill="${rec ? c : '#fff'}" stroke="${sel ? INK : c}" stroke-width="${sel ? 2.5 : 2}"/>`;
    if (LABELS.has(p.s.ticker)) g += `<text x="${px + 9}" y="${py + 3.5}" fill="#333" font-size="10.5"${sel ? ' font-weight="700"' : ''}>${esc(p.s.ticker)}</text>`;
  });
  g += `<circle class="hl" r="8" fill="none" stroke="${INK}" stroke-width="1.5" style="display:none"/><rect class="hit" x="${L}" y="${T}" width="${PW}" height="${PH}" fill="transparent"/>`;
  el.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Full-period return against maximum drawdown for 35 companies">${g}</svg>`;
  const svg = el.firstElementChild, hl = svg.querySelector('.hl'), hit = svg.querySelector('.hit');
  const px = pts.map(p => ({p, px: x(p.dd), py: y(p.mult)}));
  let near = null;
  const locate = ev => { const r = svg.getBoundingClientRect(), mx = (ev.clientX - r.left) * (W / r.width), my = (ev.clientY - r.top) * (H / r.height); let best = null, bd = Infinity; px.forEach(q => { const d = (q.px - mx) ** 2 + (q.py - my) ** 2; if (d < bd) { bd = d; best = q; } }); return bd <= 20 * 20 ? best : null; };
  hit.addEventListener('pointermove', ev => {
    near = locate(ev);
    if (near) { hl.style.display = ''; hl.setAttribute('cx', near.px); hl.setAttribute('cy', near.py); hit.style.cursor = 'pointer'; const s = near.p.s, st = s.stats; showTip(tipHTML(s.name + ' (' + s.ticker + ')', [['Full-period return', pct(st.ret), s.theme.color], ['Max drawdown', pct(st.dd)], ['Regained that high', st.recovery >= 0 ? fdate(DATES[st.recovery]) : 'Not recovered']]), ev); }
    else { hl.style.display = 'none'; hit.style.cursor = 'crosshair'; hideTip(); }
  });
  hit.addEventListener('pointerleave', () => { hl.style.display = 'none'; hideTip(); near = null; });
  hit.addEventListener('click', () => { if (near && o.onSelect) o.onSelect(near.p.s.ticker); });
  return {table: {columns: ['Company', 'Ticker', 'Theme', 'Full-period return', 'Max drawdown', 'Regained that high'], rows: [...pts].sort((a, b) => b.mult - a.mult).map(p => [p.s.name, p.s.ticker, p.s.theme.name, pct(p.s.stats.ret), pct(p.s.stats.dd), p.s.stats.recovery >= 0 ? DATES[p.s.stats.recovery] : 'Not recovered'])}};
}

/* ---------------------------------------------------------------- story point 1 · overview */
const OVERVIEW_NOTE = 'I follow AI, semiconductors and new energy because of the optimism about their future, and I wanted to see how those expectations showed up in share prices. This story tracks 35 listed companies over one year, May 12, 2025 to May 11, 2026, using saved daily closing prices only: no forecasts, no trading advice, just what the market did.';
const CHAPTERS = [
  ['The watchlist', '35 companies in three themes. Pick one to follow.'],
  ['Same start, very different destinations', 'Theme paths from a common 100, against the S&P 500.'],
  ['The average hides the members', 'Every company’s return, with the mean and the median.'],
  ['AI and chips: loosely linked stocks', '120 pair correlations, one pair at a time.'],
  ['Three turning points', 'Oct 29, Mar 30, May 11: the year in three checkpoints.'],
  ['The path behind the return', 'Drawdown, recovery and what the final number hides.'],
  ['What the year showed', 'Three verdicts and your company’s recap.']
];
function findings() {
  const ranked = [...THEMES].sort((a, b) => b.mean - a.mean), be = STOCKS.BE.stats, notRec = ALL.filter(s => s.stats.recovery < 0).length;
  return [
    {go: 3, head: 'Same start, very different destinations.', text: `${ranked.map(g => g.name + ' ' + pct(g.mean)).join(', ')}; the S&P 500 ${pct(SPX.normal[LAST] - 100)}.`},
    {go: 4, head: 'A theme’s average hides its members.', text: `New Energy: mean ${pct(NE.mean)} but median ${pct(NE.median)}. AI: ${AI.gainers} of ${AI.stocks.length} rose, median ${pct(AI.median)}.`},
    {go: 5, head: 'Connected businesses, loosely linked stocks.', text: `Average AI × semiconductor pair correlation ${coef(C.cross)}; the two groups’ average daily returns correlate at ${coef(C.group)}.`},
    {go: 7, head: 'The final return leaves out the path.', text: `Bloom Energy ended ${pct(be.ret)} after a ${pct(be.dd)} fall from its high; ${notRec} of 35 companies had not regained their high by the end.`}
  ];
}
function p0c(canvas) {
  const up = ALL.filter(s => s.stats.ret > 0).length, notRec = ALL.filter(s => s.stats.recovery < 0).length;
  canvas.innerHTML = textObj('Future expectations, market realities: the year in one page.', OVERVIEW_NOTE)
    + `<div class="kpis">${ban('Companies', '35', 'AI 12 · Semiconductors 10 · New Energy 13')}${ban('Trading days', '251', 'May 12, 2025 – May 11, 2026')}${ban('Ended the year higher', up + ' / 35', notRec + ' had not regained their high by the end')}${ban('S&P 500, same period', pct(SPX.normal[LAST] - 100), 'price index, for reference', SPX_COLOR)}</div>`
    + sheet({id: 'ov-paths', title: 'Three themes, one year · rebased to 100', sub: 'Equal money in each theme’s companies, held all year. Numbered lines: the three turning points (point 6).', span: 7})
    + sheet({id: 'ov-find', title: 'What I want to show', sub: 'Four findings, one per block of the story. Click one to open it.', span: 5, noTable: true})
    + sheet({id: 'ov-db', title: 'Mean vs. median return by theme', sub: 'A mean far above the median means a few big winners carry the average.', span: 6})
    + sheet({id: 'ov-dd', title: 'Return vs. deepest drawdown · 35 companies', sub: 'Filled dot: regained its high within the year. Hollow: not recovered by May 11, 2026. Click a dot to follow that company.', span: 6})
    + sheet({id: 'ov-ch', title: 'The story, point by point', span: 12, noTable: true});
  TABLES['ov-paths'] = lineChart($('ov-paths'), {series: [...THEMES.map(g => ({id: g.id, name: g.name, short: g.short, color: g.color, values: g.values})), {id: 'SPX', name: 'S&P 500', short: 'S&P 500', color: SPX_COLOR, values: SPX.normal}], scaleAll: true, baseline: 100, height: 300, endLabels: true, labelFmt: v => pct(v - 100), tipFmt: v => fmtN(v, 1) + ' (' + pct(v - 100) + ')',
    refX: MILESTONES.map((mm, k) => ({at: DATES.indexOf(mm.date), label: String(k + 1), dash: true})), aria: 'Theme paths rebased to 100 with the three turning points'}).table;
  $('ov-find').innerHTML = `<ol class="findings">${findings().map((f, k) => `<li><button data-go="${f.go}"><span class="fn">${k + 1}</span><span><b>${esc(f.head)}</b><span>${esc(f.text)}</span></span></button></li>`).join('')}</ol>`;
  TABLES['ov-db'] = dumbbell($('ov-db'), {rows: THEMES.map(t => ({name: t.name, color: t.color, mean: t.mean, median: t.median, n: t.stocks.length, gainers: t.gainers}))}).table;
  TABLES['ov-dd'] = ddScatter($('ov-dd'), {height: 290, onSelect: t => { S.company = t; render(); }}).table;
  $('ov-ch').innerHTML = `<div class="chapters">${CHAPTERS.map((c, k) => `<button class="chap" data-go="${k + 2}"><span class="chap-n">POINT ${k + 2}</span><b>${esc(c[0])}</b><span>${esc(c[1])}</span></button>`).join('')}</div>`;
  canvas.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(+b.dataset.go)));
}
function p0s(shelf) {
  shelf.innerHTML = card('Read the story', `<div class="btn-list"><button id="start">Start with the watchlist →</button></div>`) + companyCard() + legendCard(SPX_LEGEND);
  shelf.querySelector('#start').addEventListener('click', () => go(2)); bindCompany(shelf);
}

/* ---------------------------------------------------------------- story navigator & rendering */
const POINTS = [
  {cap: 'Overview: the year in one page', canvas: p0c, shelf: p0s},
  {cap: 'The watchlist: 35 stocks, 3 themes', canvas: p1c, shelf: p1s},
  {cap: 'Same start, very different destinations', canvas: p2c, shelf: p2s},
  {cap: 'The average hides the members', canvas: p3c, shelf: p3s},
  {cap: 'AI and chips: loosely linked stocks', canvas: p4c, shelf: p4s},
  {cap: 'Three turning points', canvas: p5c, shelf: p5s},
  {cap: 'The path behind the return', canvas: p6c, shelf: p6s},
  {cap: 'What the year showed', canvas: p7c, shelf: p7s}
];
function renderNav() {
  const ol = $('points');
  ol.innerHTML = POINTS.map((p, k) => `<li><button class="sp${k + 1 === S.point ? ' active' : ''}" data-p="${k + 1}"${k + 1 === S.point ? ' aria-current="step"' : ''}><span class="n">${k + 1} / ${POINTS.length}</span><span class="cap">${esc(p.cap)}</span></button></li>`).join('');
  ol.querySelectorAll('.sp').forEach(b => b.addEventListener('click', () => go(+b.dataset.p)));
  $('prev').disabled = S.point === 1; $('next').disabled = S.point === POINTS.length;
}
function bindTables() {
  document.querySelectorAll('.tbl-btn').forEach(btn => {
    const id = btn.dataset.table;
    const draw = () => { const t = TABLES[id], box = $(id + '-table'); if (!t || !box) return; const open = S.tables.has(id); btn.setAttribute('aria-pressed', open); box.hidden = !open; box.innerHTML = open ? `<table class="dt"><thead><tr>${t.columns.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''; };
    btn.addEventListener('click', () => { if (S.tables.has(id)) S.tables.delete(id); else S.tables.add(id); draw(); });
    draw();
  });
}
function renderCanvas() { hideTip(); POINTS[S.point - 1].canvas($('canvas')); bindTables(); }
function render() {
  hideTip(); renderNav();
  POINTS[S.point - 1].shelf($('shelf'));
  renderCanvas();
  $('following').textContent = STOCKS[S.company].name + ' (' + S.company + ')';
}
function go(p) {
  S.point = Math.max(1, Math.min(POINTS.length, p));
  history.replaceState(null, '', '#' + S.point);
  render();
  const top = document.querySelector('.story-nav').getBoundingClientRect().top;
  if (top < 0) window.scrollTo({top: 0});
}
$('prev').addEventListener('click', () => go(S.point - 1));
$('next').addEventListener('click', () => go(S.point + 1));
document.addEventListener('keydown', e => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.key === 'ArrowRight') go(S.point + 1); else if (e.key === 'ArrowLeft') go(S.point - 1);
});
window.addEventListener('hashchange', () => { const p = parseInt(location.hash.slice(1), 10); if (p >= 1 && p <= POINTS.length && p !== S.point) { S.point = p; render(); } });
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(renderCanvas, 150); });
render();
