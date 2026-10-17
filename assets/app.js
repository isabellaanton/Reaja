/* Reaja — renderização das páginas (início, desastre, sobre). Sem dependências. */
(function () {
  'use strict';

  const list = window.REAJA_DISASTERS;
  const T = window.REAJA_TEXT;
  const CONTENT = window.REAJA_CONTENT || {};
  const parts = location.pathname.split('/').filter(Boolean);
  const lang = parts[0] === 'en' ? 'en' : 'pt';
  const txt = T[lang];
  const slug = parts[1];
  const isAbout = slug === 'sobre';
  const app = document.getElementById('app');
  const CATEGORIES = ['hydric', 'geologic', 'weather', 'climate', 'technological'];
  const PDF_BASE = 'https://www.gov.br/mdr/pt-br/assuntos/protecao-e-defesa-civil/';
  const SOURCE_PAGE = PDF_BASE + 'informacoes-uteis/saiba-como-agir';
  const HERO_ART = ['inundacoes', 'incendios-florestais', 'tornados', 'deslizamentos'];

  try { localStorage.setItem('reaja-lang', lang); } catch (e) { /* storage bloqueado */ }

  /* ── helpers ─────────────────────────────────────────────────────────── */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fill = (tpl, name) => tpl.replace('{name}', name);
  const label = (d) => (lang === 'pt' ? d.pt : d.en);
  const catLabel = (d) => txt[d.category] || txt.climate;
  const pdfUrl = (d) => (/^https?:/.test(d.pdf) ? d.pdf : PDF_BASE + encodeURIComponent(d.pdf));
  const icon = (id, cls) => `<svg class="icon ${cls || ''}" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#${id}"/></svg>`;
  const art = (d, cls, eager) =>
    `<img class="${cls}" src="/assets/illustrations/${d.slug}.svg" alt="" width="400" height="300" decoding="async"${eager ? '' : ' loading="lazy"'}>`;
  const bySlug = (s) => list.find((d) => d.slug === s);

  function setMeta(title, desc) {
    document.title = title;
    const m = document.querySelector('meta[name="description"]');
    if (m) m.content = desc;
  }

  /* ── blocos de layout ────────────────────────────────────────────────── */
  function header() {
    return `<a class="skip" href="#main">${txt.skip}</a>
<header class="header"><div class="shell headrow">
  <a class="logo" href="/${lang}/" aria-label="Reaja — ${txt.home}"><img src="/assets/reaja-wordmark.png" alt="" width="168" height="34"></a>
  <nav class="nav" aria-label="${txt.nav}"><a href="/${lang}/"${!slug ? ' aria-current="page"' : ''}>${txt.home}</a><a href="/${lang}/sobre/"${isAbout ? ' aria-current="page"' : ''}>${txt.about}</a></nav>
  <div class="controls">
    <label class="sr-only" for="lang">${txt.language}</label>
    <select id="lang" class="control"><option value="pt"${lang === 'pt' ? ' selected' : ''}>PT-BR</option><option value="en"${lang === 'en' ? ' selected' : ''}>EN</option></select>
    <button id="theme" class="control" type="button" aria-label="${txt.theme}">${document.documentElement.dataset.theme === 'dark' ? '☾' : '☀'}</button>
    <a class="btn btn-sm hide-sm" href="tel:199">${icon('phone')}${txt.defense} 199</a>
  </div>
</div></header>`;
  }

  function emergency() {
    return `<aside class="emergency" aria-label="${txt.call}"><div class="shell emrow"><strong>${txt.call}</strong>
<a href="tel:199">${txt.defense} 199</a><a href="tel:193">${txt.fire} 193</a><a href="tel:192">${txt.ambulance} 192</a><a href="tel:190">${txt.police} 190</a><a class="sms" href="sms:40199">SMS 40199</a></div></aside>`;
  }

  function footer() {
    return `<footer class="footer"><div class="shell footgrid">
  <div class="footbrand"><span class="footlogo"><img src="/assets/reaja-wordmark.png" alt="Reaja" width="150" height="31" loading="lazy"></span>
    <p><strong>${txt.footer}</strong></p><p>${txt.warning}</p></div>
  <div><h2>${txt.footerNav}</h2><ul><li><a href="/${lang}/">${txt.home}</a></li><li><a href="/${lang}/sobre/">${txt.about}</a></li><li><a href="${SOURCE_PAGE}" rel="noopener">${txt.sources}</a></li></ul></div>
  <div><h2>${txt.footerContacts}</h2><ul><li><a href="tel:199">${txt.defense} 199</a></li><li><a href="tel:193">${txt.fire} 193</a></li><li><a href="tel:192">${txt.ambulance} 192</a></li><li><a href="tel:190">${txt.police} 190</a></li><li><a href="sms:40199">SMS 40199</a></li></ul></div>
</div>
<div class="shell footbase"><p>${txt.source} · <a href="${SOURCE_PAGE}" rel="noopener">${txt.sources}</a></p><p>${txt.offline}</p></div></footer>`;
  }

  function card(d) {
    const note = lang === 'en' ? '[VERIFY] Official safety guidance has not been translated. See the Portuguese source.' : txt.access;
    return `<a class="card" href="/${lang}/${d.slug}/" style="--accent:${d.color}">
  <span class="cardart">${art(d, 'illus')}</span>
  <span class="cardbody"><span class="pill">${catLabel(d)}</span><h3>${label(d)}</h3><p>${note}</p><span class="more">${txt.open} ${icon('arrow')}</span></span></a>`;
  }

  /* ── início ──────────────────────────────────────────────────────────── */
  function home() {
    setMeta(txt.homeTitle, txt.intro);
    const heroTitle = txt.hero.replace(/(acontecendo|happening)/i, '<em>$1</em>');
    const mosaic = HERO_ART.map((s) => bySlug(s)).filter(Boolean).map((d) => art(d, 'mosaic-img', true)).join('');
    const chips = ['all'].concat(CATEGORIES).map((c) =>
      `<button class="chip" type="button" data-cat="${c}" aria-pressed="${c === 'all'}">${c === 'all' ? txt.all : txt[c]} <span class="chip-n">${c === 'all' ? list.length : ''}</span></button>`).join('');

    return `<main id="main">
<section class="hero"><div class="shell herogrid">
  <div class="hero-copy">
    <p class="eyebrow">${lang === 'pt' ? 'Proteção e Defesa Civil' : 'Civil Protection'}</p>
    <h1>${heroTitle}</h1>
    <p class="lead">${txt.intro}</p>
    <div class="actions"><a class="btn" href="#busca">${icon('search')}${txt.search}</a><a class="btn btn-dark" href="tel:199">${icon('phone')}${txt.defense} 199</a></div>
  </div>
  <div class="hero-art" aria-hidden="true"><div class="mosaic">${mosaic}</div><span class="badge"><img src="/assets/reaja-symbol.png" alt="" width="72" height="83"></span></div>
</div></section>

<section class="stats" aria-label="Reaja"><div class="shell statsgrid">
  <div><strong>${list.length}</strong><span>${txt.statTopics}</span></div>
  <div><strong>${CATEGORIES.length}</strong><span>${txt.statCats}</span></div>
  <div><strong>40199</strong><span>${txt.statSms}</span></div>
</div></section>

<section class="section" id="busca"><div class="shell">
  <header class="sechead"><p class="eyebrow">${txt.categories}</p><h2>${txt.search}</h2><p>${txt.searchHint}</p></header>
  <div class="finder">
    <div class="searchbox">${icon('search')}
      <label class="sr-only" for="search">${txt.search}</label>
      <input class="search" type="search" id="search" placeholder="${txt.search}" autocomplete="off" enterkeyhint="search">
      <button class="clearbtn" id="search-clear" type="button" aria-label="${txt.clear}" hidden>×</button></div>
    <div class="chips" role="group" aria-label="${txt.filter}">${chips}</div>
  </div>
  <p id="count" class="count" role="status" aria-live="polite"></p>
  <div class="grid" id="grid" aria-label="${txt.categories}"></div>
  <div class="empty" id="empty" hidden><h3>${txt.noResults}</h3><p>${txt.noResultsHint}</p><button class="btn btn-sm" id="reset" type="button">${txt.reset}</button></div>
</div></section>

<section class="section alt"><div class="shell">
  <header class="sechead"><p class="eyebrow">${txt.prepare}</p><h2>${txt.prepare}</h2></header>
  <div class="prepgrid">
    <article class="prep"><span class="prepicon">${icon('kit')}</span><h3>${txt.kit}</h3><p>${txt.kitText}</p></article>
    <article class="prep"><span class="prepicon">${icon('plan')}</span><h3>${txt.plan}</h3><p>${txt.planText}</p></article>
  </div>
</div></section>

<section class="section"><div class="shell"><div class="cta">
  <div><h2>${txt.alertTitle}</h2><p>${txt.sms}</p></div>
  <a class="btn btn-yellow" href="sms:40199">${icon('alert')}${txt.alertBtn}</a>
</div></div></section>
</main>`;
  }

  /* ── desastre ────────────────────────────────────────────────────────── */
  function related(d) {
    const map = {
      'chuvas-intensas': ['enxurradas', 'alagamentos', 'inundacoes'], alagamentos: ['chuvas-intensas', 'enxurradas', 'inundacoes'],
      enxurradas: ['chuvas-intensas', 'alagamentos', 'inundacoes'], inundacoes: ['chuvas-intensas', 'alagamentos', 'enxurradas'],
      'baixa-umidade': ['incendios-florestais', 'ondas-de-calor'], granizo: ['vendavais', 'tornados'], vendavais: ['tornados', 'granizo']
    };
    const picked = (map[d.slug] || []).map(bySlug).filter(Boolean);
    return picked.length ? picked : list.filter((x) => x.slug !== d.slug).slice(0, 3);
  }

  const steps = (items) => `<ol class="steps">${items.map((x) => `<li>${esc(x)}</li>`).join('')}</ol>`;

  function phase(key, items, n) {
    return `<details class="phase phase-${key}" id="${key}" open>
  <summary><span class="phase-n" aria-hidden="true">${n}</span><h3>${txt[key]}</h3><span class="phase-count">${items.length}</span>${icon('chev', 'chev')}</summary>
  <div class="phase-body">${steps(items)}</div></details>`;
  }

  function guidance(d) {
    const c = (CONTENT[d.slug] || {}).pt;
    const hasPhases = c && ((c.before || []).length || (c.during || []).length || (c.after || []).length);
    if (!hasPhases) {
      return `<section class="section" id="orientacoes"><div class="shell"><div class="fallback">
  <span class="prepicon">${icon('alert')}</span>
  <div><h2>${txt.fallbackTitle}</h2><p>${lang === 'pt' ? txt.officialText : txt.verifiedText}</p></div>
  <a class="btn" href="${pdfUrl(d)}" target="_blank" rel="noopener">${txt.pdf} ↗</a></div></div></section>`;
    }
    const phases = [['before', c.before], ['during', c.during], ['after', c.after]].filter((p) => p[1] && p[1].length);
    const jump = phases.map((p) => `<a href="#${p[0]}">${txt[p[0]]}</a>`).join('');
    const extra = (c.extra || []).map((e) => `<section class="block"><h3>${esc(e.title)}</h3>${steps(e.items)}</section>`).join('');
    const general = (c.general || []).length ? `<section class="block"><h3>${txt.general}</h3>${steps(c.general)}</section>` : '';
    return `<section class="section" id="orientacoes"><div class="shell">
  <header class="sechead"><p class="eyebrow">${txt.guidanceEyebrow}</p><h2>${txt.guidanceTitle}</h2>
    <p>${txt.guidanceSource}${txt.guidanceLang ? ' ' + txt.guidanceLang : ''}</p>
    <nav class="jump" aria-label="${txt.jump}">${jump}</nav></header>
  <div class="phasegrid" lang="pt-BR">${phases.map((p, i) => phase(p[0], p[1], i + 1)).join('')}</div>
  ${general || extra ? `<div class="blocks" lang="pt-BR">${general}${extra}</div>` : ''}
  <p class="srcline"><a href="${pdfUrl(d)}" target="_blank" rel="noopener">${txt.pdfFull} ↗</a> · ${txt.source}</p>
</div></section>`;
  }

  function disaster(d) {
    const name = label(d);
    setMeta(fill(txt.metaTitle, name), fill(txt.metaDesc, name));
    const c = (CONTENT[d.slug] || {}).pt;
    const avoid = c && c.avoid && c.avoid.length ? steps(c.avoid) : `<p>${txt.notdoText}</p>`;
    return `<main id="main">
<section class="dhero"><div class="shell dgrid">
  <div>
    <a class="crumb" href="/${lang}/">← ${txt.back}</a>
    <span class="pill pill-lg" style="--accent:${d.color}">${icon(d.icon)}${catLabel(d)}</span>
    <h1>${name}</h1>
    <p class="lead">${lang === 'pt' ? txt.access : txt.verifiedText}</p>
    <div class="actions"><a class="btn" href="${pdfUrl(d)}" target="_blank" rel="noopener">${txt.pdf} ↗</a>
      <button class="btn btn-ghost" id="print" type="button">${txt.print}</button><button class="btn btn-ghost" id="share" type="button">${txt.share}</button></div>
    <p class="srcline"><strong>${txt.source}</strong></p>
  </div>
  ${art(d, 'detail-illus', true)}
</div></section>
${guidance(d)}
<section class="section alt"><div class="shell">
  <aside class="callout"><h2>${icon('alert')}${txt.notdo}</h2>${avoid}</aside>
  <p class="notice">${txt.warning}</p>
  <h2 class="relhead">${txt.related}</h2><div class="grid">${related(d).map(card).join('')}</div>
</div></section>
</main>`;
  }

  function about() {
    setMeta(`${txt.aboutTitle} — Reaja`, txt.aboutText);
    return `<main id="main"><section class="dhero"><div class="shell"><a class="crumb" href="/${lang}/">← ${txt.back}</a><h1>${txt.aboutTitle}</h1><p class="lead">${txt.aboutText}</p></div></section>
<section class="section"><div class="shell prose"><h2>${txt.sources}</h2><p>${txt.license}</p><p>${txt.warning}</p>
<p>${txt.source}: <a href="${SOURCE_PAGE}">Sedec/MIDR — Saiba como agir</a></p>
<h2>${txt.call}</h2><p class="calls"><a class="btn btn-sm" href="tel:199">${txt.defense} 199</a><a class="btn btn-sm" href="tel:193">${txt.fire} 193</a><a class="btn btn-sm" href="tel:192">${txt.ambulance} 192</a><a class="btn btn-sm" href="tel:190">${txt.police} 190</a></p><p>${txt.sms}</p></div></section></main>`;
  }

  function notFound() {
    return `<main id="main"><section class="section"><div class="shell prose"><h1>${txt.notfound}</h1><a class="btn" href="/${lang}/">${txt.back}</a></div></section></main>`;
  }

  /* ── montagem ────────────────────────────────────────────────────────── */
  const current = slug && !isAbout ? bySlug(slug) : null;
  const body = isAbout ? about() : slug ? (current ? disaster(current) : notFound()) : home();
  app.innerHTML = header() + body + footer() + emergency();

  document.getElementById('lang').addEventListener('change', (e) => {
    try { localStorage.setItem('reaja-lang', e.target.value); } catch (err) { /* ignore */ }
    location.href = location.pathname.replace(/^\/(pt|en)(?=\/|$)/, '/' + e.target.value);
  });
  document.getElementById('theme').addEventListener('click', () => {
    const n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = n;
    try { localStorage.setItem('reaja-theme', n); } catch (e) { /* ignore */ }
    document.getElementById('theme').textContent = n === 'dark' ? '☾' : '☀';
  });
  document.getElementById('print')?.addEventListener('click', () => print());
  window.addEventListener('beforeprint', () => document.querySelectorAll('details.phase').forEach((x) => { x.open = true; }));
  document.getElementById('share')?.addEventListener('click', async () => {
    const data = { title: document.title, text: txt.shareText, url: location.href };
    if (navigator.share) { try { await navigator.share(data); } catch (e) { /* cancelado */ } }
    else location.href = 'https://wa.me/?text=' + encodeURIComponent(data.title + ' ' + data.url);
  });

  if (!slug) {
    window.ReajaFilter.mount({ list, labels: { pt: T.pt, en: T.en }, renderCard: card, text: txt });
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(() => {});
})();
