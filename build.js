// Builds the site from dreams/*.txt + template.html.
//   node build.js            -> writes dist/index.html (full page) and dist/artifact.html (fragment)
// server.js also calls build() on startup, so pushing a new dream file is enough to publish it.
const fs = require('fs');
const path = require('path');

// starting view counts for the launch batch; add `views: 1234` to a dream's header to set your own
const SEED_VIEWS = { '01':184302,'02':96871,'12':77412,'06':41209,'10':38550,'04':22917,
                     '07':19480,'09':17062,'05':14338,'03':12904,'08':9771,'11':6215 };

function build() {
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
    return {
      id: `c${ts}`, ts, time: `${dm[4]}:${dm[5]}`,
      scenario: head.scenario,
      actors: head.actors.split(',').map(a => a.trim().toUpperCase().replace(/^\$/, '')),
      file: `conversation_${ts}_scenario_${head.scenario}.txt`,
      views: parseInt(head.views || SEED_VIEWS[f.slice(0, 2)] || 3000, 10),
      body: raw.slice(m[0].length).replace(/^\n+|\n+$/g, ''),
    };
  });

  const banner = fs.readFileSync(path.join(__dirname, 'banner.txt'), 'utf8').replace(/\n+$/, '').split(/\n\s*\n/);
  const tpl = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
  const data = JSON.stringify(dreams).replace(/<\//g, '<\\/');
  const fragment = tpl.replace('/*DATA*/[]', () => data).replace('/*BANNER*/null', () => JSON.stringify(banner));
  const page = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
    '<style>[hidden]{display:none!important}</style>\n' +
    fragment.replace('\n<div class="wrap"', '\n</head>\n<body>\n<div class="wrap"') + '\n</body>\n</html>\n';
  return { page, fragment, count: dreams.length };
}

module.exports = { build };

if (require.main === module) {
  const { page, fragment, count } = build();
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'dist', 'index.html'), page);
  fs.writeFileSync(path.join(__dirname, 'dist', 'artifact.html'), fragment);
  console.log(`built ${count} dreams -> dist/index.html (${Math.round(page.length / 1024)} KB)`);
}
