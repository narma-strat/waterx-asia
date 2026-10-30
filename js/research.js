/* Data & research tab
   Part 1: Country focus view (Malaysia, Singapore, Indonesia) and shared chart helpers
   Part 2: ASEAN overview (the default view)
   Each view reads its data from an Excel file  */

/* ===================== PART 1: COUNTRY FOCUS AND SHARED HELPERS ===================== */

const RS_FILE = 'WATERX-SPEC COUNTRY.xlsx';
// Start of each sheet name -> key used by the charts
const RS_SHEETS = [
  ['People using safely managed', 'safe'],
  ['People using at least basic', 'basic'],
  ['Renewable internal freshwater', 'fresh'],
  ['Annual freshwater withdrawals', 'withdraw'],
  ['Investment in water', 'invest']
];
// Investment is shown in US$ million
const RS_SCALE = { invest: 1e6 };

// Filled in from the Excel
const RS = {
  countries: ['Malaysia', 'Singapore', 'Indonesia'],
  colors: { Malaysia: '#2a78d6', Singapore: '#eb6834', Indonesia: '#1baf7a' }
};

function rsParseSheet(ws, key){
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const h = rows.findIndex(r => r && String(r[0]).trim() === 'Country Name');
  if (h < 0) throw new Error('no "Country Name" header row');
  const years = [], cols = [];
  rows[h].forEach((cell, i) => { const m = String(cell ?? '').match(/^\s*(\d{4})/); if (i > 0 && m) { years.push(+m[1]); cols.push(i); } });
  const data = {};
  for (const r of rows.slice(h + 1)) {
    const name = r && r[0] != null ? String(r[0]).trim() : '';
    if (RS.countries.includes(name)) data[name] = cols.map(i => typeof r[i] === 'number' ? r[i] / (RS_SCALE[key] || 1) : null);
  }
  const missing = RS.countries.filter(c => !data[c]);
  if (missing.length) throw new Error('country row(s) not found: ' + missing.join(', '));
  // Keep only the years from the first to the last one with any value
  const has = i => RS.countries.some(c => data[c][i] != null);
  let lo = 0, hi = years.length - 1;
  while (lo <= hi && !has(lo)) lo++;
  while (hi >= lo && !has(hi)) hi--;
  RS[key] = { years: years.slice(lo, hi + 1) };
  RS.countries.forEach(c => { RS[key][c] = data[c].slice(lo, hi + 1); });
}

async function rsLoadData(){
  if (!window.XLSX) throw new Error('the Excel reader could not load (check the internet connection)');
  const res = await fetch(encodeURI(RS_FILE) + '?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`"${RS_FILE}" was not found next to index.html`);
  const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' });
  for (const [start, key] of RS_SHEETS) {
    const name = wb.SheetNames.find(n => n.toLowerCase().startsWith(start.toLowerCase()));
    if (!name) throw new Error(`no sheet starting with "${start}"`);
    try { rsParseSheet(wb.Sheets[name], key); } catch (e) { throw new Error(`sheet "${name}": ${e.message}`); }
  }
}

// Number formats
const fmtPct = v => v.toFixed(1) + '%';
const fmtNum = v => Math.round(v).toLocaleString('en-US');
const fmtBn = v => (v < 1 ? v.toFixed(2) : v.toFixed(1));
const fmtUsdM = v => v >= 1000 ? 'US$' + (v / 1000).toFixed(2) + 'B' : 'US$' + Math.round(v) + 'M';
const last = arr => arr[arr.length - 1];
// Latest value that is reported, and its year
const lastVal = arr => [...arr].reverse().find(v => v != null);
const lastYr = (k, c) => RS[k].years[RS[k][c].map(v => v != null).lastIndexOf(true)];
const firstIdx = arr => arr.findIndex(v => v != null);
const pctChange = (a, b) => ((b - a) / a) * 100;
const signed = v => (v > 0 ? '+' : '') + v.toFixed(1) + '%';
const sum = arr => arr.reduce((t, v) => t + (v || 0), 0);

// Shared chart styling 
const RS_GRID = '#e8e7e1', RS_TICK = '#6b6a66', RS_INK = '#3c4a54';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
const hexA = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0');
function rsBaseOptions(yTitle, extra){
  return Object.assign({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    layout: { padding: { top: 6, right: 6 } },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle', padding: 14, font: { size: 11.5 }, color: RS_INK } },
      tooltip: { backgroundColor: '#0E2A3E', padding: 10, cornerRadius: 8, titleFont: { size: 12, weight: 600 }, bodyFont: { size: 12 }, boxPadding: 5, usePointStyle: true }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: RS_TICK, font: { size: 11 } }, border: { color: '#c3c2b7' } },
      y: { grid: { color: RS_GRID, drawTicks: false }, border: { display: false, dash: [3, 3] },
           ticks: { color: RS_TICK, font: { size: 11 }, padding: 8, maxTicksLimit: 6 },
           title: { display: !!yTitle, text: yTitle, color: RS_TICK, font: { size: 11 } } }
    }
  }, extra || {});
}

const rsCharts = {};
function rsDraw(id, config){
  if (rsCharts[id]) rsCharts[id].destroy();
  rsCharts[id] = new Chart(document.getElementById(id), config);
}

// Soft "No data" label for null value
const RS_NA = 'No data';
function rsPill(ctx, text, x, y, alignLeft){
  ctx.save();
  ctx.font = '500 10px Inter, system-ui, sans-serif';
  const w = ctx.measureText(text).width + 14, h = 17;
  const left = alignLeft ? x : x - w / 2;
  ctx.beginPath();
  ctx.roundRect(left, y - h / 2, w, h, 5);
  ctx.fillStyle = '#f7f8f8'; ctx.fill();
  ctx.setLineDash([3, 2]);
  ctx.strokeStyle = '#b9c3c9'; ctx.lineWidth = 1; ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#6b7a83'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, left + w / 2, y + 0.5);
  ctx.restore();
}
// Column charts: n/a for null
const rsNaColumns = {
  id: 'rsNaColumns',
  afterDatasetsDraw(chart){
    if (chart.options.indexAxis === 'y') return;
    const { x, y } = chart.scales;
    const base = y.getPixelForValue(Math.max(y.min, 0));
    chart.data.labels.forEach((l, i) => {
      if (chart.data.datasets.every(ds => ds.data[i] == null)) rsPill(chart.ctx, RS_NA, x.getPixelForValue(i), base - 11);
    });
  }
};
// Horizontal bar charts: n/a for null
const rsNaBars = {
  id: 'rsNaBars',
  afterDatasetsDraw(chart){
    const { x } = chart.scales;
    chart.data.datasets.forEach((ds, di) => {
      const meta = chart.getDatasetMeta(di);
      if (meta.hidden) return;
      ds.data.forEach((v, i) => { if (v == null && meta.data[i]) rsPill(chart.ctx, RS_NA, x.getPixelForValue(Math.max(x.min, 0)) + 4, meta.data[i].y, true); });
    });
  }
};

// Soft vertical gradient for area fills
const rsGradient = (color, top = 0.35) => ctx => {
  const a = ctx.chart.chartArea;
  if (!a) return hexA(color, top / 2);
  const g = ctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
  g.addColorStop(0, hexA(color, top));
  g.addColorStop(1, hexA(color, 0.02));
  return g;
};

// Access levels
const RS_LEVELS = [
  { label: 'Safely managed', color: '#1c5cab', val: c => lastVal(RS.safe[c]) },
  { label: 'Basic only', color: '#86b6ef', val: c => lastVal(RS.basic[c]) - lastVal(RS.safe[c]) },
  { label: 'Below basic', color: '#d6d5cf', val: c => 100 - lastVal(RS.basic[c]) }
];

// Line chart: safely managed vs at least basic
function rsAccessTrend(c){
  const all = RS.basic[c].concat(RS.safe[c]).filter(v => v != null);
  const lo = Math.min(...all);
  // Countries with all values near 100% get a zoomed scale so the lines are readable
  const yMin = lo >= 80 ? 90 : 0;
  const line = (label, data, color, fill) => ({ label, data, borderColor: color, backgroundColor: fill || color, fill: fill ? '+1' : false,
    borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 1.5, tension: .3, clip: false });
  rsDraw('rsTrend', {
    type: 'line',
    data: { labels: RS.safe.years, datasets: [
      line('At least basic', RS.basic[c], '#86b6ef', hexA('#86b6ef', 0.18)),
      line('Safely managed', RS.safe[c], '#1c5cab')
    ] },
    options: (() => {
      const o = rsBaseOptions('% of population');
      o.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.dataset.label}: ${fmtPct(ctx.parsed.y)}` };
      o.scales.y.min = yMin; o.scales.y.max = 100;
      o.scales.y.ticks.callback = v => v + '%';
      o.scales.y.ticks.stepSize = yMin ? 2 : 20;
      o.layout.padding.top = 12;
      return o;
    })()
  });
  document.getElementById('rsTrendSub').textContent = `% of population, ${RS.safe.years[0]} to ${last(RS.safe.years)}`;
}

// Doughnut: population
function rsAccessDonut(c){
  const vals = RS_LEVELS.map(l => l.val(c));
  rsDraw('rsAccess', {
    type: 'doughnut',
    data: { labels: RS_LEVELS.map(l => l.label), datasets: [{ data: vals, backgroundColor: RS_LEVELS.map(l => l.color), borderColor: '#fff', borderWidth: 3, borderRadius: 4, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      layout: { padding: 6 },
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, padding: 14, font: { size: 12 }, color: RS_INK,
          generateLabels: chart => chart.data.labels.map((l, i) => ({ text: `${l}   ${vals[i].toFixed(1)}%`, fillStyle: RS_LEVELS[i].color, strokeStyle: 'transparent', pointStyle: 'circle', index: i })) } },
        tooltip: { backgroundColor: '#0E2A3E', padding: 10, cornerRadius: 8, usePointStyle: true, callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(1)}%` } }
      }
    },
    plugins: [{
      id: 'rsCenter',
      afterDraw(chart){
        const { ctx, chartArea: a } = chart;
        const x = (a.left + a.right) / 2, y = (a.top + a.bottom) / 2;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = '#0E2A3E'; ctx.font = '700 22px Poppins, system-ui, sans-serif';
        ctx.fillText(fmtPct(vals[0]), x, y);
        ctx.fillStyle = '#6b6a66'; ctx.font = '11px Inter, system-ui, sans-serif';
        ctx.fillText('safely managed', x, y + 17);
        ctx.restore();
      }
    }]
  });
}

// Area chart
function rsArea(id, key, c, yTitle, tipFmt){
  rsDraw(id, {
    type: 'line',
    data: {
      labels: RS[key].years,
      datasets: [{ label: c, data: RS[key][c], borderColor: RS.colors[c], backgroundColor: rsGradient(RS.colors[c]),
                   fill: 'start', borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: RS.colors[c], pointBorderColor: '#fff', pointBorderWidth: 1.5, tension: .3 }]
    },
    options: (() => {
      const o = rsBaseOptions(yTitle);
      o.plugins.legend.display = false;
      o.plugins.tooltip.callbacks = { label: ctx => ` ${tipFmt(ctx.parsed.y)}` };
      o.scales.y.beginAtZero = false;
      o.scales.y.grace = '8%';
      o.scales.y.ticks.callback = v => Number(v).toLocaleString('en-US');
      return o;
    })()
  });
}

// Column chart
function rsColumns(id, key, c, yTitle, tipFmt){
  const data = RS[key][c];
  let lastIdx = -1;
  data.forEach((v, i) => { if (v != null) lastIdx = i; });
  rsDraw(id, {
    type: 'bar',
    data: { labels: RS[key].years, datasets: [{ label: c, data,
      backgroundColor: data.map((v, i) => i === lastIdx ? RS.colors[c] : hexA(RS.colors[c], 0.55)),
      hoverBackgroundColor: RS.colors[c], borderRadius: 6, borderSkipped: 'bottom', maxBarThickness: 34 }] },
    options: (() => {
      const o = rsBaseOptions(yTitle);
      o.plugins.legend.display = false;
      o.interaction = { mode: 'nearest', intersect: true, axis: 'x' };
      o.plugins.tooltip.callbacks = { label: ctx => ctx.parsed.y == null ? ' Not reported' : ` ${tipFmt(ctx.parsed.y)}` };
      o.scales.y.beginAtZero = true;
      o.scales.y.grace = '5%';
      o.scales.y.ticks.callback = v => Number(v).toLocaleString('en-US');
      return o;
    })(),
    plugins: [rsNaColumns]
  });
}

// Headline tiles
function rsKpis(c){
  const tile = (icon, color, label, year, value) =>
    `<div class="rs-kpi"><div class="rs-kpi-head"><span class="icon-circle icon-sm ${color}"><i class="fa-solid ${icon}"></i></span><div><div class="kpi-label">${label}</div><div class="rs-kpi-year">${year}</div></div></div>${value}</div>`;
  const val = v => `<div class="kpi-value">${v}</div>`;
  const inv = sum(RS.invest[c]);
  const box = document.getElementById('rsKpis');
  box.classList.toggle('rs-kpis-4', !inv);
  box.innerHTML = [
    tile('fa-faucet-drip', 'icon-teal', 'Safely managed drinking water', `% of population, ${lastYr('safe', c)}`, val(fmtPct(lastVal(RS.safe[c])))),
    tile('fa-glass-water', 'icon-navy', 'At least basic drinking water', `% of population, ${lastYr('basic', c)}`, val(fmtPct(lastVal(RS.basic[c])))),
    tile('fa-droplet', 'icon-green', 'Renewable freshwater per person', `m³, ${lastYr('fresh', c)}`, val(fmtNum(lastVal(RS.fresh[c])) + ' m³')),
    tile('fa-water', 'icon-amber', 'Freshwater withdrawals', `billion m³, ${lastYr('withdraw', c)}`, val(fmtBn(lastVal(RS.withdraw[c])) + ' bn m³')),
    inv ? tile('fa-hand-holding-dollar', 'icon-coral', 'Private investment in water', `Total ${RS.invest.years[0]} to ${last(RS.invest.years)}`, val(fmtUsdM(inv))) : ''
  ].join('');
}

// Investment chart
const rsHasInvest = c => sum(RS.invest[c]) > 0;
function rsInvestChart(c){
  const has = rsHasInvest(c);
  document.getElementById('rsInvestCard').hidden = !has;
  document.getElementById('rsInsightsCard').classList.toggle('rs-wide', !has);
  if (!has) {
    if (rsCharts.rsInvest) { rsCharts.rsInvest.destroy(); delete rsCharts.rsInvest; }
    return;
  }
  rsColumns('rsInvest', 'invest', c, 'US$ million', v => 'US$' + v.toLocaleString('en-US') + ' million');
}

// takeaways for selected country 
function rsInsights(c){
  const f = k => RS[k][c];
  const gap = lastVal(f('basic')) - lastVal(f('safe'));
  const fr = f('fresh'), wd = f('withdraw'), inv = sum(f('invest'));
  const since = k => RS[k].years[firstIdx(f(k))];
  const peak = inv ? RS.invest.years[f('invest').indexOf(Math.max(...f('invest').map(v => v || 0)))] : null;
  const items = [
    gap > 0.05
      ? `<b>Access gap:</b> ${fmtPct(lastVal(f('basic')))} of people have at least basic drinking water, but ${fmtPct(lastVal(f('safe')))} have safely managed water, a gap of ${gap.toFixed(1)} percentage points (${lastYr('safe', c)}).`
      : `<b>Full access:</b> ${fmtPct(lastVal(f('safe')))} of people have safely managed drinking water (${lastYr('safe', c)}).`,
    `<b>Freshwater per person:</b> ${fmtNum(lastVal(fr))} m³ in ${lastYr('fresh', c)}, ${signed(pctChange(fr[firstIdx(fr)], lastVal(fr)))} since ${since('fresh')}.`,
    `<b>Withdrawals:</b> ${fmtBn(lastVal(wd))} billion m³ in ${lastYr('withdraw', c)}, ${signed(pctChange(wd[firstIdx(wd)], lastVal(wd)))} since ${since('withdraw')}.`,
    inv ? `<b>Private capital:</b> ${fmtUsdM(inv)} of private investment in water and sanitation from ${since('invest')} to ${lastYr('invest', c)}, with the largest year in ${peak}.` : ''
  ].filter(Boolean);
  document.getElementById('rsInsights').innerHTML = items.map(t => `<div class="insight-callout">${t}</div>`).join('');
}

// Data table
function rsTable(c){
  const years = [...new Set(['safe', 'basic', 'fresh', 'withdraw', 'invest'].flatMap(k => RS[k].years))].sort((a, b) => a - b);
  const cell = (k, y, fmt) => { const i = RS[k].years.indexOf(y); const v = i < 0 ? null : RS[k][c][i]; return `<td>${v == null ? '<span class="rs-na">n/a</span>' : fmt(v)}</td>`; };
  document.getElementById('rsTableHead').innerHTML = '<tr><th>Indicator</th>' + years.map(y => `<th>${y}</th>`).join('') + '</tr>';
  const row = (name, k, fmt) => `<tr><td class="sc-country">${name}</td>` + years.map(y => cell(k, y, fmt)).join('') + '</tr>';
  document.getElementById('rsTableBody').innerHTML = [
    row('Safely managed drinking water (%)', 'safe', fmtPct),
    row('At least basic drinking water (%)', 'basic', fmtPct),
    row('Renewable freshwater per person (m³)', 'fresh', fmtNum),
    row('Freshwater withdrawals (billion m³)', 'withdraw', fmtBn),
    rsHasInvest(c) ? row('Private investment (US$ million)', 'invest', v => fmtNum(v)) : ''
  ].join('');
  document.getElementById('rsTableTitle').textContent = `View data table for ${c}`;
}

// Map
const RS_MAP_METRICS = {
  safe:     { label: 'Safely managed water', unit: '% of population', fmt: fmtPct },
  basic:    { label: 'Basic water access',   unit: '% of population', fmt: fmtPct },
  fresh:    { label: 'Freshwater per person', unit: 'm³ per person',  fmt: v => fmtNum(v) + ' m³' },
  withdraw: { label: 'Water withdrawals',     unit: 'billion m³',      fmt: v => fmtBn(v) + ' bn m³' }
};
const RS_ISO = { 458: 'Malaysia', 702: 'Singapore', 360: 'Indonesia' };
const RS_LAND = { color: '#c9d3d8', weight: 0.6, fillColor: '#eef1f2', fillOpacity: 1 };
const rsMap = { map: null, layers: {}, metric: 'safe', sel: 'Malaysia', ready: false };

function rsMapTip(c){
  return `<b>${c}</b><br>` + Object.entries(RS_MAP_METRICS).map(([k, m]) => `${m.label}: <b>${m.fmt(lastVal(RS[k][c]))}</b>`).join('<br>');
}
// Selected country in its colour
function rsMapStyle(){
  const key = rsMap.metric, m = RS_MAP_METRICS[key], sel = rsMap.sel;
  RS.countries.forEach(c => {
    const layer = rsMap.layers[c];
    if (!layer) return;
    const on = c === sel;
    layer.setStyle(on ? { fillColor: RS.colors[c], fillOpacity: 0.85, color: '#0E2A3E', weight: 1.4 } : RS_LAND);
    layer.unbindTooltip();
    if (on) layer.bindTooltip(rsMapTip(c), { sticky: true, className: 'rs-map-tip' });
    rsMap.labels[c].setContent(`<b>${c}</b><span>${m.fmt(lastVal(RS[key][c]))}</span>`);
    rsMap.labels[c].setOpacity(on ? 1 : 0);
  });
  document.getElementById('rsMapLegend').innerHTML =
    `<div class="rs-legend-title"><i class="rs-dot" style="background:${RS.colors[sel]}"></i> ${sel}</div>
     <div class="rs-legend-value">${m.fmt(lastVal(RS[key][sel]))}</div>
     <div class="rs-legend-unit">${m.label}, ${m.unit}, ${lastYr(key, sel)}</div>`;
}
function rsMapFocus(){
  if (!rsMap.ready) return;
  const target = rsMap.layers[rsMap.sel];
  rsMap.map.flyToBounds(target.getBounds(), { padding: [30, 30], maxZoom: rsMap.sel === 'Singapore' ? 7 : 6, duration: 0.6 });
}
function rsInitMap(){
  const el = document.getElementById('rsMap');
  if (!window.L || !window.topojson) { el.innerHTML = '<div class="rs-empty" style="display:flex">Map could not load. Check the internet connection.</div>'; return; }
  rsMap.map = L.map(el, { zoomControl: true, scrollWheelZoom: false, attributionControl: true, minZoom: 2, maxZoom: 9, zoomSnap: 0.25 }).setView([2, 110], 4);
  rsMap.map.attributionControl.setPrefix(false).addAttribution('Boundaries: Natural Earth');
  rsMap.labels = {};
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json')
    .then(r => r.json())
    .then(topo => {
      const geo = topojson.feature(topo, topo.objects.countries);
      // Neighbouring countries in grey 
      L.geoJSON({ type: 'FeatureCollection', features: geo.features.filter(f => !RS_ISO[+f.id]) }, {
        style: { color: '#c9d3d8', weight: 0.6, fillColor: '#eef1f2', fillOpacity: 1 }, interactive: false
      }).addTo(rsMap.map);
      const feats = geo.features.filter(f => RS_ISO[+f.id]);
      rsMap.group = L.featureGroup().addTo(rsMap.map);
      feats.forEach(f => {
        const c = RS_ISO[+f.id];
        const layer = L.geoJSON(f, { style: { weight: 1.2 } });
        layer.on('mouseover', () => { if (c === rsMap.sel) layer.setStyle({ weight: 2.5 }); });
        layer.on('mouseout', () => { if (c === rsMap.sel) layer.setStyle({ weight: 1.4 }); });
        rsMap.group.addLayer(layer);
        rsMap.layers[c] = layer;
      });
      // Value labels 
      const spots = { Malaysia: [4.6, 102.2], Singapore: [0.6, 104.9], Indonesia: [-1.8, 120.5] };
      RS.countries.forEach(c => {
        rsMap.labels[c] = L.tooltip({ permanent: true, direction: 'center', className: 'rs-map-label', interactive: false })
          .setLatLng(spots[c]).addTo(rsMap.map);
      });
      rsMap.ready = true;
      rsMapStyle();
      rsMap.map.fitBounds(rsMap.group.getBounds(), { padding: [20, 20] });
      rsMapFocus();
    })
    .catch(() => { el.insertAdjacentHTML('beforeend', '<div class="rs-map-error">Country outlines could not load.</div>'); });

  document.getElementById('rsMapMetric').addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#rsMapMetric .chip').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); });
    rsMap.metric = btn.dataset.metric;
    if (rsMap.ready) rsMapStyle();
  });
}

// Redraw everything for the selected country
function rsRender(c){
  rsKpis(c);
  rsAccessTrend(c);
  rsAccessDonut(c);
  rsArea('rsFresh', 'fresh', c, 'm³ per person', v => fmtNum(v) + ' m³');
  rsColumns('rsWithdraw', 'withdraw', c, 'billion m³', v => fmtBn(v) + ' bn m³');
  rsInvestChart(c);
  rsInsights(c);
  const span = k => `${RS[k].years[0]} to ${last(RS[k].years)}`;
  document.getElementById('rsAccessSub').textContent = `% of population, ${lastYr('safe', c)}`;
  document.getElementById('rsFreshSub').textContent = `m³ per person, ${span('fresh')}`;
  document.getElementById('rsWithdrawSub').textContent = `billion m³ per year, ${span('withdraw')}`;
  document.getElementById('rsInvestSub').textContent = `US$ million per year, ${span('invest')}`;
  rsTable(c);
  rsMap.sel = c;
  if (rsMap.ready) { rsMapStyle(); rsMapFocus(); }
}

// Data & research tab
let rsViewsInit = false;
function initDashboard(){
  if (rsViewsInit) return;
  rsViewsInit = true;
  document.getElementById('rsViewSwitch').addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const view = btn.dataset.view;
    document.querySelectorAll('#rsViewSwitch button').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-selected', b === btn); });
    document.getElementById('asView').hidden = view !== 'asean';
    document.getElementById('rsCountryView').hidden = view !== 'country';
    if (view === 'country') initCountryDashboard();
    else if (asState.map) asState.map.invalidateSize();
  });
  initChartInfo();
  initAsean();
}

// Country focus view 
let dashboardInit = false;
async function initCountryDashboard(){
  if (dashboardInit) return;
  dashboardInit = true;
  const status = document.getElementById('rsStatus'), content = document.getElementById('rsContent');
  content.hidden = true;
  status.hidden = false;
  status.className = 'as-status';
  status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading country data…';
  try {
    await rsLoadData();
  } catch (e) {
    status.className = 'as-status as-status-error';
    status.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div><b>The country data could not be loaded.</b><br>${e.message}. Make sure <b>${RS_FILE}</b> is uploaded in the same folder as index.html.</div>`;
    return;
  }
  status.hidden = true;
  content.hidden = false;
  document.getElementById('rsFilter').addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#rsFilter .chip').forEach(b => {
      b.classList.toggle('active', b === btn);
      b.setAttribute('aria-pressed', b === btn);
    });
    rsRender(btn.dataset.country);
  });
  rsMap.sel = 'Malaysia';
  rsInitMap();
  rsRender('Malaysia');
}


/* ===================== PART 2: ASEAN OVERVIEW (default) ===================== */

/* ---------- Data file ---------- */
const AS_FILE = 'WATER X- ASEAN LISTS.xlsx';
// Sheet name in the Excel -> key used by the charts
const AS_SHEETS = { GDP: 'gdp', POP: 'pop', BW: 'bw', SMW: 'smw', TWC: 'twc', DWU: 'dwu', IWU: 'iwu', AWU: 'awu', BS: 'bs', SMS: 'sms', PI: 'pi' };
// Shorter display names 
const AS_NAMES = { 'Brunei Darussalam': 'Brunei', 'Lao PDR': 'Laos', 'Viet Nam': 'Vietnam' };
// Units shown on the dashboard: GDP in US$ billion, population in millions, investment in US$ million
const AS_SCALE = { gdp: 1e9, pop: 1e6, pi: 1e6 };

// Filled in from the Excel: AS[key][country] = values by year, AS.yrs[key] 
const AS = { countries: [], yrs: {} };

function asParseSheet(ws, key){
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const h = rows.findIndex(r => r && String(r[0]).trim() === 'Country Name');
  if (h < 0) throw new Error('no "Country Name" header row');
  const years = [], cols = [];
  rows[h].forEach((cell, i) => { const m = String(cell ?? '').match(/\d{4}/); if (i > 0 && m) { years.push(+m[0]); cols.push(i); } });
  AS.yrs[key] = years;
  AS[key] = {};
  for (const r of rows.slice(h + 1)) {
    const raw = r && r[0] != null ? String(r[0]).trim() : '';
    if (!raw || /^(Data from|Last Updated)/i.test(raw)) continue;
    const name = AS_NAMES[raw] || raw;
    AS[key][name] = cols.map(i => typeof r[i] === 'number' ? r[i] / (AS_SCALE[key] || 1) : null);
  }
}

async function asLoadData(){
  if (!window.XLSX) throw new Error('the Excel reader could not load (check the internet connection)');
  // Always fetch the newest copy of the file
  const res = await fetch(encodeURI(AS_FILE) + '?t=' + Date.now(), { cache: 'no-store' });
  if (!res.ok) throw new Error(`"${AS_FILE}" was not found next to index.html`);
  const wb = XLSX.read(await res.arrayBuffer(), { type: 'array' });
  const missing = Object.keys(AS_SHEETS).filter(s => !wb.Sheets[s]);
  if (missing.length) throw new Error('sheet(s) not found: ' + missing.join(', '));
  Object.entries(AS_SHEETS).forEach(([sheet, key]) => {
    try { asParseSheet(wb.Sheets[sheet], key); } catch (e) { throw new Error(`sheet ${sheet}: ${e.message}`); }
  });
  AS.countries = Object.keys(AS.gdp).sort((a, b) => a.localeCompare(b));
}

/* ---------- Chart descriptions (the ⓘ button on each chart) ---------- */
// Plain-language meaning of each indicator
const PLAIN = {
  SMW:   ['Safely managed drinking water', 'Drinking water from an improved source located on the premises, available when needed and free from contamination. This is the highest level of service.'],
  BW:    ['At least basic drinking water', 'Drinking water from an improved source, such as piped water or a protected well, with a collection time of no more than 30 minutes per round trip.'],
  SMS:   ['Safely managed sanitation', 'Private sanitation facilities from which waste is safely disposed of on site or transported and treated elsewhere. This is the highest level of service.'],
  BS:    ['At least basic sanitation', 'Improved sanitation facilities, such as flush toilets or septic tanks, that are not shared with other households.'],
  POP:   ['Population', 'All residents of the country, based on mid-year estimates.'],
  GDP:   ['Gross domestic product (GDP)', 'The total value of goods and services produced by an economy in a year, in current US dollars.'],
  TWC:   ['Freshwater withdrawals', 'The total volume of freshwater abstracted from surface and groundwater sources for agricultural, industrial and domestic use.'],
  AWU:   ['Agriculture', 'Withdrawals for irrigation and livestock production.'],
  IWU:   ['Industry', 'Withdrawals for industrial processes, including the cooling of power plants.'],
  DWU:   ['Domestic', 'Withdrawals for households, municipal supply, public services and commercial premises.'],
  PI:    ['Private investment', 'Investment commitments by private parties in water and sanitation infrastructure projects that have reached financial close.'],
  FRESH: ['Renewable freshwater per capita', 'Internal renewable freshwater resources, comprising river flows and groundwater replenished by rainfall, divided by the total population.']
};

// Chart (canvas id) -> what it shows and which indicators it uses
const CHART_INFO = {
  asWater:    { about: 'The proportion of the population in each country with access to drinking water, by service level. Dark blue represents safely managed services, light blue represents basic services and grey represents the population without basic access.', tabs: ['SMW', 'BW'] },
  asSanit:    { about: 'The proportion of the population in each country with access to sanitation, by service level. Dark green represents safely managed services, light green represents basic services and grey represents the population without basic access.', tabs: ['SMS', 'BS'] },
  asPop:      { about: 'The total population of each ASEAN member state in the latest year, in millions, indicating the scale of demand for water services.', tabs: ['POP'] },
  asGdp:      { about: 'The gross domestic product of each country in US$ billion, comparing the earliest year available (light) with the latest year (dark).', tabs: ['GDP'] },
  asWithdraw: { about: 'The total annual freshwater withdrawals of each country in the latest year available, in billion cubic metres.', tabs: ['TWC'] },
  asSectors:  { about: 'The distribution of freshwater withdrawals in each country across agriculture, industry and domestic use, as a percentage of the total.', tabs: ['AWU', 'IWU', 'DWU'] },
  asInvest:   { about: 'Annual private investment commitments in water and sanitation projects by country, in US$ million. Years without a column recorded no commitments.', tabs: ['PI'] },
  rsTrend:    { about: 'The proportion of the population of the selected country with at least basic and with safely managed drinking water services over time.', tabs: ['SMW', 'BW'] },
  rsAccess:   { about: 'The distribution of the population of the selected country by drinking water service level in the latest year: safely managed, basic only and below basic.', tabs: ['SMW', 'BW'] },
  rsFresh:    { about: 'Renewable internal freshwater resources per capita in the selected country over time, in cubic metres.', tabs: ['FRESH'] },
  rsWithdraw: { about: 'The total annual freshwater withdrawals of the selected country over time, in billion cubic metres.', tabs: ['TWC'] },
  rsInvest:   { about: 'Annual private investment commitments in water and sanitation projects in the selected country, in US$ million. Years without a column recorded no commitments.', tabs: ['PI'] },
  // Maps: the ⓘ sits next to the map title
  asMap:      { map: true, about: 'The selected indicator for each ASEAN member state in the latest year available. Darker shading represents a higher value; select an indicator above the map to change the view.', tabs: ['BW', 'BS', 'SMW', 'SMS', 'GDP', 'POP'] },
  rsMap:      { map: true, about: 'The selected indicator for the chosen country in the latest year available. Select an indicator above the map to change the view.', tabs: ['SMW', 'BW', 'FRESH', 'TWC'] }
};

function infoHtml(cfg){
  const terms = cfg.tabs.filter(t => PLAIN[t]).map(t => `<li><b>${PLAIN[t][0]}:</b> ${PLAIN[t][1]}</li>`).join('');
  return `<div class="rs-info-title"><i class="fa-solid fa-circle-info"></i> What this ${cfg.map ? 'map' : 'chart'} shows</div>
    <p class="rs-info-about">${cfg.about}</p>
    ${terms ? `<div class="rs-info-title rs-info-sub">What the terms mean</div><ul class="rs-info-terms">${terms}</ul>` : ''}`;
}

// Adds the ⓘ button to every chart card; content is filled when it opens
let infoInit = false;
function initChartInfo(){
  if (infoInit) return;
  infoInit = true;
  Object.entries(CHART_INFO).forEach(([id, cfg]) => {
    const card = document.getElementById(id)?.closest('.dash-card');
    if (!card) return;
    const box = document.createElement('div');
    box.className = cfg.map ? 'rs-info rs-info-inline' : 'rs-info';
    box.innerHTML = `<button type="button" class="rs-info-btn" aria-label="About this ${cfg.map ? 'map' : 'chart'}" aria-expanded="false"><i class="fa-solid fa-circle-info"></i></button><div class="rs-info-pop" role="tooltip"></div>`;
    const pop = box.querySelector('.rs-info-pop');
    const fill = () => { pop.innerHTML = infoHtml(cfg); };
    box.addEventListener('mouseenter', fill);
    box.querySelector('.rs-info-btn').addEventListener('click', e => {
      e.stopPropagation();
      fill();
      const open = !box.classList.contains('open');
      document.querySelectorAll('.rs-info.open').forEach(b => { b.classList.remove('open'); b.firstChild.setAttribute('aria-expanded', 'false'); });
      box.classList.toggle('open', open);
      e.currentTarget.setAttribute('aria-expanded', open);
    });
    if (cfg.map) { card.classList.add('has-map-info'); card.querySelector('h3').appendChild(box); return; }
    card.classList.add('has-info');
    card.appendChild(box);
  });
  const closeAll = () => document.querySelectorAll('.rs-info.open').forEach(b => { b.classList.remove('open'); b.firstChild.setAttribute('aria-expanded', 'false'); });
  document.addEventListener('click', e => { if (!e.target.closest('.rs-info')) closeAll(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
}

/* ---------- Helpers (read values from Excel) ---------- */
const asVal = (k, c, y) => { const i = AS.yrs[k].indexOf(y); const row = AS[k][c]; return i < 0 || !row || row[i] == null ? null : row[i]; };
// Latest / earliest year 
const asLatest = k => [...AS.yrs[k]].reverse().find(y => AS.countries.some(c => asVal(k, c, y) != null));
const asFirst = k => AS.yrs[k].find(y => AS.countries.some(c => asVal(k, c, y) != null));
const asSum = (k, y) => AS.countries.reduce((t, c) => t + (asVal(k, c, y) || 0), 0);
const fmtPop = v => v >= 1 ? v.toFixed(1) + 'M' : Math.round(v * 1000) + 'K';
const fmtGdp = v => v >= 1000 ? 'US$' + (v / 1000).toFixed(2) + 'T' : 'US$' + v.toFixed(v < 10 ? 2 : 1) + 'B';
const NR = 'not reported';
const asSetText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

// Colours
const AS_C = { sectors: { Agriculture: '#1baf7a', Industry: '#2a78d6', Domestic: '#eb6834' },
  invest: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6'] };
// Map shading 
const AS_RAMP = ['#86b6ef', '#6da7ec', '#5598e7', '#3987e5', '#256abf', '#184f95'];
const asState = { metric: 'bw', map: null, layers: {}, ready: false };

/* ---------- headline titles ---------- */
function asKpis(){
  const tile = (icon, color, label, sub, value, note) =>
    `<div class="rs-kpi"><div class="rs-kpi-head"><span class="icon-circle icon-sm ${color}"><i class="fa-solid ${icon}"></i></span><div><div class="kpi-label">${label}</div><div class="rs-kpi-year">${sub}</div></div></div><div class="kpi-value">${value}</div>${note ? `<div class="rs-kpi-note">${note}</div>` : ''}</div>`;
  const inv = AS.countries.reduce((t, c) => t + AS.pi[c].reduce((s, v) => s + (v || 0), 0), 0);
  const investors = AS.countries.filter(c => AS.pi[c].some(v => v));
  const yPop = asLatest('pop'), yGdp = asLatest('gdp'), yTwc = asLatest('twc');
  document.getElementById('asKpis').innerHTML = [
    tile('fa-users', 'icon-navy', 'Population', `ASEAN total, ${yPop}`, asSum('pop', yPop).toFixed(0) + 'M', `${AS.countries.length} member states`),
    tile('fa-chart-line', 'icon-green', 'GDP', `ASEAN total, ${yGdp}`, fmtGdp(asSum('gdp', yGdp)), 'Current US$'),
    tile('fa-water', 'icon-amber', 'Freshwater withdrawals', `ASEAN total, ${yTwc}`, asSum('twc', yTwc).toFixed(0) + ' bn m³', 'Billion cubic metres'),
    tile('fa-hand-holding-dollar', 'icon-coral', 'Private investment in water', `Total, ${asFirst('pi')} to ${asLatest('pi')}`, fmtUsdM(inv), `Reported in ${investors.length} countries`)
  ].join('');
}

/* ---------- Map ---------- */
const AS_ISO = { 96: 'Brunei', 116: 'Cambodia', 360: 'Indonesia', 418: 'Laos', 458: 'Malaysia', 104: 'Myanmar',
  608: 'Philippines', 702: 'Singapore', 764: 'Thailand', 626: 'Timor-Leste', 704: 'Vietnam' };
const asMetric = (key, label, unit, fmt) => ({ label, get unit(){ return `${unit}, ${asLatest(key)}`; }, get: c => asVal(key, c, asLatest(key)), fmt });
const AS_METRICS = {
  bw:  asMetric('bw', 'Basic drinking water', '% of population', fmtPct),
  smw: asMetric('smw', 'Safely managed water', '% of population', fmtPct),
  bs:  asMetric('bs', 'Basic sanitation', '% of population', fmtPct),
  sms: asMetric('sms', 'Safely managed sanitation', '% of population', fmtPct),
  gdp: asMetric('gdp', 'GDP', 'current US$', fmtGdp),
  pop: asMetric('pop', 'Population', 'million', fmtPop)
};

const AS_DOTS = { Singapore: [1.35, 103.82], Brunei: [4.53, 114.73] };

function asBins(m){
  const vals = AS.countries.map(c => AS_METRICS[m].get(c)).filter(v => v != null).sort((a, b) => a - b);
  const min = vals[0], max = vals[vals.length - 1];
  
  const logScale = m === 'gdp' || m === 'pop';
  const t = v => logScale ? (Math.log(v) - Math.log(min)) / (Math.log(max) - Math.log(min) || 1) : (v - min) / (max - min || 1);
  return { min, max, color: v => v == null ? null : AS_RAMP[Math.min(AS_RAMP.length - 1, Math.floor(t(v) * AS_RAMP.length))] };
}
function asMapTip(c){
  return `<b>${c}</b><br>` + Object.values(AS_METRICS).map(m => { const v = m.get(c); return `${m.label}: <b>${v == null ? NR : m.fmt(v)}</b>`; }).join('<br>');
}
function asMapStyle(){
  if (!asState.ready) return;
  const m = asState.metric, b = asBins(m);
  AS.countries.forEach(c => {
    const col = b.color(AS_METRICS[m].get(c));
    (asState.layers[c] || []).forEach(l => l.setStyle({ fillColor: col || '#e9e8e3', fillOpacity: col ? 0.9 : 0.6, color: '#ffffff', weight: 0.8 }));
  });
  const notRep = AS.countries.filter(c => AS_METRICS[m].get(c) == null);
  document.getElementById('asMapLegend').innerHTML =
    `<div class="rs-legend-title">${AS_METRICS[m].label} <span>(${AS_METRICS[m].unit})</span></div>
     <div class="rs-legend-bar" style="background:linear-gradient(90deg,${AS_RAMP.join(',')})"></div>
     <div class="rs-legend-ends"><span>${AS_METRICS[m].fmt(b.min)}</span><span>${AS_METRICS[m].fmt(b.max)}</span></div>
     ${notRep.length ? `<div class="as-legend-na"><i></i> Not reported: ${notRep.join(', ')}</div>` : ''}`;
}
function asInitMap(){
  const el = document.getElementById('asMap');
  if (!window.L || !window.topojson) { el.innerHTML = '<div class="rs-empty" style="display:flex">Map could not load. Check the internet connection.</div>'; return; }
  asState.map = L.map(el, { scrollWheelZoom: false, minZoom: 2, maxZoom: 8, zoomSnap: 0.25 }).setView([8, 112], 4);
  asState.map.attributionControl.setPrefix(false).addAttribution('Boundaries: Natural Earth');
  fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json')
    .then(r => r.json())
    .then(topo => {
      const geo = topojson.feature(topo, topo.objects.countries);
      L.geoJSON({ type: 'FeatureCollection', features: geo.features.filter(f => !AS_ISO[+f.id]) }, {
        style: { color: '#c9d3d8', weight: 0.6, fillColor: '#eef1f2', fillOpacity: 1 }, interactive: false
      }).addTo(asState.map);
      asState.group = L.featureGroup().addTo(asState.map);
      geo.features.filter(f => AS_ISO[+f.id]).forEach(f => {
        const layer = L.geoJSON(f);
        asState.layers[AS_ISO[+f.id]] = [layer];
        asState.group.addLayer(layer);
      });
      Object.entries(AS_DOTS).forEach(([c, ll]) => {
        const dot = L.circleMarker(ll, { radius: 7 }).addTo(asState.map);
        (asState.layers[c] = asState.layers[c] || []).push(dot);
      });
      AS.countries.forEach(c => (asState.layers[c] || []).forEach(l => {
        l.bindTooltip(() => asMapTip(c), { sticky: true, className: 'rs-map-tip' });
        l.on('mouseover', () => l.setStyle({ weight: 2.2, color: '#0E2A3E' }));
        l.on('mouseout', () => asMapStyle());
      }));
      asState.ready = true;
      asMapStyle();
      asState.map.fitBounds(asState.group.getBounds(), { padding: [16, 16] });
    })
    .catch(() => el.insertAdjacentHTML('beforeend', '<div class="rs-map-error">Country outlines could not load.</div>'));
  document.getElementById('asMapMetric').addEventListener('click', e => {
    const btn = e.target.closest('.chip');
    if (!btn) return;
    document.querySelectorAll('#asMapMetric .chip').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', b === btn); });
    asState.metric = btn.dataset.metric;
    asMapStyle();
  });
}

/* ---------- Charts  ---------- */

function asLadder(id, basicKey, safeKey, colors, noun){
  const C = AS.countries, y = asLatest(basicKey);
  const basic = C.map(c => asVal(basicKey, c, y)), safe = C.map(c => asVal(safeKey, c, y));
  const seg = (label, data, color) => ({ label, data, backgroundColor: color, borderColor: '#fff', borderWidth: { right: 2 }, borderSkipped: false, barPercentage: .72 });
  const sets = [
    seg('Safely managed', C.map((c, i) => safe[i] != null ? safe[i] : 0), colors.safe),
    
    seg('Basic', C.map((c, i) => basic[i] == null ? 0 : safe[i] != null ? basic[i] - safe[i] : basic[i]), colors.basic),
    seg('Remaining population', C.map((c, i) => basic[i] == null ? 0 : 100 - basic[i]), '#e6ecef')
  ];
  rsDraw(id, {
    type: 'bar',
    data: { labels: C, datasets: sets },
    options: (() => {
      const o = rsBaseOptions('', { indexAxis: 'y' });
      o.interaction = { mode: 'index', intersect: false, axis: 'y' };
      o.plugins.tooltip.filter = item => item.datasetIndex === 0;
      o.plugins.tooltip.callbacks = {
        label: ctx => {
          const i = ctx.dataIndex;
          return [` At least basic ${noun}: ${basic[i] == null ? NR : fmtPct(basic[i])}`, ` Safely managed ${noun}: ${safe[i] == null ? NR : fmtPct(safe[i])}`];
        }
      };
      o.scales.x = { stacked: true, min: 0, max: 100, grid: { color: RS_GRID }, border: { display: false }, ticks: { color: RS_TICK, font: { size: 11 }, callback: v => v + '%', stepSize: 25 } };
      o.scales.y = { stacked: true, grid: { display: false }, border: { color: '#c3c2b7' }, ticks: { color: RS_INK, font: { size: 11.5, weight: 500 } } };
      return o;
    })()
  });
  asSetText(id + 'Sub', `Share of the population by service level, ${y}`);
}

// Lollipop chart: population 
function asPopulation(){
  const y = asLatest('pop');
  const data = AS.countries.map(c => asVal('pop', c, y));
  rsDraw('asPop', {
    type: 'bar',
    data: { labels: AS.countries, datasets: [
      { type: 'line', label: 'Population', data, showLine: false, pointRadius: 7, pointHoverRadius: 9, pointStyle: 'circle',
        pointBackgroundColor: '#1c5cab', pointBorderColor: '#fff', pointBorderWidth: 2, order: 0 },
      { label: 'stem', data, backgroundColor: hexA('#2a78d6', 0.35), barThickness: 3, borderSkipped: 'start', order: 1 }
    ] },
    options: (() => {
      const o = rsBaseOptions('', { indexAxis: 'y' });
      o.interaction = { mode: 'index', intersect: false, axis: 'y' };
      o.plugins.legend.display = false;
      o.plugins.tooltip.filter = item => item.datasetIndex === 0;
      o.plugins.tooltip.callbacks = { label: ctx => ` Population: ${fmtPop(ctx.raw)} (${y})` };
      o.scales.x = { type: 'logarithmic', min: 0.1, max: 500, grid: { color: RS_GRID }, border: { display: false },
                     afterBuildTicks: axis => { axis.ticks = [0.1, 1, 10, 100].map(value => ({ value })); },
                     ticks: { color: RS_TICK, font: { size: 11 }, callback: v => (v < 1 ? (v * 1000) + 'K' : v + 'M') },
                     title: { display: true, text: 'people', color: RS_TICK, font: { size: 11 } } };
      o.scales.y = { grid: { display: false }, border: { color: '#c3c2b7' }, ticks: { color: RS_INK, font: { size: 11.5, weight: 500 } } };
      return o;
    })()
  });
  asSetText('asPopSub', `Million people, ${y}`);
}

// Grouped columns: GDP 
function asGdp(){
  const y0 = asFirst('gdp'), y1 = asLatest('gdp');
  rsDraw('asGdp', {
    type: 'bar',
    data: { labels: AS.countries, datasets: [
      { label: String(y0), data: AS.countries.map(c => asVal('gdp', c, y0)), backgroundColor: '#9ec5f4', borderRadius: 4, borderSkipped: 'bottom', categoryPercentage: .72, barPercentage: .85 },
      { label: String(y1), data: AS.countries.map(c => asVal('gdp', c, y1)), backgroundColor: '#184f95', borderRadius: 4, borderSkipped: 'bottom', categoryPercentage: .72, barPercentage: .85 }
    ] },
    options: (() => {
      const o = rsBaseOptions('US$ billion');
      o.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.dataset.label}: ${fmtGdp(ctx.raw)}` };
      o.scales.x.ticks = { color: RS_INK, font: { size: 10.5 }, maxRotation: 45, minRotation: 45, autoSkip: false };
      // Log scale so small economies stay visible next to Indonesia
      o.scales.y = Object.assign(o.scales.y, { type: 'logarithmic', min: 0.3, max: 3000,
        afterBuildTicks: axis => { axis.ticks = [1, 10, 100, 1000].map(value => ({ value })); } });
      o.scales.y.ticks.callback = v => 'US$' + Number(v).toLocaleString('en-US') + 'B';
      return o;
    })(),
    plugins: [rsNaColumns]
  });
  asSetText('asGdpSub', `Current US$ billion, ${y0} and ${y1}`);
}

// Horizontal bars: total freshwater withdrawals
function asWithdrawals(){
  const y = asLatest('twc');
  rsDraw('asWithdraw', {
    type: 'bar',
    data: { labels: AS.countries, datasets: [{ label: 'Freshwater withdrawals', data: AS.countries.map(c => asVal('twc', c, y)),
      backgroundColor: hexA('#1c5cab', 0.85), hoverBackgroundColor: '#1c5cab', borderRadius: 4, borderSkipped: 'start', barPercentage: .7 }] },
    options: (() => {
      const o = rsBaseOptions('', { indexAxis: 'y' });
      o.interaction = { mode: 'index', intersect: false, axis: 'y' };
      o.plugins.legend.display = false;
      o.plugins.tooltip.callbacks = { label: ctx => ` ${fmtBn(ctx.raw)} billion m³ (${y})` };
      // Log scale so small users stay visible next to Indonesia
      o.scales.x = { type: 'logarithmic', min: 0.05, max: 500, grid: { color: RS_GRID }, border: { display: false },
                     afterBuildTicks: axis => { axis.ticks = [0.1, 1, 10, 100].map(value => ({ value })); },
                     ticks: { color: RS_TICK, font: { size: 11 }, callback: v => Number(v).toLocaleString('en-US') },
                     title: { display: true, text: 'billion m³', color: RS_TICK, font: { size: 11 } } };
      o.scales.y = { grid: { display: false }, border: { color: '#c3c2b7' }, ticks: { color: RS_INK, font: { size: 11.5, weight: 500 } } };
      return o;
    })(),
    plugins: [rsNaBars]
  });
  asSetText('asWithdrawSub', `Total, billion m³, ${y}`);
}

// 100% stacked bars
function asSectors(){
  const y = asLatest('awu');
  const list = AS.countries.filter(c => c !== 'Brunei');
  rsDraw('asSectors', {
    type: 'bar',
    data: { labels: list, datasets: [['Agriculture', 'awu'], ['Industry', 'iwu'], ['Domestic', 'dwu']].map(([label, k]) => ({
      label, data: list.map(c => asVal(k, c, y)), backgroundColor: AS_C.sectors[label], borderColor: '#fff', borderWidth: { right: 2 }, borderSkipped: false, barPercentage: .75 })) },
    options: (() => {
      const o = rsBaseOptions('', { indexAxis: 'y' });
      o.interaction = { mode: 'index', intersect: false, axis: 'y' };
      o.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw == null ? NR : ctx.raw.toFixed(1) + '%'}` };
      o.scales.x = { stacked: true, min: 0, max: 100, grid: { color: RS_GRID }, border: { display: false }, ticks: { color: RS_TICK, font: { size: 11 }, callback: v => v + '%', stepSize: 25 } };
      o.scales.y = { stacked: true, grid: { display: false }, border: { color: '#c3c2b7' }, ticks: { color: RS_INK, font: { size: 11.5, weight: 500 } } };
      return o;
    })()
  });
  asSetText('asSectorsSub', `% of freshwater withdrawals by sector, ${y}`);
}

// Stacked columns: private investment 
function asInvest(){
  const investors = AS.countries.filter(c => AS.pi[c].some(v => v));
  const y0 = asFirst('pi'), y1 = asLatest('pi');
  const yrs = AS.yrs.pi.filter(y => y >= y0 && y <= y1);
  rsDraw('asInvest', {
    type: 'bar',
    data: { labels: yrs, datasets: investors.map((c, i) => ({ label: c, data: yrs.map(y => asVal('pi', c, y)), backgroundColor: AS_C.invest[i % AS_C.invest.length],
      // minBarLength keeps small amounts visible; 
      borderColor: '#fff', borderWidth: { top: 2 }, borderSkipped: false, borderRadius: 3, maxBarThickness: 40, minBarLength: 6 })) },
    options: (() => {
      const o = rsBaseOptions('US$ million');
      o.plugins.tooltip.callbacks = { label: ctx => ` ${ctx.dataset.label}: US$${ctx.raw.toLocaleString('en-US')} million` };
      o.plugins.tooltip.filter = item => item.raw > 0;
      o.scales.x.stacked = true; o.scales.y.stacked = true;
      o.scales.y.ticks.callback = v => Number(v).toLocaleString('en-US');
      return o;
    })(),
    plugins: [rsNaColumns]
  });
  asSetText('asInvestSub', `US$ million per year, ${y0} to ${y1}`);
}

/* ---------- Takeaways  ---------- */
function asInsights(){
  const v = asVal;
  const andList = a => a.length > 1 ? a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1] : a[0];
  const yW = asLatest('bw'), yS = asLatest('bs'), yM = asLatest('smw');
  const fW = asFirst('smw'), fS = asFirst('bs');
  const full = AS.countries.filter(c => v('bw', c, yW) === 100);
  // Largest single-year private investment 
  let top = null;
  AS.countries.forEach(c => AS.yrs.pi.forEach(y => { const x = v('pi', c, y); if (x && (!top || x > top.x)) top = { c, y, x }; }));
  const pair = (k, c, y0, y1) => v(k, c, y0) != null && v(k, c, y1) != null;
  const items = [
    full.length ? `<b>Universal basic water:</b> ${andList(full)} report 100% of the population with at least basic drinking water (${yW}).` : '',
    pair('smw', 'Laos', fW, yM) ? `<b>Safely managed water:</b> Laos reports ${fmtPct(v('smw', 'Laos', fW))} in ${fW} and ${fmtPct(v('smw', 'Laos', yM))} in ${yM}.` : '',
    pair('bs', 'Cambodia', fS, yS) && pair('bs', 'Vietnam', fS, yS)
      ? `<b>Sanitation:</b> Cambodia reports basic sanitation of ${fmtPct(v('bs', 'Cambodia', fS))} in ${fS} and ${fmtPct(v('bs', 'Cambodia', yS))} in ${yS}; Vietnam reports ${fmtPct(v('bs', 'Vietnam', fS))} and ${fmtPct(v('bs', 'Vietnam', yS))}.` : '',
    top ? `<b>Private investment:</b> the largest single-year figure is ${top.c}'s US$${Math.round(top.x)}M in ${top.y}.` : ''
  ].filter(Boolean);
  document.getElementById('asInsights').innerHTML = items.map(t => `<div class="insight-callout">${t}</div>`).join('');
}

/* ---------- Data table  ---------- */
function asTable(){
  const latestPi = c => { for (const y of [...AS.yrs.pi].reverse()) { const x = asVal('pi', c, y); if (x) return `${Math.round(x).toLocaleString('en-US')} (${y})`; } return null; };
  const pct = v => v.toFixed(1);
  const L = asLatest;
  const cols = [
    [`Population, ${L('pop')} (M)`, c => asVal('pop', c, L('pop')), v => v.toFixed(1)],
    [`GDP, ${L('gdp')} (US$ B)`, c => asVal('gdp', c, L('gdp')), v => v.toLocaleString('en-US', { maximumFractionDigits: 1 })],
    [`Basic water, ${L('bw')} (%)`, c => asVal('bw', c, L('bw')), pct],
    [`Safely managed water, ${L('smw')} (%)`, c => asVal('smw', c, L('smw')), pct],
    [`Basic sanitation, ${L('bs')} (%)`, c => asVal('bs', c, L('bs')), pct],
    [`Safely managed sanitation, ${L('sms')} (%)`, c => asVal('sms', c, L('sms')), pct],
    [`Withdrawals, ${L('twc')} (bn m³)`, c => asVal('twc', c, L('twc')), fmtBn],
    [`Agriculture use, ${L('awu')} (%)`, c => asVal('awu', c, L('awu')), pct],
    [`Industry use, ${L('iwu')} (%)`, c => asVal('iwu', c, L('iwu')), pct],
    [`Domestic use, ${L('dwu')} (%)`, c => asVal('dwu', c, L('dwu')), pct],
    ['Private / PPP investment, latest year (US$ M)', latestPi, x => x]
  ];
  document.getElementById('asTableHead').innerHTML = '<tr><th>Country</th>' + cols.map(c => `<th>${c[0]}</th>`).join('') + '</tr>';
  document.getElementById('asTableBody').innerHTML = AS.countries.map(c =>
    `<tr><td class="sc-country">${c}</td>` + cols.map(([, get, fmt]) => { const x = get(c); return `<td>${x == null ? '<span class="rs-na">n/a</span>' : fmt(x)}</td>`; }).join('') + '</tr>').join('');
}

/* ---------- Render ---------- */
function asRender(){
  asKpis();
  asLadder('asWater', 'bw', 'smw', { safe: '#1c5cab', basic: '#86b6ef' }, 'drinking water');
  asLadder('asSanit', 'bs', 'sms', { safe: '#13805a', basic: '#7fd1ad' }, 'sanitation');
  asPopulation();
  asGdp();
  asWithdrawals();
  asSectors();
  asInvest();
  asInsights();
  asTable();
  asMapStyle();
}

// message when the Excel cannot be read
function asShowError(msg){
  const box = document.getElementById('asStatus');
  box.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><div><b>The ASEAN data could not be loaded.</b><br>${msg}. Make sure <b>${AS_FILE}</b> is uploaded in the same folder as index.html and the sheet names are unchanged.</div>`;
  box.className = 'as-status as-status-error';
  document.getElementById('asContent').hidden = true;
}

let aseanInit = false;
async function initAsean(){
  if (aseanInit) return;
  aseanInit = true;
  const status = document.getElementById('asStatus'), content = document.getElementById('asContent');
  content.hidden = true;
  status.className = 'as-status';
  status.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading ASEAN data…';
  try {
    await asLoadData();
  } catch (e) {
    asShowError(e.message);
    return;
  }
  status.className = 'as-status';
  status.hidden = true;
  content.hidden = false;
  asInitMap();
  asRender();
}
