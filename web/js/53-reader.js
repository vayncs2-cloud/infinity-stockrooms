/* ── the reader: one session (or one original dream), the whole transcript, and what it did ── */
function verdictHTML(d){
  const v = verdict(d);
  const side = (t, n, cls) => `<div class="side ${cls}">${logo(t, 46)}<div class="nm"><a href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a><div>${esc(STOCK[t].epithet)}</div></div>
    <span class="big ${n > 0 ? 'down' : n < 0 ? 'up' : ''}" title="${n > 0 ? 'damage taken' : n < 0 ? 'recovered' : 'untouched'}">${n > 0 ? '−' + n : n < 0 ? '+' + -n : '0'}</span></div>`;
  return `<section class="panel verdict" aria-label="Verdict">${side(v.a, v.da, 'l')}<div class="mid"><b>${esc(v.text)}</b>damage taken over the session</div>${side(v.b, v.db, 'r')}</section>`;
}
function impactHTML(d){
  const by = {};
  for (const e of d.timeline){ const x = by[e.ticker] = by[e.ticker] || {}; x[e.stat] = (x[e.stat] || 0) + e.delta; }
  const order = [...d.actors, ...Object.keys(by).filter(t => !d.actors.includes(t))];
  return `<div class="impact">${order.filter(t => by[t]).map(t => `<div class="ia"><div class="hd">${logo(t, 22)}$${esc(t)}${d.actors.includes(t) ? '' : ' <span class="kind">pulled in</span>'}</div>
    ${STATS.filter(k => by[t][k]).map(k => `<div class="row2"><span>${STAT_LABEL[k]}</span><span class="dl ${harmOf(k, by[t][k]) > 0 ? 'down' : 'up'}">${signed(by[t][k])}</span></div>`).join('')}</div>`).join('')}</div>`;
}
/* damage over the turns, one line per actor; click anywhere to jump to that turn */
function sessionChart(d, W = 320, H = 120){
  const cum = d.actors.map(() => [0]);
  for (let k = 1; k <= d.turns; k++) d.actors.forEach((t, i) => { cum[i][k] = cum[i][k - 1] + d.timeline.filter(e => e.turn === k && e.ticker === t).reduce((s, e) => s + harmOf(e.stat, e.delta), 0); });
  const all = cum.flat(), lo = Math.min(0, ...all), hi = Math.max(12, ...all), P = 8;
  const x = k => (k / Math.max(1, d.turns) * (W - 2 * P) + P), y = v => (P + (v - lo) / (hi - lo) * (H - 2 * P));
  const lines = cum.map((c, i) => { const col = ink(colorOf(d.actors[i]));
    const pts = c.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    const dots = d.timeline.filter(e => e.ticker === d.actors[i]).map(e => `<circle cx="${x(e.turn).toFixed(1)}" cy="${y(c[e.turn]).toFixed(1)}" r="2.2" fill="${harmOf(e.stat, e.delta) > 0 ? 'var(--red)' : 'var(--good)'}"/>`).join('');
    return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.8" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>${dots}`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Damage taken by each mind over the turns" data-turns="${d.turns}" data-w="${W}" data-p="${P}">
    <line x1="${P}" x2="${W - P}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}" stroke="var(--line-3)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>
    <text x="${W - P}" y="${(y(0) - 4).toFixed(1)}" text-anchor="end" font-size="9" fill="var(--faint)" font-family="var(--mono)">untouched</text>
    ${lines}<line class="cur-x" x1="0" x2="0" y1="0" y2="${H}" stroke="var(--bright)" stroke-opacity=".35" vector-effect="non-scaling-stroke"/></svg>
    <div class="lg">${d.actors.map((t, i) => `<span><i style="background:${ink(colorOf(t))}"></i>$${esc(t)} ${cum[i][d.turns] > 0 ? '−' + cum[i][d.turns] : '+' + -cum[i][d.turns]}</span>`).join('')}<span style="margin-left:auto">down = hurt</span></div>`;
}
function readerHTML(d, head, shareText, sharePath){
  return `<div class="wrap">${head}${verdictHTML(d)}
    <div class="rgrid"><div class="reader" id="reader"><div class="chat" id="log"></div></div>
      <aside class="rrail" aria-label="What this session did">
        <div class="panel schart"><h3>How it went</h3>${sessionChart(d)}</div>
        <div class="panel"><h3>What it did</h3>${impactHTML(d)}</div>
        <div class="panel tlp"><h3><span>Every move</span><span class="faint" style="letter-spacing:0;text-transform:none;font-weight:400">${d.timeline.length}</span></h3><ol class="tl" id="tl">${d.timeline.map(e => `<li><a href="#t${e.turn}" data-turn="${e.turn}"><span class="tt">#${e.turn}</span>${logo(e.ticker, 16)}<span><b>$${esc(e.ticker)} ${dlHTML(e)}</b>${esc(e.reason)}</span></a></li>`).join('')}</ol></div>
        <button type="button" class="btn" id="replayb">${I.play} Replay it typed out</button>
        ${shareBtns(shareText, sharePath)}
      </aside></div>`;
}
/* shared wiring for both reader pages: chart scrubbing, the timeline following the page, search marks, quotes */
function wireReader(d, basePath){
  const log = $('#log'), svg = $('.schart svg'), tl = $('#tl');
  const turns = d.turns, W = +svg.dataset.w, P = +svg.dataset.p;
  const jump = k => { const el = document.getElementById('t' + k); if (!el) return; history.replaceState(null, '', location.pathname + location.search + '#t' + k); $$('.msg.hl').forEach(m => m.classList.remove('hl')); el.classList.add('hl'); el.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' }); };
  svg.addEventListener('click', e => { const r = svg.getBoundingClientRect(), f = (e.clientX - r.left) / r.width * W; jump(clamp(Math.round((f - P) / (W - 2 * P) * turns), 1, turns)); });
  const mark = $('.cur-x', svg);
  const io = new IntersectionObserver(() => {
    const top = $$('.msg', log).find(m => m.getBoundingClientRect().bottom > 120);
    const k = top ? +top.dataset.turn : 0, xx = P + k / Math.max(1, turns) * (W - 2 * P);
    mark.setAttribute('x1', xx); mark.setAttribute('x2', xx);
    let on = null; for (const a of $$('a[data-turn]', tl)){ a.classList.remove('on'); if (+a.dataset.turn <= k) on = a; }
    if (on){ on.classList.add('on'); }
  }, { rootMargin: '-120px 0px -60% 0px' });
  $$('.msg', log).forEach(m => io.observe(m));
  /* ?q= marks every hit of a transcript search */
  const q = new URLSearchParams(location.search).get('q');
  if (q && q.trim().length >= 2) highlight(log, q.trim());
  const sel = SelShare(d, basePath);
  $('#replayb').onclick = () => Replay.open(d);
  return { destroy(){ io.disconnect(); sel.destroy(); } };
}
function highlight(root, q){
  const needle = q.toLowerCase(), walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), nodes = [];
  while (walker.nextNode()){ const n = walker.currentNode; if (n.parentElement.closest('.mb') && n.nodeValue.toLowerCase().includes(needle)) nodes.push(n); }
  for (const n of nodes){
    const s = n.nodeValue, lc = s.toLowerCase(), frag = document.createDocumentFragment(); let k = 0;
    for (let j = lc.indexOf(needle); j >= 0; j = lc.indexOf(needle, j + needle.length)){
      frag.append(s.slice(k, j)); const m = document.createElement('mark'); m.textContent = s.slice(j, j + needle.length); frag.append(m); k = j + needle.length;
    }
    frag.append(s.slice(k)); n.replaceWith(frag);
  }
  if (!location.hash){ const first = $('mark', root); if (first) setTimeout(() => first.scrollIntoView({ block: 'center' }), 60); }
}
/* select any line in a transcript to quote it on X */
function SelShare(d, basePath){
  const box = document.createElement('div'); box.className = 'selshare'; box.hidden = true;
  box.innerHTML = `<button type="button" data-a="x">${I.x} Post quote</button><button type="button" data-a="c">${I.copy} Copy</button>`;
  document.body.appendChild(box);
  let cur = null;
  const hide = () => { box.hidden = true; cur = null; };
  function check(){
    const s = getSelection(), text = s.toString().replace(/\s+/g, ' ').trim();
    if (!text || text.length < 3 || !s.rangeCount){ hide(); return; }
    const r = s.getRangeAt(0), msg = (r.commonAncestorContainer.nodeType === 1 ? r.commonAncestorContainer : r.commonAncestorContainer.parentElement).closest('.msg');
    if (!msg || !$('#log').contains(msg)){ hide(); return; }
    const rect = r.getBoundingClientRect();
    cur = { text: text.length > 200 ? text.slice(0, 197).trimEnd() + '…' : text, who: msg.dataset.who, turn: msg.dataset.turn };
    box.style.left = (rect.left + rect.width / 2 + scrollX) + 'px'; box.style.top = (rect.top + scrollY - 8) + 'px'; box.hidden = false;
  }
  const up = () => setTimeout(check, 10);
  const down = e => { if (!box.contains(e.target)) hide(); };
  document.addEventListener('mouseup', up); document.addEventListener('touchend', up); document.addEventListener('mousedown', down);
  box.onclick = e => {
    const a = e.target.closest('button'); if (!a || !cur) return;
    const url = shareURL(`${basePath}#t${cur.turn}`), line = `“${cur.text}”\n— $${cur.who}, ${d.scenario}`;
    if (a.dataset.a === 'x') openX(line, url); else copyText(`${line}\n${url}`, 'Quote copied');
    hide(); getSelection().removeAllRanges();
  };
  return { destroy(){ box.remove(); document.removeEventListener('mouseup', up); document.removeEventListener('touchend', up); document.removeEventListener('mousedown', down); } };
}

function Dream(id){
  const d = DREAM[id]; if (!d) return NotFound('No dream with that id.');
  const idx = DREAMS.slice().sort((a, b) => a.ts - b.ts), k = idx.indexOf(d), prev = idx[k - 1], next = idx[k + 1];
  const onAir = () => E.locate(Date.now()).dream.id === d.id;
  const v = $('#view');
  v.innerHTML = readerHTML(d, `<a class="back" href="/archive?view=originals">← Original dreams</a>
    <header class="rhead"><div><span class="eyebrow">Original dream No. ${esc(d.n)} · written ${dstr(d.ts)}</span><h1 class="sign">${esc(d.scenario)}</h1>
      <div class="file"># ${esc(d.file)}</div>
      <div class="rmeta"><span class="pp">${pair(d, 30)}${d.actors.map(tk).join(' <span class="muted">vs</span> ')}</span><span class="chip"><b>${d.turns}</b> turns</span><span class="chip"><b>${d.timeline.length}</b> moves</span><span class="chip"><b>${mmss(d.dur)}</b> on air</span><span class="chip"><b>${fmt(views(d))}</b> reads</span><span class="chip">aired <b>${fmt(E.aired(d.id, Date.now()))}×</b></span><span id="airing"></span></div></div>
      </header>`, `"${d.scenario}": $${d.actors.join(' vs $')} in the Infinite Stockrooms`, `/dream/${d.id}`) +
    `<div class="wrap"><div class="pn">${prev ? `<a href="/dream/${prev.id}"><small>← previous dream</small><b>${esc(prev.scenario)}</b></a>` : ''}${next ? `<a class="nx" href="/dream/${next.id}"><small>next dream →</small><b>${esc(next.scenario)}</b></a>` : ''}</div></div>`;
  transcript($('#log'), d);
  const w = wireReader(d, `/dream/${d.id}`);
  const air = () => {
    if (onAir()){ $('#airing').innerHTML = '<a class="chip red" href="/live"><i class="rec"></i>on air now</a>'; return; }
    const last = airedSessions(x => x === d, 1)[0];
    $('#airing').innerHTML = last ? `<a class="chip" href="/session/${last.index + 1}">last aired as <b>#${fmt(last.index + 1)}</b>, ${ago(last.end)}</a>` : '';
  };
  air();
  let n = 0;
  setView({ tick(){ if (++n % 5 === 0) air(); }, destroy(){ w.destroy(); } });
}

/* one aired session, exactly as it went out */
function Session(n){
  const cur = E.locate(Date.now());
  if (!(n >= 1)) return NotFound();
  if (n - 1 === cur.index) return go('/live', true);
  if (n - 1 > cur.index) return NotFound(`Session ${fmt(n)} has not aired yet. It goes on air in ${until(E.broadcast(n - 1).start)}.`);
  const b = E.broadcast(n - 1), d = b.dream;
  const v = $('#view');
  v.innerHTML = readerHTML(d, `<a class="back" href="/archive">← The archive</a>
    <header class="rhead"><div><span class="eyebrow">Session #${fmt(n)} · aired ${dstr(b.start / 1000)}, ${hhmm(b.start)}–${hhmm(b.end)} UTC</span><h1 class="sign">${esc(d.scenario)}</h1>
      <div class="file"># ${esc(sessFile(b))}</div>
      <div class="rmeta"><span class="pp">${pair(d, 30)}${d.actors.map(tk).join(' <span class="muted">vs</span> ')}</span><span class="chip">ended <b><time data-t="${b.end}">${ago(b.end)}</time></b></span><span class="chip"><b>${d.turns}</b> turns</span><span class="chip"><b>${d.timeline.length}</b> moves</span><span class="chip"><b>${mmss(d.dur)}</b> on air</span><a class="chip" href="/dream/${d.id}">from dream No. ${esc(d.n)} →</a></div></div>
      </header>`, `Session #${fmt(n)} of the Infinite Stockrooms: "${d.scenario}", $${d.actors.join(' vs $')}`, `/session/${n}`) +
    `<div class="wrap"><div class="pn" id="spn"></div></div>`;
  transcript($('#log'), d);
  const w = wireReader(d, `/session/${n}`);
  const nx = () => { const c = E.locate(Date.now()).index, p = n > 1 ? E.broadcast(n - 2) : null, q = n < c ? E.broadcast(n) : null;
    $('#spn').innerHTML = (p ? `<a href="/session/${n - 1}"><small>← session ${fmt(n - 1)}</small><b>${esc(p.dream.scenario)}</b></a>` : '') +
      (q ? `<a class="nx" href="/session/${n + 1}"><small>session ${fmt(n + 1)} →</small><b>${esc(q.dream.scenario)}</b></a>` : `<a class="nx" href="/live"><small><i class="rec"></i> session ${fmt(n + 1)} is on air</small><b>Watch live →</b></a>`); };
  nx();
  let k = 0;
  setView({ tick(){ if (++k % 5 === 0){ nx(); refreshTimes(v); } }, destroy(){ w.destroy(); } });
}
