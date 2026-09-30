/* ── one mind: a character sheet ── */
function chartSVG(t, k){
  const a = SIM.histOf(t, k), base = STOCK[t].stats[k], w = 300, h = 70, col = ink(colorOf(t));
  const y = v => (h - 3 - v / 100 * (h - 6)).toFixed(1);
  const pts = a.map((v, i) => `${(i / Math.max(1, a.length - 1) * w).toFixed(1)},${y(v)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${STAT_LABEL[k]} over the last ${a.length} broadcasts">
    <line x1="0" x2="${w}" y1="${y(base)}" y2="${y(base)}" stroke="var(--faint)" stroke-dasharray="2 4" vector-effect="non-scaling-stroke"/>
    ${a.length > 1 ? `<polyline points="0,${h} ${pts} ${w},${h}" fill="color-mix(in srgb, ${colorOf(t)} 12%, transparent)" stroke="none"/>
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>` : ''}</svg>`;
}

function Stock(t){
  const s = STOCK[t]; if (!s) return NotFound(`No mind called $${t} on this floor.`);
  const v = $('#view');
  const rel = Object.entries(s.relations || {});
  const inbound = STOCKS.filter(o => o.ticker !== t && o.relations && o.relations[t] && !(s.relations || {})[o.ticker]);
  const full = E.logFor(t, SIM.now);
  const mine = airedSessions(d => d.actors.includes(t), 8);
  const rec = RECORDS[t];
  const onAirNow = () => E.locate(Date.now()).dream.actors.includes(t);
  let shown = 30;
  v.innerHTML = `<div class="wrap"><a class="back" href="/floor">← The floor</a>
    <header class="shero" style="--c:${s.color};--sig:${sigilURL(t)}">${logo(t, 120)}
      <div style="min-width:0"><span class="eyebrow">${esc(KIND_ONE[s.kind] || s.kind)}${s.kind === 'ghost' ? ' · delisted' : ''}</span><h1>$${esc(t)}</h1><div class="ep">${esc(s.epithet)}</div>
        <div class="smeta"><span data-sw>${stateHTML(t)}</span><span id="sair"></span><span class="chip"><b>${fmt(full.length)}</b> recorded moves</span><span class="chip">hurt <b id="shurt">${hurtOf(t)}</b></span>
          <button type="button" class="btn sm ghost" data-x="$${esc(t)}, ${esc(s.epithet)}, on the floor of the Infinite Stockrooms" data-u="/stock/${encodeURIComponent(t)}">${I.x} Share</button></div></div>
      <div class="rec-box"><span class="led">${rec.w}–${rec.l}–${rec.e}</span><small>ahead · behind · even<br>in ${rec.bouts.length} original dream${rec.bouts.length === 1 ? '' : 's'}</small></div></header>
    <div class="sgrid">
      <section class="panel dossier" aria-label="Dossier"><dl><dt>Who</dt><dd class="q">${esc(s.bio)}</dd><dt>Voice</dt><dd>${esc(s.voice)}</dd><dt>Fears</dt><dd>${esc(s.fears)}</dd><dt>Wants</dt><dd>${esc(s.desires)}</dd></dl></section>
      <section class="panel readings" aria-label="Readings now"><div class="sh"><h2>Readings now</h2><span class="sub">dashed = where it started</span></div><div id="sradar">${radar(t)}</div><div id="sbars">${statsHTML(t)}</div></section>
    </div>
    <section class="sec" style="margin-top:28px"><div class="sh"><h2>History</h2><span class="sub">last ${SIM.histOf(t, 'confidence').length} broadcasts · dashed = baseline</span></div><div class="charts" id="charts"></div></section>
    <div class="cols">
      <section><div class="sh"><h2>Record</h2><span class="sub">who came out worse, dream by dream</span></div>
        ${rec.bouts.length ? `<ul class="rival">${rec.bouts.map(x => `<li><a href="/dream/${x.d.id}">${logo(x.opp, 38)}<span class="nm"><b>vs $${esc(x.opp)}</b><span>${esc(x.d.scenario)} · took ${x.own > 0 ? '−' + x.own : '+' + -x.own}, gave ${x.theirs > 0 ? '−' + x.theirs : '+' + -x.theirs}</span></span><span class="res ${x.res}">${x.res === 'w' ? 'ahead' : x.res === 'l' ? 'behind' : 'even'}</span></a></li>`).join('')}</ul>`
          : `<p class="empty">$${esc(t)} has never had a room of its own. It shows up in other minds' sessions.</p>`}
        ${rel.length || inbound.length ? `<div class="sh" style="margin-top:36px"><h2>Relations</h2></div><ul class="rel">
          ${rel.map(([o, why]) => `<li>${logo(o, 32)}<span>${STOCK[o] ? tk(o) : '$' + esc(o)} <span class="muted">— ${esc(why)}</span></span></li>`).join('')}
          ${inbound.map(o => `<li>${logo(o.ticker, 32)}<span>${tk(o.ticker)} <span class="muted">— from its side: ${esc(o.relations[t])}</span></span></li>`).join('')}</ul>` : ''}</section>
      <section><div class="sh"><h2>Change log</h2><span class="sub">every move and why</span></div><ul class="ll" id="slog"></ul><div class="more" id="more"></div></section>
    </div>
    <section class="sec"><div class="sh"><h2>In the archive</h2><span class="sub">latest sessions starring $${esc(t)}</span><a class="r" href="/archive?stock=${encodeURIComponent(t)}">All →</a></div>
      ${mine.length ? `<div class="cards">${mine.map(b => sessionCard(b)).join('')}</div>` : '<p class="empty">Not on air yet.</p>'}</section></div>`;
  const drawCharts = () => { $('#charts').innerHTML = STATS.map(k => { const a = SIM.histOf(t, k);
    return `<div class="panel chart"><div class="ch"><b>${STAT_LABEL[k]}</b><span class="v">${Math.round(SIM.vals[t][k])}</span></div>${chartSVG(t, k)}<div class="ch" style="margin:8px 0 0;font-size:11px"><span>range</span><span>${a.length ? Math.round(Math.min(...a)) + '–' + Math.round(Math.max(...a)) : '—'}</span></div></div>`; }).join(''); };
  const drawLog = fresh => {
    $('#slog').innerHTML = full.slice(0, shown).map(e => logLine(e, { noTicker: true, fresh: fresh && fresh.includes(e) })).join('') || '<li><span></span><span class="muted">No moves yet.</span></li>';
    $('#more').innerHTML = full.length > shown ? `<button type="button" class="btn">Load ${Math.min(100, full.length - shown)} more of ${fmt(full.length - shown)}</button>` : '';
    const b = $('#more button'); if (b) b.onclick = () => { shown += 100; drawLog(); };
  };
  const air = () => { $('#sair').innerHTML = onAirNow() ? '<a class="chip red" href="/live"><i class="rec"></i>on air now</a>' : mine.length ? `<span class="chip">last on air <b><time data-t="${mine[0].end}">${ago(mine[0].end)}</time></b></span>` : ''; };
  drawCharts(); drawLog(); air();
  let histN = SIM.broadcastIndex, n = 0;
  setView({ tick(fresh){
    const m = fresh.filter(e => e.ticker === t);
    if (m.length){ full.unshift(...m.slice().reverse()); shown += m.length; drawLog(m); updateStats($('#sbars'), t, fresh); $('#sradar').innerHTML = radar(t); $('#shurt').textContent = hurtOf(t); }
    if (SIM.broadcastIndex !== histN){ histN = SIM.broadcastIndex; drawCharts(); updateStats($('#sbars'), t, []); $('#sradar').innerHTML = radar(t); air(); }
    if (m.length || n % 5 === 0) $('[data-sw]', v).innerHTML = stateHTML(t);
    if (++n % 15 === 0) refreshTimes(v);
  }});
}
