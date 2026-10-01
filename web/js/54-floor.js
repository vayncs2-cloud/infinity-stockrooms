/* ── the floor: every mind's live readings, as a board or as cards ── */
/* how far a mind has been pushed the wrong way from its baseline, summed over the five readings */
function hurtOf(t){ const v = SIM.vals[t], b = STOCK[t].stats; return Math.round(STATS.reduce((s, k) => s + Math.max(0, harmOf(k, v[k] - b[k])), 0)); }
function cellHTML(t, k){
  const v = SIM.vals[t][k], d = Math.round(v - STOCK[t].stats[k]), a = Math.abs(d), h = harmOf(k, d);
  const lv = a >= 30 ? 4 : a >= 18 ? 3 : a >= 9 ? 2 : a >= 3 ? 1 : 0;
  return `<span class="cell${lv ? ` ${h > 0 ? 'h' : 'g'}${lv}` : ''}" title="${STAT_LABEL[k]} ${Math.round(v)}, baseline ${STOCK[t].stats[k]}"><b>${Math.round(v)}</b><i>${d ? signed(d) : '·'}</i></span>`;
}
function lastHTML(t){
  const l = SIM.last[t]; if (!l) return '<span class="faint">No moves yet.</span>';
  const d = DREAM[l.dream];
  return `${dlHTML(l)}${esc(l.reason)} <a href="/session/${l.b + 1}#t${l.turn}">${d ? esc(d.scenario) : ''} · <time data-t="${l.t}">${ago(l.t)}</time></a>`;
}

function Floor(){
  const q = new URLSearchParams(location.search);
  let view = q.get('view') || store.get('sr-fview', 'board'); if (!['board', 'cards'].includes(view)) view = 'board';
  let kind = store.get('sr-fkind2', 'all'); if (kind !== 'all' && !KINDS.includes(kind)) kind = 'all';
  let sortBy = store.get('sr-fsort3', 'hurt'), dir = store.get('sr-fdir', 'desc');
  if (!['hurt', 'ticker', ...STATS].includes(sortBy)) sortBy = 'hurt';
  const v = $('#view');
  const hurtMost = STOCKS.map(s => s.ticker).sort((a, b) => hurtOf(b) - hurtOf(a))[0];
  v.innerHTML = `<div class="wrap"><header class="fhead"><div><span class="eyebrow">The floor · ${STOCKS.length} minds, live</span>
      <h1 class="sign">Everyone,<br><span class="glow">right now.</span></h1>
      <p>Five readings per mind, each starting at a baseline written into who it is. Sessions push them around; after every broadcast each one drifts a little back toward itself. Red is harm, green is relief. Worst off right now: <a href="/stock/${encodeURIComponent(hurtMost)}">$${esc(hurtMost)}</a>.</p></div>
      <div class="legend"><span><i style="background:rgba(240,103,90,.5)"></i>pushed the bad way</span><span><i style="background:rgba(98,208,151,.38)"></i>pushed the good way</span><span><i style="background:var(--panel-3)"></i>near baseline</span></div></header>
    <div class="tools">
      <div class="seg" role="group" aria-label="Kind">${['all', ...KINDS].map(k => `<button type="button" data-kind="${k}" aria-pressed="${kind === k}">${k === 'all' ? 'All' : KIND_LABEL[k]}<span class="n">${k === 'all' ? STOCKS.length : STOCKS.filter(s => s.kind === k).length}</span></button>`).join('')}</div>
      <span class="sp"></span>
      <div class="seg" role="group" aria-label="View"><button type="button" data-view="board" aria-pressed="${view === 'board'}">Board</button><button type="button" data-view="cards" aria-pressed="${view === 'cards'}">Cards</button></div>
    </div>
    <div id="fl"></div></div>`;
  const list = () => STOCKS.filter(s => kind === 'all' || s.kind === kind).map(s => s.ticker).sort((a, b) => {
    const r = sortBy === 'ticker' ? a.localeCompare(b) : sortBy === 'hurt' ? hurtOf(a) - hurtOf(b) : SIM.vals[a][sortBy] - SIM.vals[b][sortBy];
    return (dir === 'asc' ? r : -r) || a.localeCompare(b);
  });
  const rowHTML = (t, i) => { const s = STOCK[t]; return `<tr data-t="${esc(t)}"><td class="rk">${i + 1}</td>
      <td><div class="bm">${logo(t, 32)}<div><a href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a><span>${esc(s.epithet)} · ${esc(s.kind)}</span></div></div></td>
      <td data-sw>${stateHTML(t)}</td>
      <td class="c"><span class="led" style="font-size:18px;color:${hurtOf(t) >= 40 ? 'var(--red)' : hurtOf(t) >= 15 ? 'var(--red-2)' : 'var(--dim)'}">${hurtOf(t)}</span></td>
      ${STATS.map(k => `<td>${cellHTML(t, k)}</td>`).join('')}
      <td>${spark(t, 'stability', 96, 26)}</td><td class="last"><div><span>${lastHTML(t)}</span></div></td></tr>`; };
  const cardHTML = t => { const s = STOCK[t]; return `<article class="panel fc" data-t="${esc(t)}" style="--c:${s.color}">
      <div class="hd">${logo(t, 44)}<div class="nm"><a class="t" href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a><div class="ep">${esc(s.epithet)}</div></div><span class="kind">${s.kind}</span></div>
      ${statsHTML(t, true)}
      <div class="ft"><span data-sw>${stateHTML(t)}</span><span data-sp title="Stability, last 60 sessions">${spark(t, 'stability')}</span></div>
      <div class="why" data-why>${lastHTML(t)}</div></article>`; };
  const th = (key, label, cls = '') => `<th class="${cls}"${sortBy === key ? ` aria-sort="${dir === 'asc' ? 'ascending' : 'descending'}"` : ''}><button type="button" data-sort="${key}">${label}</button></th>`;
  function draw(){
    const ts = list();
    if (!ts.length){ $('#fl').innerHTML = '<p class="empty">None of that kind.</p>'; return; }
    if (view === 'board') $('#fl').innerHTML = `<div class="board-w"><table class="board"><thead><tr><th><button type="button" disabled>#</button></th>${th('ticker', 'Mind')}<th><button type="button" disabled>State</button></th>${th('hurt', 'Hurt', 'c')}${STATS.map(k => th(k, STAT_LABEL[k])).join('')}<th><button type="button" disabled>Stability, 60</button></th><th><button type="button" disabled>Last move</button></th></tr></thead>
      <tbody>${ts.map(rowHTML).join('')}</tbody></table></div>`;
    else $('#fl').innerHTML = `<div class="fgrid">${ts.map(cardHTML).join('')}</div>`;
    $$('[data-sort]', v).forEach(b => b.onclick = () => {
      const k = b.dataset.sort; if (sortBy === k) dir = dir === 'asc' ? 'desc' : 'asc'; else { sortBy = k; dir = k === 'ticker' ? 'asc' : 'desc'; }
      store.set('sr-fsort3', sortBy); store.set('sr-fdir', dir); draw();
    });
  }
  $$('[data-kind]', v).forEach(b => b.onclick = () => { kind = b.dataset.kind; store.set('sr-fkind2', kind); $$('[data-kind]', v).forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
  $$('[data-view]', v).forEach(b => b.onclick = () => { view = b.dataset.view; store.set('sr-fview', view); $$('[data-view]', v).forEach(x => x.setAttribute('aria-pressed', x === b));
    history.replaceState(null, '', '/floor' + (view === 'cards' ? '?view=cards' : '')); draw(); });
  draw();
  let histN = SIM.broadcastIndex, n = 0;
  setView({ tick(fresh){
    if (SIM.broadcastIndex !== histN){ histN = SIM.broadcastIndex; const y = scrollY; draw(); scrollTo(0, y); return; }
    for (const e of fresh){
      const t = e.ticker, hurt = harmOf(e.stat, e.delta) > 0;
      if (view === 'board'){
        const tr = $(`tr[data-t="${CSS.escape(t)}"]`, v); if (!tr) continue;
        const i = +tr.querySelector('.rk').textContent - 1;
        tr.outerHTML = rowHTML(t, i);
        const nu = $(`tr[data-t="${CSS.escape(t)}"]`, v); nu.classList.add('flash'); if (hurt) nu.classList.add('hurt'); setTimeout(() => nu.classList.remove('flash', 'hurt'), 1600);
      } else {
        const c = $(`.fc[data-t="${CSS.escape(t)}"]`, v); if (!c) continue;
        updateStats(c, t, fresh); c.querySelector('[data-sw]').innerHTML = stateHTML(t); c.querySelector('[data-why]').innerHTML = lastHTML(t);
        c.classList.add('flash'); if (hurt) c.classList.add('hurt'); setTimeout(() => c.classList.remove('flash', 'hurt'), 1400);
      }
    }
    if (++n % 15 === 0) refreshTimes(v);
  }});
}
