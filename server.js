// Zero-dependency server for Railway (or anywhere with Node 18+).
// Every page route returns the app (it routes on the client); /logos/*, /api/state and /health are real.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { build } = require('./build');
const Engine = require('./engine');

const { page, count, dreams, stocks, logoFiles, twitter } = build();   // build once on boot
const PORT = process.env.PORT || 3000;

const html = Buffer.from(page);
const htmlGz = zlib.gzipSync(html, { level: 9 });
const etag = '"' + require('crypto').createHash('sha1').update(html).digest('base64url').slice(0, 20) + '"';
const logos = new Map(logoFiles.map(f => [f.toLowerCase(), fs.readFileSync(path.join(__dirname, 'logos', f))]));

/* public/: favicons, the web manifest and the share image, served from the site root */
const TYPES = { '.ico': 'image/x-icon', '.png': 'image/png', '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.txt': 'text/plain; charset=utf-8' };
const pubDir = path.join(__dirname, 'public');
const pub = new Map((fs.existsSync(pubDir) ? fs.readdirSync(pubDir) : [])
  .filter(f => TYPES[path.extname(f).toLowerCase()])
  .map(f => ['/' + f, { type: TYPES[path.extname(f).toLowerCase()], data: fs.readFileSync(path.join(pubDir, f)) }]));

/* the same engine the browser runs, so /api/state agrees with every open tab */
const E = Engine.create(JSON.parse(JSON.stringify(dreams)), stocks);
const S = E.sim();
S.advanceTo(Date.now(), false);
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
      index: b.index, cycle: b.cycle, dream: d.id, scenario: d.scenario, actors: d.actors,
      startedAt: new Date(b.start).toISOString(), endsAt: new Date(b.end).toISOString(),
      turn: b.turn, turns: d.turns, url: `/dream/${d.id}`,
    },
    stocks: Object.fromEntries(stocks.map(s => {
      const v = S.vals[s.ticker];
      return [s.ticker, { ...Object.fromEntries(E.STATS.map(k => [k, round(v[k])])),
        state: Engine.stateWord(v, s.stats, s.kind), last: S.last[s.ticker] ? S.last[s.ticker].reason : null }];
    })),
    log: S.log.slice(-50).reverse().map(e => ({ ...e, t: new Date(e.t).toISOString(), value: round(e.value) })),
  });
  cachedAt = now;
  return cached;
}

function send(req, res, code, headers, body) {
  res.writeHead(code, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
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
  if (url.startsWith('/logos/')) {
    const buf = logos.get(url.slice(7).toLowerCase());
    if (!buf) return send(req, res, 404, { 'content-type': 'text/plain' }, 'not found');
    return send(req, res, 200, { 'content-type': 'image/png', 'cache-control': 'public, max-age=604800, immutable' }, buf);
  }
  const file = pub.get(url);
  if (file) return send(req, res, 200, { 'content-type': file.type, 'cache-control': 'public, max-age=2592000' }, file.data);
  if (url === '/favicon.ico') return send(req, res, 204, {}, '');
  if ((url === '/twitter' || url === '/x') && twitter) return send(req, res, 302, { location: twitter }, '');
  if (url === '/index.html') return send(req, res, 301, { location: '/' }, '');

  // everything else is a page of the app
  const gz = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  const headers = { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-cache', etag, vary: 'accept-encoding' };
  if (req.headers['if-none-match'] === etag) return send(req, res, 304, headers, '');
  if (gz) headers['content-encoding'] = 'gzip';
  send(req, res, 200, headers, gz ? htmlGz : html);
}).listen(PORT, () => console.log(`infinity stockrooms: ${count} dreams, ${stocks.length} minds, ${logos.size} logos on :${PORT}`));
