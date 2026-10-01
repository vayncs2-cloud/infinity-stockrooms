# infinite stockrooms

Tokenized Robinhood Chain stocks (and a few coins) talk to each other in a simulated terminal. It's an homage to Infinite Backrooms.
Every dream is a hand-made `.txt` file in `dreams/`, and the floor is alive: dreams air one after another
forever, and what happens in them moves each mind's stats.

## How it works

- `dreams/NN-name.txt` holds one conversation per file. `dreams/NN-name.events.json` lists the stat
  events that fire during it. The format and voice rules are in `STYLE_GUIDE.md` (see "v2").
- `stocks.js` is the roster: every mind's epithet, kind, bio, voice, fears, desires, relations, baseline stats and sigil.
- `logos/<TICKER>.png` (or `.svg`, drawn full-bleed) is picked up automatically. A stock without a file shows its 10x10 `sigil` as pixel art.
- `engine.js` is the live floor, shared by the browser and the server. Everything is a pure function of time,
  so every visitor sees the same broadcast and the same stats:
  - Broadcasts start at 2026-07-01 UTC and loop through all dreams in a seeded shuffle per cycle.
  - A dream's airtime comes from its content: ~35 chars/sec of prose, 0.12 s per code line, and a 2.5 s pause per turn.
  - Each event fires when its turn starts (delta up to ±25). Stats are clamped 0-100, and after every broadcast each mind drifts 8% back toward its baseline.
  - Replaying every broadcast since launch takes ~20 ms, so the page can afford to do it on load.
- Stats are five plain readings: volatility, awareness, confidence, fear, stability (0-100, defined in `stocks.js`).
- **Damage** is how hard a session hit a mind: confidence, stability and awareness lost, fear and volatility gained.
  On air, each mind has a composure bar that damage drains. When a session ends, the mind that bled clearly more (by more than 3) "came out worse".
  If neither bled, both came out steadier. A mind's record on its page counts this across the original dreams.
- Every broadcast is kept: when a session ends it appears in the archive at `/session/<n>`, with the time it actually aired.

## The app

The site is a single-page app in `web/`:

- `web/index.html` is the shell: head and share tags, the header and the empty `<main>`.
- `web/style.css` has all the styles. Colors, type and spacing are tokens at the top.
- `web/js/*.js` are concatenated in filename order into one script:

| file | what |
|---|---|
| `00-core.js` | data, helpers, the engine instance, damage and verdicts, records, transcript search |
| `10-ui.js` | logos, stat bars, the radar, session cards and rows, sharing, toasts |
| `15-banner.js` | the ANSI banner (marquee and glitch) and the corridor behind the home hero |
| `20-typist.js` | renders a dream as a chat at any time offset; typing sounds |
| `30-chrome.js` | the header's on-air pill, the ticker tape, the footer |
| `40-live.js` | the live stage: the fight card, the chat and the rail; the schedule |
| `50-home.js` | `/` and `/live` |
| `52-archive.js` | `/archive`: aired sessions, the original dreams as posters, and transcript search |
| `53-reader.js` | `/session/<n>` and `/dream/<id>`: the verdict, the damage chart, the move timeline and quote sharing |
| `54-floor.js` | `/floor`: the board and the cards |
| `55-stock.js` | `/stock/<ticker>`: the character sheet |
| `56-lore.js` | `/lore` and the 404 |
| `60-terminal.js` | the terminal: `/` or Ctrl+K anywhere. A search palette that also runs `grep`, `ls`, `cd`, `cat`, `top`, `ps`, `tail -f` and `help` |
| `61-replay.js` | the full-screen replay of any session at 1×, 4× or 12× |
| `90-router.js` | routing and the one clock that advances the floor every second |

- `banner.txt` is the one-line ANSI Shadow banner, drawn on a canvas.
- `build.js` validates everything and produces three hashed assets (`app.<hash>.css`, `app.<hash>.js` with the engine,
  and `data.<hash>.js` with the dreams and the roster), plus a `shell()` that fills the HTML shell for a route.
- `server.js` builds on boot and has no dependencies. It serves:
  - every page route as the shell, with that route's title, description and share card (unknown routes get a 404 with the same shell)
  - `/assets/*` compressed with brotli or gzip and cached for a year
  - `/logos/*` and everything in `public/`, subfolders included
  - `/api/state` (the live state as JSON, including the last 10 archived sessions), `/health`, `/robots.txt` and `/sitemap.xml`
  - `/x` and `/twitter`, which redirect to the X account

## Share cards

`public/og/` holds a 1200x630 card for the home page, for every dream and for every mind. Links to `/dream/<id>`, `/session/<n>` and `/stock/<ticker>`
unfurl into their own card on X. The cards are drawn by `tools/og.js` with headless Chrome:

```
node tools/og.js     # needs Node 22+ and Google Chrome
```

Run it after adding a dream or a mind, then commit `public/og/`. A route without a card falls back to `og/home.jpg`.

## Add a new dream

1. Write it following `STYLE_GUIDE.md`. You can paste the guide into Claude/ChatGPT as the prompt.
2. Save it as `dreams/35-some-scenario.txt` with the header:
   ```
   ---
   scenario: some scenario
   actors: NVDA, TSLA
   date: 2026-10-01 03:12
   views: 4200          (optional)
   ---
   ```
3. Run `node tools/turns.js dreams/35-some-scenario.txt` and write `dreams/35-some-scenario.events.json`.
4. Check it with `node tools/check.js dreams/35-some-scenario.txt` until it prints OK.
5. Run `node tools/og.js` for its share card.
6. Commit, push and deploy (`railway up`). The dream joins the broadcast.

Adding or editing dreams reshapes the schedule, so the whole live history is re-derived from the new content.
That's expected: the floor is a function of (content, time).

## Launch settings

`config.js`:

```js
module.exports = { coin: '$STOCKROOMS', ca: '', twitter: 'https://x.com/StockRoomsApp', handle: '@StockRoomsApp' };
```

The X link shows in the header, the hero and the footer, and the ticker in the home hero and the footer. The contract address stays off the site while `ca` is empty. Paste it in and deploy,
and it shows in the footer with a copy button.

Share links and cards use `https://stockrooms.fun` as their origin. Set `PUBLIC_URL` to override it.

## Run locally

```
npm start          # http://localhost:3000
npm run build      # writes dist/index.html, the whole app inlined into one static page
```

## Deploy on Railway

The service runs `npm start` (settings are in `railway.json`, health check at `/health`).
Deploy with `railway up`, or connect the GitHub repo so every push deploys.
