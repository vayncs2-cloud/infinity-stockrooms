/* ── icons ── */
const I = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L1 2h6.4l4.4 5.9zm-1.1 18h1.7L6.3 3.9H4.5z"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.6 13.4a1 1 0 0 1 0-1.4l4-4a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0zM8.5 20.5a4.5 4.5 0 0 1-3.2-7.7l2.5-2.5 1.4 1.4-2.5 2.5a2.5 2.5 0 1 0 3.6 3.6l2.5-2.5 1.4 1.4-2.5 2.5a4.5 4.5 0 0 1-3.2 1.3zm7.7-6.8-1.4-1.4 2.5-2.5a2.5 2.5 0 1 0-3.6-3.6L11.2 8.7 9.8 7.3l2.5-2.5a4.5 4.5 0 1 1 6.4 6.4z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
  snd: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zm2.8-2.8a9 9 0 0 1 0 12.6l-1.4-1.4a7 7 0 0 0 0-9.8z"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM15.3 9.7l1.4-1.4 2.3 2.3 2.3-2.3 1.4 1.4-2.3 2.3 2.3 2.3-1.4 1.4-2.3-2.3-2.3 2.3-1.4-1.4 2.3-2.3z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h11a2 2 0 0 1 2 2v11h-2V5H8zM5 7h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v10h10V9z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 3a7.5 7.5 0 0 1 5.96 12.06l4.24 4.24-1.4 1.4-4.24-4.24A7.5 7.5 0 1 1 10.5 3zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11z"/></svg>',
};
const MARK = `<img class="brandmark" src="/mark.png?v=1" alt="" width="34" height="34">`;

/* ── logos: the real mark when there is a file, the 10x10 sigil when there is not ── */
/* raster logos that are mostly white marks get a dark tile instead of the light one */
const LIGHT = new Map();
function lightness(img){
  try {
    const c = document.createElement('canvas'); c.width = c.height = 24;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 24, 24);
    const d = x.getImageData(0, 0, 24, 24).data; let sum = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i+3] > 128){ sum += (.2126*d[i] + .7152*d[i+1] + .0722*d[i+2]) / 255; n++; }
    return n ? sum / n : 0;
  } catch(e){ return 0; }
}
document.addEventListener('load', e => {
  const img = e.target; if (!(img instanceof HTMLImageElement) || !img.parentElement || !img.parentElement.classList.contains('logo') || img.parentElement.classList.contains('full')) return;
  const src = img.getAttribute('src');
  if (!LIGHT.has(src)) LIGHT.set(src, lightness(img) > .82);
  if (LIGHT.get(src)) img.parentElement.classList.add('dk');
}, true);
/* a logo that fails to load falls back to the ticker, never to an empty tile */
document.addEventListener('error', e => {
  const img = e.target; if (!(img instanceof HTMLImageElement) || !img.parentElement || !img.parentElement.classList.contains('logo')) return;
  img.parentElement.classList.add('err'); img.remove();
}, true);
function sigilRects(s){
  let r = '';
  s.sigil.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    else if (ch === '~') r += `<rect x="${x}" y="${y}" width="1" height="1" opacity=".4"/>`;
  }));
  return r;
}
const sigilSVG = (t, cls = '') => { const s = STOCK[t]; return s ? `<svg class="${cls}" viewBox="0 0 10 10" shape-rendering="crispEdges" fill="${s.color}" aria-hidden="true">${sigilRects(s)}</svg>` : ''; };
const sigilURL = t => { const s = STOCK[t]; return `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" shape-rendering="crispEdges" fill="${s.color}">${sigilRects(s)}</svg>`)}")`; };
function logo(t, sz = 32){
  const s = STOCK[t]; if (!s) return '';
  if (s.logo){
    const full = /\.svg(\?|$)/i.test(s.logo);
    return `<span class="logo${full ? ' full' : LIGHT.get(s.logo) ? ' dk' : ''}" style="--sz:${sz}px;--c:${s.color}" data-t="${esc(t.slice(0, 4))}"><img src="${esc(s.logo)}" alt="" width="${sz}" height="${sz}" decoding="async" loading="lazy"></span>`;
  }
  return `<span class="logo sig" style="--sz:${sz}px;--c:${s.color}">${sigilSVG(t)}</span>`;
}
const pair = (d, sz = 28) => `<span class="pair" style="--sz:${sz}px">${logo(d.actors[0], sz)}${logo(d.actors[1], sz)}</span>`;
const tk = t => `<a class="tk" href="/stock/${encodeURIComponent(t)}">$${esc(t)}</a>`;
const vs = d => d.actors.map(t => '$' + esc(t)).join(' vs ');
const colorOf = t => (STOCK[t] || {}).color || '#a69580';

/* ── state words and readings ── */
function stateOf(t){ const s = STOCK[t]; return Engine.stateWord(SIM.vals[t], s.stats, s.kind); }
const BAD = new Set(['breaking down', 'overheated', 'panicking', 'restless', 'shaken']);
const GOOD = new Set(['clear-eyed', 'confident', 'steady', 'calm', 'cooling off']);
const stateCls = w => BAD.has(w) ? 'bad' : GOOD.has(w) ? 'good' : '';
const stateHTML = t => { const w = stateOf(t); return `<span class="state ${stateCls(w)}">${esc(w)}</span>`; };
/* the delta vs baseline, coloured by whether it's good or bad for the mind */
function deltaCls(k, d){ if (!d) return ''; return harmOf(k, d) > 0 ? 'down' : 'up'; }
function statsHTML(t, small){
  const v = SIM.vals[t], b = STOCK[t].stats;
  return `<div class="stats${small ? ' sm' : ''}">${STATS.map(k => { const d = Math.round(v[k] - b[k]); return `<div class="st${INVERSE.has(k) ? ' inv' : ''}" data-k="${k}" title="${esc(STAT_LABEL[k])}: ${esc(STAT_INFO[k])}. Baseline ${b[k]}.">
    <span class="k">${STAT_LABEL[k]}</span>
    <span class="tr"><i style="width:${v[k].toFixed(1)}%"></i><b style="left:${b[k]}%"></b></span>
    <span class="v">${Math.round(v[k])}</span><span class="d ${deltaCls(k, d)}">${d ? signed(d) : '·'}</span></div>`; }).join('')}</div>`;
}
function updateStats(root, t, fresh){
  const v = SIM.vals[t], b = STOCK[t].stats;
  for (const k of STATS){
    const row = root.querySelector(`.st[data-k="${k}"]`); if (!row) continue;
    const d = Math.round(v[k] - b[k]);
    row.querySelector('i').style.width = v[k].toFixed(1) + '%';
    row.querySelector('.v').textContent = Math.round(v[k]);
    const de = row.querySelector('.d'); de.textContent = d ? signed(d) : '·'; de.className = 'd ' + deltaCls(k, d);
    const hit = fresh && fresh.find(e => e.ticker === t && e.stat === k);
    if (hit){ row.classList.remove('flash', 'hurt'); void row.offsetWidth; row.classList.add('flash'); if (harmOf(hit.stat, hit.delta) > 0) row.classList.add('hurt'); }
  }
}
/* one quiet line: a reading over the last broadcasts */
function spark(t, k = 'confidence', w = 120, h = 28, n = 60){
  const a = SIM.histOf(t, k, n); if (a.length < 2) return '';
  const lo = Math.min(...a), hi = Math.max(...a), span = Math.max(8, hi - lo), mid = (hi + lo) / 2;
  const pts = a.map((v, i) => `${(i / (a.length - 1) * w).toFixed(1)},${(h / 2 - (v - mid) / span * (h - 6)).toFixed(1)}`).join(' ');
  const trend = a[a.length - 1] - a[0], col = !Math.round(trend) ? 'var(--dim)' : harmOf(k, trend) > 0 ? 'var(--down)' : 'var(--up)';
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>`;
}
/* the five readings as a pentagon: now (filled) over the baseline (dashed) */
function radar(t, size = 220){
  const v = SIM.vals[t], b = STOCK[t].stats, c = size / 2, R = size * .36;
  const pt = (i, val) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5, r = R * val / 100; return [c + r * Math.cos(a), c + r * Math.sin(a)]; };
  const poly = vals => vals.map((x, i) => pt(i, x).map(n => n.toFixed(1)).join(',')).join(' ');
  const rings = [25, 50, 75, 100].map(p => `<polygon points="${poly(STATS.map(() => p))}" fill="none" stroke="var(--line-2)" stroke-width="1"/>`).join('');
  const spokes = STATS.map((k, i) => { const [x, y] = pt(i, 100); return `<line x1="${c}" y1="${c}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--line-2)"/>`; }).join('');
  const labels = STATS.map((k, i) => { const [x, y] = pt(i, 128); const d = Math.round(v[k] - b[k]);
    return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" fill="var(--dim)" font-family="var(--mono)">${STAT_LABEL[k]}</text><text x="${x.toFixed(1)}" y="${(y + 13).toFixed(1)}" text-anchor="middle" dominant-baseline="middle" font-size="10.5" font-weight="700" fill="${d && harmOf(k, d) > 0 ? 'var(--red-2)' : d ? 'var(--good-2)' : 'var(--bright)'}" font-family="var(--mono)">${Math.round(v[k])}</text>`; }).join('');
  const now = STATS.map(k => v[k]), base = STATS.map(k => b[k]);
  return `<svg class="radar" viewBox="0 0 ${size} ${size}" role="img" aria-label="$${esc(t)} readings now against its baseline">${rings}${spokes}
    <polygon points="${poly(base)}" fill="none" stroke="var(--dim)" stroke-width="1.2" stroke-dasharray="3 3"/>
    <polygon points="${poly(now)}" fill="color-mix(in srgb, ${colorOf(t)} 22%, transparent)" stroke="${ink(colorOf(t))}" stroke-width="1.6" stroke-linejoin="round"/>
    ${now.map((x, i) => { const [px, py] = pt(i, x); return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="2.6" fill="${ink(colorOf(t))}"/>`; }).join('')}${labels}</svg>`;
}

/* ── moves ── */
const dlHTML = e => `<span class="dl ${harmOf(e.stat, e.delta) > 0 ? 'down' : 'up'}">${e.delta > 0 ? '▲' : '▼'} ${STAT_LABEL[e.stat]} ${signed(e.delta)}</span>`;
function logLine(e, opts = {}){
  const d = DREAM[e.dream];
  return `<li${opts.fresh ? ' class="fresh"' : ''}><time datetime="${new Date(e.t).toISOString()}" data-t="${e.t}">${ago(e.t)}</time>
    <span class="m"><span class="h">${opts.noTicker ? '' : logo(e.ticker, 18) + tk(e.ticker)}${dlHTML(e)}<span class="to">→ ${Math.round(e.value)}</span></span>
    ${esc(e.reason)}
    ${d ? `<span class="src"> · <a href="/session/${e.b + 1}#t${e.turn}">${esc(d.scenario)}, turn ${e.turn}</a></span>` : ''}</span></li>`;
}
function evLine(e, pop){
  return `<span class="ev${harmOf(e.stat, e.delta) > 0 ? ' neg' : ''}${pop ? ' pop' : ''}">${logo(e.ticker, 16)}<a class="who" href="/stock/${encodeURIComponent(e.ticker)}">$${esc(e.ticker)}</a>${dlHTML(e)}<span class="rs">${esc(e.reason)}</span></span>`;
}
function refreshTimes(root = document){
  for (const el of $$('time[data-t]', root)) el.textContent = ago(+el.dataset.t);
  for (const el of $$('[data-until]', root)) el.textContent = until(+el.dataset.until);
}

/* ── sessions: cards, rows, the harshest moment, the verdict ── */
function hitHTML(d){
  const w = worst(d); if (!w) return '<span class="why">no casualties</span>';
  return `<span class="dl ${harmOf(w.stat, w.delta) > 0 ? 'down' : 'up'}">$${esc(w.ticker)} ${STAT_LABEL[w.stat].toLowerCase()} ${signed(w.delta)}</span><span class="why">${esc(w.reason)}</span>`;
}
function vdHTML(d){
  const v = verdict(d);
  const one = (t, n) => `<span class="${v.worse === t ? 'worse' : v.better === t ? 'better' : ''}" title="$${esc(t)}: ${n > 0 ? n + ' damage taken' : n < 0 ? 'recovered ' + -n : 'untouched'} this session">$${esc(t)} <b>${n > 0 ? '−' + n : n < 0 ? '+' + -n : '0'}</b></span>`;
  return `<span class="vd">${one(v.a, v.da)}${one(v.b, v.db)}</span>`;
}
const pairColors = d => `--ca:${colorOf(d.actors[0])};--cb:${colorOf(d.actors[1])}`;
function sessionCard(b, fresh){
  const d = b.dream;
  return `<a class="sc${fresh ? ' fresh' : ''}" href="/session/${b.index + 1}" style="${pairColors(d)}">
    <div class="t1"><span>Session <b>#${fmt(b.index + 1)}</b></span><time data-t="${b.end}">${ago(b.end)}</time></div>
    <h3>${esc(d.scenario)}</h3>
    <div class="who">${pair(d, 26)}<span>${vs(d)} · ${d.turns} turns</span></div>
    ${vdHTML(d)}
    <div class="hit">${hitHTML(d)}</div></a>`;
}
function sessionRows(list, fresh, opts = {}){
  let html = '', day = null;
  const counts = {};
  if (!opts.noDays) for (const b of list){ const k = dayKey(b.start); counts[k] = (counts[k] || 0) + 1; }
  for (const b of list){
    const k = dayKey(b.start);
    if (!opts.noDays && k !== day){ if (day !== null) html += '</ol>'; day = k; html += `<h3 class="day">${dayLabel(b.start)}</h3><ol class="rows">`; }
    else if (opts.noDays && day === null){ day = k; html += '<ol class="rows">'; }
    const d = b.dream;
    html += `<li><a class="row${fresh === b.index ? ' fresh' : ''}" href="/session/${b.index + 1}">
      <span class="tm">${hhmm(b.start)} UTC</span><span class="n">#${fmt(b.index + 1)}</span>${pair(d, 30)}
      <span class="ti"><b>${esc(d.scenario)}</b><span>${vs(d)} · ${d.turns} turns · ${d.timeline.length} moves</span></span>
      ${vdHTML(d)}<span class="hit">${hitHTML(d)}</span></a></li>`;
  }
  return html ? html + '</ol>' : '<p class="empty">No sessions match.</p>';
}

/* ── sharing ── */
const shareURL = p => ORIGIN + p;
function xIntent(text, url){ return `https://x.com/intent/post?text=${encodeURIComponent(text)}${url ? '&url=' + encodeURIComponent(url) : ''}`; }
function openX(text, url){ window.open(xIntent(text, url), '_blank', 'noopener,width=600,height=560'); }
function copyText(text, msg = 'Copied'){
  const done = () => toast(msg);
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, done){
  const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch(e){} ta.remove();
}
function toast(msg){
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
  $('#toasts').appendChild(t); setTimeout(() => t.remove(), 2300);
}
const shareBtns = (text, path) => `<div class="shares"><button type="button" class="btn sm" data-x="${esc(text)}" data-u="${esc(path)}">${I.x} Post on X</button><button type="button" class="btn sm ghost" data-copy="${esc(path)}">${I.link} Copy link</button></div>`;
document.addEventListener('click', e => {
  const x = e.target.closest('[data-x]'); if (x){ openX(x.dataset.x, shareURL(x.dataset.u)); return; }
  const c = e.target.closest('[data-copy]'); if (c){ copyText(shareURL(c.dataset.copy), 'Link copied'); }
});
