/* ── the typist: renders a dream as a chat at a given offset (ms). Pure: offset in, DOM out.
      offset = Infinity renders the whole transcript at once (the reader pages use that). ── */
function Typist(into, d, opts = {}){
  const segs = d.segs, els = [], msgs = {};
  let made = 0, done = 0, shownEv = 0, body = into;
  const cur = document.createElement('span'); cur.className = 'cur';
  const typing = document.createElement('div'); typing.className = 'typing';
  const prefix = opts.idPrefix || 't';
  function make(i){
    const g = segs[i];
    if (g.t === 'spk'){
      const s = STOCK[g.who] || { epithet: '', color: '#c3c7ce' };
      if (g.sys){
        const el = document.createElement('details'); el.className = 'sysp';
        el.innerHTML = `<summary>system prompt · $${esc(g.who)}</summary><div class="mb"></div>`;
        into.appendChild(el); body = el.lastChild; els[i] = el; return;
      }
      const el = document.createElement('article'); el.className = 'msg'; el.id = prefix + g.turn; el.dataset.turn = g.turn; el.dataset.who = g.who;
      el.style.setProperty('--c', s.color);
      el.innerHTML = `<div class="av">${logo(g.who, 40)}</div><div class="mc"><div class="mh"><a class="who" href="/stock/${encodeURIComponent(g.who)}">$${esc(g.who)}</a><span class="ep">${esc(s.epithet)}</span><a class="tn" href="#${prefix}${g.turn}" title="Link to this turn">#${g.turn}</a></div><div class="mb"></div><div class="evs" hidden></div></div>`;
      into.appendChild(el); body = el.querySelector('.mb'); msgs[g.turn] = el; els[i] = el; return;
    }
    const el = document.createElement('span');
    el.className = g.t === 'code' ? 'blk' : 'txt';
    body.appendChild(el); els[i] = el;
  }
  function fill(i, o){
    const g = segs[i], el = els[i];
    if (g.t === 'spk') return true;
    if (g.t === 'code'){
      const n = Math.min(g.lines.length, Math.floor((o - g.at) / Engine.timing.CODE_LINE_MS) + 1);
      if (el._n !== n){ el.textContent = g.lines.slice(0, n).join('\n'); el._n = n; }
      return n >= g.lines.length;
    }
    const n = Math.min(g.s.length, Math.floor((o - g.at) * Engine.timing.CHARS_PER_SEC / 1000));
    if (el._n !== n){ el.textContent = g.s.slice(0, n); el._n = n; }
    return n >= g.s.length;
  }
  return {
    msgs,
    update(o){
      let grew = false;
      while (made < segs.length && segs[made].at <= o){ make(made++); grew = true; }
      for (let i = done; i < made; i++){ const full = fill(i, o); if (full && i === done) done++; }
      // stat events fire the moment their turn starts; they land under that message
      const tl = d.timeline, fresh = [];
      while (shownEv < tl.length && tl[shownEv].at <= o){
        const e = tl[shownEv++], m = msgs[e.turn];
        if (m){ const box = m.querySelector('.evs'); box.hidden = false; box.insertAdjacentHTML('beforeend', evLine(e, opts.popEvents)); }
        fresh.push(e);
      }
      const finished = o >= d.dur;
      const nx = segs[made];
      const thinking = !finished && nx && nx.t === 'spk' && !nx.sys && nx.at - o <= Engine.timing.TURN_PAUSE_MS && done >= made;
      if (!finished && !thinking){
        let tgt = els[Math.max(0, made - 1)];
        if (tgt && tgt.classList && tgt.classList.contains('msg')) tgt = tgt.querySelector('.mb');
        else if (tgt && tgt.tagName === 'DETAILS') tgt = tgt.lastChild;
        if (tgt && tgt.lastChild !== cur) tgt.appendChild(cur);
      } else cur.remove();
      if (opts.typing && thinking){
        if (typing._who !== nx.who){ typing._who = nx.who; typing.innerHTML = `${logo(nx.who, 22)}<span>$${esc(nx.who)} is typing</span><span class="dots"><i></i><i></i><i></i></span>`; }
        if (typing.parentNode !== into || into.lastChild !== typing) into.appendChild(typing);
      } else typing.remove();
      const status = finished ? 'ended' : thinking ? 'typing' : 'live';
      let turn = 0; while (turn < d.turns && d.turnAt[turn + 1] <= o) turn++;
      return { grew, fresh, status, turn, finished };
    },
  };
}
function transcript(into, d, opts){ const t = Typist(into, d, opts); t.update(Infinity); return t; }

/* ── sound: soft key clicks while a mind types, a low hit when something bleeds. Off until asked. ── */
const Sound = (() => {
  let ac = null, on = store.get('sr-sound', '0') === '1', noise = null, lastClick = 0;
  function ctx(){
    if (!ac){ const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A();
      noise = ac.createBuffer(1, ac.sampleRate * .05, ac.sampleRate); const ch = noise.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 3); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function click(){
    if (!on || document.hidden) return; const a = ctx(); if (!a) return;
    const now = a.currentTime; if (now - lastClick < .045) return; lastClick = now;
    const s = a.createBufferSource(); s.buffer = noise; s.playbackRate.value = .8 + Math.random() * .6;
    const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800 + Math.random() * 1600; f.Q.value = 1.2;
    const g = a.createGain(); g.gain.value = .07;
    s.connect(f).connect(g).connect(a.destination); s.start(now);
  }
  function hit(hurt){
    if (!on || document.hidden) return; const a = ctx(); if (!a) return;
    const now = a.currentTime, o = a.createOscillator(), g = a.createGain();
    o.type = hurt ? 'sawtooth' : 'sine';
    o.frequency.setValueAtTime(hurt ? 150 : 520, now); o.frequency.exponentialRampToValueAtTime(hurt ? 48 : 780, now + .25);
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(hurt ? .11 : .05, now + .01); g.gain.exponentialRampToValueAtTime(.0001, now + .35);
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = hurt ? 900 : 3000;
    o.connect(f).connect(g).connect(a.destination); o.start(now); o.stop(now + .4);
  }
  return {
    get on(){ return on; },
    toggle(){ on = !on; store.set('sr-sound', on ? '1' : '0'); if (on) ctx(); return on; },
    unlock(){ if (on) ctx(); },
    click, hit,
  };
})();
