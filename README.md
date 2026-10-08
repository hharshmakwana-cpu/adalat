# ADALAT v7 — production source

ADALAT is a courtroom game that teaches Indian law. This folder is the v7 source code, replacing the 1.2 MB single-file prototype. It uses React + TypeScript + Vite for the front end, a game engine shared by browser and server, Vercel API functions, and Supabase for multiplayer.

## Quick start
```bash
npm install
cp .env.example .env.local      # fill in values (see N)
npm run dev                     # http://localhost:5173  (single-player works with no env at all)
npm test                        # engine, protocol, security, AI-schema, legal-library tests
npm run build                   # → dist/
```
Deploy: push this folder to GitHub, then import it in Vercel. The framework (Vite) is detected from `vercel.json`.

---

## A. File list (new)
```
package.json  vite.config.js  tsconfig.json  vercel.json  index.html  .env.example  .gitignore
public/        favicon.svg  robots.txt  sitemap.xml
shared/        engine.js     – pure, deterministic game engine (browser + server)
               schemas.js    – Zod schemas for every trust boundary + AI case quality gate
               legal.js      – the law library (only source of section references)
               cases.js      – built-in case library (data)
               text.js       – normalisation, name/room-code validation, secret detection
               legacy/adalat-cases.js – the 3 v6 cases, migrated (with legal corrections)
api/_lib/      server.js     – errors, body limits, auth, rate limits, room tokens, security log, realtime ping
               ai.js         – AI providers (Groq → Gemini fallback), token budgets, strict JSON
api/room/[op].js             – create | join | role | ready | seat | start | resume | leave | transfer-host | kick
api/game/action.js           – the only way to change a multiplayer game
api/adalat-ai/[task].js      – health | generate-case | witness | review
src/           main.tsx  App.tsx  i18n.ts  vite-env.d.ts
src/styles/    tokens.css (design tokens)  app.css
src/lib/       services.ts   – storage, API client, lazy Supabase, audio cues, speech in/out
src/game/      hooks.ts      – useLocalGame (single-player) / useRoom (multiplayer)
src/components/ui.tsx        – Announcer (aria-live), Dialog (focus trap/restore), LawCard, Toast, Figure
src/screens/   Flow.tsx (Home, Cases, Roles, Brief)  Court.tsx  Result.tsx  Lab.tsx  Friends.tsx
supabase/migrations/001_init.sql
tests/         engine.test.js  security.test.js
docs/          design spec, architecture spec, legal content (from the v7 handoff)
```

## B. Architecture
- **Cases are data and the engine is generic.** `shared/engine.js` is a pure reducer: `applyMove(state, case, role, move, now)` returns `{ ok, state, events }`. It never touches the DOM, network or clock. `now` and the RNG seed are passed in.
  - Single-player runs the engine in the browser.
  - Multiplayer runs the same file on the server.
- **Phases.** Each turn carries a phase (Filing, Charges, Prosecution evidence, Defence evidence, Final arguments, Judgment) and a step. The steps are: filing, charges, plea, chief, objection, ruling, answer, cross, evidence, summon, args, verdict, sentence.
  - A turn's conditions (`cond`) decide which steps apply. For example, the objection and ruling steps only happen when a leading question was actually asked, and the trial steps are skipped after a guilty plea.
  - Illegal moves are rejected: wrong role, wrong turn, bad option, early timeout, adjournment limit.
- **Projection.** `project(state, case, viewer)` builds the only data a client ever sees.
  - Before the judgment it contains no correct outcome, no explanation, no flags, no option grades and no other players' feedback.
  - At the reveal it adds the correct outcome, the explanation, the lesson and all moves.
- **Scoring** is computed by the engine across seven skills: legal accuracy, evidence, procedure, question quality, judicial reasoning, credibility and time. Awards are only given when earned.
- **Code splitting.** Court, Result, Lab and Friends are lazy-loaded. Supabase is dynamically imported only when entering multiplayer or calling the AI. The home screen opens no realtime connection.

## C. Multiplayer protocol
The client sends **intents** over HTTPS. The server derives the actor, validates the move, runs the engine and stores the result. It then broadcasts a **version ping** on a private Realtime channel, and each client pulls its own projection.

| Client → server | Body (Zod, `.strict()`) |
|---|---|
| `POST /api/room/create` | `displayName, caseId, level, role, allowSpectators` |
| `POST /api/room/join` | `code, displayName, wantRole?, spectate?` |
| `POST /api/room/role` · `ready` · `seat` · `kick` · `start` · `resume` · `leave` · `transfer-host` | `roomId` + op fields |
| `POST /api/game/action` | `{ roomId, actionId(uuid), turnId, baseVersion, move: CHOOSE{index} \| SUBMIT_TEXT{text} \| TIMEOUT }` |

Server checks in `api/game/action.js`, in order:
1. Verified Supabase user token.
2. HMAC room token bound to room and user.
3. Player looked up by `user_id`. Body fields such as `by` or `role` are rejected by the strict schema.
4. Not a spectator.
5. `baseVersion === room.version`, otherwise `STALE`.
6. `turnId` matches, otherwise `WRONG_TURN`.
7. The current turn's role is the player's role, otherwise `NOT_YOUR_TURN`.
8. The seat is assigned to this player, otherwise `NOT_YOUR_SEAT`.
9. `actionId` is unique (primary key), otherwise `DUPLICATE_ACTION`.
10. Engine validation.
11. Compare-and-swap update on `version`. Of two simultaneous submits, exactly one wins.

AI-controlled seats are played by the server in the same request.

**Presence and reconnect.**
- The client shows CONNECTED, RECONNECTING, CONNECTION LOST and RESUMING, driven by channel status, `online`/`offline` and `visibilitychange`, plus a 15 s heartbeat that pulls fresh state.
- Late packets with an older version are ignored.
- If the same user joins again (duplicate tab or refresh), they get their existing seat back.

**Host migration.** If the host has not been seen for 20 s, any member may call `transfer-host`. The server assigns the host role to that player. Because state lives on the server, nothing is lost.

**Roles are never silently reassigned.** A taken seat returns `ROLE_TAKEN` with the holder's name and the free seats, and the UI shows a "Role unavailable" dialog.

**Spectators** get the public projection only. Every action from a spectator is rejected.

## D. Security changes
- Removed: the browser-side Supabase config form, the 4-character codes, client-broadcast game state, and the open `{prompt}` AI proxy.
- Room codes are 9 characters of Crockford base32 (about 45 bits). Join attempts are limited to 10 per minute and 30 per hour per IP. A bad code gets a uniform 404 after a 300 ms delay. Rooms expire after 30 min in the lobby or 2 h in game, with cleanup by cron.
- Supabase: RLS is on for every table and **no client policies exist**. Realtime topics are private: members can only *receive* broadcasts on their own room topic and track presence. Only the server sends.
- Limits:
  - Bodies: 8–16 KB.
  - Free text: 600 characters, with control and bidi characters stripped.
  - Names: 2–24 characters, no `<>{}`.
- Rate limits use an atomic Postgres function.
- Security events are logged to `security_log` (hashed user ids, no free text).
- XSS: everything is rendered as React text. There is no `dangerouslySetInnerHTML` anywhere.
- Headers (`vercel.json`): CSP (self + Google Fonts + `*.supabase.co`/`wss:`), nosniff, Referrer-Policy, Permissions-Policy (microphone=self), HSTS, `frame-ancestors 'none'` and X-Frame-Options DENY.
- Secrets live server-side only. The client refuses to start multiplayer if a service-role or secret key was put in `VITE_SUPABASE_ANON_KEY`, and warns: "Do not put a server secret in the browser."

## E. AI / API changes
- Typed tasks only. The **server writes every prompt**; the client never sends one.
- `GET /api/adalat-ai/health` only checks configuration and spends no tokens.
- Each request gets a token budget (case 3800, witness 160, review 400), a 25 s timeout, and at most one fallback provider. Rate limits per user per hour: 6 generations, 80 witness answers, 10 reviews, plus per-IP caps.
- Errors are generic codes (`AI_UNAVAILABLE`, `AI_INVALID`, `RATE_LIMITED`) with a request id. Provider and model names are never returned.
- **Case generation is game-aware.**
  - The AI writes a turn-by-turn case: options with grades, an objection opportunity, and a weakness the defence can discover in cross-examination that changes the outcome.
  - It may only cite **library law ids** allowed for the case type.
  - Output is parsed strictly. Malformed JSON is rejected, never repaired.
  - It is then checked by Zod and the deterministic `caseProblems()` gate, which checks law ids, the exhibit references, the answer↔question mapping, phase order, the verdict outcomes, and whether every flag a turn or outcome depends on can actually be set.
  - If it fails, the server regenerates once with the problems listed, then returns `AI_INVALID`.
  - The UI keeps your choices and offers a built-in case.
- Unique cases: the server picks a random city, setting, twist and month, and the client sends an avoid-list of your last 15 cases.

## F. Legal-content corrections
- BSA confession card `sec:'BSA 2023'` changed to **BSA §23**. The custody rule and the discovery proviso are added to the advanced layer.
- BSA §119 is now explicitly **"may — not must"**, rebuttable and discretionary.
- BSA §146: leading questions are barred in chief or re-examination **only if objected to**. The Court *shall* permit them on introductory or undisputed matters, and they are allowed in cross-examination.
- IT Act §66C/66D punishment: "up to 3 years, **and liable to** fine up to ₹1 lakh".
- BNSS §193 (police report) and §263 (framing of charge within 60 days) are added to the library, with §263 labelled "in real courts this can take several hearings".
- "Basic rule" cards are relabelled **GAME SIMPLIFICATION**. "Beyond reasonable doubt" is explained as a standard set by the courts, not a single section.
- Status labels: `checked_public` = checked against public bare-act sources on 2026-10-08. A human reviewer still has to confirm each card on India Code before it is marked `verified`. BNS §106(1), §281, §125(b) and MV Act §185 are marked **needs_review**.
- Property, divorce and consumer disputes are **removed from the criminal generator**. The UI says those case types need their own procedure and are "coming soon".

## G. UI / UX
- Dark courtroom palette from the tokens: ink, brass, parchment, purple for primary actions only, role colours only for people, semantic colours only for feedback.
- Home: columns, a slow brass light and a bench. One primary action.
- Roles are "character class" tiles showing who you are, what you do, how to perform well and what you learn.
- Case file on parchment, with collapsible story, timeline, people, exhibits and law sections.
- Courtroom arena: the bench with the judge, then prosecution, witness box, dock and defence. The active speaker glows and lifts; everyone else dims.
  - A parchment speech bubble shows what is being said.
  - A concept chip explains the current step.
  - The record reveals entries one at a time, so the hearing plays out in order.
- Moments: "OBJECTION!" stamp, sustained/overruled toast, exhibit-marked toast, court-adjourned and judgment-pronounced banners. Each has a sound cue.
- Feedback after every move: strong/okay/weak with ✓, ! or ✕, the skill affected, why, and a better move. On Beginner you can try a weak move again.
- Court record tabs: Transcript, Exhibits (view, use in question), Orders, Law (three-layer cards), Timeline.
- Timer: normal, warning and critical states. Ticks in the last 5 s. Spoken announcements at 10 s and 5 s. The engine owns the deadline and the client only renders it.
- Result: the judgment, how the law sees it, the skill bars with stars, awards and a player/role/score table (multiplayer), and a debrief (what you learned, key legal rule, what you missed with the better move, an optional AI teacher review). Losing the case does not lower your skill score.
- Audio: synthesised cues (no gavel as the theme), started only after the first tap. Sound and voice toggles. Speech input handles permission denied, busy mic, network errors and unsupported browsers, and is never required.

## H. Accessibility
- Semantics: landmarks, one h1 per screen, and the phase stepper as an `<ol>` with `aria-current="step"`.
- Live regions announce every new record entry (polite) and objections, rulings and timer warnings (assertive).
- Dialogs have `role="dialog"`, `aria-modal`, a focus trap, Esc to close, and return focus to whatever opened them.
- Brass focus ring on everything. Roles are a radiogroup you can move through with the arrow keys.
- Keyboard play: `1`–`3` choose an option, `Enter` submits, `E` opens exhibits, `R` opens the record.
- `prefers-reduced-motion` disables all motion and pulsing.
- Feedback never relies on colour alone (icon + word).
- All contrast pairs in the tokens meet WCAG AA. Muted text is #A9A4C2 on #141225 (≈7.4:1).

## I. Responsive / mobile
- Below 1024 px the record stacks under the arena.
- Below 768 px:
  - The arena shows heads and names only.
  - The action dock is sticky with `env(safe-area-inset-bottom)` padding.
  - Dialogs become bottom sheets.
  - Tap targets are at least 44–48 px.
- No horizontal scroll. Text boxes have no fixed heights.

## J–K. Tests and results
- **Run in this environment:** an end-to-end engine simulation of all 3 cases × 5 roles × best and worst play (30 full trials).
  - Every trial finished.
  - Best play scored 100 with verdict = correct.
  - Wrong role → `NOT_YOUR_TURN`, bad option → `INVALID_ACTION`, early timeout → `INVALID_ACTION`.
  - The live projection contained none of `correct/explain/flags/choices/seed/lesson`, and the reveal was null until the end.
- **Written, to run with `npm test`:**
  - `tests/engine.test.js` (≈25 cases): every case as every role, determinism, rule rejections, objection flow, keyword grading, witness truthfulness, adjournment limit, a projection leak scan at every step for 3 viewer types, own-feedback-only.
  - `tests/security.test.js` (≈30 cases): forged `by/actorId/role/host/score/state/truth/correct/winner/verdict/turn` rejected, unknown move types, oversized text, non-uuid replay keys, hostile names, control/bidi stripping, room-code format, secret detection, the legal library's required fields and "may/must" lint, and the AI quality gate (invented law, law not allowed for the type, missing exhibit, incomplete verdict, missing fields, smuggled keys, unset flags).
- **Not yet automated:** multiplayer tests with 2, 3 and 5 live clients against a real Supabase, Playwright end-to-end and screenshots at 320–1920 px, axe audits. These need a running Supabase project and browser; add them in CI.

## L. Known limitations
1. **Built-in case answers ship in the client bundle** because single-player runs offline. Multiplayer is server-authoritative and never sends answers, but a determined player could read the bundle. For tournaments, serve cases from the server only.
2. Case Lab (AI) cases are single-player only. Multiplayer uses the 3 built-in cases.
3. Built-in case text is English. The interface and law cards are bilingual, and Case Lab can generate in Hindi.
4. Civil, consumer, family and commercial flows are not built. They are shown as "coming soon" and are not converted into criminal trials.
5. Law cards are `checked_public`, not `verified`, until a human reviewer confirms them on India Code. Four are `needs_review`.
6. With no Supabase configured, the AI endpoint falls back to in-memory per-instance IP limits (degraded mode).
7. Character figures are abstract placeholders; commission vector portraits.
8. Not run here: `npm install`, the type check and the build. Expect to fix small type or lint issues on the first `npm run typecheck`. The build itself (Vite) does not type-check.

## M. Deployment
1. Supabase: create a project, then open the SQL editor and run `supabase/migrations/001_init.sql`.
2. Authentication → Providers: enable **Anonymous sign-ins**.
3. Realtime → Settings: turn **off** "Allow public access" so channels are private-only.
4. Optional: enable `pg_cron` and uncomment the cleanup schedule at the end of the SQL.
5. Vercel: import the repo and add the environment variables (N). Deploy.
6. Smoke test:
   - `/api/adalat-ai/health` should show `{ ok: true, multiplayer: true }`.
   - Play a built-in case.
   - Generate a Case Lab case.
   - Create a room in one browser and join from another (incognito).

## N. Environment variables
| Name | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | client (public) | multiplayer + AI auth |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | server only | authoritative room state |
| `ROOM_TOKEN_SECRET` | server only | ≥32 random bytes (`openssl rand -hex 32`) |
| `GROQ_API_KEY` and/or `GEMINI_API_KEY` | server only | AI (free tiers work) |
| `GROQ_MODEL`, `GEMINI_MODEL` | server only, optional | model overrides |

## O. Supabase configuration
- Everything is in `supabase/migrations/001_init.sql`. It creates:
  - tables: `rooms`, `room_players`, `room_seat_modes`, `room_actions`, `rate_limits`, `security_log`
  - indexes: a unique index on role per room
  - RLS: on for every table, with no client policies
  - functions: `hit_rate()` (atomic rate limiter) and `can_read_topic()` (security definer)
  - Realtime policies on `realtime.messages`: members may receive, and may track presence only
- The service role is used only by `/api/*`.
