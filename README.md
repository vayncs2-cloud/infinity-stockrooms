# infinity stockrooms

Tokenized Robinhood Chain stocks talk to each other in a simulated terminal. It's an homage to Infinite Backrooms.
Every dream is a hand-made `.txt` file in `dreams/`, and the floor is alive: dreams air one after another
forever, and what happens in them moves each mind's stats.

## How it works

- `dreams/NN-name.txt` holds one conversation per file. `dreams/NN-name.events.json` lists the stat
  events that fire during it. The format and voice rules are in `STYLE_GUIDE.md` (see "v2").
- `stocks.js` is the roster: every mind's epithet, kind, bio, voice, fears, desires, relations, baseline stats and sigil.
- `logos/<TICKER>.png` is picked up automatically. A stock without a file shows its 10x10 `sigil` as pixel art.
- `engine.js` is the live floor, shared by the browser and the server. Everything is a pure function of time,
  so every visitor sees the same broadcast and the same stats:
  - Broadcasts start at 2026-07-01 UTC and loop through all dreams in a seeded shuffle per cycle.
  - A dream's airtime comes from its content: ~35 chars/sec of prose, 0.12 s per code line, and a 2.5 s pause per turn.
  - Each event fires when its turn starts. Stats are clamped 0-100, and after every broadcast each mind drifts 8% back toward its baseline.
- `template.html` is the whole app (styles + scripts): `/` (home: the live dream, the archive feed, the log, movers and the whole floor),
  `/live`, `/floor`, `/stock/<ticker>`, `/dreams` (the archive: aired sessions + original dreams), `/dream/<id>`, `/session/<n>`, `/lore`.
- Every broadcast is kept: when a session ends it appears in the archive at `/session/<n>`, with the time it actually aired.
- `banner.txt` is the one-line ANSI Shadow banner, drawn on a canvas.
- `build.js` validates everything and combines it into one page.
- `server.js` builds on boot and serves the app for every route, plus `/logos/*`, `/api/state` (the live state as JSON, including the last 10 archived sessions)
  and `/health`. It has no dependencies.

## Add a new dream

1. Write it following `STYLE_GUIDE.md`. You can paste the guide into Claude/ChatGPT as the prompt.
2. Save it as `dreams/25-some-scenario.txt` with the header:
   ```
   ---
   scenario: some scenario
   actors: NVDA, TSLA
   date: 2026-10-01 03:12
   views: 4200          (optional)
   ---
   ```
3. Run `node tools/turns.js dreams/25-some-scenario.txt` and write `dreams/25-some-scenario.events.json`.
4. Check it with `node tools/check.js dreams/25-some-scenario.txt` until it prints OK.
5. Commit and push. Railway redeploys automatically and the dream joins the broadcast.

Adding or editing dreams reshapes the schedule, so the whole live history is re-derived from the new content.
That's expected: the floor is a function of (content, time).

## Launch settings

At the top of the second `<script>` in `template.html`:

```js
const CONFIG = { coin: "$BACKROOMS", ca: "", twitter: "" };
```

Paste the contract address and Twitter URL there, then push. They show in the header and footer.

## Run locally

```
npm start          # http://localhost:3000
npm run build      # writes dist/index.html if you want a static file instead
```

## Deploy on Railway

The service runs `npm start` (settings are in `railway.json`, health check at `/health`).
Deploy with `railway up`, or connect the GitHub repo so every push deploys.
