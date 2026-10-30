/* Company profiles tab: from WATERX-COMPANY.xlsx  */

const CO_FILE = 'WATERX-COMPANY.xlsx';
const CO_FIRST = 'China';  // first country chip after "All countries"

// Companies not in the Excel
const extraCompanies = [
  {name:"Haitian Water Group Co., Ltd", country:"China", logo:"images/logos/haitian.jpg",
   address:"No. 506, South Section of Hupan Road, Xinglong Subdistrict, Tianfu New Area, China (Sichuan) Pilot Free Trade Zone, Chengdu, Sichuan, China",
   phone:"+86 28 8515 7318", email:"webmaster@haitianshuiwu.com", website:"https://global.haitian603759.com/",
   desc:"Provides water supply and wastewater treatment services, environmental infrastructure investment, construction and operation, with capabilities in smart water, solid waste treatment and piped direct drinking water.",
   categories:["Water Utility","Water Treatment","Smart Water"]}
];

// Logos
const CO_SVG = ['avkvalves','grundfos','mattenplant','hach','xylem'];
const CO_SUFFIX = ['com','my','sg','cn','net','gov','org','co'];
const coKey = url => {
  const parts = url.replace(/^\w+:\/\//,'').split('/')[0].toLowerCase().split('.');
  while (parts.length > 1 && CO_SUFFIX.includes(parts[parts.length - 1])) parts.pop();
  return parts.pop();
};
const CO_RENAME = {iaotu:'aotu'};  
const coLogo = url => { const k = CO_RENAME[coKey(url)] || coKey(url); return `images/logos/${k}.${CO_SVG.includes(k) ? 'svg' : 'png'}`; };

// Excel reading
const coClean = v => { const t = String(v ?? '').trim(); return /^(n\/?a|-|not published)/i.test(t) ? '' : t; };
async function coLoad(){
  const res = await fetch(encodeURI(CO_FILE) + '?t=' + Date.now(), {cache:'no-store'});
  if (!res.ok) throw new Error(CO_FILE + ' not found');
  const wb = XLSX.read(await res.arrayBuffer(), {type:'array'});
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header:1, defval:''});
  const h = rows.findIndex(r => r.some(c => String(c).trim() === 'Company Name'));
  if (h < 0) throw new Error('"Company Name" header not found');
  const head = rows[h].map(c => String(c).trim().toLowerCase());
  const col = name => head.indexOf(name.toLowerCase());
  const get = (r, name) => col(name) < 0 ? '' : coClean(r[col(name)]);
  return rows.slice(h + 1).filter(r => get(r, 'Company Name')).map(r => {
    const website = get(r, 'Website');
    return {
      name: get(r, 'Company Name'),
      country: get(r, 'Country'),
      categories: get(r, 'Category').split(';').map(c => c.trim()).filter(Boolean),
      desc: get(r, 'Description'), website, phone: get(r, 'Contact number'),
      email: get(r, 'Email'), address: get(r, 'Address'),
      logo: website ? coLogo(website) : ''
    };
  });
}

// Category icons
const catIconFor = c => {
  const t = c.toLowerCase();
  if (t.includes('meter')) return 'fa-gauge-high';
  if (t.includes('smart') || t.includes('digital') || t.includes('automation')) return 'fa-microchip';
  if (t.includes('quality') || t.includes('monitoring')) return 'fa-vial';
  if (t.includes('chemical')) return 'fa-flask';
  if (t.includes('flood')) return 'fa-house-flood-water';
  if (t.includes('drinking')) return 'fa-faucet-drip';
  if (t.includes('valve')) return 'fa-faucet';
  if (t.includes('pump')) return 'fa-fan';
  if (t.includes('pipe')) return 'fa-grip-lines';
  if (t.includes('solid waste')) return 'fa-recycle';
  if (t.includes('epc') || t.includes('construction') || t.includes('engineering')) return 'fa-helmet-safety';
  if (t.includes('investment') || t.includes('asset')) return 'fa-chart-line';
  if (t.includes('utility') || t.includes('operation')) return 'fa-gears';
  if (t.includes('treatment')) return 'fa-filter';
  if (t.includes('infrastructure')) return 'fa-industry';
  return 'fa-droplet';
};
const catList = s => `<div class="cat-list">${s.categories.map(c => `<div class="cat-item"><i class="fa-solid ${catIconFor(c)}"></i><span>${esc(c)}</span></div>`).join('')}</div>`;
const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const firstEmail = s => s.email.split(/[;,\s]+/).filter(Boolean)[0] || '';
const enquiryLink = s => firstEmail(s) ? `mailto:${firstEmail(s)}?subject=${encodeURIComponent('Enquiry via WaterX Asia: ' + s.name)}` : s.website;
const initials = n => n.replace(/\(.*?\)/g,'').split(/\s+/).filter(w => /^[A-Z]/.test(w)).slice(0,2).map(w => w[0]).join('') || n[0];
const logoBox = s => `<div class="supplier-logo-box">${s.logo ? `<img class="supplier-logo-img" src="${s.logo}" alt="${esc(s.name)} logo" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'supplier-initials',textContent:'${esc(initials(s.name))}'}))">` : `<span class="supplier-initials">${esc(initials(s.name))}</span>`}</div>`;

// Country + category filters, company cards
const grid = document.getElementById('supplierGrid');
const coFilter = document.getElementById('coFilter');
const coCat = document.getElementById('coCategory');
let companies = [], coCountry = '', coCategory = '';  // '' = all
const inCountry = s => !coCountry || s.country === coCountry;

function renderFilter(){
  const counts = {};
  companies.forEach(s => counts[s.country] = (counts[s.country] || 0) + 1);
  const list = Object.keys(counts).sort((a, b) => (b === CO_FIRST) - (a === CO_FIRST) || a.localeCompare(b));
  if (coCountry && !counts[coCountry]) coCountry = '';
  coFilter.innerHTML = [['', 'All countries'], ...list.map(c => [c, c])].map(([v, label]) => `<button type="button" class="chip${v === coCountry ? ' active' : ''}" data-country="${esc(v)}" aria-pressed="${v === coCountry}">${esc(label)}</button>`).join('');
  // Category list only shows categories found in the selected country
  const shown = companies.filter(inCountry);
  const cats = {};
  shown.forEach(s => s.categories.forEach(c => cats[c] = (cats[c] || 0) + 1));
  if (!cats[coCategory]) coCategory = '';
  coCat.innerHTML = `<option value="">All categories</option>` +
    Object.keys(cats).sort().map(c => `<option value="${esc(c)}"${c === coCategory ? ' selected' : ''}>${esc(c)}</option>`).join('');
}
coFilter.addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  coCountry = b.dataset.country;
  renderFilter();
  renderSuppliers();
});
coCat.addEventListener('change', () => { coCategory = coCat.value; renderSuppliers(); });

function renderSuppliers(){
  grid.innerHTML = '';
  companies.filter(s => inCountry(s) && (!coCategory || s.categories.includes(coCategory))).forEach(s => {
    const card = document.createElement('div');
    card.className = 'supplier-card';
    card.innerHTML = `
      ${logoBox(s)}
      <div class="supplier-top" style="margin-bottom:6px;">
        <div>
          <div class="supplier-name">${esc(s.name)}</div>
          <div class="supplier-loc"><i class="fa-solid fa-location-dot" style="margin-right:4px;"></i>${esc(s.country)}</div>
        </div>
      </div>
      ${s.desc ? `<p class="supplier-blurb">${esc(s.desc)}</p>` : ''}
      <div class="sp-field">
        <div class="sp-label">Product / technology category</div>
        ${catList(s)}
      </div>
      <div class="card-foot">
        ${firstEmail(s) ? `<a class="btn btn-primary btn-sm" href="${enquiryLink(s)}"><i class="fa-solid fa-envelope"></i> Enquire</a>`
          : `<a class="btn btn-primary btn-sm" href="${esc(s.website)}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-globe"></i> Website</a>`}
        <button class="btn btn-ghost btn-sm view-profile">View profile</button>
      </div>`;
    card.querySelector('.view-profile').addEventListener('click', () => openModal(s));
    grid.appendChild(card);
  });
}

async function initCompanies(){
  grid.innerHTML = '<p class="as-status">Loading company profiles…</p>';
  let rows = [];
  try { rows = await coLoad(); }
  catch (err) {
    console.error(err);
    grid.innerHTML = `<p class="as-status">Company list could not be loaded (${esc(err.message)}). Check that ${CO_FILE} is next to index.html.</p>`;
  }
  companies = extraCompanies.concat(rows);
  renderFilter();
  renderSuppliers();
}
initCompanies();

// View profile pop-up
const overlay = document.getElementById('modalOverlay');
function openModal(s){
  document.getElementById('modalTitle').textContent = s.name;
  document.getElementById('modalDesc').textContent = s.desc;
  document.getElementById('modalProducts').innerHTML = catList(s);
  const phones = s.phone.split('/').map(p => p.trim()).filter(Boolean);
  const emails = s.email.split(/[;,\s]+/).filter(Boolean);
  document.getElementById('modalContact').innerHTML = [
    s.address && `<div><i class="fa-solid fa-location-dot"></i>${esc(s.address)}</div>`,
    phones.length && `<div><i class="fa-solid fa-phone"></i>${phones.map(p => `<a href="tel:${p.replace(/\(.*?\)|[^\d+]/g,'')}">${esc(p)}</a>`).join(' / ')}</div>`,
    emails.length && `<div><i class="fa-solid fa-envelope"></i>${emails.map(m => `<a href="mailto:${esc(m)}">${esc(m)}</a>`).join(', ')}</div>`,
    s.website && `<div><i class="fa-solid fa-globe"></i><a href="${esc(s.website)}" target="_blank" rel="noopener noreferrer">${esc(s.website)}</a></div>`
  ].filter(Boolean).join('');
  const enq = document.getElementById('modalEnquire');
  enq.href = enquiryLink(s);
  enq.style.display = firstEmail(s) ? '' : 'none';
  document.getElementById('modalWebsite').href = s.website;
  overlay.classList.add('open');
}
document.getElementById('modalClose').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('open'); });
