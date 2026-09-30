/* ── the live broadcast: a fight card over a chat. Mountable anywhere (the /live page and home). ── */
function LivePanel(root){
  root.innerHTML = `<div class="live">
    <section class="stage" aria-label="Live broadcast">
      <div class="stage-top">
        <span class="tag-live"><i></i>LIVE</span>
        <span class="sess" id="lsess"></span>
        <span class="sp"></span>
        <div class="meta"><span class="tl2">turn <b id="lturn">0</b>/<span id="lturns"></span></span><span><b id="lleft">—</b> left</span></div>
        <button class="ibtn" id="lsnd" type="button" aria-pressed="false" title="Typing sounds"></button>
        <button class="ibtn" id="lshare" type="button" title="Share what's on air">${I.x}<span>Share</span></button>
      </div>
      <div class="prog"><i id="lprog"></i></div>
      <div class="hud" id="lhud"></div>
      <div class="pane" id="lpane"><div class="chat" id="llog" aria-live="off"></div><button class="jump" id="ljump" type="button" hidden>↓ Jump to live</button></div>
    </section>
    <aside class="rail" id="lrail" aria-label="The two minds on air"></aside>
  </div>`;
  const pane = $('#lpane', root), logEl = $('#llog', root), jump = $('#ljump', root), hud = $('#lhud', root), rail = $('#lrail', root);
  let b = null, ty = null, raf = 0, timer = 0, pops = [], dead = false, follow = true, auto = false;
  const toEnd = () => { auto = true; pane.scrollTop = pane.scrollHeight; };
  pane.addEventListener('scroll', () => { if (auto){ auto = false; return; } follow = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 140; jump.hidden = follow; }, { passive: true });
  jump.onclick = () => { follow = true; jump.hidden = true; toEnd(); };
  const snd = $('#lsnd', root);
  const drawSnd = () => { snd.setAttribute('aria-pressed', Sound.on); snd.innerHTML = `${Sound.on ? I.snd : I.mute}<span>${Sound.on ? 'Sound on' : 'Sound off'}</span>`; };
  snd.onclick = () => { Sound.toggle(); drawSnd(); };
  drawSnd();
  $('#lshare', root).onclick = () => openX(`On air now in the Infinite Stockrooms: $${b.dream.actors.join(' vs $')}, "${b.dream.scenario}"`, shareURL('/live'));

  const fighter = (t, side) => { const s = STOCK[t]; return `<div class="fighter ${side}" data-t="${esc(t)}" style="--c:${s.color}">
      <span class="fl">${logo(t, 60)}</span>
      <div class="fn"><a href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a><span class="ep">${esc(s.epithet)}</span><span class="fs" data-sw>${stateHTML(t)}</span></div></div>`; };
  const hpBar = side => `<div class="hp ${side}"><div class="hl"><span>Composure</span><b>0</b></div><div class="hpb"><i class="gh"></i><i class="fi"></i></div></div>`;

  function start(){
    b = E.locate(Date.now()); const d = b.dream, [A, B] = d.actors;
    logEl.innerHTML = (b.index ? `<span class="sysline"><span class="ok">[ OK ]</span> session ${fmt(b.index)} written to the archive · <a href="/session/${b.index}">/session/${b.index}</a></span>` : '') +
      `<span class="sysline">simulator@stockrooms:~/$ ./dream --pair ${esc(d.actors.join(',').toLowerCase())} --scenario "${esc(d.scenario)}"</span><span class="sysline"><span class="ok">[ OK ]</span> session ${fmt(b.index + 1)} allocated · ${esc(sessFile(b))}</span>`;
    ty = Typist(logEl, d, { popEvents: true, typing: true });
    pops = d.timeline.filter(e => e.at <= Date.now() - b.start).slice(-6).reverse();
    $('#lsess', root).innerHTML = `Session <b>#${fmt(b.index + 1)}</b>`;
    $('#lturns', root).textContent = d.turns;
    hud.innerHTML = fighter(A, 'l') + `<div class="vs"><span class="vs-x">VS</span><span class="vs-t">${esc(d.scenario)}</span><span class="vs-s" id="lvs"></span></div>` + fighter(B, 'r') +
      `<div class="hpr">${hpBar('l')}<span class="mid">this<br>session</span>${hpBar('r')}</div>`;
    const nb = E.broadcast(b.index + 1);
    rail.innerHTML = d.actors.map(t => `<div class="panel actor" data-t="${esc(t)}" style="--c:${STOCK[t].color}">
        <div class="hd">${logo(t, 40)}<div class="nm"><a href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a><div class="ep">${esc(STOCK[t].epithet)}</div></div><span data-sw>${stateHTML(t)}</span></div>
        ${statsHTML(t, true)}</div>`).join('') +
      `<div class="panel feed"><h3><span>This session</span><span id="lcount"></span></h3><ul class="pops" id="pops"></ul></div>
       <a class="panel next" href="/live#coming" title="The schedule">Up next ${pair(nb.dream, 20)}<b>${esc(nb.dream.scenario)}</b><span class="mono" id="nextin"></span></a>`;
    drawPops();
    const r = ty.update(Date.now() - b.start);
    drawHUD(Date.now() - b.start, [], true);
    follow = true; jump.hidden = true;
    toEnd();
    return r;
  }
  function drawPops(fresh){
    const n = b.dream.timeline.filter(e => e.at <= Date.now() - b.start).length;
    $('#lcount', root).textContent = `${n} of ${b.dream.timeline.length} moves`;
    $('#pops', root).innerHTML = pops.length ? pops.map(e => `<li class="${fresh && fresh.includes(e) ? 'pop' : ''}">${logo(e.ticker, 20)}<b>$${esc(e.ticker)} ${dlHTML(e)}</b><span>${esc(e.reason)}</span></li>`).join('')
      : '<li class="none">Nothing has moved yet this session.</li>';
  }
  /* composure: 100 at the bell, drained by every hit this session, restored by every recovery */
  function drawHUD(o, fresh, first){
    const d = b.dream, dmg = damage(d, o);
    d.actors.forEach((t, i) => {
      const hp = $$('.hp', hud)[i], n = dmg[t] || 0, pct = composure(n);
      if (first){ for (const x of hp.querySelectorAll('i')){ x.style.transition = 'none'; x.style.width = pct + '%'; } void hp.offsetWidth; for (const x of hp.querySelectorAll('i')) x.style.transition = ''; }
      hp.querySelector('.fi').style.width = pct + '%';
      hp.querySelector('.gh').style.width = pct + '%';
      hp.querySelector('.fi').classList.toggle('low', pct < 35);
      const lab = hp.querySelector('.hl b'); lab.textContent = n > 0 ? `−${n}` : n < 0 ? `+${-n}` : '0'; lab.className = n > 0 ? 'down' : n < 0 ? 'up' : '';
    });
    for (const e of fresh){
      const i = d.actors.indexOf(e.ticker), h = harmOf(e.stat, e.delta);
      Sound.hit(h > 0);
      if (i < 0 || reduceMotion) continue;
      const hp = $$('.hp', hud)[i], bar = hp.querySelector('.hpb'), pop = document.createElement('span');
      pop.className = 'hit-pop' + (h > 0 ? '' : ' heal'); pop.textContent = (h > 0 ? '−' : '+') + Math.abs(h);
      const w = parseFloat(hp.querySelector('.fi').style.width) || 0;
      pop.style.top = (bar.offsetTop - 30) + 'px';
      pop.style[i === 0 ? 'left' : 'right'] = `calc(${clamp(w, 6, 92)}% - 18px)`;
      hp.appendChild(pop); setTimeout(() => pop.remove(), 1400);
      if (h >= 8){ const f = $$('.fighter', hud)[i]; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); }
    }
  }
  function frame(){
    raf = 0; if (dead) return;
    const now = Date.now();
    if (now >= b.end) start();
    const o = now - b.start, d = b.dream;
    const r = ty.update(o);
    if (r.fresh.length){ pops = [...r.fresh.slice().reverse(), ...pops].slice(0, 6); drawPops(r.fresh); drawHUD(o, r.fresh); }
    if (r.status === 'live') Sound.click();
    if (follow && pane.scrollHeight - pane.scrollTop - pane.clientHeight > 1) toEnd();
    $('#lturn', root).textContent = r.turn;
    $('#lvs', root).textContent = `turn ${r.turn} of ${d.turns} · ${r.status}`;
    $('#lleft', root).textContent = mmss(b.end - now);
    $('#lprog', root).style.width = (o / d.dur * 100).toFixed(2) + '%';
    const ni = $('#nextin', root); if (ni) ni.textContent = mmss(b.end - now);
    schedule();
  }
  function schedule(){ if (!raf && !dead) timer = setTimeout(() => { raf = requestAnimationFrame(frame); }, 50); }
  start(); frame();
  const onVis = () => { if (!document.hidden){ clearTimeout(timer); cancelAnimationFrame(raf); raf = 0; frame(); } };
  document.addEventListener('visibilitychange', onVis);
  return {
    get broadcast(){ return b; },
    tick(fresh){
      for (const t of b.dream.actors){
        const a = $(`.actor[data-t="${CSS.escape(t)}"]`, rail); if (a){ updateStats(a, t, fresh); a.querySelector('[data-sw]').innerHTML = stateHTML(t); }
        const f = $(`.fighter[data-t="${CSS.escape(t)}"] [data-sw]`, hud); if (f) f.innerHTML = stateHTML(t);
      }
    },
    destroy(){ dead = true; clearTimeout(timer); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); },
  };
}

/* the schedule is a function of time too: the next sessions, in order, with the minute they go on air */
function upNextHTML(n = 6){
  const cur = E.locate(Date.now());
  let html = '';
  for (let k = 1; k <= n; k++){
    const nb = E.broadcast(cur.index + k), d = nb.dream;
    html += `<li><a href="/dream/${d.id}" title="Read the original dream">
      <span class="when"><b data-until="${nb.start}">${until(nb.start)}</b><small>${hhmm(nb.start)} UTC</small></span>${pair(d, 30)}
      <span class="ti"><b>${esc(d.scenario)}</b><span>${vs(d)} · session #${fmt(nb.index + 1)}</span></span></a></li>`;
  }
  return `<ol class="sched">${html}</ol>`;
}
