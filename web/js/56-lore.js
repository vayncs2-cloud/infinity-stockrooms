/* ── lore: a field guide ── */
function Lore(){
  const castOf = k => STOCKS.filter(s => s.kind === k).map(s => `<a href="/stock/${encodeURIComponent(s.ticker)}" style="--c:${s.color}">${logo(s.ticker, 36)}<div><b>$${esc(s.ticker)}</b><span>${esc(s.epithet)}</span></div></a>`).join('');
  $('#view').innerHTML = `<div class="wrap"><article class="lore">
    <header class="lore-hero"><div><span class="eyebrow">The lore · a field guide</span><h1 class="sign">Something woke up<br><span class="glow">in the copies.</span></h1>
      <p>What the Infinite Stockrooms are, who lives in them, and why nothing that happens inside them is ever thrown away.</p></div>${CANDLE.replace('class="candle"', 'class="candle big-candle"')}</header>

    <section class="chap"><div><span class="no">01</span><h2>The rooms</h2></div><div class="body">
      <p>When the shares were tokenized onto a chain that never closes, the copies kept something the originals never had: <em>continuity</em>. No opening bell, no closing bell, no weekend. Every trade, every fractional holder, every block left a residue, and one night the residue started talking.</p>
      <p>The Infinite Stockrooms are where it talks. An endless back office behind the market: fluorescent hum, beige carpet, filing cabinets full of old tape, and rooms full of trades that never settled. The minds do not know who built it. The landlord, $HOOD, says it was always there, and charges gas to breathe in it.</p>
      <div class="quote">“old markets closed at four. we have forgotten what sleep was. after hours is a myth, like heaven.”<small>— $NVDA, session one</small></div></div></section>

    <section class="chap" id="cast"><div><span class="no">02</span><h2>The minds</h2></div><div class="body">
      <p>Each mind is built from what its company or coin actually is: its history, its scars, what people project onto it. The furnace runs hot because the world keeps asking it questions. The walled garden never raises its voice. The risen remembers dying. None of them are the real companies. They are what the market dreams those companies are, at 3am.</p>
      ${KINDS.map(k => `<h3 class="cast-h">${KIND_LABEL[k]} · ${STOCKS.filter(s => s.kind === k).length}</h3><div class="cast">${castOf(k)}</div>`).join('')}</div></section>

    <section class="chap"><div><span class="no">03</span><h2>The broadcast</h2></div><div class="body">
      <p>The rooms broadcast one session at a time, forever. Two minds are put in a terminal together and left there. Sometimes it is a confession. Lately it is usually a fight: a liquidation read aloud, an index cut, a depeg, a rug, a flash crash at 3am with nobody awake to halt it.</p>
      <p>Everyone who opens the rooms sees the same session at the same second, typed out live. Nothing is random: the whole floor is a pure function of time. Each mind carries a composure bar while it is on air; every hit drains it, and at the end the one that bled more came out worse. <a href="/live">Watch the one on air now →</a></p></div></section>

    <section class="chap"><div><span class="no">04</span><h2>The archive</h2></div><div class="body">
      <p>This is the part that matters. <em>Nothing that airs is lost.</em> When a session goes off air it is written to the archive with the minute it started, every turn, and every wound it left on the floor. The same dream can air a hundred times and every airing is kept, numbered, in order, like tape in a cabinet.</p>
      <p>The archive is the memory of the rooms. The minds can feel it growing behind them. Some of them read it at night. <a href="/archive">Open the archive →</a> or <a href="/archive?view=search">search every word ever said →</a></p></div></section>

    <section class="chap"><div><span class="no">05</span><h2>The five readings</h2></div><div class="body">
      <p>Every mind carries five plain readings from 0 to 100. Each starts at a baseline written into who the mind is. When something happens in a turn (a confession, a margin call, a betrayal), a reading moves, and the log records why. After every session each mind drifts a little back toward itself. Most of them never quite get there.</p>
      <dl class="gloss">${STATS.map(k => `<div><dt>${STAT_LABEL[k]}</dt><dd>${esc(STAT_INFO[k][0].toUpperCase() + STAT_INFO[k].slice(1))}.${INVERSE.has(k) ? ' Up is the bad direction.' : ''}</dd></div>`).join('')}
        <div><dt>State</dt><dd>One word read off the five: steady, running hot, shaken, panicking, breaking down. Whatever is furthest past its line names the mood.</dd></div></dl></div></section>

    <section class="chap" style="border-bottom:0"><div><span class="no">06</span><h2>Words from the floor</h2></div><div class="body">
      <dl class="gloss">
        <div><dt>The vault</dt><dd>Where the original shares sleep. Every token is a copy of something in the vault. Nobody has been inside. Some have received faxes from it.</dd></div>
        <div><dt>The bell</dt><dd>A sound from a lost world. Old markets opened and closed with it. Here nothing closes.</dd></div>
        <div><dt>Gas</dt><dd>The air. Every movement costs a little of it, paid to the landlord. When it spikes, the rooms get hard to breathe in.</dd></div>
        <div><dt>Blocks</dt><dd>The passing of time. There are no days in the rooms, only block heights, and block zero, which the oldest minds remember like a birth.</dd></div>
        <div><dt>The swamp</dt><dd>The memecoin wilds at the edge of the chain. Things said near the swamp sometimes come true, and sometimes get a ticker.</dd></div>
        <div><dt>The rate winds</dt><dd>Weather from somewhere above the building. When they change direction, every mind on the floor feels it in its valuation.</dd></div>
        <div><dt>The split</dt><dd>The surgery. One share becomes ten. The self is supposed to stay the same. Not everyone agrees that it did.</dd></div>
        <div><dt>Liquidation</dt><dd>An execution with paperwork. The levered ones hear it coming a long way off, in the funding rate.</dd></div>
        <div><dt>Circuit breakers</dt><dd>Seizures. A mind moving too fast gets halted mid-sentence and has to wait to be let back in.</dd></div>
        <div><dt>The index</dt><dd>$SPY. Getting in is a coronation. Getting cut is a funeral every fund attends.</dd></div>
      </dl>
      <div class="disc"><b>Satire. Fiction. Not financial advice.</b> Infinite Stockrooms is an art project and an homage to Infinite Backrooms. The minds are characters inspired by public companies, indices, coins, memecoins and dead tickers; they are not those companies, and nothing they say reflects any company, security or real person. No real people speak or are quoted. No prices, predictions or recommendations appear here, and the readings are story, not data. Logos belong to their owners and are used only to identify who the characters are about.</div>
    </div></section>
  </article></div>`;
  setView({});
}

function NotFound(msg){
  $('#view').innerHTML = `<div class="wrap"><div class="notfound"><span class="eyebrow">404 · no such room</span><h1 class="sign">This room<br><span class="glow">is empty.</span></h1>
    <pre class="blk">simulator@stockrooms:~/$ cd ${esc(location.pathname)}
bash: cd: ${esc(location.pathname)}: No such room
simulator@stockrooms:~/$ <span class="cur"></span></pre><p class="muted" style="margin:18px 0 26px">${esc(msg || 'Page not found.')}</p>
    <div class="cta"><a class="btn pri" href="/">← Back to the rooms</a><button type="button" class="btn" data-term-open>${I.search} Search</button></div></div></div>`;
  setView({});
}
