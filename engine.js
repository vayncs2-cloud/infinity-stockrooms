// The live floor. Everything here is a pure function of (content, time), so every visitor,
// and the server's /api/state, sees the same broadcast and the same stats at the same moment.
// Runs in node (require) and in the browser (build.js inlines it as window.Engine).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Engine = factory();
})(this, function () {
  const EPOCH = Date.UTC(2026, 6, 1);          // the rooms opened
  const CHARS_PER_SEC = 35;                    // prose typing speed
  const CODE_LINE_MS = 120;                    // one line of terminal output / ascii art
  const TURN_PAUSE_MS = 2500;                  // "thinking" before each speaker turn
  const REVERT = 0.08;                         // mean reversion toward baseline after each broadcast
  const STATS = ['volatility', 'awareness', 'confidence', 'fear', 'stability'];
  const HIST = 240;                            // broadcast-end samples kept per stock
  const LOG = 1200;                            // global change-log entries kept

  const LABEL = /^<([A-Z0-9_.$-]+)(#SYSTEM)?>\s*$/;

  /* split a dream body into timed segments: spk (label), text (prose), code (fenced block) */
  function segments(body) {
    const out = []; let buf = [], code = null;
    const flush = () => { if (buf.length) { out.push({ t: 'text', s: buf.join('\n') }); buf = []; } };
    for (const line of body.split('\n')) {
      if (/^\s*```/.test(line)) {
        if (code === null) { flush(); code = []; }
        else { out.push({ t: 'code', s: code.join('\n') }); code = null; }
        continue;
      }
      if (code !== null) { code.push(line); continue; }
      const m = line.match(LABEL);
      if (m) { flush(); out.push({ t: 'spk', s: line.trim(), who: m[1], sys: !!m[2] }); continue; }
      buf.push(line);
    }
    flush();
    if (code) out.push({ t: 'code', s: code.join('\n') });
    for (const g of out) if (g.t === 'text') g.s = g.s.replace(/^\n+|\n+$/g, '');
    return out.filter(g => g.t !== 'text' || g.s.length);
  }

  /* attach timing: seg.at (ms from broadcast start when it begins to appear), seg.dur, turn numbers */
  function prepareDream(d) {
    const segs = segments(d.body);
    let t = 0, turn = 0; const turnAt = [0];
    for (const g of segs) {
      if (g.t === 'spk') {
        if (!g.sys) { t += TURN_PAUSE_MS; g.turn = ++turn; turnAt[turn] = t; }
        g.at = t; g.dur = 0;
      } else if (g.t === 'code') {
        g.at = t; g.lines = g.s.split('\n'); g.dur = g.lines.length * CODE_LINE_MS; t += g.dur; g.turn = turn;
      } else {
        g.at = t; g.dur = Math.round(g.s.length * 1000 / CHARS_PER_SEC); t += g.dur; g.turn = turn;
      }
    }
    const events = (d.events || []).filter(e => e.turn >= 1 && e.turn <= turn)
      .map((e, i) => ({ ...e, i, at: turnAt[e.turn] }))
      .sort((a, b) => a.at - b.at || a.i - b.i);
    return Object.assign(d, { segs, turns: turn, turnAt, dur: Math.max(t, 1000), timeline: events });
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(dreams, stocks) {
    const list = dreams.slice().sort((a, b) => a.id < b.id ? -1 : 1).map(prepareDream);
    const N = list.length;
    const cycleLen = list.reduce((s, d) => s + d.dur, 0);
    const byId = Object.fromEntries(list.map(d => [d.id, d]));
    const base = Object.fromEntries(stocks.map(s => [s.ticker, s.stats]));

    /* seeded shuffle per cycle; never play the same dream twice in a row across a cycle boundary */
    const permCache = new Map();
    function rawPerm(c) {
      const r = mulberry32((c + 1) * 2654435761); const p = list.map((_, i) => i);
      for (let i = N - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
      return p;
    }
    function perm(c) {
      if (permCache.has(c)) return permCache.get(c);
      const p = rawPerm(c);
      if (c > 0 && N > 1 && p[0] === rawPerm(c - 1)[N - 1]) [p[0], p[1]] = [p[1], p[0]];
      const starts = []; let s = 0; for (const i of p) { starts.push(s); s += list[i].dur; }
      const v = { p, starts };
      if (permCache.size > 64) permCache.clear();
      permCache.set(c, v); return v;
    }
    function broadcast(index) {
      const c = Math.floor(index / N), k = index % N, { p, starts } = perm(c);
      const d = list[p[k]], start = EPOCH + c * cycleLen + starts[k];
      return { index, cycle: c, dream: d, start, end: start + d.dur };
    }
    function locate(t) {
      t = Math.max(t, EPOCH);
      const c = Math.floor((t - EPOCH) / cycleLen), within = t - EPOCH - c * cycleLen, { starts } = perm(c);
      let k = N - 1; while (k > 0 && starts[k] > within) k--;
      const b = broadcast(c * N + k), offset = t - b.start;
      let turn = 0; while (turn < b.dream.turns && b.dream.turnAt[turn + 1] <= offset) turn++;
      return Object.assign(b, { offset, turn });
    }
    /* how many times a dream has aired up to t (including the one on air) */
    function aired(id, t) {
      const cur = locate(t), c = cur.cycle, i = list.indexOf(byId[id]);
      const pos = perm(c).p.indexOf(i);
      return c + (pos <= cur.index % N ? 1 : 0);
    }

    /* the walk runs on flat arrays: stock a, stat k lives at a * 5 + k */
    const TI = new Map(stocks.map((s, i) => [s.ticker, i]));
    const NS = stocks.length, NV = NS * 5, BASE = new Float64Array(NV);
    stocks.forEach((s, a) => STATS.forEach((k, j) => { BASE[a * 5 + j] = s.stats[k]; }));
    /* each dream's timeline compiled once: value slot (-1 = unknown mind or stat), delta, offset */
    const compiled = new Map(list.map(d => {
      const tl = d.timeline, n = tl.length, slot = new Int32Array(n), dl = new Float64Array(n), at = new Float64Array(n);
      tl.forEach((e, i) => {
        const a = TI.has(e.ticker) ? TI.get(e.ticker) : -1, k = STATS.indexOf(e.stat);
        slot[i] = a >= 0 && k >= 0 ? a * 5 + k : -1; dl[i] = e.delta; at[i] = e.at;
      });
      return [d, { tl, slot, dl, at }];
    }));
    /* length of an array after n pushes under the rule "past 2K entries, cut back to the last K" */
    const keep = (n, K) => n <= K * 2 ? n : K + (n - K * 2 - 1) % (K + 1);

    /* the stat simulator: walks every broadcast since EPOCH in order. advanceTo() is incremental,
       and stepping in small increments gives exactly the same result as one big jump.
       Only what can still be read gets built: the log tail (at most LOG * 2 entries), the last
       HIST * 2 hist samples and each mind's last move. Older moves are applied and forgotten. */
    function sim(opts = {}) {
      const track = opts.track || null, tr = track === null ? -1 : TI.has(track) ? TI.get(track) : -2;
      const vals = {}, hist = {}, last = {}, H = [];
      for (const s of stocks) {
        vals[s.ticker] = { ...s.stats };
        H.push(hist[s.ticker] = { t: [], ...Object.fromEntries(STATS.map(k => [k, []])) });
      }
      const V = BASE.slice(), log = [], trackLog = [];
      let bi = 0, ei = 0, cur = broadcast(0), now = EPOCH, logged = 0;
      // per call: a ring of the latest LOG * 2 moves (the log tail), and each mind's latest move
      const RING = LOG * 2, rV = new Float64Array(RING), rB = new Float64Array(RING), rS = new Float64Array(RING), rE = [], rD = [];
      const lq = new Float64Array(NS), lV = new Float64Array(NS), lB = new Float64Array(NS), lS = new Float64Array(NS), lE = [], lD = [];
      const entry = (e, start, d, value, b) => ({ t: start + e.at, ticker: e.ticker, stat: e.stat, delta: e.delta, value,
        reason: e.reason, dream: d.id, turn: e.turn, b });
      const S = {
        vals, hist, log, last, trackLog,
        get now() { return now; },
        get broadcastIndex() { return bi; },
        advanceTo(t, collect = true) {
          const fresh = [];
          if (t < now) return fresh;
          const lazy = tr === -1 && !collect;                // nobody needs every entry: ring them, build the tail
          const hFrom = locate(t).index - HIST * 2;          // hist samples from before this can never be read
          let q = 0, hSkip = false, hClear = false;
          lq.fill(-1);
          for (;;) {
            const C = compiled.get(cur.dream), n = C.at.length, st = cur.start;
            while (ei < n && st + C.at[ei] <= t) {
              const i = ei++, j = C.slot[i];
              if (j < 0) continue;
              const nv = Math.max(0, Math.min(100, V[j] + C.dl[i]));
              V[j] = nv;
              const a = (j / 5) | 0, e = C.tl[i];
              if (tr === -1 && collect) {
                const x = last[e.ticker] = entry(e, st, cur.dream, nv, bi);
                log.push(x); if (log.length > LOG * 2) log.splice(0, log.length - LOG);
                logged++; fresh.push(x);
              } else if (a === tr) {
                const x = last[e.ticker] = entry(e, st, cur.dream, nv, bi);
                trackLog.push(x); if (collect) fresh.push(x);
              } else {
                if (lazy) { const r = q % RING; rV[r] = nv; rB[r] = bi; rS[r] = st; rE[r] = e; rD[r] = cur.dream; }
                lq[a] = q; lV[a] = nv; lB[a] = bi; lS[a] = st; lE[a] = e; lD[a] = cur.dream;
              }
              q++;
            }
            if (cur.end > t) break;
            // broadcast over: everyone drifts 8% back toward who they were
            for (let j = 0; j < NV; j++) V[j] += REVERT * (BASE[j] - V[j]);
            if (bi < hFrom) hSkip = true;
            else {
              if (hSkip && !hClear) { hClear = true; for (const h of H) for (const k in h) h[k].length = 0; }
              const len = keep(bi + 1, HIST);
              for (let a = 0; a < NS; a++) {
                const h = H[a];
                for (let k = 0; k < 5; k++) h[STATS[k]].push(Math.round(V[a * 5 + k] * 10) / 10);
                h.t.push(cur.end);
                if (h.t.length > len) for (const k in h) h[k].splice(0, h[k].length - len);
              }
            }
            bi++; ei = 0; cur = broadcast(bi);
          }
          // the log tail, built from the ring: anything older than the ring is out of its reach
          let from = q, built = [];
          if (lazy && q) {
            from = Math.max(0, q - RING); built = new Array(q - from);
            for (let s = from; s < q; s++) { const r = s % RING; built[s - from] = entry(rE[r], rS[r], rD[r], rV[r], rB[r]); }
            if (from > 0) log.length = 0;
            logged += q;
            for (const x of built) log.push(x);
            const len = keep(logged, LOG);
            if (log.length > len) log.splice(0, log.length - len);
          }
          for (let a = 0; a < NS; a++) if (lq[a] >= 0)
            last[stocks[a].ticker] = lq[a] >= from ? built[lq[a] - from] : entry(lE[a], lS[a], lD[a], lV[a], lB[a]);
          for (let a = 0; a < NS; a++) { const v = vals[stocks[a].ticker]; for (let k = 0; k < 5; k++) v[STATS[k]] = V[a * 5 + k]; }
          now = t;
          return fresh;
        },
        histOf(ticker, k, n = HIST) { const a = hist[ticker][k]; return a.slice(Math.max(0, a.length - n)); },
        histTimes(ticker, n = HIST) { const a = hist[ticker].t; return a.slice(Math.max(0, a.length - n)); },
      };
      return S;
    }

    /* the full change log of one stock, newest first (replayed on demand) */
    function logFor(ticker, t) { const s = sim({ track: ticker }); s.advanceTo(t, false); return s.trackLog.slice().reverse(); }

    /* who moved most over a window: real change in value (events and reversion), plus the event count */
    function movers(S, t, windowMs = 6 * 3600e3) {
      const out = [];
      for (const s of stocks) {
        const h = S.hist[s.ticker], cut = t - windowMs;
        let i = h.t.length - 1; while (i > 0 && h.t[i] > cut) i--;
        const then = i >= 0 && h.t.length ? Object.fromEntries(STATS.map(k => [k, h[k][i]])) : s.stats;
        const by = {}; let abs = 0;
        for (const k of STATS) { const d = Math.round(S.vals[s.ticker][k] - then[k]); if (d) by[k] = d; abs += Math.abs(d); }
        let n = 0; for (let j = S.log.length - 1; j >= 0 && S.log[j].t > cut; j--) if (S.log[j].ticker === s.ticker) n++;
        if (abs) out.push({ ticker: s.ticker, abs, n, by });
      }
      return out.sort((a, b) => b.abs - a.abs);
    }

    return { EPOCH, STATS, list, byId, N, cycleLen, base, perm, broadcast, locate, aired, sim, logFor, movers, stateWord };
  }

  /* one plain word for how a mind is doing, from its stats and how far they are from its baseline */
  // each candidate scores by how far past its threshold the mind is; the strongest one names the state
  function stateWord(v, b, kind) {
    const d = k => v[k] - b[k];
    const cands = [
      ['breaking down', Math.max(22 - v.stability, -d('stability') - 20)],
      ['overheated',    Math.max(v.volatility - 90, v.volatility >= 78 ? d('volatility') - 6 : -1)],
      [kind === 'ghost' ? 'restless' : 'panicking', Math.max(v.fear - 82, d('fear') - 16)],
      ['shaken',        Math.max(20 - v.confidence, -d('confidence') - 18)],
      ['clear-eyed',    Math.max(v.awareness - 94, d('awareness') - 16)],
      ['confident',     Math.max(v.confidence - 95, d('confidence') - 14)],
      ['quiet',         kind === 'ghost' ? -1 : 12 - v.volatility],
      ['confused',      -d('awareness') - 14],
      ['running hot',   d('volatility') - 10],
      ['calm',          -d('fear') - 12],
      ['steady',        d('stability') - 10],
      ['cooling off',   -d('volatility') - 14],
    ];
    let best = null;
    for (const [w, s] of cands) if (s >= 0 && (!best || s > best[1])) best = [w, s];
    if (best) return best[0];
    const dist = STATS_.reduce((s, k) => s + Math.abs(d(k)), 0);
    return dist > 18 ? 'drifting' : kind === 'ghost' ? 'lingering' : 'normal';
  }
  const STATS_ = ['volatility', 'awareness', 'confidence', 'fear', 'stability'];

  return { create, segments, EPOCH, STATS: STATS_, stateWord, timing: { CHARS_PER_SEC, CODE_LINE_MS, TURN_PAUSE_MS, REVERT } };
});
