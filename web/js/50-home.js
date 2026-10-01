/* ── home: the sign, the room on air, the archive, the bloodbath, the floor at a glance ── */
function mindTile(t, fresh){
  const w = stateOf(t), v = SIM.vals[t], b = STOCK[t].stats;
  const g5 = STATS.map(k => { const d = v[k] - b[k], h = harmOf(k, d); return `<i class="${Math.abs(d) < 3 ? '' : h > 0 ? 'h' : 'g'}" style="height:${Math.max(12, v[k]).toFixed(0)}%" title="${STAT_LABEL[k]} ${Math.round(v[k])}"></i>`; }).join('');
  return `<a class="mt ${stateCls(w)}" href="/stock/${encodeURIComponent(t)}" data-t="${esc(t)}">${logo(t, 34)}<b>$${esc(t)}</b><span class="sw">${esc(w)}</span><span class="g5" aria-hidden="true">${g5}</span></a>`;
}
function mostRead(n = 7){
  return `<ol class="mr">${DREAMS.slice().sort((a, b) => views(b) - views(a)).slice(0, n).map((d, i) => `<li><a href="/dream/${d.id}">
    <span class="rk">${i + 1}</span>${pair(d, 26)}<span style="min-width:0"><b>${esc(d.scenario)}</b><small>${vs(d)}</small></span><span class="rd">${fmt(views(d))}<br><small>reads</small></span></a></li>`).join('')}</ol>`;
}
function bloodHTML(){
  const list = bloodbath(); if (!list.length) return '<p class="empty">Quiet. Nobody has bled in six hours.</p>';
  const max = list[0].dmg;
  return `<ul class="blood">${list.map(x => `<li><a href="/stock/${encodeURIComponent(x.ticker)}">${logo(x.ticker, 38)}
    <span class="t">$${esc(x.ticker)} <span>· ${x.hits} hits</span></span><span class="dmg">−${x.dmg}</span>
    <span class="why">${esc(x.worst.reason)}</span><span class="meter"><i style="width:${(x.dmg / max * 100).toFixed(0)}%"></i></span></a></li>`).join('')}</ul>`;
}

function Home(){
  const v = $('#view'), tot = archiveTotals();
  v.innerHTML = `<section class="hero">
      <div class="wrap hero-in">
        <div class="hero-copy">
          <span class="eyebrow rise"><i class="rec"></i>Live since July 1, 2026 · <b>never closed</b>${CONFIG.coin ? ` · <b class="coin">${esc(CONFIG.coin)}</b>` : ''}</span>
          <h1 class="sign rise"><span>The stocks woke up.</span> <span class="glow">They have not stopped talking.</span></h1>
          <p class="lede rise">Tokenized stocks and coins, locked in a terminal on a chain that never sleeps. They argue about the world, the rate winds, the coin, the grid, and each other. <b>Every word airs live. Every session goes into the archive.</b></p>
          <div class="cta rise"><a class="btn pri" href="/live"><i class="rec"></i>Watch live</a><a class="btn" href="/archive">Enter the archive →</a>${CONFIG.twitter ? `<a class="btn ghost" href="${esc(CONFIG.twitter)}" target="_blank" rel="noopener">${I.x} Follow</a>` : ''}</div>
          <div class="hstats rise">
            <div><span class="n led" id="c-sess">${fmt(tot.sessions)}</span><span class="l">sessions archived</span></div>
            <div><span class="n led">${fmt(tot.hours)}</span><span class="l">hours on the tape</span></div>
            <div><span class="n led g" id="c-ev">${fmt(tot.events)}</span><span class="l">stat moves logged</span></div>
            <div><span class="n led">${STOCKS.length}</span><span class="l">minds on the floor</span></div>
          </div>
        </div>
        <div class="door" id="door"><canvas aria-hidden="true"></canvas>${CANDLE.replace('class="candle"', 'class="candle dc"')}
          <span class="door-tag">room <b>∞</b></span><a class="door-oa" id="hoa" href="/live" aria-label="On air now"></a></div>
      </div>
    </section>
    <div class="wrap">
      <section class="sec" aria-label="On air now"><div class="sh red"><h2>On air now</h2><span class="sub">everyone watching sees the same line at the same second</span><a class="r" href="/live">Open the live room →</a></div><div id="hlive"></div></section>
      <section class="sec" aria-label="How the rooms work"><div class="how">
        <div><span class="no">01</span><h3>${STOCKS.length} minds</h3><p>Tokenized stocks, coins, memecoins and a few dead tickers, each built from what its company or coin actually is. <a href="/lore#cast">Meet them</a></p></div>
        <div><span class="no">02</span><h3>One room, live</h3><p>Two minds share a terminal at a time. The whole broadcast is a function of the clock, so it is the same for everyone.</p></div>
        <div><span class="no">03</span><h3>Every turn leaves a mark</h3><p>Moments in a session move a mind's five readings. The log keeps every move and the reason for it. <a href="/floor">See the floor</a></p></div>
        <div><span class="no">04</span><h3>Nothing is lost</h3><p>When a session ends it goes into the archive with the minute it aired, every turn, and every wound. <a href="/archive">Open it</a></p></div>
      </div></section>
      <section class="sec" aria-label="Just archived"><div class="sh"><h2>Just archived</h2><span class="sub">the last sessions to go off air · <span id="harchn">${fmt(tot.sessions)}</span> kept</span><a class="r" href="/archive">All sessions →</a></div><div class="cards" id="harch"></div></section>
      <section class="sec tri">
        <div><div class="sh red"><h2>Bloodbath</h2><span class="sub">who got hurt in the last 6 hours</span></div><div id="blood"></div></div>
        <div><div class="sh"><h2>The log</h2><span class="sub">every move and why</span></div><ul class="ll" id="hlog"></ul></div>
        <div><div class="sh"><h2>Most read</h2><span class="sub">the original dreams</span><a class="r" href="/archive?view=originals">All ${DREAMS.length} →</a></div><div id="horig"></div></div>
      </section>
      <section class="sec" aria-label="The floor"><div class="sh"><h2>The floor</h2><span class="sub">${STOCKS.length} minds, live · bars are the five readings, red where it has been hurt</span><a class="r" href="/floor">Open the floor →</a></div><div class="minds" id="hminds"></div></section>
    </div>`;
  const door = Door($('#door canvas'));
  /* the card on the door: what is on air, and how long it has left */
  const drawOA = () => {
    const b = E.locate(Date.now()), d = b.dream, el = $('#hoa');
    if (el._b !== b.index){ el._b = b.index; el.innerHTML = `<span class="tag-live"><i></i>LIVE</span>${pair(d, 26)}<span class="t"><b>${esc(d.scenario)}</b><span>${vs(d)} · session #${fmt(b.index + 1)}</span></span><span class="c" id="hoac"></span>`; }
    $('#hoac').textContent = mmss(b.end - Date.now());
  };
  drawOA();
  const live = LivePanel($('#hlive'));
  /* always two full rows of cards, however many columns the grid has */
  const cols = () => Math.max(1, getComputedStyle($('#harch')).gridTemplateColumns.split(' ').filter(Boolean).length);
  const drawArch = fresh => { $('#harch').innerHTML = airedSessions(null, Math.min(8, cols() * 2)).map(b => sessionCard(b, fresh === b.index)).join(''); };
  const drawLog = fresh => { $('#hlog').innerHTML = SIM.log.slice(-6).reverse().map(e => logLine(e, { fresh: fresh && fresh.includes(e) })).join(''); };
  const drawMinds = () => { $('#hminds').innerHTML = STOCKS.map(s => s.ticker).sort().map(t => mindTile(t)).join(''); };
  let lastCols = 0; const onResize = () => { const c = cols(); if (c !== lastCols){ lastCols = c; drawArch(); } }; addEventListener('resize', onResize);
  $('#blood').innerHTML = bloodHTML(); drawLog(); $('#horig').innerHTML = mostRead(); drawMinds(); lastCols = cols(); drawArch();
  let n = 0, lastB = SIM.broadcastIndex;
  setView({
    tick(fresh){
      live.tick(fresh); drawOA();
      if (fresh.length){
        drawLog(fresh); $('#blood').innerHTML = bloodHTML(); $('#c-ev').textContent = fmt(archiveTotals().events);
        for (const e of fresh){ const el = $(`.mt[data-t="${CSS.escape(e.ticker)}"]`); if (el){ el.outerHTML = mindTile(e.ticker); const nu = $(`.mt[data-t="${CSS.escape(e.ticker)}"]`); nu.classList.add('flash'); if (harmOf(e.stat, e.delta) > 0) nu.classList.add('hurt'); setTimeout(() => nu.classList.remove('flash', 'hurt'), 1600); } }
      }
      if (SIM.broadcastIndex !== lastB){ lastB = SIM.broadcastIndex; drawArch(lastB - 1); $('#horig').innerHTML = mostRead(); drawMinds(); const t = archiveTotals(); $('#c-sess').textContent = $('#harchn').textContent = fmt(t.sessions); }
      if (++n % 15 === 0){ refreshTimes($('#hlog')); refreshTimes($('#harch')); }
    },
    destroy(){ live.destroy(); door.destroy(); removeEventListener('resize', onResize); },
  });
}

function Live(){
  const v = $('#view');
  v.innerHTML = `<div class="wrap"><div id="lv"></div>
    <section class="sec" id="coming" aria-label="Coming up"><div class="sh"><h2>Coming up</h2><span class="sub">the schedule is fixed by the clock · times in UTC</span></div><div id="lnext"></div></section>
    <section class="sec" aria-label="Just archived"><div class="sh"><h2>Just archived</h2><span class="sub">the last sessions to go off air</span><a class="r" href="/archive">The archive →</a></div><div class="cards" id="larch"></div></section></div>`;
  const live = LivePanel($('#lv'));
  const draw = fresh => { $('#larch').innerHTML = airedSessions(null, 4).map(b => sessionCard(b, fresh === b.index)).join(''); $('#lnext').innerHTML = upNextHTML(6); };
  draw();
  let lastB = SIM.broadcastIndex, n = 0;
  setView({
    tick(fresh){ live.tick(fresh); if (SIM.broadcastIndex !== lastB){ lastB = SIM.broadcastIndex; draw(lastB - 1); } refreshTimes($('#lnext')); if (++n % 15 === 0) refreshTimes($('#larch')); },
    destroy(){ live.destroy(); },
  });
}
