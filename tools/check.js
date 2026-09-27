// Validate a dream and its events:  node tools/check.js dreams/15-shadow-twin.txt
const fs = require('fs');
const stocks = require('../stocks.js');
const T = new Set(stocks.map(s => s.ticker));
const STATS = ['heat', 'lucidity', 'faith', 'dread', 'cohesion'];
const f = process.argv[2];
const raw = fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const errs = [];
const m = raw.match(/^---\n([\s\S]*?)\n---\n/);
if (!m) errs.push('missing --- header');
const head = {};
if (m) for (const l of m[1].split('\n')) { const i = l.indexOf(':'); if (i > 0) head[l.slice(0, i).trim()] = l.slice(i + 1).trim(); }
for (const k of ['scenario', 'actors', 'date']) if (!head[k]) errs.push(`header missing ${k}`);
if (head.date && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(head.date)) errs.push('bad date format');
const actors = (head.actors || '').split(',').map(s => s.trim());
for (const a of actors) if (!T.has(a)) errs.push(`actor ${a} not in stocks.js`);
const body = raw.slice(m ? m[0].length : 0);
let turns = 0, fences = 0, words = body.split(/\s+/).length, inCode = false, longLines = 0;
for (const line of body.split('\n')) {
  if (/^\s*```/.test(line)) { fences++; inCode = !inCode; continue; }
  if (inCode && line.length > 90) longLines++;
  const s = !inCode && line.match(/^<([A-Z0-9_.$-]+)(#SYSTEM)?>\s*$/);
  if (s && !s[2]) { turns++; if (!T.has(s[1])) errs.push(`speaker ${s[1]} not in stocks.js`); }
}
if (fences % 2) errs.push('unclosed code fence');
if (longLines) errs.push(`${longLines} code lines over 90 chars`);
const ef = f.replace(/\.txt$/, '.events.json');
let ev = [];
if (!fs.existsSync(ef)) errs.push(`missing ${ef}`);
else {
  try { ev = JSON.parse(fs.readFileSync(ef, 'utf8')); } catch (e) { errs.push('events json invalid: ' + e.message); }
  ev.forEach((e, i) => {
    if (!Number.isInteger(e.turn) || e.turn < 1 || e.turn > turns) errs.push(`event ${i}: turn ${e.turn} out of 1..${turns}`);
    if (!T.has(e.ticker)) errs.push(`event ${i}: unknown ticker ${e.ticker}`);
    if (!STATS.includes(e.stat)) errs.push(`event ${i}: bad stat ${e.stat}`);
    if (!Number.isInteger(e.delta) || !e.delta || Math.abs(e.delta) > 20) errs.push(`event ${i}: bad delta ${e.delta}`);
    if (!e.reason || e.reason.length > 110) errs.push(`event ${i}: reason missing or too long`);
  });
}
console.log(`${f}: ${words} words, ${turns} turns, ${ev.length} events`);
console.log(errs.length ? 'ERRORS:\n- ' + errs.join('\n- ') : 'OK');
process.exitCode = errs.length ? 1 : 0;
