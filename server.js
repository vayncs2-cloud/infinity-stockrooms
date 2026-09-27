// Zero-dependency server for Railway (or anywhere with Node 18+).
const http = require('http');
const { build } = require('./build');

const { page, count } = build();          // build once on boot from dreams/*.txt
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end('ok'); }
  if (url === '/' || url === '/index.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=60' });
    return res.end(page);
  }
  res.writeHead(302, { location: '/' }); res.end();   // everything else goes home (dreams are #anchors)
}).listen(PORT, () => console.log(`infinity stockrooms: ${count} dreams on :${PORT}`));
