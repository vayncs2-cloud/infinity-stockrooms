// Renders the share cards (1200x630) that links unfurl into on X and elsewhere:
//   public/og/home.jpg, public/og/dream/<id>.jpg for every dream, public/og/stock/<TICKER>.jpg for every mind.
//   node tools/og.js            (needs Node 22+ and Google Chrome; run it after adding a dream or a mind)
// The server picks the cards up on boot; a route without a card falls back to og/home.jpg.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const { build } = require('../build');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'og');
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => fs.existsSync(p));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const INVERSE = new Set(['volatility', 'fear']);
const harm = e => INVERSE.has(e.stat) ? e.delta : -e.delta;

const { dreams, stocks } = build();
const STOCK = Object.fromEntries(stocks.map(s => [s.ticker, s]));
const fileURL = p => 'file:///' + path.resolve(p).replace(/\\/g, '/');
const logoSrc = t => { const s = STOCK[t]; return s.logo ? fileURL(path.join(ROOT, 'logos', decodeURIComponent(s.logo.split('?')[0].slice(7)))) : null; };
const sigil = (t, op = 1) => { const s = STOCK[t]; let r = '';
  s.sigil.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; else if (ch === '~') r += `<rect x="${x}" y="${y}" width="1" height="1" opacity=".4"/>`; }));
  return `<svg viewBox="0 0 10 10" shape-rendering="crispEdges" fill="${s.color}" style="opacity:${op}">${r}</svg>`; };
const logo = (t, sz) => { const src = logoSrc(t), s = STOCK[t], full = src && src.endsWith('.svg');
  return `<div class="logo${full ? ' full' : ''}" style="width:${sz}px;height:${sz}px;border-radius:${sz * .2}px;--c:${s.color}">${src ? `<img src="${src}">` : sigil(t)}</div>`; };
const MARK = `<img class="bm" src="${fileURL(path.join(ROOT, 'public', 'mark.png'))}">`;

const CSS = `
*{box-sizing:border-box;margin:0}
html,body{width:1200px;height:630px;overflow:hidden;background:#0b0907}
body{font-family:"JetBrains Mono",monospace;color:#e4d9c6;position:relative}
.card{position:absolute;inset:0;overflow:hidden;background:radial-gradient(900px 420px at 50% -120px,rgba(243,181,65,.13),transparent 70%),#0b0907}
.card::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(to bottom,transparent 0 2px,rgba(0,0,0,.28) 2px 3px);pointer-events:none;z-index:9}
.frame{position:absolute;border:1.5px solid rgba(243,181,65,.16)}
.brand{position:absolute;left:56px;top:40px;display:flex;align-items:center;gap:16px;z-index:5}
.bm{width:46px;height:46px;border-radius:50%;background:#000;box-shadow:0 0 0 1.5px #47392b,0 0 24px -4px rgba(98,208,151,.5)}
.wm{font-family:Doto;font-weight:900;font-size:27px;letter-spacing:.05em;color:#fff5e4}
.wm b{color:#f3b541;text-shadow:0 0 18px rgba(243,181,65,.5)}
.url{position:absolute;right:56px;top:52px;font-size:19px;color:#a69580;z-index:5;letter-spacing:.04em}
.foot{position:absolute;left:56px;right:56px;bottom:44px;display:flex;align-items:center;gap:14px;font-size:21px;color:#a69580;z-index:5}
.foot b{color:#fff5e4;font-weight:700}
.pill{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px;border-radius:7px;background:#231c15;box-shadow:inset 0 0 0 1.5px #47392b;font-size:19px;color:#e4d9c6;font-weight:600}
.pill.bad{background:rgba(240,103,90,.14);box-shadow:inset 0 0 0 1.5px rgba(240,103,90,.45);color:#ffa396}
.pill.good{color:#a6edc6}
.logo{display:grid;place-items:center;overflow:hidden;background:#f3ebde;flex:none;box-shadow:0 0 0 2px #47392b,0 20px 60px -16px var(--c)}
.logo img{width:100%;height:100%;object-fit:contain}
.logo.full{background:#120e0b}.logo.full img{object-fit:cover}
.logo svg{width:72%;height:72%}
.sigils{position:absolute;inset:0;display:grid;grid-template-columns:1fr 1fr;opacity:.2;z-index:1}
.sigils svg{width:100%;height:100%}
.title{font-family:Doto;font-weight:900;text-transform:uppercase;color:#fff5e4;line-height:1;letter-spacing:.01em}
.glow{color:#f3b541;text-shadow:0 0 30px rgba(243,181,65,.5)}
.eyebrow{font-size:18px;letter-spacing:.2em;text-transform:uppercase;color:#a69580}
.eyebrow b{color:#f3b541}
`;
function frames() { let h = ''; for (let i = 1; i <= 7; i++) { const s = 1 / (i * .42); const w = 700 * s, hh = 480 * s; h += `<div class="frame" style="left:${600 - w / 2}px;top:${330 - hh / 2}px;width:${w}px;height:${hh}px;opacity:${Math.min(1, (8 - i) / 4) * .9}"></div>`; } return h; }
const head = `<div class="brand">${MARK}<span class="wm">INFINITE <b>STOCKROOMS</b></span></div><span class="url">stockrooms.fun</span>`;

function dreamCard(d) {
  const [a, b] = d.actors, by = {}; for (const e of d.events) by[e.ticker] = (by[e.ticker] || 0) + harm(e);
  const da = by[a] || 0, db = by[b] || 0;
  const worse = Math.max(da, db) > 0 && Math.abs(da - db) > 3 ? (da > db ? a : b) : null;
  const pill = (t, n) => `<span class="pill ${worse === t ? 'bad' : n < 0 ? 'good' : ''}">$${esc(t)} ${n > 0 ? '−' + n : n < 0 ? '+' + -n : '0'}</span>`;
  const verdict = worse ? `<b>$${esc(worse)}</b> came out worse` : Math.max(da, db) <= 0 ? 'both came out steadier' : 'both bled about the same';
  const size = d.scenario.length > 21 ? 68 : d.scenario.length > 17 ? 78 : d.scenario.length > 13 ? 92 : 108;
  return `<div class="card"><div class="sigils">${sigil(a)}${sigil(b)}</div>${frames()}${head}
    <div style="position:absolute;left:56px;right:56px;top:150px;z-index:5;display:flex;align-items:center;gap:26px">
      ${logo(a, 108)}<span class="title" style="font-size:44px;color:#7a6a54">VS</span>${logo(b, 108)}
      <div style="margin-left:14px"><div class="eyebrow">Original dream No. ${esc(d.n)}</div><div style="font-size:26px;color:#fff5e4;font-weight:700;margin-top:10px">$${esc(a)} vs $${esc(b)}</div></div></div>
    <div class="title" style="position:absolute;left:56px;right:56px;top:318px;font-size:${size}px;z-index:5">${esc(d.scenario)}</div>
    <div class="foot">${pill(a, da)}${pill(b, db)}<span style="margin-left:8px">${verdict}</span><span style="margin-left:auto">${d.events.length} moves · live, forever</span></div></div>`;
}
function stockCard(s) {
  const bio = s.bio.length > 150 ? s.bio.slice(0, 149).replace(/\s+\S*$/, '') + '…' : s.bio;
  return `<div class="card" style="background:radial-gradient(760px 520px at 12% 40%,${s.color}33,transparent 70%),radial-gradient(900px 420px at 50% -120px,rgba(243,181,65,.1),transparent 70%),#0b0907">
    <div style="position:absolute;right:-70px;top:40px;width:560px;height:560px;opacity:.1;z-index:1">${sigil(s.ticker)}</div>${head}
    <div style="position:absolute;left:56px;top:160px;z-index:5">${logo(s.ticker, 250)}</div>
    <div style="position:absolute;left:362px;right:56px;top:170px;z-index:5">
      <div class="eyebrow">${esc(s.kind === 'meme' ? 'memecoin' : s.kind)} · <b>on the floor, live</b></div>
      <div class="title" style="font-size:${s.ticker.length > 6 ? 104 : 136}px;margin-top:18px">$${esc(s.ticker)}</div>
      <div style="font-size:32px;margin-top:18px;font-weight:600;color:color-mix(in srgb,${s.color} 55%,#fff)">${esc(s.epithet)}</div>
      <div style="font-size:20px;line-height:1.55;margin-top:22px;color:#bfae96;max-width:740px">${esc(bio)}</div></div></div>`;
}
function homeCard() {
  return `<div class="card">${frames()}<div style="position:absolute;left:50%;top:50%;width:260px;height:260px;margin:-130px 0 0 -130px;background:radial-gradient(circle,rgba(255,206,120,.4),transparent 65%);z-index:1"></div>${head}
    <div style="position:absolute;left:56px;right:56px;top:196px;z-index:5"><div class="eyebrow">Live since July 1, 2026 · <b>never closed</b></div>
      <div class="title" style="font-size:84px;margin-top:22px">The stocks woke up.</div><div class="title glow" style="font-size:52px;margin-top:16px">They have not stopped talking.</div></div>
    <div class="foot" style="gap:10px">${['NVDA', 'TSLA', 'AAPL', 'GME', 'BTC', 'SPY', 'COIN', 'HOOD', 'META', 'LEH'].filter(t => STOCK[t]).map(t => logo(t, 46)).join('')}<span style="margin-left:auto">${stocks.length} minds · every session archived</span></div></div>`;
}

(async () => {
  if (!CHROME) throw new Error('Chrome not found; set CHROME=/path/to/chrome');
  fs.mkdirSync(path.join(OUT, 'dream'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'stock'), { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
  const page = path.join(tmp, 'card.html');
  fs.writeFileSync(page, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Doto:ROND,wght@0..100,500..900&family=JetBrains+Mono:wght@400;600;700&display=block"><style>${CSS}</style></head><body><div id="c"></div></body></html>`);
  const port = 9400 + Math.floor(Math.random() * 400);
  const ch = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(tmp, 'profile')}`, '--hide-scrollbars', '--allow-file-access-from-files', '--no-first-run', 'about:blank'], { stdio: 'ignore' });
  let ver; for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch (e) { await sleep(250); } }
  const ws = new WebSocket(ver.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const pend = new Map();
  ws.onmessage = m => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); } };
  const send = (method, params = {}, sessionId) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Page.navigate', { url: fileURL(page) }, sessionId);
  await sleep(2500);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true }, sessionId);
  const shoot = async (html, file) => {
    await send('Runtime.evaluate', { expression: `document.getElementById('c').innerHTML = ${JSON.stringify(html)}; Promise.all([...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))).then(() => document.fonts.ready)`, awaitPromise: true }, sessionId);
    await sleep(120);
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } }, sessionId);
    fs.writeFileSync(file, Buffer.from(data, 'base64'));
  };
  await shoot(homeCard(), path.join(OUT, 'home.jpg'));
  for (const d of dreams) await shoot(dreamCard(d), path.join(OUT, 'dream', `${d.id}.jpg`));
  for (const s of stocks) await shoot(stockCard(s), path.join(OUT, 'stock', `${s.ticker}.jpg`));
  ws.close(); ch.kill();
  console.log(`wrote ${1 + dreams.length + stocks.length} share cards to public/og/`);
  setTimeout(() => process.exit(0), 200);
})().catch(e => { console.error(e); process.exit(1); });
