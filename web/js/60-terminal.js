/* ── the terminal: a search palette for everyone, a shell for anyone who types a command. Opens with / or Ctrl+K. ── */
const Term = (() => {
  let el = null, input, out, res, items = [], sel = 0, open = false, lastFocus = null;
  const PROMPT = 'simulator@stockrooms:~/$';
  const PAGES = [
    { label: 'Live', sub: 'the room on air now', href: '/live', ic: '●' },
    { label: 'Archive', sub: 'every session that aired', href: '/archive', ic: '▤' },
    { label: 'Original dreams', sub: `all ${DREAMS.length} of them`, href: '/archive?view=originals', ic: '▦' },
    { label: 'Floor', sub: `${STOCKS.length} minds, live`, href: '/floor', ic: '▥' },
    { label: 'Lore', sub: 'a field guide', href: '/lore', ic: '§' },
    { label: 'Home', sub: 'the front of the building', href: '/', ic: '⌂' },
  ];
  const CMDS = {
    help: () => [
      '<span class="d">type anything to search minds, dreams and rooms. or run:</span>',
      '  <span class="p">grep</span> &lt;words&gt;     search every line ever said',
      '  <span class="p">ls</span> [minds|dreams] list rooms, minds or dreams',
      '  <span class="p">cd</span> &lt;room&gt;        go to live, archive, floor, lore, ~',
      '  <span class="p">cat</span> &lt;$TICKER&gt;    read a mind\'s file',
      '  <span class="p">open</span> &lt;anything&gt;  a mind, a dream, or a session number',
      '  <span class="p">top</span> [stat]        who is worst off (or highest in a reading)',
      '  <span class="p">ps</span>                what is on air and what is next',
      '  <span class="p">tail -f</span>           follow the live broadcast',
      '  <span class="p">sound</span>             typing sounds on the live broadcast',
      '  <span class="p">uptime</span> · <span class="p">date</span> · <span class="p">whoami</span> · <span class="p">clear</span> · <span class="p">exit</span>',
    ],
    ls(a){
      const w = (a[0] || '').replace(/\/$/, '');
      if (w === 'minds' || w === 'floor') return STOCKS.map(s => `<a href="/stock/${encodeURIComponent(s.ticker)}">$${esc(s.ticker.padEnd(9))}</a> <span class="d">${esc(s.kind.padEnd(6))} ${esc(s.epithet)}</span>`);
      if (w === 'dreams' || w === 'archive') return E.list.map(d => `<a href="/dream/${d.id}">${esc(d.n)} ${esc(d.scenario.padEnd(26))}</a> <span class="d">${esc(vs(d))}</span>`);
      return ['<span class="d">drwxr-xr-x  hood  hood</span>  <a href="/live">live/</a>', '<span class="d">drwxr-xr-x  hood  hood</span>  <a href="/archive">archive/</a>', '<span class="d">drwxr-xr-x  hood  hood</span>  <a href="/floor">floor/</a>  <span class="d">(ls minds)</span>', '<span class="d">drwxr-xr-x  hood  hood</span>  <a href="/archive?view=originals">dreams/</a>  <span class="d">(ls dreams)</span>', '<span class="d">-rw-r--r--  hood  hood</span>  <a href="/lore">lore.txt</a>'];
    },
    cd(a){
      const w = (a[0] || '~').replace(/\/$/, '').toLowerCase();
      const map = { '~': '/', '/': '/', home: '/', live: '/live', archive: '/archive', floor: '/floor', minds: '/floor', lore: '/lore', dreams: '/archive?view=originals', search: '/archive?view=search' };
      if (w === '..'){ history.back(); return null; }
      if (map[w] !== undefined){ nav(map[w]); return null; }
      const t = w.toUpperCase().replace(/^\$/, ''); if (STOCK[t]){ nav('/stock/' + encodeURIComponent(t)); return null; }
      return [`<span class="e">cd: ${esc(a[0])}: No such room</span>`];
    },
    cat(a){
      const t = (a[0] || '').toUpperCase().replace(/^\$/, ''), s = STOCK[t];
      if (!s){ const d = findDream(a.join(' ')); if (d){ nav('/dream/' + d.id); return null; } return [`<span class="e">cat: ${esc(a[0] || '')}: No such file</span>`]; }
      const v = SIM.vals[t];
      return [`<a href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a> <span class="d">· ${esc(s.epithet)} · ${esc(s.kind)} · ${esc(stateOf(t))}</span>`, esc(s.bio), `<span class="d">fears:</span> ${esc(s.fears)}`, `<span class="d">wants:</span> ${esc(s.desires)}`,
        STATS.map(k => `<span class="d">${k.slice(0, 4)}</span> ${Math.round(v[k])}`).join('  ')];
    },
    open(a){
      const q = a.join(' ').trim(); if (!q) return ['<span class="e">open: what?</span>'];
      if (/^#?\d+$/.test(q)){ nav('/session/' + q.replace('#', '')); return null; }
      const hit = search(q)[0]; if (hit){ nav(hit.href); return null; }
      return [`<span class="e">open: ${esc(q)}: nothing by that name</span>`];
    },
    grep(a){
      const q = a.filter(x => !/^-/.test(x)).join(' ').replace(/^["']|["']$/g, '');
      if (q.length < 2) return ['<span class="e">usage: grep &lt;words&gt;</span>'];
      const hits = grep(q, 500);
      if (!hits.length) return [`<span class="d">(no lines match “${esc(q)}”)</span>`];
      return [...hits.slice(0, 8).map(x => `<a href="/dream/${x.d.id}?q=${encodeURIComponent(q)}#t${x.turn}">${esc(x.d.scenario)}:${x.turn}</a> <span class="d">$${esc(x.who)}:</span> ${snippet(x, q, 50)}`),
        `<span class="d">${hits.length >= 500 ? '500+' : hits.length} matching turns ·</span> <a href="/archive?view=search&q=${encodeURIComponent(q)}">see them all →</a>`];
    },
    top(a){
      const k = (a[0] || '').toLowerCase(), stat = STATS.find(s => s.startsWith(k) && k);
      const list = STOCKS.map(s => s.ticker).sort((x, y) => stat ? SIM.vals[y][stat] - SIM.vals[x][stat] : hurtOf(y) - hurtOf(x)).slice(0, 10);
      return [`<span class="d">  PID  MIND       ${stat ? stat.toUpperCase().padEnd(10) : 'HURT      '} STATE</span>`, ...list.map((t, i) => `  ${String(1000 + i * 7).padStart(4)} <a href="/stock/${encodeURIComponent(t)}">$${esc(t.padEnd(9))}</a> ${String(stat ? Math.round(SIM.vals[t][stat]) : hurtOf(t)).padEnd(10)} <span class="d">${esc(stateOf(t))}</span>`)];
    },
    ps(){
      const b = E.locate(Date.now()), n = E.broadcast(b.index + 1);
      return [`<span class="d">SESSION   STATUS   LEFT   ROOM</span>`, `#${fmt(b.index + 1).padEnd(8)} <span class="e">on air</span>   ${mmss(b.end - Date.now()).padEnd(6)} <a href="/live">${esc(b.dream.scenario)}</a> <span class="d">${esc(vs(b.dream))}</span>`,
        `#${fmt(n.index + 1).padEnd(8)} next     ${until(n.start).padEnd(6)} ${esc(n.dream.scenario)} <span class="d">${esc(vs(n.dream))}</span>`];
    },
    tail(){ nav('/live'); return null; },
    sound(){ const on = Sound.toggle(); $$('#lsnd').forEach(b => { b.setAttribute('aria-pressed', on); b.innerHTML = `${on ? I.snd : I.mute}<span>${on ? 'Sound on' : 'Sound off'}</span>`; }); return [`typing sounds ${on ? 'on' : 'off'}`]; },
    uptime(){ const t = archiveTotals(), d = (Date.now() - E.EPOCH) / 864e5; return [`up ${Math.floor(d)} days, ${Math.floor((d % 1) * 24)}:${String(Math.floor(((d * 24) % 1) * 60)).padStart(2, '0')}, ${STOCKS.length} minds, ${fmt(t.sessions)} sessions archived, ${fmt(t.events)} moves logged`]; },
    date(){ return [new Date().toUTCString().replace('GMT', 'UTC') + '   <span class="d">(the rooms do not observe weekends)</span>']; },
    whoami(){ return ['guest', '<span class="d">0.0031 of you belongs to someone in a bedroom.</span>']; },
    sudo(){ return ['<span class="e">guest is not in the sudoers file. this incident will be reported to $PLTR.</span>']; },
    clear(){ out.innerHTML = ''; return null; },
    exit(){ close(); return null; },
  };
  CMDS.man = CMDS.help; CMDS.cls = CMDS.clear; CMDS.q = CMDS.exit; CMDS.find = CMDS.grep; CMDS.search = CMDS.grep; CMDS.who = CMDS.ps;
  function findDream(q){ q = q.toLowerCase().trim(); return E.list.find(d => d.scenario === q) || E.list.find(d => d.scenario.includes(q)); }
  function nav(href){ close(); go(href); $('#view').focus({ preventScroll: true }); }
  /* palette results: rooms, minds, dreams, then a transcript search */
  function search(q){
    q = q.toLowerCase().trim().replace(/^\$/, '');
    const out = [];
    const score = (hay, extra = 0) => { const i = hay.indexOf(q); return i < 0 ? -1 : (i === 0 ? 3 : hay[i - 1] === ' ' ? 2 : 1) + extra; };
    if (/^#?\d+$/.test(q)){ const n = +q.replace('#', ''), cur = E.locate(Date.now()).index;
      if (n >= 1 && n <= cur + 1){ const b = E.broadcast(n - 1); out.push({ s: 9, label: `Session #${fmt(n)}`, sub: `${b.dream.scenario} · ${vs(b.dream)}`, href: n - 1 === cur ? '/live' : `/session/${n}`, ic: '#' }); } }
    for (const p of PAGES){ const s = score(p.label.toLowerCase(), 1); if (s > 0) out.push({ ...p, s }); }
    for (const st of STOCKS){ const s = Math.max(score(st.ticker.toLowerCase(), 2), score(st.epithet.toLowerCase())); if (s > 0) out.push({ s, label: '$' + st.ticker, sub: st.epithet, href: '/stock/' + encodeURIComponent(st.ticker), logo: st.ticker, meta: stateOf(st.ticker) }); }
    for (const d of E.list){ const s = Math.max(score(d.scenario.toLowerCase(), 1), score(d.actors.join(' ').toLowerCase()) - 1); if (s > 0) out.push({ s, label: d.scenario, sub: vs(d), href: '/dream/' + d.id, pair: d, meta: 'dream ' + d.n }); }
    out.sort((a, b) => b.s - a.s);
    const top = out.slice(0, 7);
    if (q.length >= 2) top.push({ label: `Search every transcript for “${q}”`, sub: 'grep', href: `/archive?view=search&q=${encodeURIComponent(q)}`, ic: '⌕' });
    return top;
  }
  function render(){
    const raw = input.value, first = raw.trim().split(/\s+/)[0].toLowerCase();
    if (!raw.trim()){
      const b = E.locate(Date.now());
      items = [{ label: `On air: ${b.dream.scenario}`, sub: vs(b.dream), href: '/live', ic: '●', meta: mmss(b.end - Date.now()) + ' left' }, ...PAGES.slice(1, 5)];
    } else if (CMDS[first]) items = [{ cmd: raw.trim(), label: raw.trim(), sub: 'press enter to run', ic: '›' }];
    else items = search(raw);
    sel = Math.min(sel, Math.max(0, items.length - 1));
    const head = !raw.trim() ? '<li class="gh">Jump to</li>' : '';
    res.innerHTML = head + items.map((it, i) => `<li><a href="${it.href ? esc(it.href) : '#'}" data-i="${i}" aria-selected="${i === sel}" role="option">${it.logo ? logo(it.logo, 24) : it.pair ? pair(it.pair, 20) : `<span class="ic">${esc(it.ic || '·')}</span>`}<b>${esc(it.label)}</b><span>${esc(it.sub || '')}</span>${it.meta ? `<em>${esc(it.meta)}</em>` : ''}</a></li>`).join('');
  }
  function run(line){
    const parts = line.trim().split(/\s+/), cmd = parts[0].toLowerCase();
    out.insertAdjacentHTML('beforeend', `<div><span class="p">${PROMPT}</span> ${esc(line)}</div>`);
    const r = CMDS[cmd] ? CMDS[cmd](parts.slice(1)) : [`<span class="e">${esc(cmd)}: command not found</span> <span class="d">(try help)</span>`];
    if (r && open){ out.insertAdjacentHTML('beforeend', `<div>${r.join('\n')}</div>`); $('.term-scroll', el).scrollTop = 1e9; }
  }
  function choose(i){
    const it = items[i]; if (!it) return;
    if (it.cmd){ run(it.cmd); input.value = ''; render(); return; }
    nav(it.href);
  }
  function build(){
    el = document.createElement('div'); el.className = 'term'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Search and terminal');
    el.innerHTML = `<div class="term-box"><div class="term-bar"><i></i><i></i><i></i><span>simulator@stockrooms — search or type a command</span><span class="sp"></span><kbd>esc</kbd></div>
      <div class="term-scroll"><div class="term-out" id="tout"><div class="d">Infinite Stockrooms shell. Type to search, or <span class="p">help</span> for commands.</div></div>
      <div class="term-in"><label for="tin">${PROMPT}</label><input id="tin" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="nvda, the vault, grep bell, help…" aria-controls="tres"></div>
      <ul class="term-res" id="tres" role="listbox"></ul></div>
      <div class="term-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open or run</span><span><kbd>esc</kbd> close</span><span style="margin-left:auto">try <b style="color:var(--dim)">grep vault</b> · <b style="color:var(--dim)">top fear</b> · <b style="color:var(--dim)">ps</b></span></div></div>`;
    document.body.appendChild(el);
    input = $('#tin', el); out = $('#tout', el); res = $('#tres', el);
    input.addEventListener('input', () => { sel = 0; render(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown'){ e.preventDefault(); sel = (sel + 1) % Math.max(1, items.length); render(); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); sel = (sel - 1 + items.length) % Math.max(1, items.length); render(); }
      else if (e.key === 'Enter'){ e.preventDefault(); const raw = input.value.trim(), first = raw.split(/\s+/)[0].toLowerCase();
        if (raw && CMDS[first]){ run(raw); input.value = ''; render(); } else choose(sel); }
      else if (e.key === 'Escape'){ e.preventDefault(); close(); }
      else if (e.key === 'Tab'){ e.preventDefault(); const it = items[sel]; if (it && it.label && !it.cmd) { input.value = it.label.replace(/^\$/, ''); render(); } }
    });
    el.addEventListener('mousedown', e => { if (e.target === el) close(); });
    res.addEventListener('click', e => { const a = e.target.closest('a[data-i]'); if (!a) return; e.preventDefault(); e.stopPropagation(); choose(+a.dataset.i); });
    res.addEventListener('mousemove', e => { const a = e.target.closest('a[data-i]'); if (a && +a.dataset.i !== sel){ sel = +a.dataset.i; $$('a[data-i]', res).forEach(x => x.setAttribute('aria-selected', +x.dataset.i === sel)); } });
    out.addEventListener('click', e => { if (e.target.closest('a[href]')) setTimeout(close, 0); });
  }
  function show(prefill){
    if (!el) build();
    lastFocus = document.activeElement; open = true; el.hidden = false; document.body.style.overflow = 'hidden';
    input.value = prefill || ''; sel = 0; render(); input.focus();
  }
  function close(){ if (!el || !open) return; open = false; el.hidden = true; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  addEventListener('keydown', e => {
    if (open) return;
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey)){ e.preventDefault(); show(); }
  });
  document.addEventListener('click', e => { if (e.target.closest('#termb,[data-term-open]')){ e.preventDefault(); show(); } });
  return { show, close, get open(){ return open; } };
})();
