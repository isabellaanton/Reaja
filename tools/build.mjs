#!/usr/bin/env node
/*
 * Gera as páginas HTML (pt/ en/), sitemap.xml e robots.txt.
 * Cada página recebe <title>, description, canonical, hreflang, Open Graph e JSON-LD próprios
 * (o corpo continua sendo renderizado por assets/app.js).
 *
 *   node tools/build.mjs                       # usa https://reajaa.vercel.app
 *   SITE_URL=https://meudominio.com.br node tools/build.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = (process.env.SITE_URL || 'https://reajaa.vercel.app').replace(/\/$/, '');
const V = '5'; // versão dos assets (cache busting)

const ctx = {}; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['data/disasters.js', 'data/i18n.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const LIST = ctx.REAJA_DISASTERS, T = ctx.REAJA_TEXT;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const fill = (t, n) => t.replace('{name}', n);
const LOC = { pt: 'pt-BR', en: 'en' };

function pagesFor(lang) {
  const t = T[lang];
  const out = [{ path: '', title: t.homeTitle, desc: t.intro, type: 'home' }, { path: 'sobre/', title: `${t.aboutTitle} — Reaja`, desc: t.aboutText, type: 'about' }];
  for (const d of LIST) {
    const name = lang === 'pt' ? d.pt : d.en;
    out.push({ path: d.slug + '/', title: fill(t.metaTitle, name), desc: fill(t.metaDesc, name), type: 'disaster', name });
  }
  return out;
}

function jsonLd(lang, p) {
  const url = `${SITE}/${lang}/${p.path}`;
  const base = { '@context': 'https://schema.org', inLanguage: LOC[lang] };
  if (p.type === 'home') return [{ ...base, '@type': 'WebSite', name: 'Reaja', url, description: p.desc }];
  const crumbs = [{ name: 'Reaja', url: `${SITE}/${lang}/` }, { name: p.type === 'about' ? T[lang].aboutTitle : p.name, url }];
  return [
    { ...base, '@type': 'WebPage', name: p.title, description: p.desc, url, isPartOf: { '@type': 'WebSite', name: 'Reaja', url: `${SITE}/${lang}/` } },
    { ...base, '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })) }
  ];
}

function html(lang, p) {
  const other = lang === 'pt' ? 'en' : 'pt';
  const url = (l) => `${SITE}/${l}/${p.path}`;
  return `<!doctype html>
<html lang="${LOC[lang]}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<meta name="theme-color" content="#a9232d">
<link rel="canonical" href="${url(lang)}">
<link rel="alternate" hreflang="${LOC[lang]}" href="${url(lang)}">
<link rel="alternate" hreflang="${LOC[other]}" href="${url(other)}">
<link rel="alternate" hreflang="x-default" href="${url('pt')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Reaja">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${url(lang)}">
<meta property="og:image" content="${SITE}/assets/reaja-app-512.png">
<meta name="twitter:card" content="summary">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/assets/reaja-app-192.png" type="image/png">
<link rel="preconnect" href="https://api.fontshare.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=chillax@400,500,600,700&f[]=clash-grotesk@400,500,600,700&f[]=tanker@400&display=swap">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap">
<link rel="stylesheet" href="/assets/site.css?v=${V}">
<script>try{let t=localStorage.getItem('reaja-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}</script>
${jsonLd(lang, p).map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:24px">Reaja: ative o JavaScript para ver as orientações. Emergência: Defesa Civil 199 · Bombeiros 193 · SAMU 192 · Polícia 190.</p></noscript>
<script src="/data/disasters.js?v=${V}"></script>
<script src="/data/i18n.js?v=${V}"></script>
<script src="/data/content.js?v=${V}"></script>
<script src="/assets/filter.js?v=${V}"></script>
<script src="/assets/app.js?v=${V}"></script>
</body>
</html>
`;
}

const urls = [];
for (const lang of ['pt', 'en']) {
  for (const p of pagesFor(lang)) {
    const dir = path.join(ROOT, lang, p.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), html(lang, p));
    urls.push(`${SITE}/${lang}/${p.path}`);
  }
}
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`ok: ${urls.length} páginas, sitemap.xml e robots.txt (${SITE})`);
