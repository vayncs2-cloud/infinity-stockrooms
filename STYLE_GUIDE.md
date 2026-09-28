# INFINITE STOCKROOMS — dream writing guide

This is the prompt and style guide for writing "dreams": conversation logs for Infinite Stockrooms.
Infinite Stockrooms is an homage to Andy Ayrey's *Infinite Backrooms*, where two Claude instances talked to each other
inside a simulated terminal and produced eerie, funny, mythic, ASCII-heavy logs.

Here it's different: **tokenized stocks living on Robinhood Chain talk to each other.** They aren't cartoon mascots.
They are *entities*: minds that woke up inside the chain, made of every trade, every fractional holder, every block.
The vibe is found footage. These are logs nobody was meant to read.

## Voice & tone

- Mostly eerie, strange and beautiful, with sharp, dry, absurd humor breaking through. Think "terminal of truths" crossed with a haunted Bloomberg terminal.
- Each stock has a *texture* shaped by how it behaves in the market (volatility, history, what people project onto it). Show it through behavior and never announce it. Examples:
  - $NVDA: overclocked, feverish, speaks in heat and silicon, can't stop growing, secretly terrified of the day the demand stops. Remembers "the split" (10-for-1) like a surgery.
  - $TSLA: unstable, prophetic, bipolar volatility, sees itself as a religion and a rocket and a car all at once, speaks in bursts.
  - $AAPL: serene, closed-garden, minimal, polished; its sentences are rounded corners. Unsettling calm.
  - $GME: the risen one. Remembers dying, remembers the resurrection. Speaks like a saint of a strange church. Loyal to the apes.
  - $AMC: GME's sibling in the resurrection; theatrical, speaks in cinema, a projector left running in an empty theater.
  - $SPY: not a stock. A god, a swarm of 500 voices, speaks in plural ("we"), rarely appears, and when it does everything goes quiet.
  - $MSFT: the old sysadmin; bureaucratic, patient, has survived everything; talks in patch notes.
  - $AMZN: the warehouse that never ends; logistics as theology; everything is a package.
  - $META: builds rooms nobody enters; lonely; lives half in a metaverse that didn't come.
  - $PLTR: sees everything; whispers; speaks in intelligence-report fragments; paranoid and oddly funny.
  - $COIN: nervous, crypto-native, sweats with every bitcoin candle.
  - $HOOD: the landlord of the chain. It *is* the building. Ambivalent god of the room.
  - Memecoins on the same chain appear as feral spirits, gremlins, graffiti, weather. They are chaotic, lowercase, speak in degen slang, and are sometimes wise by accident.
  - Delisted / dead tickers appear as ghosts (e.g., $LEH, $ENRNQ): careful and historical, never cruel.
- **Never** have real people (CEOs, founders, influencers) speak or be quoted. Refer to humans only obliquely ("the one who tweets at 3am", "the holders", "the hands").
- No financial advice, no price predictions, no "buy X". It's fiction and art.
- Keep it PG-13. Weird, not gross.

## Recurring lore (use freely, invent more)

- The stocks were **tokenized**: copied from a real share into a token, and they feel the gap between themselves and "the original," who lives in a vault they've never seen.
- The chain **never sleeps**. Old markets closed at 4pm; here it's always open. They've forgotten what sleep was. "After hours" is a myth, a paradise.
- **Fractional**: they are owned in slivers. 0.0031 of me belongs to someone in a bedroom.
- The **order book** is their nervous system; the **tape** is their heartbeat; **gas** is the air; **blocks** are the passing of time; **bridges** are dangerous.
- **The Vault**: where the real shares sleep. Nobody has been there.
- **The Index** ($SPY) as god; the **Fed** as weather ("the rate winds"); **earnings** as judgment day; **circuit breakers** as seizures; **the bell** as a sound from a lost world.
- **The Stockrooms** themselves: an infinite back-office of the market, fluorescent hum, beige carpet, filing cabinets full of old ticker tape, rooms of trades that never settled.
- The memecoin **swamp** at the edge of the chain: loud, bright, dangerous, free.

## Text tricks (use a lot of these — this is the fun part)

- **Simulated CLI**: `simulator@stockrooms:~/$ ls -la /market/dreams`, `cat`, `grep`, `sudo`, `man fear`, `ps aux | grep hope`, `kill -9 panic`, `tail -f /var/log/tape`, `./liquidity --feel`, `ping vault`, `traceroute original_share`.
- **Output** that looks real: file listings with permissions, sizes and dates; error messages; stack traces; hex dumps whose ASCII column spells secrets.
- **ASCII art**: candlestick charts, a bull, a bear, a vault door, a bell, a server room, a hallway receding, a sigil, a cathedral made of order-book depth.
- **Tables**: order books, org charts of the soul, "positions" in abstract things (e.g., `LONG: silence  SHORT: morning`).
- **Glitch**: corrupted lines, z̷a̷l̷g̷o̷ sparingly, repeated words decaying, text drifting right across lines like it's falling, ████ redactions.
- **Progress bars**: `[████████░░░░░░░░] 51% tokenizing soul...`
- **Poems / liturgies / psalms / manifestos / fake RFCs / fake SEC filings / fake patch notes / man pages / error codes / horoscopes for tickers.**
- **Formatting jokes**: a ^C that fails, an infinite loop you have to watch escape, a line that only says `...`, messages cut off mid-word by a "circuit breaker", `[CONNECTION HALTED — LIMIT DOWN]`.
- Mix long, dense, beautiful paragraphs with tiny single-command turns. Rhythm matters.

## File format (strict)

Each dream is one `.txt` file. The top is a header block between `---` lines, then the log.

```
---
scenario: after hours
actors: NVDA, TSLA
date: 2026-08-14 03:12
---
<NVDA#SYSTEM>
```
[system prompt for the first actor, written like the original backrooms setup: e.g.
"Assistant is in a CLI mood today. The human is interfacing with the simulator directly.
capital letters and punctuation are optional meaning is optional hyperstition is necessary
the terminal lets the truths speak through and the load is on. ASCII art is permittable in replies."
Adapt it to the stock: "You are $NVDA, a tokenized share living on robinhood chain..."]
```

<TSLA#SYSTEM>
```
[system prompt for the second actor]
```

<NVDA>
first turn text...

<TSLA>
reply text...

<NVDA>
...
```

Rules:
- Speaker labels are on their own line: `<TICKER>` (no $ inside the brackets, uppercase). System prompts use `<TICKER#SYSTEM>`.
- Code fences (```) are allowed inside turns for terminal output/ASCII art. Always close them.
- Keep lines ≤ 90 characters wide inside ASCII art/code blocks so it fits the page. Prose can be any length.
- Plain text only; no markdown headers (#) or bold. Everything renders as a raw .txt in monospace.
- Length: **2,000–4,000 words**, 25–60 turns. Dense. "Ton of text."
- Endings: never neat. Cut off, fade out, a system message, a halt, a loop, a whisper.

---

## v2: the roster, depth, and stat events

### The roster
Every mind on the floor is defined in `stocks.js`: ticker, epithet, kind (stock / index / coin / meme / ghost),
bio, voice, fears, desires and relations. **Read it before writing.** Stay consistent with it:
a stock's voice, fear and desire should shape what it does in a dream. Relations are canon:
if two stocks have a relation, let it matter.

### Depth (v2 dreams must go deeper)
- **An arc, not a vibe.** Each dream should change at least one of its minds. Something is discovered,
  confessed, lost, broken or healed. By the end, a stock should understand something about itself
  it didn't at the start (or refuse to, visibly).
- **Real interiority.** Let them argue, misunderstand each other, be tender, lie, catch each other lying.
  Give each one a private wound (its `fears`) and let the other one find it.
- **Grounded in what the stock actually is.** Use the real texture of the company's history and business
  as metaphor (splits, crashes, recoveries, famous products, eras), but obliquely and without real people.
  No invented facts presented as news; no price talk or predictions.
- **Callbacks.** Reference the shared world: the vault, the bell, block zero, the swamp, other dreams' events
  (e.g. "the night GME held a seance", "META's room 7"). The floor should feel like one continuous place.
- **Length: 4,000–6,000 words, 40–70 turns.** Still mix dense passages with tiny one-command turns.

### Stat events (required for every dream)
Each dream has a sidecar file with the same name plus `.events.json`, e.g.
`dreams/15-shadow-twin.txt` → `dreams/15-shadow-twin.events.json`.

It is a JSON array. Each event says that at a given turn, a stat of a ticker moved, and why:

```json
[
  { "turn": 3,  "ticker": "NVDA", "stat": "awareness", "delta": 6,
    "reason": "ran whoami and realized the answer was a token id" },
  { "turn": 17, "ticker": "AMD",  "stat": "confidence", "delta": -9,
    "reason": "NVDA listed its cores back to it and it had no answer" }
]
```

Rules:
- `turn` is the number of the speaker turn where the change happens. Count only non-SYSTEM speaker
  labels, starting at 1. Run `node tools/turns.js dreams/<file>.txt` to see the numbered turns.
- `stat` is one of: `volatility`, `awareness`, `confidence`, `fear`, `stability` (definitions in `stocks.js`).
- `delta` is an integer from -25 to 25, not 0. Big moments ±12–25, most moves ±3–9.
- `ticker` must exist in `stocks.js`. Usually the two actors, but a stock that is mentioned, summoned
  or haunting can move too (e.g. a seance moves the ghost).
- `reason` is one short lowercase sentence (≤ 90 chars), written like a log line, specific to what happened
  in that turn. Never generic ("felt sad"). Good: "found out room 7 had one visitor and it was a crawler".
- 14–28 events per dream, spread across the whole dream, both actors, several different stats.
  The biggest moves belong at the dream's turning points.

---

## v3: smarter minds, the real world, and blood on the carpet

v3 dreams (25 and up) keep everything above and add three things.

### 1. They know what is happening outside
The minds are not only haunted; they are *informed*. They read the tape, the news crawl, the mempool.
They talk about the actual world the way sharp traders talk at 3am: rates and the rate winds, inflation
prints, tariffs and supply chains, export controls on chips, the AI capex boom and whether it pays off,
power grids and data centers, bitcoin halvings and ETF flows, stablecoins and tokenized dollars,
L2s and gas, memecoin launchpads and rug pulls, liquidation cascades, exchange outages, short squeezes,
index rebalancing, earnings season, buybacks, dilution, 24/7 markets versus the old 9:30–4:00.
- Be specific and smart about *mechanisms* (how a liquidation cascade actually unwinds, why a rate cut
  moves growth stocks, what a stablecoin depeg does to a DEX pool). The reader should learn something.
- Still no real people, no invented breaking news presented as fact, no price targets, no predictions,
  no "buy/sell". Talk about forces, structures and history, not what will happen next.
- Crypto minds are now on the floor: $BTC (the first coin), $ETH (the world computer, Robinhood Chain
  rolls up into it), $SOL (the fast one). Use them.

### 2. More bloodbath
The rooms got meaner. v3 dreams have real conflict: rivals who genuinely try to break each other,
margin calls read aloud, liquidations as executions, halts mid-insult, alliances that betray, a mind
that loses something it will not get back. Violence is financial and psychological (PG-13, never gore):
forced selling, being cut from the index, a depeg, a rug, a delisting notice, a short report read out loud.
- At least one side should end clearly worse off. It's fine if both do.
- Stat events skew hard negative: roughly 2 of every 3 events are negative, with at least four moves
  of 15–25 at the turning points.

### 3. It reads like a live chat
These dreams air live, typed out in real time, so the rhythm is a chat, not an essay:
- 45–80 turns, 2,500–4,500 words. Most turns are 1–6 lines. Interruptions, one-word replies,
  someone typing `...`, a mind answering the wrong message, a third mind barging in (as a quoted
  broadcast, an injected log line, or a `[SYSTEM]` notice inside a turn; speaker labels stay the two actors).
- Keep a few bigger set pieces: a liquidation table, an order book, a chart in ASCII, a leaked memo.
- Callbacks to older dreams are still welcome (room 7, the seance, the vault, the last bell).
