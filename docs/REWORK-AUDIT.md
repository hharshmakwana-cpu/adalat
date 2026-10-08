# ADALAT v8 — Game-first rework audit

The goal of v8: a courtroom mind game a 7-year-old understands at a glance, with legal depth kept in optional layers.
This audit records each problem, what changed and why, and what was actually measured.

## What could and could not be run
- **Run in the authoring sandbox:**
  - the shared engine and the sync helpers, as plain JS;
  - end-to-end simulated trials for every case;
  - payload-size measurement for the engine projection.
- **Not run in the authoring sandbox:**
  - `npm install`, `npm run typecheck`, `npm test`, `npm run build`;
  - Playwright at the 9 breakpoints, axe, network throttling;
  - live multiplayer latency against Vercel and Supabase.
- **Do these before calling v8 done:**
  - run all four `npm` scripts;
  - open `window.__adalatNet` in a dev build. It records action round-trip times, pull count and ping count.
- **Status of the performance claims below:**
  - payload sizes are **measured**;
  - round-trip counts are **counted from the code**;
  - real latency is **not yet measured**.

## 1. Gameplay blocked by animation (biggest perceived lag)

**Previous problem**
- `Court.tsx` revealed log entries one at a time, using `shown`/`busy` timers of 650–2600 ms per entry.
- The player could only act when `mine && !busy`.
- After every AI batch, that meant 5–15 seconds of forced waiting.
- Voice read every line during this, and a full-screen overlay sat on top of it.

**Change**
- Game state and presentation are now separate.
- The current turn is playable the instant the state arrives.
- Only the newest speech bubble animates (240 ms). Older entries render instantly.
- An AI batch shows a 0.9 s non-blocking "Prosecution makes a move…" pill.
- Routine moments are small overlays the player can click through (650 ms). Only the judgment is larger (1.1 s), and it can be skipped.
- Voice reads only the line that set up the player's decision.

**UX impact:** the wait to act goes from seconds to 0 ms of forced waiting.

## 2. Too much on screen

**Previous problem:** the court screen showed the arena, a speech bubble, a concept chip, the feedback block, an action dock, and a permanent five-tab record panel (transcript, exhibits, orders, law, timeline).

**Change**
- New layout from top to bottom:
  - **HUD:** exit, level, progress, timer, connection;
  - **Scene:** animated characters, active glow, idle breathing, witness lean;
  - **Last 1–3 lines** of what was said;
  - **One-line feedback;**
  - **YOUR MOVE:** a game headline (for example "Ask the witness"), the case prompt in small text, and 3 large choices.
- 📁 Clues, ℹ️ Learn and 📜 Record open as drawers.
- On mobile the drawers are bottom sheets.

## 3. Copy that reads like procedure

**Change:** added `src/game/presentation.ts`, a presentation layer with game wording:

| Procedure term | Game wording |
|---|---|
| Filing | "Start the case" |
| Charges | "Choose the charges" |
| Chief examination | "Ask the witness" |
| Objection | "Stop that question?" |
| Cross-examination | "Test the story" |
| Arguments | "Make your strongest case" |
| Verdict | "Make the final call" |

- The legal term appears small, under Learn.
- Feedback is now one line: ✓ GREAT MOVE, ! NOT BAD or ✕ NOT THE BEST, plus the first sentence of the explanation. The full why and the better move open under "Learn why".
- Engine, case data and `shared/legal.js` are unchanged, so the law is simplified in the UI only, never in substance.

## 4. Home, levels, roles, brief

**Home:** the title, "Can you make the right call?", **PLAY**, **PLAY WITH FRIENDS** and a small ⚙ Settings link. Sound, voice, language, quieter sounds and the Case Lab moved into Settings.

**Levels**
- LEVEL 1 · LEARN, LEVEL 2 · THINK, LEVEL 3 · MASTER.
- Each level shows an icon, one line, its case, stars, best score and a lock.
- A pop animation and an "unlocked" badge appear when a level opens.

**Roles:** no longer a forced step. Solo play starts as Defence; the role can be changed from the Before-you-start screen. Each role is an icon, a name and one line, with the full description under ℹ.

**Brief:** the long case file is replaced by WHO? / WHAT HAPPENED? / YOUR JOB and START. The full file is under "See full case".

**Taps from Home to playing:** PLAY → level → START = **3 taps**.

## 5. Difficulty and typing

**Change**
- Timers: L1 none, L2 45 s, L3 30 s (was 0 / 90 / 60).
- AI opponent accuracy (0.55, 0.70, 0.85), feedback and hints still scale by level.
- **No typing is ever required.** Every turn, including the formerly free-text ones, completes with a tap.
- "Write your own" is a bonus offered only at Level 3, with optional voice input.
- Test: `tests/sync.test.js` plays every case as every role using taps only.

**Remaining issue:** the 3 built-in cases were authored for v6. Depending on role, a player makes about 4–10 decisions, so Defence gets only 4 in some branches. Level 2 and 3 differ mostly in timer and opponent strength, not in ambiguity. Hitting 6–12 decisions with decoys needs new case content (see J).

## 6. Multiplayer network path

### Previous problem
- **Action endpoint:** 9 sequential database/network round trips per action:
  1. getUser
  2. room
  3. player
  4. rate limit
  5. action insert
  6. update
  7. broadcast, with no timeout
  8. players
  9. seat modes
- **Payload:** every response included the static case file and the whole log.
- **Client duplicate pull:** the acting client received its own broadcast and fired a second full `resume`.
- **No coalescing:** several pings meant several parallel pulls.
- **Heartbeat:** every 15 s it fetched the full game.

### Changes
- **`api/game/action.js`:** 4 rounds instead of 9.
  1. getUser ∥ room, then player.
  2. Rate limit ∥ replay-key insert. The engine runs locally.
  3. Compare-and-swap update.
  4. Broadcast ∥ players read.
  - The broadcast is capped at 1.2 s, so it can never hold the response for long.
  - The response is `view(..., { lite: true, logFrom })`: no seat modes, no case file, only new log entries.
- **`api/room/[op].js`**
  - New `state` op: game-only data plus a log delta.
  - New `heartbeat` op: presence only. It returns `{version, status}` and no game.
  - `resume` remains the full snapshot, used for first load, reconnect and tab resume.
  - For room ops, the room and my player are loaded in parallel.
  - The public case file is cached per instance, since it is immutable.
- **`shared/sync.js`**
  - `sliceLog` and `mergeView` handle deltas and ignore any response older than the current version.
  - A delta from another session is never spliced onto old data.
  - `createPuller` allows at most one fetch in flight, and pings that arrive during a fetch collapse into it. A ping whose version the client already has is ignored, which covers our own action.
- **`useRoom`**
  - Applies its own action response directly.
  - Realtime pulls only for other players' moves.
  - The heartbeat pulls only when its returned version is newer.
  - `sending` drives an immediate "Checking…" state on the tapped button.
- **Security kept:**
  - user token, room token (verified before any write), seat, turn, version and spectator checks;
  - unique `actionId`, compare-and-swap, hidden-data projection.
  - Malformed room tokens now return `ROOM_TOKEN_INVALID` (401) instead of a 500 from `JSON.parse`.

### Measured payload (engine projection, JSON bytes, all three cases, Defence seat)

| | Before: per-action response | After: per-action response |
|---|---|---|
| L1 | ≈ 14.6 KB avg (6.99 KB game + 7.66 KB case + seat modes) | ≈ 4.5 KB avg |
| L2 | ≈ 12.9 KB | ≈ 4.3 KB |
| L3 | ≈ 12.0 KB | ≈ 3.7 KB |

- Roughly **65–70 % smaller** per action.
- The final reveal response is the largest (about 9–10 KB) because it includes every move.

### Not measured
- Click → response P50 and P95 on the live site.
- **Expected:** fewer sequential round trips, and the broadcast no longer blocks, which should cut server time. This must be confirmed with `window.__adalatNet.actionMs` and `timing.serverMs` (included outside production).

## 7. Timer

**Previous problem:** a 250 ms interval re-rendered the whole court.

**Change:** a 1 s interval, set only while a deadline exists. The server still owns the deadline, and TIMEOUT is sent once per turn.

## 8. Mobile and desktop
- **Mobile**
  - The choice area is anchored at the bottom with safe-area padding.
  - Choices are at least 56 px tall; tool buttons are 48 px.
  - Nothing in the core loop needs horizontal scrolling or a sidebar.
  - Dialogs are bottom sheets.
- **Desktop (≥1024 px):** a larger scene (320 px), with choices laid out as a row of tall tiles.
- **Not yet verified:** a visual check at 320/360/390/414/768/1024/1280/1440/1920 px. Run Playwright.

## 9. Accessibility
- Kept: live-region announcements, focus-trapped dialogs, keyboard 1–3 to choose, visible focus, and reduced motion. Reduced motion zeroes every animation, including idle, drift and shake.
- Feedback uses icon + word + colour.
- Settings toggles are `role="switch"`.
- The stepper is an `<ol>` with `aria-current`.

## 10. Result screen
- In order:
  1. YOU WON (overall ≥ 65) or GOOD TRY;
  2. a big score;
  3. stars that animate in sequence;
  4. the verdict line;
  5. one 💡 key lesson;
  6. PLAY NEXT LEVEL (shows "New level unlocked!" when one opens), PLAY AGAIN, HOME.
- Under "Detailed performance": the seven skill bars, the legal reasoning, what you missed, the key law card and the AI review.
- Multiplayer adds awards and a player table.

## Files changed
- `shared/engine.js` (timers)
- `shared/sync.js` (new)
- `shared/schemas.js` (`state`, `heartbeat`, `logFrom`)
- `api/_lib/server.js` (token parse, broadcast timeout)
- `api/room/[op].js` (lite view, state, heartbeat, parallel loads, case cache)
- `api/game/action.js` (rewritten pipeline)
- `src/game/hooks.ts` (rewritten sync)
- `src/game/presentation.ts` (new)
- `src/screens/Court.tsx` (rewritten)
- `src/screens/Flow.tsx` (Home, Levels, Roles, Brief, Settings)
- `src/screens/Result.tsx` (rewritten)
- `src/App.tsx` (new flow, settings)
- `src/screens/Friends.tsx` (one-tap create, room options collapsed, Court props)
- `src/styles/app.css` (v8 game layer)
- `tests/sync.test.js` (new)

## Remaining non-blocking issues
1. The built-in cases need re-authoring to hit 6–12 decisions per role, with real decoys at L2/L3 and short option text. Some options are still long sentences.
2. Character figures are still abstract circles, now animated. Commissioned vector characters would raise game feel the most.
3. Hindi covers all new UI strings; the built-in case text is still English.
4. Lobby role and case changes after creation use the existing ops. There is no in-lobby case switcher yet.
5. Real multiplayer latency, the Playwright breakpoints, axe and 2/3/5-player live tests still need to be run on a machine with Node and a Supabase project.
