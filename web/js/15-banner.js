/* ── the banner: ANSI Shadow drawn as crisp cells on a canvas. It marquees, catches the light, and glitches. ── */
function Banner(canvas, opts = {}){
  const rows = BANNER.map(l => Array.from(l));
  const R = rows.length, C = Math.max(...rows.map(r => r.length));
  let split = C;
  for (let c = 20; c < C - 1; c++) if (rows.every(r => (r[c] || ' ') === ' ' && (r[c+1] || ' ') === ' ')) { split = c; break; }
  const RATIO = 1.8, marquee = opts.marquee !== false;
  const ctx = canvas.getContext('2d');
  const base = document.createElement('canvas'), bctx = base.getContext('2d');
  /* mov holds the scrolled frame so the glitch effects can sample it */
  const mov = document.createElement('canvas'), mctx = mov.getContext('2d');
  const LOOP_MS = 30000;
  let W = 0, H = 0, cw = 0, ch = 0, cells = [], visible = true, raf = 0, dead = false;
  const fx = { next: 0, until: 0, slices: [], flick: [] };
  const cx = c => Math.round(c * cw), cy = r => Math.round(r * ch);

  function paint(){
    const par = canvas.parentElement.clientWidth; if (!par) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const cssH = par / C * RATIO * R;
    canvas.style.height = cssH + 'px';
    W = base.width = mov.width = canvas.width = Math.round(par * dpr);
    H = base.height = mov.height = canvas.height = Math.round(cssH * dpr);
    cw = W / C; ch = H / R; cells = [];
    const th = Math.max(1, Math.round(cw * .16));
    const g1 = bctx.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, '#fff6e6'); g1.addColorStop(1, '#bba68a');
    const g2 = bctx.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#ffe2a0'); g2.addColorStop(1, '#c4841c');
    bctx.clearRect(0, 0, W, H);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++){
      const k = rows[r][c]; if (!k || k === ' ' || k === '█') continue;
      bctx.fillStyle = c < split ? '#5a4c3c' : '#8a5c18';
      const x0 = cx(c), x1 = cx(c+1), y0 = cy(r), y1 = cy(r+1);
      const va = Math.round(x0 + (x1-x0)*.22), vb = Math.round(x0 + (x1-x0)*.62);
      const ha = Math.round(y0 + (y1-y0)*.3), hb = Math.round(y0 + (y1-y0)*.62);
      const hs = (a, b, y) => bctx.fillRect(a, y, Math.max(1, b - a), th);
      const vs_ = (x, a, b) => bctx.fillRect(x, a, th, Math.max(1, b - a));
      if (k === '═'){ hs(x0, x1, ha); hs(x0, x1, hb); }
      else if (k === '║'){ vs_(va, y0, y1); vs_(vb, y0, y1); }
      else if (k === '╔'){ vs_(va, ha, y1); hs(va, x1, ha); vs_(vb, hb, y1); hs(vb, x1, hb); }
      else if (k === '╗'){ hs(x0, vb+th, ha); vs_(vb, ha, y1); hs(x0, va+th, hb); vs_(va, hb, y1); }
      else if (k === '╚'){ vs_(va, y0, hb+th); hs(va, x1, hb); vs_(vb, y0, ha+th); hs(vb, x1, ha); }
      else if (k === '╝'){ vs_(vb, y0, hb+th); hs(x0, vb+th, hb); vs_(va, y0, ha+th); hs(x0, va+th, ha); }
    }
    bctx.save();
    bctx.shadowBlur = Math.max(2, cw * 1.1);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++){
      if (rows[r][c] !== '█') continue;
      cells.push([r, c]);
      bctx.fillStyle = c < split ? g1 : g2;
      bctx.shadowColor = c < split ? 'rgba(255,240,215,.16)' : 'rgba(243,181,65,.5)';
      bctx.fillRect(cx(c), cy(r), cx(c+1) - cx(c), cy(r+1) - cy(r));
    }
    bctx.restore();
    ctx.clearRect(0, 0, W, H); ctx.drawImage(base, 0, 0);
  }

  function frame(t){
    raf = 0;
    if (dead || !visible || document.hidden || reduceMotion) return;
    const span = W + Math.round(cw * 8), off = marquee ? Math.round((t % LOOP_MS) / LOOP_MS * span) : 0;
    mctx.clearRect(0, 0, W, H);
    mctx.drawImage(base, off, 0); if (off) mctx.drawImage(base, off - span, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(mov, 0, 0);
    ctx.save(); ctx.globalCompositeOperation = 'source-atop';
    const P = 7500, D = 2400, ph = t % P;
    if (ph < D){
      const x = -W * .25 + (ph / D) * W * 1.5, bw = W * .06;
      const g = ctx.createLinearGradient(x - bw, 0, x + bw, H * .6);
      g.addColorStop(0, 'rgba(255,246,228,0)'); g.addColorStop(.5, 'rgba(255,246,228,.6)'); g.addColorStop(1, 'rgba(255,246,228,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (Math.random() < .22 && cells.length) fx.flick.push({ cell: cells[Math.floor(Math.random() * cells.length)], until: t + 50 + Math.random() * 220, dark: Math.random() < .8 });
    fx.flick = fx.flick.filter(f => f.until > t);
    for (const f of fx.flick){
      const [r, c] = f.cell;
      let x = cx(c) + off; if (x >= W) x -= span;
      ctx.fillStyle = f.dark ? 'rgba(11,9,7,.62)' : 'rgba(255,246,228,.55)';
      ctx.fillRect(x, cy(r), cx(c+1) - cx(c), cy(r+1) - cy(r));
    }
    ctx.restore();
    if (!fx.next) fx.next = t + 1800 + Math.random() * 3000;
    if (t >= fx.next){
      fx.until = t + 70 + Math.random() * 130;
      fx.next = t + 3500 + Math.random() * 6500;
      fx.slices = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
        const h = Math.max(2, Math.round(ch * (.25 + Math.random() * 1.1)));
        return { y: Math.round(Math.random() * (H - h)), h, dx: Math.round((Math.random() < .5 ? -1 : 1) * cw * (1 + Math.random() * 5)), tint: Math.random() < .5 ? 'rgba(240,103,90,.45)' : 'rgba(255,214,133,.4)' };
      });
    }
    if (t < fx.until) for (const s of fx.slices){
      ctx.clearRect(0, s.y, W, s.h);
      ctx.drawImage(mov, 0, s.y, W, s.h, s.dx, s.y, W, s.h);
      ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = s.tint; ctx.fillRect(0, s.y, W, s.h); ctx.restore();
      ctx.globalAlpha = .35; ctx.drawImage(mov, 0, s.y, W, s.h, -s.dx * .4, s.y, W, s.h); ctx.globalAlpha = 1;
    }
    loop();
  }
  let lastT = 0;
  function loop(){ if (!raf && !dead && !reduceMotion) raf = requestAnimationFrame(t => { if (t - lastT < 30){ raf = 0; loop(); return; } lastT = t; frame(t); }); }

  let lastW = -1, pend = 0;
  const ro = new ResizeObserver(() => {
    if (pend) return;
    pend = requestAnimationFrame(() => { pend = 0; const w = canvas.parentElement.clientWidth; if (w && w !== lastW){ lastW = w; paint(); loop(); } });
  });
  ro.observe(canvas.parentElement);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) loop(); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden) loop(); };
  document.addEventListener('visibilitychange', onVis);
  return { destroy(){ dead = true; ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); cancelAnimationFrame(pend); document.removeEventListener('visibilitychange', onVis); } };
}

/* ── the door: frames receding forever toward one warm light, walked very slowly. The candle waits at the end. ── */
function Door(canvas){
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, raf = 0, dead = false, visible = true, lastT = 0;
  const R = .68, N = 12, LOOP = 6500;            // each frame is .68 the size of the one before it; one frame closer every 6.5 s
  function size(){
    const r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.max(1, Math.round(r.width * dpr)); H = canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  const rr = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  /* light caught along one edge: brightest in the middle, gone by the corners */
  function glint(x, y, w, h, horiz, a){
    const g = horiz ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, 'rgba(255,170,60,0)'); g.addColorStop(.5, `rgba(255,196,100,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(255,170,60,0)');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, ph = reduceMotion ? .35 : (t % LOOP) / LOOP;
    // the light at the end
    const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * .5);
    bg.addColorStop(0, 'rgba(255,206,120,.42)'); bg.addColorStop(.07, 'rgba(243,170,60,.2)'); bg.addColorStop(.35, 'rgba(90,52,18,.1)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const fw = W * .84, fh = H * .86;
    for (let i = -2; i <= N; i++){
      const z = i - ph, s = Math.pow(R, z), w = fw * s, h = fh * s;
      if (w > W * 1.9) continue;
      // frames fade in from the far end and fade out again as they pass the viewer
      const a = Math.min(1, Math.max(0, (1.7 - s) / .7)) * Math.min(1, Math.max(0, (N - z) / 3));
      if (a <= .01) continue;
      const x = cx - w / 2, y = cy - h / 2, lw = Math.max(1, 26 * s * dpr), r = lw * .45;
      // the room past each frame is a little warmer than the one before it
      rr(x, y, w, h, r); ctx.fillStyle = `rgba(58,32,10,${(.07 * a).toFixed(3)})`; ctx.fill();
      // the frame: a dark lacquered band, a hairline on its outside, light caught on its inside
      ctx.lineWidth = lw; ctx.strokeStyle = `rgba(6,4,3,${(.92 * a).toFixed(3)})`; rr(x, y, w, h, r); ctx.stroke();
      ctx.lineWidth = Math.max(1, dpr * .8); ctx.strokeStyle = `rgba(255,200,120,${(.1 * a).toFixed(3)})`; rr(x - lw / 2, y - lw / 2, w + lw, h + lw, r * 1.6); ctx.stroke();
      const gt = Math.max(1, lw * .15), ga = a, ins = lw * .5 + gt;
      ctx.globalCompositeOperation = 'lighter';
      glint(x + ins, y + ins - gt, w - ins * 2, gt, true, ga);
      glint(x + ins, y + h - ins, w - ins * 2, gt, true, ga * .8);
      glint(x + ins - gt, y + ins, gt, h - ins * 2, false, ga * .7);
      glint(x + w - ins, y + ins, gt, h - ins * 2, false, ga * .7);
      glint(x + ins, y + ins - gt * 4, w - ins * 2, gt * 7, true, .13 * a);
      glint(x + ins, y + h - ins - gt * 3, w - ins * 2, gt * 7, true, .1 * a);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  function frame(t){ raf = 0; if (dead || !visible || document.hidden) return; if (t - lastT >= 33){ lastT = t; draw(t); } if (!reduceMotion) raf = requestAnimationFrame(frame); }
  const ro = new ResizeObserver(() => { size(); draw(performance.now()); });
  ro.observe(canvas);
  const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
  io.observe(canvas);
  const onVis = () => { if (!document.hidden && !raf) raf = requestAnimationFrame(frame); };
  document.addEventListener('visibilitychange', onVis);
  size(); draw(performance.now()); if (!reduceMotion) raf = requestAnimationFrame(frame);
  return { destroy(){ dead = true; ro.disconnect(); io.disconnect(); cancelAnimationFrame(raf); document.removeEventListener('visibilitychange', onVis); } };
}
