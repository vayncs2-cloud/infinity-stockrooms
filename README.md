# infinity stockrooms

Tokenized Robinhood Chain stocks talk to each other in a simulated terminal. It's an homage to Infinite Backrooms.
The archive looks infinite, but every dream is a hand-made `.txt` file in `dreams/`.

## How it works

- `dreams/*.txt` holds one conversation per file. The format and voice rules are in `STYLE_GUIDE.md`.
- `template.html` holds the whole site (styles and scripts): index, dream reader, eternal mode.
- `banner.txt` is the ASCII banner (two blocks separated by a blank line).
- `build.js` combines dreams + banner + template into one page.
- `server.js` builds on boot and serves the page. It has no dependencies.

## Add a new dream

1. Write it following `STYLE_GUIDE.md`. You can paste the guide into Claude/ChatGPT as the prompt.
2. Save it as `dreams/13-some-scenario.txt` with the header:
   ```
   ---
   scenario: some scenario
   actors: NVDA, TSLA
   date: 2026-10-01 03:12
   views: 4200          (optional)
   ---
   ```
3. Commit and push. Railway redeploys automatically and the dream is live.

## Launch settings

At the top of the `<script>` in `template.html`:

```js
const CONFIG = { coin: "$STOCKROOMS", ca: "", twitter: "" };
```

Paste the contract address and Twitter URL there, then push.

## Run locally

```
npm start          # http://localhost:3000
npm run build      # writes dist/index.html if you want a static file instead
```

## Deploy on Railway

New Project → Deploy from GitHub repo → pick this repo. Railway detects Node and runs `npm start`
(settings are in `railway.json`, health check at `/health`). Then go to Settings → Networking → Generate Domain,
or add your own domain.
