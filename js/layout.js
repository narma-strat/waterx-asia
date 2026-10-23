/* Header and footer (edit menu and footer links here) */
(function(){
  const page = document.body.dataset.page || 'home';
  const home = page === 'home';
  const ext = 'target="_blank" rel="noopener noreferrer"';
  const extIcon = ' <i class="fa-solid fa-arrow-up-right-from-square"></i>';

  // Link to a section or tab
  function homeLink(cls, label, section, tab){
    if (home) {
      return tab
        ? `<a class="${cls}" href="#${section}" onclick="goTo('${section}','${tab}');return false;">${label}</a>`
        : `<a class="${cls}" href="#${section}">${label}</a>`;
    }
    return `<a class="${cls}" href="index.html#${tab || section}">${label}</a>`;
  }

  const brand = home
    ? `<a href="#" class="brand" onclick="window.scrollTo({top:0,behavior:'smooth'});return false;" aria-label="WaterX Asia, back to top">`
    : `<a href="index.html" class="brand" aria-label="WaterX Asia home">`;

  // Header
  const header = `
<header>
  <div class="wrap nav">
    ${brand}
      <div class="brand-mark">AW</div>
      <div>
        <div class="brand-name">WaterX Asia</div>
        <div class="brand-tag">Water in Asia</div>
      </div>
    </a>
    <nav class="links">
      ${homeLink('', 'Insights', 'insights')}
      ${homeLink('', 'Commercial', 'commercial')}
      <a href="https://ai.shuiwujia.com/" ${ext}>WaterPlus AI</a>
      ${homeLink('', 'About', 'about')}
    </nav>
    <div style="display:flex;align-items:center;gap:12px;">
      <a href="login.html" class="btn btn-ghost btn-sm"><i class="fa-solid fa-right-to-bracket"></i> Login</a>
      ${home
        ? `<a href="#commercial" onclick="goTo('commercial','list');return false;" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> List your company</a>`
        : `<a href="index.html#list" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> List your company</a>`}
      <!-- Language switch: display only for now, no translation is applied -->
      <div class="lang-switch" role="group" aria-label="Language" title="English / Chinese versions">
        <i class="fa-solid fa-globe"></i>
        <button type="button" class="active">EN</button>
        <button type="button">中文</button>
      </div>
    </div>
  </div>
</header>`;

  // Footer
  const footer = `
<footer>
  <div class="wrap">
    <div class="foot-brand">
      <div class="brand-name" style="color:#fff;">WaterX Asia</div>
      <div class="brand-tag" style="color:#6E8C9B;">A WaterPlus × STRATEGY369 collaboration</div>
    </div>

    <div class="foot-group">
      <div class="foot-label">About</div>
      <div class="foot-cols">
        <div>
          ${homeLink('foot-head', 'About WaterX Asia', 'about')}
          ${homeLink('foot-link', 'What we do', 'about')}
          ${homeLink('foot-link', 'Why it matters', 'about')}
          ${homeLink('foot-link', 'How we work', 'about')}
        </div>
        <div>
          <span class="foot-head">Partners</span>
          <a class="foot-link" href="https://web.shuiwujia.com/" ${ext}>WaterPlus${extIcon}</a>
          <a class="foot-link" href="https://strat369.com.my/" ${ext}>STRATEGY369 Consulting${extIcon}</a>
          <a class="foot-link" href="https://ai.shuiwujia.com/" ${ext}>WaterPlus AI${extIcon}</a>
        </div>
      </div>
    </div>

    <div class="foot-group">
      <div class="foot-label">Insights</div>
      <div class="foot-cols">
        <div>
          ${homeLink('foot-head', 'Opportunities', 'insights', 'opportunities')}
          ${homeLink('foot-link', 'Water Supply (Upstream to Midstream)', 'insights', 'opportunities')}
          ${homeLink('foot-link', 'Customer / End-Use', 'insights', 'opportunities')}
          ${homeLink('foot-link', 'Wastewater Management', 'insights', 'opportunities')}
          ${homeLink('foot-link', 'Cross-Cutting Enablers', 'insights', 'opportunities')}
        </div>
        <div>
          ${homeLink('foot-head', 'News', 'insights', 'news')}
          ${homeLink('foot-link', 'SPAN tenders Selangor membrane upgrade', 'insights', 'news')}
          ${homeLink('foot-link', 'MEE tightens discharge standards', 'insights', 'news')}
          ${homeLink('foot-link', 'Vietnam PPP adds desalination', 'insights', 'news')}
          ${homeLink('foot-link', 'Jakarta tariff roadmap', 'insights', 'news')}
        </div>
        <div>
          ${homeLink('foot-head', 'Data &amp; research', 'insights', 'dashboard')}
          ${homeLink('foot-link', 'ASEAN KPI dashboard', 'insights', 'dashboard')}
          ${homeLink('foot-link', 'Country scorecard', 'insights', 'dashboard')}
          ${homeLink('foot-link', 'Investment pipeline mix', 'insights', 'dashboard')}
          ${homeLink('foot-link', 'Benchmark gauges', 'insights', 'dashboard')}
        </div>
        <div>
          ${homeLink('foot-head', 'Thought leadership', 'insights', 'leadership')}
          ${homeLink('foot-link', "China's National Water Network", 'insights', 'leadership')}
          ${homeLink('foot-link', 'Shanghai Digital Water Summit 2026', 'insights', 'leadership')}
          ${homeLink('foot-link', 'How AI will reshape water', 'insights', 'leadership')}
          ${homeLink('foot-link', "China's Decree 831 water reset", 'insights', 'leadership')}
        </div>
      </div>
    </div>

    <div class="foot-group">
      <div class="foot-label">Commercial</div>
      <div class="foot-cols">
        <div>
          ${homeLink('foot-head', 'Company profiles', 'commercial', 'profiles')}
          ${homeLink('foot-link', 'Haitian Water Group', 'commercial', 'profiles')}
          ${homeLink('foot-link', 'List your company', 'commercial', 'list')}
        </div>
        <div>
          ${homeLink('foot-head', 'M&amp;A and partnerships', 'commercial', 'mna')}
          ${homeLink('foot-link', 'Stake sale or acquisition', 'commercial', 'mna')}
          ${homeLink('foot-link', 'Joint venture or partnership', 'commercial', 'mna')}
          ${homeLink('foot-link', 'Submit an opportunity', 'commercial', 'mna')}
        </div>
      </div>
    </div>

    <div class="foot-note">© 2026 WaterX Asia. A WaterPlus × STRATEGY369 collaboration.</div>
  </div>
</footer>`;

  // Add to page
  const h = document.getElementById('site-header');
  const f = document.getElementById('site-footer');
  if (h) h.outerHTML = header;
  if (f) f.outerHTML = footer;

  // EN / 中文 switch (display only)
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
    });
  });
})();
