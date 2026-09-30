// Builds the site from dreams/*.txt (+ .events.json), stocks.js, logos/, banner.txt, config.js, engine.js and web/.
//   node build.js            -> writes dist/index.html (the whole app inlined into one static page)
// server.js calls build() on boot and serves the parts instead: a small HTML shell per route (carrying that
// route's title and share card), plus the styles, the app and the data as hashed, long-cached assets.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// starting view counts; add `views: 1234` to a dream's header to set your own
const SEED_VIEWS = { '01':184302,'02':96871,'12':77412,'06':41209,'10':38550,'04':22917,
                     '07':19480,'09':17062,'05':14338,'03':12904,'08':9771,'11':6215,
                     '13':8844,'14':7310,'15':11976,'16':5402,'17':6688,'18':4921,
                     '19':7755,'20':9130,'21':5874,'22':10244,'23':6391,'24':8067 };
const STATS = ['volatility', 'awareness', 'confidence', 'fear', 'stability'];
const SITE = 'https://stockrooms.fun';
const WEB = path.join(__dirname, 'web');

function loadStocks() {
  delete require.cache[require.resolve('./stocks.js')];
  const stocks = require('./stocks.js').map(s => ({ ...s }));
  const logoDir = path.join(__dirname, 'logos');
  const files = fs.existsSync(logoDir) ? fs.readdirSync(logoDir).filter(f => /\.(png|svg)$/i.test(f)) : [];
  const seen = new Set();
  for (const s of stocks) {
    if (seen.has(s.ticker)) throw new Error(`stocks.js: duplicate ticker ${s.ticker}`);
    seen.add(s.ticker);
    for (const k of STATS) if (!(s.stats[k] >= 0 && s.stats[k] <= 100)) throw new Error(`stocks.js: ${s.ticker}.stats.${k} must be 0-100`);
    if (!Array.isArray(s.sigil) || s.sigil.length !== 10) throw new Error(`stocks.js: ${s.ticker}.sigil must be 10 rows`);
    const f = files.find(x => x.toLowerCase() === `${s.ticker.toLowerCase()}.png`) || files.find(x => x.toLowerCase() === `${s.ticker.toLowerCase()}.svg`);
    if (f) s.logo = `/logos/${encodeURIComponent(f)}?v=${Math.round(fs.statSync(path.join(logoDir, f)).mtimeMs / 1000).toString(36)}`;
  }
  return { stocks, logoFiles: files };
}

function loadEvents(file, turnsKnown, tickers) {
  if (!fs.existsSync(file)) { console.warn(`warning: no ${path.basename(file)} (dream has no stat events yet)`); return []; }
  let ev;
  try { ev = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { throw new Error(`${path.basename(file)}: invalid JSON: ${e.message}`); }
  if (!Array.isArray(ev)) throw new Error(`${path.basename(file)}: must be a JSON array`);
  return ev.map((e, i) => {
    const where = `${path.basename(file)} event ${i}`;
    if (!Number.isInteger(e.turn) || e.turn < 1 || e.turn > turnsKnown) throw new Error(`${where}: turn ${e.turn} out of 1..${turnsKnown}`);
    if (!tickers.has(e.ticker)) throw new Error(`${where}: unknown ticker ${e.ticker}`);
    if (!STATS.includes(e.stat)) throw new Error(`${where}: bad stat ${e.stat}`);
    if (!Number.isInteger(e.delta) || !e.delta || Math.abs(e.delta) > 25) throw new Error(`${where}: bad delta ${e.delta}`);
    if (!e.reason) throw new Error(`${where}: missing reason`);
    return { turn: e.turn, ticker: e.ticker, stat: e.stat, delta: e.delta, reason: String(e.reason) };
  });
}

function loadDreams(tickers) {
  const dir = path.join(__dirname, 'dreams');
  const dreams = fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort().map(f => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
    const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
    if (!m) throw new Error(`missing --- header in dreams/${f}`);
    const head = {};
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':'); if (i > 0) head[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    for (const k of ['scenario', 'actors', 'date']) if (!head[k]) throw new Error(`dreams/${f} header needs "${k}:"`);
    const dm = head.date.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
    if (!dm) throw new Error(`dreams/${f} date must look like 2026-09-27 03:12`);
    const ts = Date.UTC(+dm[1], +dm[2] - 1, +dm[3], +dm[4], +dm[5]) / 1000;
    const body = raw.slice(m[0].length).replace(/^\n+|\n+$/g, '');
    let turns = 0, inCode = false;
    for (const line of body.split('\n')) {
      if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
      const s = !inCode && line.match(/^<([A-Z0-9_.$-]+)(#SYSTEM)?>\s*$/);
      if (s && !s[2]) turns++;
    }
    const actors = head.actors.split(',').map(a => a.trim().toUpperCase().replace(/^\$/, ''));
    for (const a of actors) if (!tickers.has(a)) throw new Error(`dreams/${f}: actor ${a} is not in stocks.js`);
    return {
      id: `c${ts}`, ts, time: `${dm[4]}:${dm[5]}`, n: f.slice(0, 2),
      scenario: head.scenario, actors,
      file: `conversation_${ts}_scenario_${head.scenario.replace(/\s+/g, '_')}.txt`,
      views: parseInt(head.views || SEED_VIEWS[f.slice(0, 2)] || 3000, 10),
      body,
      events: loadEvents(path.join(dir, f.replace(/\.txt$/, '.events.json')), turns, tickers),
    };
  });
  const ids = new Set();
  for (const d of dreams) { if (ids.has(d.id)) throw new Error(`two dreams share the date ${d.id}`); ids.add(d.id); }
  return dreams;
}

const read = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const js = v => JSON.stringify(v).replace(/<\//g, '<\\/').replace(/<!--/g, '<\\!--').replace(/[\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16));
const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 10);
const escAttr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function build() {
  const { stocks, logoFiles } = loadStocks();
  const tickers = new Set(stocks.map(s => s.ticker));
  const dreams = loadDreams(tickers);
  delete require.cache[require.resolve('./config.js')];
  const config = { ...require('./config.js') };

  const banner = read(path.join(__dirname, 'banner.txt')).replace(/\n+$/, '').split('\n');
  const engine = read(path.join(__dirname, 'engine.js'));
  const scripts = fs.readdirSync(path.join(WEB, 'js')).filter(f => f.endsWith('.js')).sort()
    .map(f => `/* ── web/js/${f} ── */\n` + read(path.join(WEB, 'js', f))).join('\n');

  // share cards need absolute URLs: PUBLIC_URL wins, then the production domain
  const origin = (process.env.PUBLIC_URL || SITE).replace(/\/+$/, '');

  const css = read(path.join(WEB, 'style.css'));
  const app = `${engine}\n;(() => {\n'use strict';\n${scripts}\n})();\n`;
  const data = `window.SR=${js({ config, banner, stocks, dreams, origin })};\n`;
  const assets = {
    css:  { name: `app.${hash(css)}.css`,  type: 'text/css; charset=utf-8', body: css },
    app:  { name: `app.${hash(app)}.js`,   type: 'text/javascript; charset=utf-8', body: app },
    data: { name: `data.${hash(data)}.js`, type: 'text/javascript; charset=utf-8', body: data },
  };

  const tpl = read(path.join(WEB, 'index.html'));
  /* one page per route: the same shell with that route's title, description, canonical url and share image */
  function shell(meta = {}, inline = false) {
    const m = {
      title: meta.title ? `${meta.title} · Infinite Stockrooms` : 'Infinite Stockrooms',
      desc: meta.desc || 'Tokenized stocks and coins talk to each other in the dark, live, around the clock. Every session is archived.',
      url: origin + (meta.path || '/'),
      image: origin + (meta.image || '/og/home.jpg'),
      imageW: 1200, imageH: 630,
    };
    const head = inline
      ? `<style>${css}</style>`
      : `<link rel="preload" href="/assets/${assets.data.name}" as="script"><link rel="preload" href="/assets/${assets.app.name}" as="script"><link rel="stylesheet" href="/assets/${assets.css.name}">`;
    const tail = inline
      ? `<script>${data.replace(/<\/script/gi, '<\\/script')}</script><script>${app.replace(/<\/script/gi, '<\\/script')}</script>`
      : `<script src="/assets/${assets.data.name}" defer></script><script src="/assets/${assets.app.name}" defer></script>`;
    return tpl
      .replace(/%TITLE%/g, () => escAttr(m.title))
      .replace(/%DESC%/g, () => escAttr(m.desc))
      .replace(/%URL%/g, () => escAttr(m.url))
      .replace(/%IMAGE%/g, () => escAttr(m.image))
      .replace(/%IMAGE_W%/g, m.imageW).replace(/%IMAGE_H%/g, m.imageH)
      .replace(/%HANDLE%/g, () => escAttr(config.handle || ''))
      .replace(/%TWITTER%/g, () => escAttr(config.twitter || ''))
      .replace(/%COIN%/g, () => escAttr(config.coin || ''))
      .replace('<!--HEAD-->', () => head)
      .replace('<!--SCRIPTS-->', () => tail);
  }

  return { count: dreams.length, dreams, stocks, logoFiles, config, origin, assets, shell, twitter: config.twitter };
}

module.exports = { build };

if (require.main === module) {
  const { shell, count } = build();
  const page = shell({}, true);
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), page);
  console.log(`built ${count} dreams -> dist/index.html (${Math.round(page.length / 1024)} KB)`);
}
