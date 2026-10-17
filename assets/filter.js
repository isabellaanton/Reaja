/*
 * Reaja — busca e filtro por categoria.
 *
 * Correção do bug original: o filtro antigo só alternava o atributo `hidden` nos cards, mas o CSS
 * `.card { display:block }` sobrescrevia `[hidden]`, então a lista nunca mudava (só o contador).
 * Agora existe um único estado { q, cat } e a lista é re-renderizada a partir dele.
 *
 * Uso: ReajaFilter.mount({ list, labels, renderCard, text }) — veja app.js.
 */
(function (root) {
  'use strict';

  /** minúsculas e sem acentos: "Inundações" casa com "inundacoes" */
  function norm(s) {
    return String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  /** texto pesquisável de um desastre: nomes PT/EN, slug e nome da categoria nos dois idiomas */
  function haystack(d, labels) {
    return norm([d.pt, d.en, d.slug.replace(/-/g, ' '), labels.pt[d.category], labels.en[d.category]].join(' '));
  }

  /** todos os termos digitados precisam aparecer (ordem livre) */
  function filterDisasters(list, state, labels) {
    const terms = norm(state.q).split(/\s+/).filter(Boolean);
    return list.filter(function (d) {
      if (state.cat && state.cat !== 'all' && d.category !== state.cat) return false;
      if (!terms.length) return true;
      const h = haystack(d, labels);
      return terms.every(function (t) { return h.includes(t); });
    });
  }

  function readUrl(categories) {
    const p = new URLSearchParams(location.search);
    const cat = p.get('cat');
    return { q: p.get('q') || '', cat: categories.indexOf(cat) > -1 ? cat : 'all' };
  }

  function writeUrl(state) {
    try {
      const p = new URLSearchParams();
      if (state.q.trim()) p.set('q', state.q.trim());
      if (state.cat !== 'all') p.set('cat', state.cat);
      const qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    } catch (e) { /* ambiente sem History API: ignora */ }
  }

  function mount(opts) {
    const els = {
      search: document.getElementById('search'),
      clear: document.getElementById('search-clear'),
      grid: document.getElementById('grid'),
      count: document.getElementById('count'),
      empty: document.getElementById('empty'),
      reset: document.getElementById('reset'),
      chips: Array.prototype.slice.call(document.querySelectorAll('.chip[data-cat]'))
    };
    if (!els.search || !els.grid) return null;

    const categories = els.chips.map(function (c) { return c.dataset.cat; }).filter(function (c) { return c !== 'all'; });
    const state = readUrl(categories);
    els.search.value = state.q;

    function update() {
      const result = filterDisasters(opts.list, state, opts.labels);
      els.grid.innerHTML = result.map(opts.renderCard).join('');
      els.grid.hidden = result.length === 0;
      els.empty.hidden = result.length !== 0;
      els.count.textContent = result.length + ' ' + (result.length === 1 && opts.text.result1 ? opts.text.result1 : opts.text.results);
      els.clear.hidden = !state.q;

      // contagem por categoria considerando só o texto digitado
      els.chips.forEach(function (chip) {
        const cat = chip.dataset.cat;
        const n = filterDisasters(opts.list, { q: state.q, cat: cat }, opts.labels).length;
        chip.setAttribute('aria-pressed', String(state.cat === cat));
        chip.querySelector('.chip-n').textContent = n;
      });
      writeUrl(state);
    }

    els.search.addEventListener('input', function (e) { state.q = e.target.value; update(); });
    els.search.addEventListener('keydown', function (e) { if (e.key === 'Escape' && state.q) { state.q = ''; els.search.value = ''; update(); } });
    els.clear.addEventListener('click', function () { state.q = ''; els.search.value = ''; update(); els.search.focus(); });
    els.chips.forEach(function (chip) {
      chip.addEventListener('click', function () { state.cat = chip.dataset.cat; update(); });
    });
    els.reset.addEventListener('click', function () { state.q = ''; state.cat = 'all'; els.search.value = ''; update(); els.search.focus(); });

    update();
    return { state: state, update: update };
  }

  const api = { norm: norm, filterDisasters: filterDisasters, mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ReajaFilter = api;
})(typeof window !== 'undefined' ? window : globalThis);
