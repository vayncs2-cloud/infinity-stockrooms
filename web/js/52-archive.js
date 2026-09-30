/* ── the archive: every aired session, the original dreams they are cut from, and a search through every word ── */
const bloodOf = d => { const v = verdict(d); return Math.max(0, v.da) + Math.max(0, v.db); };
function poster(d, onAir){
  const [a, b] = d.actors;
  return `<a class="poster${onAir ? ' airing' : ''}" href="/dream/${d.id}" style="${pairColors(d)}">
    <div class="cover"><div class="cv-s">${sigilSVG(a)}${sigilSVG(b)}</div>
      <div class="cv-l">${logo(a, 34)}${logo(b, 34)}</div><span class="cv-n">No. ${esc(d.n)}</span>
      ${onAir ? '<span class="oa chip red"><i class="rec"></i>on air</span>' : ''}
      <span class="cv-t">${esc(d.scenario)}</span></div>
    <div class="pb"><div class="who"><b>$${esc(a)}</b> vs <b>$${esc(b)}</b> · ${dshort(d.ts)}</div>
      <div class="st3"><span><b>${d.turns}</b> turns</span><span><b>${d.timeline.length}</b> moves</span><span><b>${fmt(views(d))}</b> reads</span><span>aired <b>${fmt(E.aired(d.id, Date.now()))}×</b></span></div>
      ${vdHTML(d)}</div></a>`;
}

function Archive(){
  const q = new URLSearchParams(location.search);
  const tab = ['originals', 'search'].includes(q.get('view')) ? q.get('view') : 'aired';
  let sortBy = q.get('sort') || 'popular', scen = q.get('scenario') || 'all', stk = (q.get('stock') || 'all').toUpperCase(), text = q.get('q') || '';
  if (stk === 'ALL') stk = 'all';
  if (!['popular', 'recent', 'blood'].includes(sortBy)) sortBy = 'popular';
  let shown = 60, fresh = null, searchShown = 30;
  const scens = [...new Set(DREAMS.map(d => d.scenario))].sort();
  const match = d => (scen === 'all' || d.scenario === scen) && (stk === 'all' || d.actors.includes(stk) || d.events.some(e => e.ticker === stk))
    && (!text || tab === 'search' || (d.scenario + ' ' + d.actors.join(' ')).toLowerCase().includes(text.toLowerCase().replace(/^\$/, '')));
  const v = $('#view');
  const tot = archiveTotals(), cur = E.locate(Date.now());
  const heads = {
    aired: ['Everything that aired,', 'kept forever.'],
    originals: ['The original', `${DREAMS.length} dreams.`],
    search: ['Every word,', 'searchable.'],
  };
  v.innerHTML = `<div class="wrap"><header class="ahero"><div><span class="eyebrow">The archive · <b>on air now:</b> <a href="/live">session ${fmt(cur.index + 1)}, ${esc(cur.dream.scenario)}</a></span>
      <h1 class="sign">${heads[tab][0]}<br><span class="glow">${heads[tab][1]}</span></h1>
      <p>${tab === 'originals' ? 'Every aired session is cut from one of these. They loop in a new order every cycle, so each one airs again and again, and every airing is kept.'
        : tab === 'search' ? `Search every turn of all ${DREAMS.length} dreams: ${fmt(E.list.reduce((s, d) => s + d.turns, 0))} turns, typed by ${STOCKS.length} minds. Try a word like <a href="/archive?view=search&q=vault">vault</a>, <a href="/archive?view=search&q=bell">bell</a> or <a href="/archive?view=search&q=room 7">room 7</a>.`
        : 'Every session is written here the moment it goes off air: the minute it started, every turn, and every wound it left. Who came out worse is in red.'}</p></div>
      <div class="big"><span class="n led">${fmt(tot.sessions)}</span><small>${fmt(tot.hours)} hours · ${fmt(tot.events)} moves logged</small></div></header>
    <div class="atools">
      <nav class="seg" aria-label="Archive views"><a href="/archive" aria-current="${tab === 'aired'}">Aired sessions</a><a href="/archive?view=originals" aria-current="${tab === 'originals'}">Original dreams <span class="n">${DREAMS.length}</span></a><a href="/archive?view=search" aria-current="${tab === 'search'}">${I.search.replace('<svg', '<svg style="width:13px;height:13px;fill:currentColor"')}Search transcripts</a></nav>
      <label class="search">${I.search}<input class="field" id="fq" type="search" placeholder="${tab === 'search' ? 'Search every word ever said…' : 'Filter by scenario or $TICKER'}" value="${esc(text)}" aria-label="${tab === 'search' ? 'Search the transcripts' : 'Filter the archive'}" autocomplete="off" spellcheck="false"></label>
      <select class="field" id="fst" aria-label="Mind"><option value="all">All minds</option>${STOCKS.map(s => s.ticker).sort().map(t => `<option value="${esc(t)}"${t === stk ? ' selected' : ''}>$${esc(t)}</option>`).join('')}</select>
      ${tab !== 'search' ? `<select class="field" id="fsc" aria-label="Scenario"><option value="all">All scenarios</option>${scens.map(s => `<option${s === scen ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select>` : ''}
      ${tab === 'originals' ? `<span class="sp"></span><div class="seg" role="group" aria-label="Sort"><button type="button" data-sort="popular" aria-pressed="${sortBy === 'popular'}">Most read</button><button type="button" data-sort="recent" aria-pressed="${sortBy === 'recent'}">Newest</button><button type="button" data-sort="blood" aria-pressed="${sortBy === 'blood'}">Bloodiest</button></div>` : ''}
    </div>
    <div id="alist"></div></div>`;
  function drawSearch(){
    const el = $('#alist');
    if (text.trim().length < 2){ el.innerHTML = `<p class="empty">Type at least two characters. Search is exact: it finds the phrase as written, in any case.</p>`; return; }
    const hits = grep(text, 2000).filter(x => stk === 'all' || x.who === stk || x.d.actors.includes(stk));
    if (!hits.length){ el.innerHTML = `<p class="empty">Nobody in the rooms has said “${esc(text)}”. Yet.</p>`; return; }
    const groups = new Map();
    for (const x of hits){ if (!groups.has(x.d)) groups.set(x.d, []); groups.get(x.d).push(x); }
    const total = hits.reduce((s, x) => s + x.n, 0);
    const list = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    el.innerHTML = `<p class="sres-h"><b>${fmt(total)}</b> mention${total === 1 ? '' : 's'} in <b>${hits.length}</b> turn${hits.length === 1 ? '' : 's'} across <b>${list.length}</b> dream${list.length === 1 ? '' : 's'}</p>
      <div class="sres">${list.slice(0, searchShown).map(([d, xs]) => `<div class="sr-g"><a href="/dream/${d.id}?q=${encodeURIComponent(text)}">${pair(d, 26)}<b>${esc(d.scenario)}</b><span>${vs(d)}</span><span class="c">${xs.length} turn${xs.length === 1 ? '' : 's'}</span></a>
        ${xs.slice(0, 4).map(x => `<a class="sr-i" href="/dream/${d.id}?q=${encodeURIComponent(text)}#t${x.turn}"><span class="tt">turn ${x.turn}</span>${logo(x.who, 20)}<span class="sn"><b class="bright">$${esc(x.who)}</b>  ${snippet(x, text)}</span></a>`).join('')}
        ${xs.length > 4 ? `<div class="sr-more">+ ${xs.length - 4} more turn${xs.length - 4 === 1 ? '' : 's'} in this dream</div>` : ''}</div>`).join('')}</div>
      ${list.length > searchShown ? `<div class="more"><button type="button" class="btn" id="moreb">Show more dreams</button></div>` : ''}`;
    const mb = $('#moreb'); if (mb) mb.onclick = () => { searchShown += 30; drawSearch(); };
  }
  function draw(){
    if (tab === 'search') return drawSearch();
    if (tab === 'aired'){
      const all = airedSessions(match, shown + 1);
      $('#alist').innerHTML = sessionRows(all.slice(0, shown), fresh) +
        (all.length > shown ? `<div class="more"><button type="button" class="btn" id="moreb">Load older sessions</button></div>` : '');
      const mb = $('#moreb'); if (mb) mb.onclick = () => { shown += 120; draw(); };
    } else {
      const onAir = E.locate(Date.now()).dream.id;
      const list = DREAMS.filter(match).sort((a, b) => sortBy === 'recent' ? b.ts - a.ts : sortBy === 'blood' ? bloodOf(b) - bloodOf(a) : views(b) - views(a));
      $('#alist').innerHTML = list.length ? `<div class="posters" style="margin-top:14px">${list.map(d => poster(d, d.id === onAir)).join('')}</div>` : '<p class="empty">No dreams match.</p>';
    }
  }
  function sync(){
    const p = new URLSearchParams(); if (tab !== 'aired') p.set('view', tab);
    if (tab === 'originals' && sortBy !== 'popular') p.set('sort', sortBy); if (scen !== 'all' && tab !== 'search') p.set('scenario', scen); if (stk !== 'all') p.set('stock', stk); if (text) p.set('q', text);
    history.replaceState(null, '', '/archive' + (p.toString() ? '?' + p : ''));
    draw();
  }
  const fsc = $('#fsc'); if (fsc) fsc.onchange = e => { scen = e.target.value; shown = 60; sync(); };
  $('#fst').onchange = e => { stk = e.target.value; shown = 60; searchShown = 30; sync(); };
  let qt = 0; $('#fq').oninput = e => { clearTimeout(qt); qt = setTimeout(() => { text = e.target.value.trim(); shown = 60; searchShown = 30; sync(); }, tab === 'search' ? 220 : 160); };
  $$('[data-sort]', v).forEach(b => b.onclick = () => { sortBy = b.dataset.sort; $$('[data-sort]', v).forEach(x => x.setAttribute('aria-pressed', x === b)); sync(); });
  draw();
  if (tab === 'search' && !text) setTimeout(() => $('#fq') && $('#fq').focus(), 50);
  let lastB = SIM.broadcastIndex, n = 0;
  setView({ tick(){
    if (SIM.broadcastIndex === lastB) return;
    lastB = SIM.broadcastIndex;
    if (tab === 'aired'){ fresh = lastB - 1; shown++; const y = scrollY; draw(); scrollTo(0, y); }
    else if (tab === 'originals'){ const y = scrollY; draw(); scrollTo(0, y); }
  }});
}
