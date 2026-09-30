// Zero-dependency server for Railway (or anywhere with Node 18+).
// Every page route returns a small shell carrying that route's title and share card; the app, styles and data
// are hashed assets cached for a year. /logos/*, /api/state, /health, /robots.txt and /sitemap.xml are real.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { build } = require('./build');
const Engine = require('./engine');

const t0 = Date.now();
const { count, dreams, stocks, logoFiles, config, origin, assets, shell } = build();   // build once on boot
const PORT = process.env.PORT || 3000;
const SECURITY = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'strict-origin-when-cross-origin' };

/* the app, styles and data: compressed once, served forever under their hash */
const ASSETS = new Map(Object.values(assets).map(a => {
  const raw = Buffer.from(a.body);
  return ['/assets/' + a.name, { type: a.type, raw, gz: zlib.gzipSync(raw, { level: 9 }),
    br: zlib.brotliCompressSync(raw, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 10, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length } }) }];
}));
const logos = new Map(logoFiles.map(f => [f.toLowerCase(), fs.readFileSync(path.join(__dirname, 'logos', f))]));

/* public/: favicons, the web manifest and the share images, served from the site root (subfolders too) */
const TYPES = { '.ico': 'image/x-icon', '.png': 'image/png', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain; charset=utf-8', '.mp4': 'video/mp4' };
const pubDir = path.join(__dirname, 'public');
const pub = new Map();
(function walk(dir, rel) {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.isDirectory()) { walk(path.join(dir, f.name), rel + f.name + '/'); continue; }
    const type = TYPES[path.extname(f.name).toLowerCase()];
    if (type) pub.set(rel + f.name, { type, data: fs.readFileSync(path.join(dir, f.name)) });
  }
})(pubDir, '/');

/* the same engine the browser runs, so /api/state and the share cards agree with every open tab */
const E = Engine.create(JSON.parse(JSON.stringify(dreams)), stocks);
const S = E.sim();
S.advanceTo(Date.now(), false);
const STOCK = Object.fromEntries(stocks.map(s => [s.ticker, s]));
const DREAM = Object.fromEntries(E.list.map(d => [d.id, d]));
const INVERSE = new Set(['volatility', 'fear']);
const harm = e => INVERSE.has(e.stat) ? e.delta : -e.delta;
const fmt = n => Math.round(n).toLocaleString('en-US');
const vs = d => d.actors.map(t => '$' + t).join(' vs ');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const hhmm = t => new Date(t).toISOString().slice(11, 16);
const dstr = t => { const d = new Date(t); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
function verdict(d) {
  const by = {}; for (const e of d.timeline) by[e.ticker] = (by[e.ticker] || 0) + harm(e);
  const [a, b] = d.actors, da = by[a] || 0, db = by[b] || 0;
  if (Math.max(da, db) <= 0) return 'Both came out steadier.';
  if (Math.abs(da - db) <= 3) return 'Both bled about the same.';
  return `$${da > db ? a : b} came out worse.`;
}
function worstLine(d) {
  const w = d.timeline.reduce((m, e) => !m || harm(e) > harm(m) ? e : m, null);
  return w ? ` Harshest moment: $${w.ticker} ${w.stat} ${w.delta > 0 ? '+' : '−'}${Math.abs(w.delta)}, ${w.reason}.` : '';
}
const clip = (s, n = 200) => s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
const img = p => pub.has(p) ? p : null;

/* what each route is called when it's shared; null means there is no such page */
function meta(p) {
  const seg = p.split('/').filter(Boolean);
  const cur = E.locate(Date.now());
  if (p === '/') return { path: '/' };
  if (p === '/live') return { path: p, title: 'Live', desc: `On air now: "${cur.dream.scenario}", ${vs(cur.dream)}, session #${fmt(cur.index + 1)}. Everyone watching sees the same line at the same second.` };
  if (p === '/archive' || p === '/dreams') return { path: '/archive', title: 'The archive', desc: `${fmt(cur.index)} sessions aired and kept: every turn, every wound, the minute it went out. Search every word the minds have ever said.` };
  if (p === '/floor') return { path: p, title: 'The floor', desc: `${stocks.length} minds, live: tokenized stocks, coins, memecoins and ghosts, each with five readings that sessions push around.` };
  if (p === '/lore') return { path: p, title: 'Lore', desc: 'A field guide to the Infinite Stockrooms: the rooms, the minds, the broadcast, the archive and the words from the floor.' };
  if (seg[0] === 'stock' && seg.length === 2) {
    let t = seg[1]; try { t = decodeURIComponent(t); } catch (e) {}
    const s = STOCK[t.toUpperCase().replace(/^\$/, '')]; if (!s) return null;
    return { path: `/stock/${encodeURIComponent(s.ticker)}`, title: `$${s.ticker}, ${s.epithet}`, desc: clip(s.bio), image: img(`/og/stock/${s.ticker}.jpg`) };
  }
  if (seg[0] === 'dream' && seg.length === 2) {
    const d = DREAM[seg[1]]; if (!d) return null;
    return { path: `/dream/${d.id}`, title: `${d.scenario}: ${vs(d)}`, desc: clip(`Original dream No. ${d.n}. ${d.turns} turns, ${d.timeline.length} stat moves. ${verdict(d)}${worstLine(d)}`, 260), image: img(`/og/dream/${d.id}.jpg`) };
  }
  if (seg[0] === 'session' && seg.length === 2 && /^\d+$/.test(seg[1])) {
    const n = +seg[1]; if (n < 1 || n - 1 > cur.index) return null;
    const b = E.broadcast(n - 1), d = b.dream;
    return { path: `/session/${n}`, title: `Session #${fmt(n)}: ${d.scenario}`, desc: clip(`${vs(d)}, aired ${dstr(b.start)}, ${hhmm(b.start)} UTC. ${d.turns} turns. ${verdict(d)}${worstLine(d)}`, 260), image: img(`/og/dream/${d.id}.jpg`) };
  }
  return null;
}

let cached = null, cachedAt = 0;
function state() {
  const now = Date.now();
  if (cached && now - cachedAt < 1000) return cached;
  S.advanceTo(now, false);
  const b = E.locate(now), d = b.dream;
  const round = v => Math.round(v * 10) / 10;
  cached = JSON.stringify({
    now: new Date(now).toISOString(),
    dreamsGenerated: b.index + 1,
    broadcast: {
      index: b.index, session: b.index + 1, cycle: b.cycle, dream: d.id, scenario: d.scenario, actors: d.actors,
      startedAt: new Date(b.start).toISOString(), endsAt: new Date(b.end).toISOString(),
      turn: b.turn, turns: d.turns, url: `/dream/${d.id}`,
    },
    stocks: Object.fromEntries(stocks.map(s => {
      const v = S.vals[s.ticker];
      return [s.ticker, { ...Object.fromEntries(E.STATS.map(k => [k, round(v[k])])),
        state: Engine.stateWord(v, s.stats, s.kind), last: S.last[s.ticker] ? S.last[s.ticker].reason : null }];
    })),
    archive: Array.from({ length: Math.min(10, b.index) }, (_, i) => {
      const a = E.broadcast(b.index - 1 - i);
      return { session: a.index + 1, dream: a.dream.id, scenario: a.dream.scenario, actors: a.dream.actors,
        startedAt: new Date(a.start).toISOString(), endedAt: new Date(a.end).toISOString(), url: `/session/${a.index + 1}` };
    }),
    log: S.log.slice(-50).reverse().map(e => ({ ...e, t: new Date(e.t).toISOString(), value: round(e.value) })),
  });
  cachedAt = now;
  return cached;
}

const sitemap = () => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  ['/', '/live', '/archive', '/floor', '/lore', ...E.list.map(d => `/dream/${d.id}`), ...stocks.map(s => `/stock/${encodeURIComponent(s.ticker)}`)]
    .map(p => `  <url><loc>${origin}${p}</loc></url>`).join('\n') + '\n</urlset>\n';

function send(req, res, code, headers, body) {
  res.writeHead(code, { ...SECURITY, ...headers });
  res.end(req.method === 'HEAD' ? undefined : body);
}
function encoding(req) {
  const ae = req.headers['accept-encoding'] || '';
  return /\bbr\b/.test(ae) ? 'br' : /\bgzip\b/.test(ae) ? 'gzip' : null;
}

http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(req, res, 405, { allow: 'GET, HEAD' }, '');
  let url;
  try { url = decodeURIComponent(req.url.split('?')[0]); } catch (e) { url = '/'; }

  if (url === '/health') return send(req, res, 200, { 'content-type': 'text/plain' }, 'ok');
  if (url === '/api/state') {
    return send(req, res, 200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
      'access-control-allow-origin': '*' }, state());
  }
  const asset = ASSETS.get(url);
  if (asset) {
    const enc = encoding(req), headers = { 'content-type': asset.type, 'cache-control': 'public, max-age=31536000, immutable', vary: 'accept-encoding' };
    if (enc) headers['content-encoding'] = enc;
    return send(req, res, 200, headers, enc === 'br' ? asset.br : enc === 'gzip' ? asset.gz : asset.raw);
  }
  if (url.startsWith('/assets/')) return send(req, res, 404, { 'content-type': 'text/plain', 'cache-control': 'no-store' }, 'not found');
  if (url.startsWith('/logos/')) {
    const buf = logos.get(url.slice(7).toLowerCase());
    if (!buf) return send(req, res, 404, { 'content-type': 'text/plain' }, 'not found');
    const type = url.toLowerCase().endsWith('.svg') ? 'image/svg+xml' : 'image/png';
    return send(req, res, 200, { 'content-type': type, 'cache-control': 'public, max-age=604800, immutable' }, buf);
  }
  const file = pub.get(url);
  if (file) return send(req, res, 200, { 'content-type': file.type, 'cache-control': 'public, max-age=2592000' }, file.data);
  if (url === '/favicon.ico') return send(req, res, 204, {}, '');
  if ((url === '/twitter' || url === '/x') && config.twitter) return send(req, res, 302, { location: config.twitter }, '');
  if (url === '/index.html') return send(req, res, 301, { location: '/' }, '');
  if (url === '/robots.txt') return send(req, res, 200, { 'content-type': 'text/plain; charset=utf-8' }, `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
  if (url === '/sitemap.xml') return send(req, res, 200, { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' }, sitemap());

  // everything else is a page of the app: the same shell, titled for this route (404 when there is no such page)
  const p = url.replace(/\/+$/, '') || '/';
  const m = meta(p);
  const html = Buffer.from(shell(m || { title: 'No such room', path: p }));
  const enc = encoding(req), headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', vary: 'accept-encoding' };
  if (enc) headers['content-encoding'] = enc;
  send(req, res, m ? 200 : 404, headers, enc === 'br' ? zlib.brotliCompressSync(html, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 } }) : enc === 'gzip' ? zlib.gzipSync(html) : html);
}).listen(PORT, () => console.log(`infinite stockrooms: ${count} dreams, ${stocks.length} minds, ${logos.size} logos, ready in ${Date.now() - t0}ms on :${PORT}`));
