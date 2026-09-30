/* ── data, config and small helpers ── */
const { config: CONFIG, banner: BANNER, stocks: STOCKS, dreams: DREAMS, origin: ORIGIN } = window.SR;

const STAT_LABEL = { volatility: 'Volatility', awareness: 'Awareness', confidence: 'Confidence', fear: 'Fear', stability: 'Stability' };
const STAT_INFO = {
  volatility: 'how hot and erratic it runs right now',
  awareness:  'how clearly it sees what it is: a token, a copy, a mind on a chain',
  confidence: 'how much it believes in itself, and how much its holders do',
  fear:       'how close the thing it fears most feels',
  stability:  'how whole it feels; splits, dilution, liquidations and fights wear it down',
};
/* for these two, going up is the bad direction */
const INVERSE = new Set(['volatility', 'fear']);
const harmOf = (stat, delta) => INVERSE.has(stat) ? delta : -delta;
const STATS = Engine.STATS;
const KINDS = ['stock', 'index', 'coin', 'meme', 'ghost'];
const KIND_LABEL = { stock: 'Stocks', index: 'Index', coin: 'Coins', meme: 'Memes', ghost: 'Ghosts' };
const KIND_ONE = { stock: 'stock', index: 'index', coin: 'coin', meme: 'memecoin', ghost: 'ghost' };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const dstr = ts => { const d = new Date(ts * 1000); return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`; };
const dshort = ts => { const d = new Date(ts * 1000); return `${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCDate()}`; };
const dayKey = t => Math.floor(t / 864e5);
function dayLabel(t){
  const k = dayKey(t), today = dayKey(Date.now()), d = new Date(t);
  const base = `${DAYS[d.getUTCDay()]}, ${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return k === today ? `<b>Today</b> · ${base}` : k === today - 1 ? `<b>Yesterday</b> · ${base}` : base;
}
const store = { get(k, d){ try { return localStorage.getItem(k) ?? d; } catch(e){ return d; } }, set(k, v){ try { localStorage.setItem(k, v); } catch(e){} } };
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function ago(t){
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (s < 60) return s + 's ago'; const m = Math.round(s / 60); if (m < 60) return m + 'm ago';
  const h = Math.round(m / 60); if (h < 48) return h + 'h ago'; return Math.round(h / 24) + 'd ago';
}
function until(t){
  const s = Math.max(0, Math.round((t - Date.now()) / 1000));
  if (s < 3600) return mmss(s * 1000); const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
const mmss = ms => { const s = Math.max(0, Math.round(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const hhmm = t => { const d = new Date(t); return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
const signed = n => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
/* stock colours are picked for logos; lift the dark ones so they read on black */
const ink = c => `color-mix(in srgb, ${c} 62%, #fff)`;

/* ── the engine: the same pure function of time as the server's /api/state ── */
const E = Engine.create(DREAMS, STOCKS);
const SIM = E.sim();
SIM.advanceTo(Date.now(), false);
const STOCK = Object.fromEntries(STOCKS.map(s => [s.ticker, s]));
const DREAM = Object.fromEntries(DREAMS.map(d => [d.id, d]));
const views = d => d.views + E.aired(d.id, Date.now()) * 17;
/* the harshest single event in a dream: the headline of every archived session */
const worst = d => d.timeline.reduce((w, e) => !w || harmOf(e.stat, e.delta) > harmOf(w.stat, w.delta) ? e : w, null);

/* ── damage: every event hurts or heals; a session's damage is the sum, per mind ── */
const HP_SCALE = 180;                          // the worst sessions on record take a mind close to this
function damage(d, upto = Infinity){
  const by = {};
  for (const e of d.timeline){ if (e.at > upto) break; by[e.ticker] = (by[e.ticker] || 0) + harmOf(e.stat, e.delta); }
  return by;
}
const composure = dmg => clamp(100 - Math.max(0, dmg) * 100 / HP_SCALE, 0, 100);
/* who came out worse: the actor that actually bled, and clearly more than the other (within 3 is even).
   when both walk out steadier nobody lost. */
const VERDICTS = new Map();
function verdict(d){
  if (VERDICTS.has(d.id)) return VERDICTS.get(d.id);
  const by = damage(d), [a, b] = d.actors, da = by[a] || 0, db = by[b] || 0;
  let worse = null, text;
  if (Math.max(da, db) <= 0) text = da || db ? 'both came out steadier' : 'nobody moved';
  else if (Math.abs(da - db) <= 3) text = 'both bled about the same';
  else { worse = da > db ? a : b; text = `$${worse} came out worse`; }
  const v = { a, b, da, db, worse, better: worse ? (worse === a ? b : a) : null, text, by };
  VERDICTS.set(d.id, v);
  return v;
}
/* each mind's record across the original dreams it starred in */
const RECORDS = (() => {
  const r = Object.fromEntries(STOCKS.map(s => [s.ticker, { w: 0, l: 0, e: 0, bouts: [] }]));
  for (const d of E.list){
    const v = verdict(d);
    for (const t of d.actors){
      const x = r[t]; if (!x) continue;
      const opp = d.actors.find(o => o !== t) || t;
      const res = !v.worse ? 'e' : v.worse === t ? 'l' : 'w';
      x[res]++; x.bouts.push({ d, opp, res, own: v.by[t] || 0, theirs: v.by[opp] || 0 });
    }
  }
  return r;
})();

/* ── full-text search over every turn of every dream ── */
let SEARCH = null;
function searchIndex(){
  if (SEARCH) return SEARCH;
  SEARCH = [];
  for (const d of E.list){
    let cur = null;
    for (const g of d.segs){
      if (g.t === 'spk'){ cur = g.sys ? null : { d, turn: g.turn, who: g.who, text: '' }; if (cur) SEARCH.push(cur); continue; }
      if (cur) cur.text += (cur.text ? '\n' : '') + g.s;
    }
  }
  for (const x of SEARCH) x.lc = x.text.toLowerCase();
  return SEARCH;
}
function grep(q, limit = 400){
  const needle = q.trim().toLowerCase(); if (needle.length < 2) return [];
  const out = [];
  for (const x of searchIndex()){
    const i = x.lc.indexOf(needle);
    if (i < 0) continue;
    let n = 0; for (let j = i; j >= 0; j = x.lc.indexOf(needle, j + needle.length)) n++;
    out.push({ ...x, i, n });
    if (out.length >= limit) break;
  }
  return out;
}
/* a one-line window around the first hit, with every hit marked */
function snippet(x, q, span = 90){
  const needle = q.trim().toLowerCase(), t = x.text;
  let a = Math.max(0, x.i - span), b = Math.min(t.length, x.i + needle.length + span);
  let s = t.slice(a, b).replace(/\s+/g, ' ');
  const lc = s.toLowerCase(); let html = '', k = 0;
  for (let j = lc.indexOf(needle); j >= 0; j = lc.indexOf(needle, j + needle.length)){ html += esc(s.slice(k, j)) + '<mark>' + esc(s.slice(j, j + needle.length)) + '</mark>'; k = j + needle.length; }
  html += esc(s.slice(k));
  return (a > 0 ? '… ' : '') + html + (b < t.length ? ' …' : '');
}

/* ── aired sessions: every broadcast that finished is kept, as it aired ── */
const sessFile = b => `conversation_${Math.floor(b.start / 1000)}_scenario_${b.dream.scenario.replace(/\s+/g, '_')}.txt`;
function airedSessions(match, limit = Infinity){
  const out = [];
  for (let i = E.locate(Date.now()).index - 1; i >= 0 && out.length < limit; i--){
    const b = E.broadcast(i);
    if (!match || match(b.dream)) out.push(b);
  }
  return out;
}
/* archive totals: every finished broadcast since the rooms opened */
function archiveTotals(){
  const cur = E.locate(Date.now()), perCycle = E.list.reduce((s, d) => s + d.timeline.length, 0);
  let events = cur.cycle * perCycle;
  const { p } = E.perm(cur.cycle);
  for (let k = 0; k < cur.index % E.N; k++) events += E.list[p[k]].timeline.length;
  return { sessions: cur.index, hours: (cur.start - E.EPOCH) / 3600e3, events };
}
/* who got hurt most recently: harm = confidence/stability/awareness lost, fear/volatility gained */
function bloodbath(windowMs = 6 * 3600e3, n = 5){
  const cut = Date.now() - windowMs, by = {};
  for (let j = SIM.log.length - 1; j >= 0 && SIM.log[j].t > cut; j--){
    const e = SIM.log[j], h = harmOf(e.stat, e.delta);
    if (h <= 0) continue;
    const x = by[e.ticker] = by[e.ticker] || { ticker: e.ticker, dmg: 0, hits: 0, worst: e };
    x.dmg += h; x.hits++; if (h > harmOf(x.worst.stat, x.worst.delta)) x.worst = e;
  }
  return Object.values(by).sort((a, b) => b.dmg - a.dmg).slice(0, n);
}
