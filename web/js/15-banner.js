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
    const g1 = bctx.createLinearGradient(0, 0, 0, H); g1.addColorStop(0, '#f2faf6'); g1.addColorStop(1, '#9fb5aa');
    const g2 = bctx.createLinearGradient(0, 0, 0, H); g2.addColorStop(0, '#8dffc0'); g2.addColorStop(1, '#16a85a');
    bctx.clearRect(0, 0, W, H);
    for (let r = 0; r < R; r++) for (let c = 0; c < C; c++){
      const k = rows[r][c]; if (!k || k === ' ' || k === '█') continue;
      bctx.fillStyle = c < split ? '#4a5a53' : '#1d7a47';
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
      bctx.shadowColor = c < split ? 'rgba(230,245,238,.18)' : 'rgba(61,220,132,.45)';
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
      g.addColorStop(0, 'rgba(240,255,248,0)'); g.addColorStop(.5, 'rgba(240,255,248,.62)'); g.addColorStop(1, 'rgba(240,255,248,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    if (Math.random() < .22 && cells.length) fx.flick.push({ cell: cells[Math.floor(Math.random() * cells.length)], until: t + 50 + Math.random() * 220, dark: Math.random() < .8 });
    fx.flick = fx.flick.filter(f => f.until > t);
    for (const f of fx.flick){
      const [r, c] = f.cell;
      let x = cx(c) + off; if (x >= W) x -= span;
      ctx.fillStyle = f.dark ? 'rgba(4,7,6,.62)' : 'rgba(240,255,248,.55)';
      ctx.fillRect(x, cy(r), cx(c+1) - cx(c), cy(r+1) - cy(r));
    }
    ctx.restore();
    if (!fx.next) fx.next = t + 1800 + Math.random() * 3000;
    if (t >= fx.next){
      fx.until = t + 70 + Math.random() * 130;
      fx.next = t + 3500 + Math.random() * 6500;
      fx.slices = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
        const h = Math.max(2, Math.round(ch * (.25 + Math.random() * 1.1)));
        return { y: Math.round(Math.random() * (H - h)), h, dx: Math.round((Math.random() < .5 ? -1 : 1) * cw * (1 + Math.random() * 5)), tint: Math.random() < .5 ? 'rgba(255,91,79,.45)' : 'rgba(124,196,192,.4)' };
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

/* ── the corridor: frames receding forever toward one warm light, walked very slowly ── */
function Corridor(canvas){
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, raf = 0, dead = false, visible = true, lastT = 0;
  const N = 14, SPEED = 1 / 5200;                // one frame-depth every 5.2 s
  function size(){
    const r = canvas.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = Math.max(1, Math.round(r.width * dpr)); H = canvas.height = Math.max(1, Math.round(r.height * dpr));
  }
  function draw(t){
    ctx.clearRect(0, 0, W, H);
    const vx = W * .5, vy = H * .5, phase = reduceMotion ? .35 : (t * SPEED) % 1;
    // the light at the end
    const g = ctx.createRadialGradient(vx, vy, 0, vx, vy, Math.min(W, H) * .5);
    g.addColorStop(0, 'rgba(255,217,140,.26)'); g.addColorStop(.18, 'rgba(242,181,58,.08)'); g.addColorStop(1, 'rgba(242,181,58,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const bw = W * .62, bh = H * .78;
    for (let i = N; i >= 0; i--){
      const z = i + 1 - phase;                   // depth: 1 is at the viewer, N is far
      const s = 1 / (z * .42);
      const w = bw * s, h = bh * s;
      if (w > W * 3.2) continue;
      // frames fade in from the far end and fade out again as they pass the viewer
      const a = Math.min(1, (N - z) / 5) * Math.min(1, Math.max(0, z - .35) / 2.2) * .42;
      if (a <= 0.01) continue;
      const x = vx - w / 2, y = vy - h / 2;
      ctx.strokeStyle = `rgba(61,220,132,${a.toFixed(3)})`;
      ctx.lineWidth = Math.max(1, dpr * Math.min(1.6, s * .8));
      ctx.strokeRect(x, y, w, h);
      // doors along both walls, like the stockroom's filing cabinets
      const dw = w * .07, dh = h * .09;
      ctx.fillStyle = `rgba(61,220,132,${(a * .16).toFixed(3)})`;
      for (let k = 0; k < 3; k++){
        const yy = y + h * (.3 + k * .16);
        ctx.fillRect(x - dw * 1.4, yy, dw, dh);
        ctx.fillRect(x + w + dw * .4, yy, dw, dh);
      }
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
