# ADALAT v7 — Architecture, Engine, Multiplayer & Security Spec

## 1. Audit of the current prototype (fix all of these)

| # | Area | Finding | Fix |
|---|---|---|---|
| A1 | Architecture | One ~1000-line design file with all state in one class; the deploy artifact is a 1.2 MB inlined HTML | Vite + React + TS modules (§2) |
| A2 | Multiplayer trust | `adalat-net.js` broadcasts full `SYNC` state (log, flags, moves, scores, `cur`, `phase`, seats) from the host. Any client can broadcast the same event and others apply it, so state, score and turn can be forged | Server-authoritative engine; clients send only intents (§6) |
| A3 | Identity | `payload.by`, `name`, `host` flags are trusted | Supabase Auth (anonymous sign-in allowed); actor derived from the JWT (`auth.uid()`) |
| A4 | Room code | 4 characters, so it can be guessed; no expiry, throttling or full-room checks | 9-character Crockford code plus a server-issued room token, rate limits, TTL (§6.2) |
| A5 | Hidden info | Case object (incl. `truth`, `correct`, `explain`, witness `knows`) is in every client's memory and in the sync state | Player projections; secrets stay server-side until JUDGMENT (§7) |
| A6 | Public channel | Realtime channel is public; anyone with the code can read and send | Private channels + RLS on `realtime.messages` (§6.5) |
| A7 | Browser config | The lobby asks users to paste a Supabase URL/key | Remove. Config comes from build env; reject any `service_role`/`sb_secret_` key pasted anywhere |
| A8 | AI proxy | `/api/adalat-ai` takes any `{prompt}` without auth, rate limit or size cap; GET may spend quota | §10 |
| A9 | AI output | `repair()` force-closes truncated JSON and plays it | Strict Zod schema; reject and regenerate; never repair (§10.3) |
| A10 | Legal | AI invents section numbers; civil, family and consumer cases get turned into criminal trials | Curated law library + validation; separate flows (§4, LEGAL-CONTENT) |
| A11 | Lifecycle | `setTimeout` auto-advance with a `tok` check only; AI promises can resolve after navigation; speech recognition is not always stopped | Session-scoped AbortController and `sessionId`/`turnId` guards (§3.4) |
| A12 | Clipboard | Shows "Copied" without awaiting the write | Await, fall back, show the failure message |
| A13 | Contrast | v6 lavender muted text on tinted backgrounds is borderline | Tokens + CI contrast test |
| A14 | Storage | Progress, name and seen-cases in localStorage with no separation | §12 |
| A15 | Errors | Some raw error strings reach the UI (`AI_SERVER_401`) | Error mapping layer (§3.5) |

## 2. Source layout
```
src/
  app/            App.tsx, routes.tsx (home, play, lab, tutorial, lobby/:code, court, result), providers
  components/     ui primitives: Button, IconButton, Dialog, Sheet, Tabs, Popover, Toast, Term, StatusTag, Timer
  components/game/       PhaseStepper, ScoreChip, FeedbackToast, MomentLayer (objection/ruling/judgment), Countdown
  components/court/      Arena, Bench, CounselDesk, WitnessBox, Figure, SpeechBubble, ActionDock, Composer, CourtRecord/*, ExhibitSlip, LawCard, ReasoningTree
  components/lobby/      CreateRoom, JoinRoom, SeatList, RoomCodePanel, ConnectionBadge, HostDialogs
  components/results/    SkillBars, Awards, Debrief, RoomTable
  game/engine/    reducer.ts (pure), machine.ts (phase graph), projector.ts (public/role views), rng.ts (seeded)
  game/rules/     criminal/, civil/, consumer/, family/, cyber/ (= criminal + IT Act), motor/ (MACT claim)
  game/actions/   types.ts, schemas.ts (Zod), guards.ts
  game/scoring/   dimensions.ts, deltas.ts, awards.ts
  game/phases/    one file per phase: enter(), allowedActions(), onAction(), timeoutAction()
  content/        cases/*.json (built-in), strings/{en,hi}.json, glossary/{en,hi}.json
  legal/          acts/*.json, sections/*.json, concepts/*.json, citations.ts, validate.ts
  multiplayer/client/    supabase.ts (lazy), channel.ts, presence.ts, resume.ts
  multiplayer/protocol/  messages.ts (Zod), version.ts
  multiplayer/session/   useRoom.ts, useSeat.ts, clock.ts (server time offset)
  ai/client/      api.ts (fetch with AbortSignal), streaming not required
  ai/schemas/     caseSchema.ts, witnessSchema.ts, assessSchema.ts, verdictSchema.ts
  ai/validators/  caseQualityGate.ts
  accessibility/  announcer.tsx (live regions), focus.ts, useReducedMotion.ts
  audio/          engine.ts, cues.ts, speech.ts, recognition.ts
  motion/         presets.ts (durations/easings from tokens), useMoment.ts
  styles/         tokens.css, base.css (reset, focus ring, fonts)
  utils/          text.ts (normalize/sanitize), ids.ts, errors.ts
api/
  adalat-ai/      generate-case.ts, witness.ts, assess.ts, review.ts, health.ts
  room/           create.ts, join.ts, leave.ts, resume.ts, transfer-host.ts
  game/           action.ts (single entrypoint for all in-game intents)
  _lib/           auth.ts, ratelimit.ts, engine (imports src/game/engine — shared, isomorphic), log.ts
supabase/migrations/*.sql
tests/ unit/ integration/ multiplayer/ accessibility/ security/ e2e/
```
Code-splitting: `court/*`, `multiplayer/*`, `ai/*` and `audio/*` are lazy-loaded route chunks. The home chunk must stay under 120 KB gzip. Supabase is imported only from `multiplayer/client/supabase.ts`, which is dynamically imported when the user enters friends mode.

## 3. Game engine

### 3.1 Principles
- A **case is data** and the **engine is generic**. The engine is a pure reducer `(state, action, ctx) → {state, events, scoreDeltas}` used both client-side (single-player) and server-side (multiplayer).
- The UI dispatches actions only. Components never mutate state.
- Every state has `sessionId`, `turnId` (monotonic), `version` (monotonic) and `phase`.

### 3.2 Phases
`CASE_INTRO → COURT_OPEN → FILING → CHARGE_STAGE → PLEA → PROSECUTION_EVIDENCE{ EXAMINATION_IN_CHIEF ⇄ CROSS_EXAMINATION ⇄ RE_EXAMINATION, OBJECTION → RULING } → ACCUSED_STATEMENT → DEFENCE_EVIDENCE{…} → FINAL_ARGUMENTS → JUDGMENT → SENTENCING? → RESULT`

`OBJECTION` and `RULING` are interrupt sub-states that can be entered from any examination step while a question is pending. `ADJOURNED` is an interrupt from any hearing phase and returns to the same step. Each phase module exports:
```ts
interface PhaseModule { id: PhaseId; enter(s): Effect[]; allowedActions(s, seat): ActionType[]; onAction(s, a): Result; timeoutAction?(s): GameAction; next(s): PhaseId | null; }
```
`machine.ts` holds the transition graph for each **procedure** and rejects any transition that is not in the graph.

### 3.3 Case schema (built-in and AI share this)
```ts
type Case = {
  caseId: string; version: 1; caseType: 'criminal'|'civil'|'consumer'|'family'|'cyber'|'motor';
  procedure: 'magistrate_warrant_police_report'|'magistrate_summons'|'sessions'|'civil_suit'|'consumer_complaint'|'family_petition'|'mact_claim';
  difficulty: 'beginner'|'standard'|'expert'; jurisdiction: 'IN'; court: string /* fictional, e.g. "Court No. 4, Judicial Magistrate First Class" */;
  title: string; caseNumber: string; oneLine: string; estimatedMinutes: number;
  legalSubjects: string[]; skillsTested: SkillId[]; learningObjectives: string[];
  story: string[]; timeline: {when:string; what:string}[];
  people: {id:string; name:string; role:RoleId|'complainant'|'io'; side?:'pros'|'def'}[];
  exhibits: {id:'P-1'|string; title:string; shows:string; side:'pros'|'def'; admissibilityIssue?: string /* hidden */}[];
  witnesses: {id:'PW1'|string; personId:string; side:'pros'|'def'; knows: Fact[] /* hidden */; doesNotKnow: string[]; weakPoints: {factId:string; trigger:string}[]; priorStatement?: string; relationship?: string; manner:string}[];
  lawRefs: string[] /* ids into legal/sections, e.g. "BNS-303" — never free text */;
  issues: {id:string; question:string; elements: string[] /* element ids from the law card */}[];
  outcomes: {id:'full'|'part'|'acq'|string; label:string; lawRefs:string[]}[];
  hidden: { correctOutcome: string; reasoning: ReasoningNode[]; explain: string; decisiveFacts: string[] };
  lesson: {title:string; points:string[]}; sources: string[]; verificationStatus: 'verified'|'needs_review';
  i18n?: { hi?: Partial<Case> };
};
type Fact = { id:string; text:string; proven_by?: string[] /* exhibit/witness ids */ };
```

### 3.4 Lifecycle safety
- `useSession()` creates an AbortController for each case session. Every fetch, timer, speech or recognition handle registers with it and is aborted when you navigate away or replay.
- Async results are applied only if `result.sessionId === state.sessionId && result.turnId === state.turnId`. Anything else is dropped.
- Timers derive from `deadlineAt` (server time minus offset); there are no client-side countdown authorities.

### 3.5 Errors
`utils/errors.ts` maps internal codes to user messages (EN/HI). Codes: `AI_UNAVAILABLE, AI_INVALID, AI_TIMEOUT, NET_LOST, ROOM_NOT_FOUND, ROOM_FULL, ROOM_EXPIRED, RATE_LIMITED, ROLE_TAKEN, NOT_YOUR_TURN, INVALID_ACTION, UNKNOWN`.

## 4. Case-type flows (do NOT reuse the criminal flow for everything)
| Type | Procedure (game) | Parties | Standard | Outcomes | Status for v7 |
|---|---|---|---|---|---|
| Criminal | Police-report warrant case before Magistrate: police report (BNSS §193) → charge (BNSS §263) → plea → prosecution evidence → statement of accused → defence evidence → arguments → judgment → sentence | State (APP) v. Accused | Beyond reasonable doubt | Convict (offence/lesser) / Acquit | **Ship** |
| Cyber | Criminal flow plus IT Act sections and electronic-evidence issues | same | same | same | **Ship** |
| Motor accident | Criminal flow for rash driving; a separate MACT compensation claim flow (claimant v. owner/insurer, preponderance of probability) | — | — | Compensation amount | Criminal ship; MACT later |
| Civil | Plaint → written statement → issues → plaintiff evidence → defendant evidence → arguments → decree | Plaintiff v. Defendant | Balance of probabilities | Decree / dismiss / partial | Later; show "Coming soon" |
| Consumer | Complaint before District Commission → opposite party's version → evidence (mostly affidavits) → arguments → order | Complainant v. Opposite party | Balance of probabilities | Relief / dismissal | Later |
| Family | Petition → reply → mediation/conciliation step → evidence → judgment | Petitioner v. Respondent | Balance of probabilities | Decree / dismissal | Later |

Roles change for each type: there is no "Prosecutor" or "Accused" in civil, consumer or family cases. Remove "Property dispute", "Divorce / family" and "Consumer complaint" from the AI criminal generator until those flows exist. Where a dispute has a genuine criminal angle (e.g. criminal trespass, cruelty), offer it as a **criminal** case and label it as such. Mark any simplification of the flow in the UI with `GAME SIMPLIFICATION · In real courts: …` (e.g. "In real courts this happens over many dates.").

## 5. Actions (client → engine)
```ts
type GameAction =
 | {t:'SUBMIT_QUESTION'; text:string; exhibitRef?:string}
 | {t:'SUBMIT_ANSWER'; text:string}                 // witness/accused
 | {t:'SUBMIT_OBJECTION'; ground:ObjectionGround}
 | {t:'RULE_OBJECTION'; ruling:'sustained'|'overruled'}
 | {t:'MARK_EXHIBIT'; exhibitId:string} | {t:'CHALLENGE_EXHIBIT'; exhibitId:string; reason:string} | {t:'RULE_EXHIBIT'; exhibitId:string; admit:boolean}
 | {t:'SUBMIT_ARGUMENT'; text:string; cites:{exhibits:string[]; laws:string[]}}
 | {t:'SUBMIT_PLEA'; plea:'guilty'|'not_guilty'} | {t:'SUBMIT_STATEMENT'; text:string}
 | {t:'SUBMIT_VERDICT'; outcomeId:string; reasons:string[]} | {t:'SUBMIT_SENTENCE'; optionId:string}
 | {t:'REQUEST_ADJOURNMENT'; reason:string} | {t:'RULE_REQUEST'; grant:boolean}
 | {t:'END_EXAMINATION'} | {t:'READY_FOR_NEXT'};
type Envelope = { actionId: string /* uuid v7 */; roomId: string; turnId: number; baseVersion: number; action: GameAction };
```
Zod limits: text 3–600 characters after normalization (NFC, collapse whitespace, strip C0/C1 control characters); `reasons` ≤3 items of ≤200 characters; ids must match `^[A-Z]{1,2}-?\d{1,2}$`.

## 6. Multiplayer

### 6.1 Topology
- **Authority:** a server function `api/game/action` runs the shared engine against the room row (Postgres, `SELECT … FOR UPDATE`) and then broadcasts **projections**.
- **Realtime:** Supabase Realtime on private channels is used for fan-out and presence only. Clients **never** broadcast game events; RLS denies client `INSERT` on the game topic.
- **AI seats** are run by the server inside the same action pipeline (with queued jobs), so clients can't forge AI moves.

### 6.2 Rooms
- **Code:** 9 Crockford-base32 characters shown as `XXX-XXX-XXX` (about 45 bits), random and not sequential. Generation retries on collision.
- **Join:** `POST /api/room/join {code, displayName, wantRole?}` → server validates → returns `{roomId, seatId, role|null, roomToken}`. `roomToken` is a short-lived JWT (2h) with `room_id`, `seat_id` and `role`; it is required for every room API call.
- **Limits:**
  - 6 seats and 20 spectators per room
  - 10 join attempts per IP per minute and 30 per hour
  - 5 rooms created per user per hour
  - On a bad code: a uniform 404 with a 300ms delay (resists enumeration)
- **TTL:** 30 minutes since the last action in the lobby, 2 hours in game. A cron (`pg_cron`, every 5 minutes) sets rooms to `expired` and purges players and actions after 24 hours.
- **Statuses:** `lobby → countdown → in_game → finished → expired | ended`.

### 6.3 Client → server messages (HTTP POST, all Zod-validated)
`JOIN_ROOM, SELECT_ROLE{role}, READY{ready}, START (host), SUBMIT_ACTION{Envelope}, REQUEST_RESUME{lastVersion}, REQUEST_LEAVE, TRANSFER_HOST{toSeatId} (host or vote), KICK{seatId} (host), SET_SEAT_MODE{role, mode:'human'|'ai'} (host)`.

### 6.4 Server validation pipeline for SUBMIT_ACTION
1. Verify the Supabase JWT and the room token, then derive `userId` and `seatId`. **Ignore any actor fields in the body.**
2. Rate limit: 2 actions/second per seat, 60/minute.
3. Zod-parse the envelope; body ≤8 KB.
4. Lock the room row and check: room `in_game`; seat belongs to the room and is not a spectator; `envelope.turnId === state.turnId`; `baseVersion === state.version` (otherwise 409 with the current snapshot); `actionId` not in `room_actions` (unique index, which handles replays); `action.t` is in `allowedActions(state, seat)`.
5. Run the engine. Persist the new state, increment `version`, insert into `room_actions {actionId, roomId, turnId, actorSeatId, version, type, createdAt}` (free text stored only in state, not logged), and commit.
6. Broadcast `STATE_PATCH {version, turnId, publicDelta}` on `room:{id}:public` and per-seat deltas on `room:{id}:seat:{seatId}`.

Rejections return `{code}` (see §3.5) and are logged with `requestId`.

### 6.5 Supabase SQL (core)
```sql
create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code ~ '^[0-9A-HJKMNP-TV-Z]{9}$'),
  host_user uuid not null references auth.users,
  status text not null default 'lobby' check (status in ('lobby','countdown','in_game','finished','expired','ended')),
  case_id text not null, difficulty text not null,
  public_state jsonb not null default '{}', hidden_state jsonb not null default '{}',
  turn_id int not null default 0, version int not null default 0,
  expires_at timestamptz not null default now() + interval '30 minutes',
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms on delete cascade, user_id uuid references auth.users,
  display_name text not null check (char_length(display_name) between 2 and 24),
  role text check (role in ('judge','pros','def','accused','witness','clerk')), is_spectator bool default false,
  ready bool default false, connected bool default true, last_seen timestamptz default now(),
  unique(room_id, user_id), unique(room_id, role)
);
create table room_actions (
  action_id uuid primary key, room_id uuid references rooms on delete cascade,
  turn_id int not null, version int not null, actor_player uuid references room_players, type text not null, created_at timestamptz default now()
);
create table room_scores ( room_id uuid references rooms on delete cascade, player_id uuid references room_players, dimension text, value int, primary key(room_id, player_id, dimension) );

alter table rooms enable row level security; alter table room_players enable row level security;
alter table room_actions enable row level security; alter table room_scores enable row level security;
-- Clients never read hidden_state: expose a view without it.
create view rooms_public with (security_invoker=on) as select id, code, status, case_id, difficulty, public_state, turn_id, version, expires_at from rooms;
create policy "members read room" on rooms for select using (exists(select 1 from room_players p where p.room_id = rooms.id and p.user_id = auth.uid()));
revoke select on rooms from authenticated, anon; grant select on rooms_public to authenticated;
create policy "members read players" on room_players for select using (exists(select 1 from room_players p where p.room_id = room_players.room_id and p.user_id = auth.uid()));
-- All writes go through server functions using the service role; no insert/update policies for clients.

-- Realtime authorization (private channels). Topics: room:<id>:public, room:<id>:seat:<seatId>
create policy "read own room topics" on realtime.messages for select to authenticated using (
  exists(select 1 from room_players p where p.user_id = auth.uid()
    and ( realtime.topic() = 'room:'||p.room_id||':public' or realtime.topic() = 'room:'||p.room_id||':seat:'||p.id )));
create policy "presence only" on realtime.messages for insert to authenticated with check (
  realtime.messages.extension = 'presence' and exists(select 1 from room_players p where p.user_id = auth.uid() and realtime.topic() = 'room:'||p.room_id||':public'));
```
Client: `supabase.channel('room:'+id+':public', {config:{private:true}})`. Turn on "Allow anonymous sign-ins" and call `supabase.auth.signInAnonymously()` the first time a player enters friends mode.

### 6.6 Presence, reconnect and host migration
- Presence payload: `{seatId, state:'online'|'away'}` only. The server never trusts presence for authority; it uses it only to show status.
- Reconnect: on channel `CHANNEL_ERROR`/`TIMED_OUT`, or on `visibilitychange` to visible or `online`, the client sends `REQUEST_RESUME{lastVersion}`. The server replies with the full projection, and the client replaces its state if `version > local`. Late packets with `version ≤ local` are dropped.
- Seat hold: 60 seconds, then AI takeover is offered to the host; the default is AI after 120 seconds.
- Host migration: a host heartbeat lives in `room_players.last_seen`. After 20 seconds stale, any player may call `TRANSFER_HOST` and the server assigns it atomically to the earliest-joined connected player. Because the game is server-authoritative, nothing is lost.
- Duplicate tab: the same `user_id` reconnecting takes over `connected`, and the old tab gets `SESSION_REPLACED`.

### 6.7 Spectators
`is_spectator=true`, with no role and no seat topic. They receive the public projection only, and every action from a spectator is rejected. A future classroom mode adds a `teacher` host type and analytics, and needs no change to the protocol.

## 7. Hidden information and projections
`projector.ts` builds:
- **public**: phase, turn, transcript, marked exhibits (no `admissibilityIssue`), orders, timer deadline, connection, public score totals per player (shown only after RESULT if the host enabled live scores).
- **seat(role)**: public + its own feedback + its own suggestions + (for a witness seat) that witness's `knows`/`doesNotKnow` only.
- **reveal** (after JUDGMENT is entered): `hidden.correctOutcome`, `reasoning`, `explain`.

The `truth`, `correct`, `explain` fields and the other witnesses' knowledge are **never** included in any projection before the reveal. The test `tests/security/projection.spec.ts` deep-scans every projection for forbidden keys at every step.

## 8. Judgment and the reasoning tree
- For each `issue`, the engine evaluates: **Fact established?** (facts proven by admitted exhibits or by unshaken testimony) → **Evidence support?** → **Legal element satisfied?** (law card elements) → **Alternative explanation?** (from defence moves, credibility hits) → **Reasonable doubt?** → **Finding**.
- Testimony is credible unless a `weakPoint` was triggered in cross (the engine records `contradiction` events; a triggered weak point flips that fact to "doubt").
- The engine computes `recordOutcome` from the tree. A judge player's verdict is compared against `recordOutcome` (what the record supports), **not** against a fixed answer. `hidden.correctOutcome` is used for the debrief ("on full evidence the law would say…").
- AI is used only to write the oral judgment text, constrained to the computed findings.

## 9. Scoring and awards
- **Dimensions** (0–100 each): `legal_accuracy, evidence, procedure, question_quality | judicial_reasoning, strategy, time`.
- **Deltas** come from the engine:
  - question grade (AI assess → 0/1/2, mapped to −2/+1/+2 and validated by deterministic rules such as "leading in chief = 0 regardless of AI")
  - objection correct/incorrect (±2 strategy, ±1 procedure)
  - spam penalty
  - missed exhibit (an exhibit never used by the side that owns it, −2 evidence)
  - contradiction found (+3 strategy)
  - ruling correct per rules (±2 judicial_reasoning)
  - timeout (−1 time)
- Normalized per role at RESULT. The server is authoritative in multiplayer; the client only displays.
- **Awards** (computed, only if the threshold is met):
  - Best Advocate (highest advocate composite ≥70)
  - Sharpest Cross (most contradictions, ≥1)
  - Sharpest Objection (most sustained, ≥2, zero overruled)
  - Strongest Reasoning (judge ≥80)
  - Evidence Master (all own exhibits used and admitted)
  - Best Strategist (strategy ≥85)

## 10. AI endpoint
### 10.1 Routes
Replace the generic `{prompt}` proxy with **typed task endpoints**: `POST /api/adalat-ai/{generate-case|witness|assess|review|judgment-text}`. The server builds the prompts, so the client never sends a raw prompt. `GET /api/adalat-ai/health` checks only that the configuration exists and spends no tokens.

### 10.2 Protection
- Auth: Supabase JWT required (anonymous allowed). Room tasks also require the room token.
- Rate limits (Upstash Redis or Postgres token bucket):
  - generate-case: 6/hour per user and 20/hour per IP
  - witness, assess: 60/hour per user and 300/hour per room
  - review: 10/hour per user
- Limits: request body ≤16 KB; user text fields ≤600 characters; `max_tokens` per task (case 1800, witness 220, assess 300, review 400); upstream timeout 25 seconds; ≤1 retry; ≤1 provider fallback.
- Each request gets a `requestId` (returned in the `x-request-id` header). Server logs carry `{requestId, task, userId hash, latency, ok, code}` with no free text.
- Client errors are generic: `{code:'AI_UNAVAILABLE'|'AI_INVALID'|'RATE_LIMITED', requestId}`. Never return provider or model names.

### 10.3 Validation and the case quality gate
- Zod-parse the output. If parsing fails, reject (one regeneration attempt); do **not** repair truncated JSON.
- **Law references must come from the library.** The prompt gives the model the list of allowed `lawRefs` ids for the case type and difficulty. Any id not in the library makes the output invalid.
- Deterministic gate (`caseQualityGate.ts`) checks:
  - every exhibit id referenced in story, witnesses and issues exists
  - timeline is in chronological order
  - each witness `knows` facts reference existing exhibits or people
  - every issue's elements exist on its law cards
  - `outcomes` contain `hidden.correctOutcome`
  - for `acq`, at least one decisive fact has a triggerable weak point
  - for `full`, every element has a fact with `proven_by`
  - text lengths are within bounds
  - no real-person names from a denylist; city is in the allowed list
  - Hindi fields exist when lang=hi
- If any critical check fails, regenerate (max 2), then fall back to a built-in case with the message "AI case generation is temporarily unavailable."
- Keep the v6 uniqueness seeding (city, setting, twist, month, random id) and the avoid-list of the last 15 played cases (title, accused, one-line summary only).
- The AI witness answers only from that witness's `knows`/`doesNotKnow`/`weakPoints` and must admit a weak point when the question targets its trigger (the engine checks for this and records a `contradiction`).

## 11. Security checklist
- **XSS:** React escaping only; no `dangerouslySetInnerHTML` anywhere (enforced by an ESLint rule). All AI text, names and transcripts are treated as untrusted strings.
- **Headers** (`vercel.json`): `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co; img-src 'self' data:; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: microphone=(self), camera=(), geolocation=()`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`.
- **Secrets:** `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`/provider keys, `ROOM_TOKEN_SECRET` and `UPSTASH_*` exist server-side only. The client gets only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (publishable). Remove the browser config form. Any input that matches `/service_role|sb_secret_/` is rejected with: "Do not enter a server secret in the browser."
- **Logging:** room create/join/leave/resume, invalid action (code), rate-limit hits, AI task outcome, judgment computed, security rejections.
- **Observability:** aggregate counters for AI success rate and p50/p95 latency, generation failures, realtime connect failures and reconnects, room abandonment, completion rate. No personal data.

## 12. Storage
- `adalat:prefs` (lang, sound, voice, reducedAudio, tutorialDone)
- `adalat:progress` (per case: best per role, conceptsLearned[])
- `adalat:seen` (last 30 AI cases: title, accused, oneLine)
- `sessionStorage adalat:room` (roomId, roomToken, seatId), cleared when leaving or when the room ends

Do not store case stories or transcripts. Migrate v6 keys (`adalat-progress-v2`, `adalat-name`, `adalat-seen-cases`) once, then delete them.

## 13. Tests (Vitest + Playwright + axe)
- **Unit / engine:**
  - start; each phase transition; illegal transition rejected; timer expiry → timeoutAction
  - objection: leading in chief sustained; leading in cross invalid ground
  - ruling; exhibit mark, admit and reject; adjournment limit
  - judgment reasoning tree for each built-in case and each truth variant
  - score calculation snapshot; replay resets the session; leave cleans up (AbortController called, no timers left; use fake timers to assert)
- **Multiplayer** (2, 3 and 5 clients against a local Supabase via `supabase start`):
  - host join, guest join, duplicate role → `ROLE_TAKEN`, duplicate tab → `SESSION_REPLACED`
  - disconnect/reconnect mid-turn and mid-judgment, late join → spectator, room full
  - wrong turn, wrong role, wrong phase
  - **forged actor id, forged state broadcast, forged score, forged correctOutcome, client INSERT on a game topic → all rejected**
  - replay of `actionId`, stale `baseVersion` → 409, two simultaneous submits → exactly one accepted
  - host leaves → migration
- **Security:**
  - oversized prompt or body → 413; oversized name → 400
  - `<script>`/`<img onerror>` in name and answers renders as text
  - invalid room code; enumeration (100 random codes → uniform 404 and rate limit)
  - rapid join and create → 429; fake host flag ignored; AI flood → 429
  - projection deep-scan for hidden keys
- **AI:** valid JSON passes; invalid, partial, missing-field or wrong-type output rejected; unknown law id rejected; overlong rejected; unsupported case type → 400; regenerate path; fallback to built-in.
- **Legal content:** every section JSON has act, section, title, simple, legal, source, verifiedAt, status; `status==='verified'` is required for anything a built-in case references; a lint fails on the words "must presume" or "always" in explanations of provisions that say "may".
- **Accessibility:** axe on each route (0 serious); keyboard-only run through tutorial → court → result; focus trap and restore on every dialog; reduced-motion snapshot (no animations); contrast-pair test from tokens.
- **E2E lifecycle:** Home → Play → Brief → Court → Result → Replay → Home; Home → Create → Lobby → Court → Result → Leave → Home. Assert no open channels, intervals or recognition after each.
- **Responsive:** Playwright screenshots at 320, 360, 390, 414, 768, 1024, 1280, 1440 and 1920, plus an overflow assertion (`scrollWidth ≤ clientWidth`).

## 14. Deployment
1. `supabase db push` (migrations in §6.5). Turn on anonymous sign-ins and Realtime private channels ("Allow public access" OFF).
2. Vercel env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `ROOM_TOKEN_SECRET` (32+ bytes), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `AI_MODEL` (server-only).
3. `vercel.json`: headers from §11; `/api/*` functions with maxDuration 30.
4. SEO: title "ADALAT — Step into the courtroom", meta description, Open Graph image (1200×630 of frame 1a), favicon, `robots.txt`, `sitemap.xml` (home, tutorial, about), semantic headings.
5. After deploying: run the Playwright smoke test against the production URL (the CSP must not break wss://, fonts or the API).

## 15. Acceptance criteria
Every one of the following must be demonstrated by a test or a manual QA note in the PR:
- no spoofing paths (§13 forged tests)
- hidden info never exposed before reveal
- the AI endpoint is protected and its output is schema-checked
- legal refs come from the verified library
- no civil, family or consumer case masquerades as criminal
- the arena is not a dashboard (design review against frames 1a–1j)
- mobile is usable at 320
- keyboard play and visible focus work
- reduced motion works
- contrast passes
- no leaked timers or subscriptions
- reconnect and room expiry work
- invalid actions are rejected
- score, verdict, turn and roles are authoritative
- simplification is labelled
- no raw errors are shown
- every §0 feature in README still works
