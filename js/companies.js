/* Company profiles tab */

// Company list: copy a { ... } block to add a company. Empty "" fields are hidden.
const companies = [
  {name:"Haitian Water Group Co., Ltd", loc:"Chengdu, Sichuan, China", listing:"SSE: 603759", logo:"images/haitian-logo.jpg",
   address:"No. 506, South Section of Hupan Road, Xinglong Subdistrict, Tianfu New Area, China (Sichuan) Pilot Free Trade Zone, Chengdu, Sichuan, China",
   phone:"+86 28 8515 7318", email:"webmaster@haitianshuiwu.com", website:"https://global.haitian603759.com/",
   desc:"Haitian Water Group Co., Ltd. (SSE: 603759) is a listed environmental and water utility company headquartered in Chengdu, China. The company provides integrated services covering water supply, wastewater treatment, environmental infrastructure investment, construction and operation. It has extensive experience in utility operations and has developed capabilities in smart water management, resource recycling, solid waste treatment and piped direct drinking water.",
   categories:["Water Supply & Wastewater Treatment","Water Utility Operation & Management","Environmental Infrastructure Investment","EPC / Project Construction","Solid Waste Treatment","Piped Direct Drinking Water","Smart Water & Digital Water Solutions"],
   certifications:"", projects:"", markets:""}
];


// Category icons and short labels
const catIconFor = c => {
  const t = c.toLowerCase();
  if (t.includes('smart') || t.includes('digital')) return 'fa-microchip';
  if (t.includes('drinking')) return 'fa-faucet-drip';
  if (t.includes('solid waste')) return 'fa-recycle';
  if (t.includes('epc') || t.includes('construction')) return 'fa-helmet-safety';
  if (t.includes('investment')) return 'fa-chart-line';
  if (t.includes('operation')) return 'fa-gears';
  return 'fa-droplet';
};
const catShort = {
  "Water Supply & Wastewater Treatment": "Water / Wastewater",
  "Water Utility Operation & Management": "Utility O&M",
  "Environmental Infrastructure Investment": "Infra Investment",
  "EPC / Project Construction": "EPC / Construction",
  "Solid Waste Treatment": "Solid Waste",
  "Piped Direct Drinking Water": "Drinking Water",
  "Smart Water & Digital Water Solutions": "Smart Water"
};
const catList = (s, short) => `<div class="cat-list">${s.categories.map(c => `<div class="cat-item" title="${esc(c)}"><i class="fa-solid ${catIconFor(c)}"></i><span>${esc(short && catShort[c] ? catShort[c] : c)}</span></div>`).join('')}</div>`;
const extraFields = s => [['Certifications', s.certifications], ['Key projects / references', s.projects], ['Markets served', s.markets]].filter(f => f[1]);
const esc = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const enquiryLink = s => `mailto:${s.email}?subject=${encodeURIComponent('Enquiry via WaterX Asia: ' + s.name)}`;

// Company cards
const grid = document.getElementById('supplierGrid');
function renderSuppliers(){
  grid.innerHTML = '';
  companies.forEach(s => {
    const card = document.createElement('div');
    card.className = 'supplier-card';
    card.innerHTML = `
      <img class="supplier-logo-img" src="${s.logo}" alt="${esc(s.name)} logo">
      <div class="supplier-top" style="margin-bottom:6px;">
        <div>
          <div class="supplier-name">${esc(s.name)}</div>
          <div class="supplier-loc"><i class="fa-solid fa-location-dot" style="margin-right:4px;"></i>${esc(s.loc)}</div>
        </div>
      </div>
      <div class="badges">
        ${s.listing ? `<span class="badge badge-en"><i class="fa-solid fa-chart-line"></i> ${esc(s.listing)}</span>` : ''}
        <span class="badge badge-en">EN profile</span>
      </div>
      <div class="sp-field">
        <div class="sp-label">Product / technology category</div>
        ${catList(s, true)}
      </div>
      ${extraFields(s).map(([label, val]) => `<div class="sp-field"><div class="sp-label">${label}</div><div class="sp-value">${esc(val)}</div></div>`).join('')}
      <div class="card-foot">
        <a class="btn btn-primary btn-sm" href="${enquiryLink(s)}"><i class="fa-solid fa-envelope"></i> Enquire</a>
        <button class="btn btn-ghost btn-sm view-profile">View profile</button>
      </div>`;
    card.querySelector('.view-profile').addEventListener('click', () => openModal(s));
    grid.appendChild(card);
  });
}
renderSuppliers();

// View profile pop-up
const overlay = document.getElementById('modalOverlay');
function openModal(s){
  document.getElementById('modalTitle').textContent = s.name;
  document.getElementById('modalDesc').textContent = s.desc;
  document.getElementById('modalProducts').innerHTML = catList(s);
  document.getElementById('modalExtra').innerHTML = extraFields(s).map(([label, val]) => `<h4>${label}</h4><p>${esc(val)}</p>`).join('');
  document.getElementById('modalContact').innerHTML = `
    <div><i class="fa-solid fa-location-dot"></i>${esc(s.address)}</div>
    <div><i class="fa-solid fa-phone"></i><a href="tel:${s.phone.replace(/\s/g,'')}">${esc(s.phone)}</a></div>
    <div><i class="fa-solid fa-envelope"></i><a href="mailto:${s.email}">${esc(s.email)}</a></div>
    <div><i class="fa-solid fa-globe"></i><a href="${s.website}" target="_blank" rel="noopener noreferrer">${esc(s.website)}</a></div>`;
  document.getElementById('modalEnquire').href = enquiryLink(s);
  document.getElementById('modalWebsite').href = s.website;
  overlay.classList.add('open');
}
document.getElementById('modalClose').addEventListener('click', () => overlay.classList.remove('open'));
overlay.addEventListener('click', e => { if(e.target === overlay) overlay.classList.remove('open'); });

