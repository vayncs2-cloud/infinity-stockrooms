/* ── views ── */
let VIEW = null;          // { tick(fresh), destroy() }
function setView(v){ VIEW = v || {}; }

/* ── router: real paths; the server returns the same shell for every route ── */
function route(){
  if (VIEW && VIEW.destroy) VIEW.destroy();
  VIEW = null;
  const p = location.pathname.replace(/\/+$/, '') || '/';
  const seg = p.split('/').filter(Boolean).map(x => { try { return decodeURIComponent(x); } catch(e){ return x; } });
  const nav = seg[0] === 'stock' ? 'floor' : (seg[0] === 'dream' || seg[0] === 'session' || seg[0] === 'dreams') ? 'archive' : (seg[0] || 'home');
  $$('[data-nav]').forEach(a => a.dataset.nav === nav ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.body.dataset.page = nav;
  const titled = s => document.title = s ? `${s} · Infinite Stockrooms` : 'Infinite Stockrooms';
  if (p === '/'){ titled(); Home(); }
  else if (p === '/live'){ titled('Live'); Live(); }
  else if (p === '/floor'){ titled('The floor'); Floor(); }
  else if (p === '/archive' || p === '/dreams'){ if (p === '/dreams') history.replaceState(null, '', '/archive' + location.search); const v = new URLSearchParams(location.search).get('view'); titled(v === 'originals' ? 'Original dreams' : v === 'search' ? 'Search the transcripts' : 'The archive'); Archive(); }
  else if (p === '/lore'){ titled('Lore'); Lore(); }
  else if (seg[0] === 'stock' && seg.length === 2){ const t = seg[1].toUpperCase().replace(/^\$/, ''); titled(STOCK[t] ? `$${t}, ${STOCK[t].epithet}` : 'No such mind'); Stock(t); }
  else if (seg[0] === 'dream' && seg.length === 2){ const d = DREAM[seg[1]]; titled(d ? `${d.scenario}: ${vs(d).replace(/&#39;/g, "'")}` : 'No such dream'); Dream(seg[1]); }
  else if (seg[0] === 'session' && seg.length === 2 && /^\d+$/.test(seg[1])){ titled('Session #' + fmt(+seg[1])); Session(+seg[1]); }
  else { titled('No such room'); NotFound(); }
  if (!VIEW) VIEW = {};
}
function scrollToHash(){
  const h = location.hash.slice(1), el = h && document.getElementById(h);
  if (!el) return false;
  el.scrollIntoView({ block: 'start' });
  if (el.classList.contains('msg')){ $$('.msg.hl').forEach(m => m.classList.remove('hl')); el.classList.add('hl'); }
  return true;
}
function go(url, replace){
  history[replace ? 'replaceState' : 'pushState'](null, '', url);
  route();
  if (!scrollToHash()) window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download') || a.hasAttribute('data-native')) return;
  const u = new URL(a.href, location.href);
  if (u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/logos/')) return;
  e.preventDefault();
  if (u.pathname === location.pathname && u.search === location.search && u.hash){
    history.pushState(null, '', u.hash); scrollToHash(); return;
  }
  go(u.pathname + u.search + u.hash);
  $('#view').focus({ preventScroll: true });
});
addEventListener('popstate', () => { route(); scrollToHash(); });

/* legacy links: /#c1784000000 -> /dream/c1784000000 */
if (/^#c\d+$/.test(location.hash) && location.pathname === '/') history.replaceState(null, '', '/dream/' + location.hash.slice(1));

/* sound needs a gesture before it can play; the first tap anywhere unlocks it if it was left on */
addEventListener('pointerdown', () => Sound.unlock(), { once: true });

renderChrome(); tape(); tickChrome();
route();
if (location.hash) setTimeout(scrollToHash, 0);

/* one clock for the whole floor */
let lastB = SIM.broadcastIndex;
setInterval(() => {
  const fresh = SIM.advanceTo(Date.now());
  tickChrome();
  if (SIM.broadcastIndex !== lastB || fresh.length){ lastB = SIM.broadcastIndex; tape(); }
  if (VIEW && VIEW.tick) VIEW.tick(fresh);
}, 1000);
