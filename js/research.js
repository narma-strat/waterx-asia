/* Data & research tab: gauges, charts, scorecard */

// Runs when the tab first opens
let dashboardInit = false;
function initDashboard(){
  if(dashboardInit) return;
  dashboardInit = true;

  // Gauges
  function renderGauge(id, value, max, benchmark, prefix, suffix, title, benchLabel){
    const el = document.getElementById(id);
    const pct = Math.min(100, (value/max)*100);
    const indPct = Math.min(100, (benchmark/max)*100);
    const fillDeg = (pct*1.8).toFixed(1);
    const indAngle = (-90 + indPct*1.8).toFixed(1);
    const fmt = n => n >= 1000 ? n.toLocaleString('en-US') : n;
    el.innerHTML = `
      <div class="gauge-legend"><span><i class="dot company"></i>ASEAN avg</span><span><i class="dot industry"></i>${benchLabel} ${prefix||''}${fmt(benchmark)}${suffix||''}</span></div>
      <div class="gauge-shell">
        <div class="gauge-arc" style="background:conic-gradient(from -90deg, #7C6FE0 0deg ${fillDeg}deg, #E7E5F5 ${fillDeg}deg 180deg, #E7E5F5 180deg 360deg)"></div>
        <div class="gauge-tick" style="transform:rotate(${indAngle}deg)"></div>
      </div>
      <div class="gauge-value">${prefix||''}${fmt(value)}${suffix||''}</div>
      <div class="gauge-title">${title}</div>`;
  }
  renderGauge('gauge1', 28.5, 60, 25, '', '%', 'Non-revenue water', 'Global benchmark');
  renderGauge('gauge2', 0.42, 1.2, 0.55, 'USD', '', 'Avg. water tariff / m³', 'Global benchmark');
  renderGauge('gauge3', 92, 100, 100, '', '%', 'Access to safe drinking water', 'SDG target');
  renderGauge('gauge4', 61, 100, 70, '', '%', 'Wastewater treatment coverage', 'Global benchmark');

  // Bar + line chart
  const countries = ['Malaysia','Indonesia','Vietnam','Philippines','Thailand','Singapore'];
  new Chart(document.getElementById('trendChart'), {
    data:{
      labels: countries,
      datasets:[
        {type:'bar', label:'Investment pipeline (USD B)', data:[2.1,5.8,4.2,3.1,2.4,0.8], backgroundColor:'#5DCAA5', order:2, yAxisID:'y'},
        {type:'line', label:'Non-revenue water (%)', data:[33.9,38.2,25.4,36.7,28.1,8.5], borderColor:'#534AB7', backgroundColor:'#534AB7', order:1, yAxisID:'y1', tension:.3}
      ]
    },
    options:{
      responsive:true,
      plugins:{legend:{position:'top', labels:{boxWidth:10, font:{size:11}}}},
      scales:{
        y:{title:{display:true,text:'Investment (USD billion)',font:{size:11}}, grid:{color:'#EEF3F5'}},
        y1:{position:'right', grid:{drawOnChartArea:false}, title:{display:true,text:'Non-revenue water (%)',font:{size:11}}}
      }
    }
  });

  // Donut charts
  function donut(id, labels, data, colors){
    new Chart(document.getElementById(id), {
      type:'doughnut',
      data:{labels, datasets:[{data, backgroundColor:colors, borderWidth:0}]},
      options:{plugins:{legend:{position:'bottom', labels:{boxWidth:10, font:{size:10.5}}}}, cutout:'62%'}
    });
  }
  donut('incomeDonut', ['Water supply','Wastewater treatment','Digital and smart water','Desalination'], [38,34,16,12], ['#5DCAA5','#F0997B','#7F77DD','#378ADD']);
  donut('expenseDonut', countries, [11,32,23,17,13,4], ['#5DCAA5','#F0997B','#7F77DD','#378ADD','#EF9F27','#D4537E']);
}

// Country scorecard
const scorecard = [
  {country:"Malaysia",    invest:"USD2.1B", nrw:"33.9%", ww:"58%", tariff:"USD0.38/m³", trend:"up",   trendVal:"+12%"},
  {country:"Indonesia",   invest:"USD5.8B", nrw:"38.2%", ww:"46%", tariff:"USD0.24/m³", trend:"up",   trendVal:"+21%"},
  {country:"Vietnam",     invest:"USD4.2B", nrw:"25.4%", ww:"57%", tariff:"USD0.31/m³", trend:"up",   trendVal:"+18%"},
  {country:"Philippines", invest:"USD3.1B", nrw:"36.7%", ww:"49%", tariff:"USD0.35/m³", trend:"up",   trendVal:"+9%"},
  {country:"Thailand",    invest:"USD2.4B", nrw:"28.1%", ww:"63%", tariff:"USD0.40/m³", trend:"down", trendVal:"-3%"},
  {country:"Singapore",   invest:"USD0.8B", nrw:"8.5%",  ww:"96%", tariff:"USD1.02/m³", trend:"up",   trendVal:"+5%"}
];
document.getElementById('scorecardBody').innerHTML = scorecard.map(r => {
  const nrwPct = parseFloat(r.nrw);
  return `<tr>
    <td class="sc-country">${r.country}</td>
    <td>${r.invest}</td>
    <td><div style="display:flex;align-items:center;gap:8px;"><div class="mini-bar" style="max-width:70px;"><span style="width:${Math.min(100, nrwPct*2)}%;"></span></div>${r.nrw}</div></td>
    <td>${r.ww}</td>
    <td>${r.tariff}</td>
    <td><span class="trend-badge trend-${r.trend}"><i class="fa-solid fa-arrow-${r.trend}"></i> ${r.trendVal}</span></td>
  </tr>`;
}).join('');
