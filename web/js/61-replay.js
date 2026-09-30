/* ── replay: the same typist on a private clock, full screen ── */
const Replay = (() => {
  let el = null, speed = 1, off = 0, t0 = 0, d = null, ty = null, timer = 0, lastFocus = null;
  const clock = () => off + (performance.now() - t0) * speed;
  function build(){
    el = document.createElement('div'); el.className = 'eternal'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Replay');
    el.innerHTML = `<div class="ebar"><span class="tag-live off">REPLAY</span><span id="ract"></span><b id="rsess">—</b><span id="rstat" class="muted">typing</span><span class="sp"></span>
      <div class="prog" style="flex:1 1 120px;max-width:260px;border-radius:2px"><i id="rprog"></i></div>
      <button id="rspeed" type="button" title="Speed">1×</button><button id="rskip" type="button">Skip to end</button><button id="rexit" type="button">Close ✕</button></div>
      <div class="escr" id="rscr"><div class="chat" id="rlog"></div></div>`;
    document.body.appendChild(el);
    $('#rexit').onclick = close;
    $('#rskip').onclick = () => { off = d.dur; t0 = performance.now(); };
    $('#rspeed').onclick = () => { off = clock(); t0 = performance.now(); speed = speed === 1 ? 4 : speed === 4 ? 12 : 1; $('#rspeed').textContent = `${speed}×`; };
    addEventListener('keydown', e => {
      if (!el || el.hidden) return;
      if (e.key === 'Escape' || (e.ctrlKey && e.key.toLowerCase() === 'c' && !getSelection().toString())) close();
    });
  }
  function frame(){
    timer = 0; if (el.hidden) return;
    const scr = $('#rscr'), near = scr.scrollHeight - scr.scrollTop - scr.clientHeight < 160;
    const o = clock(), r = ty.update(o);
    $('#rstat').textContent = `turn ${r.turn}/${d.turns} · ${r.status}`;
    $('#rprog').style.width = Math.min(100, o / d.dur * 100).toFixed(2) + '%';
    if (r.status === 'live') Sound.click();
    for (const e of r.fresh) Sound.hit(harmOf(e.stat, e.delta) > 0);
    if (near) scr.scrollTop = scr.scrollHeight;
    if (!r.finished) timer = setTimeout(() => requestAnimationFrame(frame), 40);
    else $('#rlog').insertAdjacentHTML('beforeend', `<div class="endcard"><b>Session terminated.</b><span>${esc(verdict(d).text)}.</span><span class="sp"></span><button type="button" class="btn sm" id="rclose2">Back to the transcript</button></div>`), $('#rclose2').onclick = close;
  }
  function open(dr){
    if (!el) build();
    d = dr; off = 0; t0 = performance.now(); speed = 1; $('#rspeed').textContent = '1×'; lastFocus = document.activeElement;
    el.hidden = false; document.body.style.overflow = 'hidden';
    $('#rsess').textContent = d.scenario;
    $('#ract').innerHTML = pair(d, 22);
    $('#rlog').innerHTML = `<span class="sysline">simulator@stockrooms:~/$ ./dream --replay ${esc(d.file)}</span>`;
    ty = Typist($('#rlog'), d, { idPrefix: 'r', popEvents: true, typing: true });
    clearTimeout(timer); frame(); $('#rexit').focus();
  }
  function close(){ if (!el) return; clearTimeout(timer); el.hidden = true; document.body.style.overflow = ''; if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true }); }
  return { open, close };
})();
