// Print the numbered speaker turns of a dream, for writing events.
//   node tools/turns.js dreams/01-vanilla-stockrooms.txt
// Turn numbers count only non-SYSTEM speaker labels (<NVDA>, <TSLA> ...), starting at 1.
const fs = require('fs');
const raw = fs.readFileSync(process.argv[2], 'utf8').replace(/\r\n/g, '\n');
const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
let n = 0, inCode = false, cur = null, buf = [];
const flush = () => { if (cur) console.log(`#${cur.n} <${cur.who}> ${buf.join(' ').replace(/\s+/g, ' ').trim().slice(0, 140)}`); buf = []; };
for (const line of body.split('\n')) {
  if (/^\s*```/.test(line)) { inCode = !inCode; continue; }
  const m = !inCode && line.match(/^<([A-Z0-9_.$-]+)(#SYSTEM)?>\s*$/);
  if (m) { flush(); cur = m[2] ? null : { n: ++n, who: m[1] }; continue; }
  if (cur && buf.join(' ').length < 200) buf.push(line);
}
flush();
console.log(`total turns: ${n}`);
