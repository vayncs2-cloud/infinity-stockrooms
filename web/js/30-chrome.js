/* ── header, tape, footer ── */
function caHTML(){
  if (!CONFIG.ca) return '';
  return `<div class="ca"><b>${esc(CONFIG.coin)}</b><code title="${esc(CONFIG.ca)}">${esc(CONFIG.ca.slice(0, 6) + '…' + CONFIG.ca.slice(-4))}</code><button type="button" data-ca>Copy CA</button></div>`;
}
document.addEventListener('click', e => { if (e.target.closest('[data-ca]')) copyText(CONFIG.ca, 'Contract address copied'); });

function renderChrome(){
  if (!CONFIG.twitter) $('#xbtn').remove();
  $('#foot').innerHTML = `<div class="wrap"><div class="foot-in">
      <div class="fb">${CANDLE}<div><p class="big">The market never closes.<br><em>Neither do the rooms.</em></p>
        <p>Tokenized stocks and coins talking to each other in a simulated terminal, live, forever. Every session that airs is kept in the archive.</p>${caHTML()}</div></div>
      <div><h4>Rooms</h4><ul><li><a href="/live">Live broadcast</a></li><li><a href="/archive">The archive</a></li><li><a href="/archive?view=originals">Original dreams</a></li><li><a href="/archive?view=search">Search the transcripts</a></li></ul></div>
      <div><h4>Floor</h4><ul><li><a href="/floor">All ${STOCKS.length} minds</a></li><li><a href="/floor?view=cards">Mind cards</a></li><li><a href="/lore">Lore</a></li><li><a href="/lore#cast">The cast</a></li></ul></div>
      <div><h4>Signal</h4><ul>${CONFIG.twitter ? `<li><a href="${esc(CONFIG.twitter)}" target="_blank" rel="noopener">X · ${esc(CONFIG.handle || '')} ↗</a></li>` : ''}<li><a href="/api/state" data-native>/api/state</a></li><li><button type="button" class="linkish" data-term-open style="color:var(--dim)">Open the terminal <kbd>/</kbd></button></li></ul></div>
    </div>
    <div class="fine"><span>Fiction. Nothing here is financial advice, a price prediction, or the words of any real person. Logos belong to their owners.</span><span>An homage to Infinite Backrooms.</span></div></div>`;
}
function tape(){
  const one = STOCKS.map(s => { const l = SIM.last[s.ticker];
    const bad = l && harmOf(l.stat, l.delta) > 0;
    return `<span class="ti">${logo(s.ticker, 16)}<b>$${esc(s.ticker)}</b>${l ? `<span class="${bad ? 'down' : 'up'}">${l.delta > 0 ? '▲' : '▼'} ${STAT_LABEL[l.stat].toLowerCase()} ${signed(l.delta)}</span>` : ''}<span class="s">${esc(stateOf(s.ticker))}</span></span>`; }).join('');
  $('#tape').innerHTML = one + one;
}
function tickChrome(){
  const b = E.locate(Date.now()), d = b.dream;
  const oa = $('#onair');
  if (oa._b !== b.index){
    oa._b = b.index;
    oa.innerHTML = `<span class="oa-t"><i class="rec"></i>ON AIR</span><span class="oa-s">${esc(d.scenario)}</span><span class="oa-v">${pair(d, 18)}</span><span class="oa-c" id="oac"></span>`;
    oa.title = `On air now: ${d.scenario}, $${d.actors.join(' vs $')}`;
    $('#navct').textContent = fmt(b.index);
  }
  $('#oac').textContent = mmss(b.end - Date.now());
}
