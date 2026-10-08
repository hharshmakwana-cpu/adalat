# Handoff: ADALAT v7 — Courtroom Game Redesign

> Prompt for Claude Code: **"Implement this design and architecture in my existing Adalat repository. Read README.md, ARCHITECTURE.md and LEGAL-CONTENT.md in full first. Keep every existing feature working (listed in §0) while you migrate."**

## Overview
ADALAT is a multiplayer courtroom game. You learn Indian law by playing a trial. This bundle covers:
- **README.md** (this file): product, screens, design tokens, interactions, motion, audio, accessibility, mobile, states.
- **ARCHITECTURE.md**: source layout, game engine and state machine, case-type flows, multiplayer protocol, security, Supabase SQL, AI endpoint, scoring, tests, deployment.
- **LEGAL-CONTENT.md**: the legal content schema, the verified law-card library, and corrections to the current case data.
- **Adalat Game Design v7.dc.html**: hi-fi screen frames 1a–1j, which this doc refers to by id.

## About the design files
The HTML file is a **design reference**, not production code. Rebuild it in **React + TypeScript + Vite** with CSS variables (tokens in §3). Do not copy its inline styles. Do not ship the current 1.2 MB bundled `index.html` as the architecture. Rebuild the modules from the existing source: `Adalat Courtroom Game v6.dc.html`, `adalat-cases.js`, `adalat-ai.js`, `adalat-net.js`, `api/adalat-ai.js`.

## Fidelity
**High fidelity** for colour, type, hierarchy and layout. Character figures are deliberately abstract placeholders (head disc plus shoulders in the role colour). Replace them with commissioned flat vector portraits in the same restrained style. They must not be cartoonish or photographic.

---

## 0. Existing features that must survive
English/Hindi · 3 built-in cases (theft, road accident, cyber fraud) · AI case generation ("Surprise me", city/setting/twist seeding, a no-repeat list of recently played cases) · AI witness answers · AI grading and review · friends mode (Supabase) · role selection with AI or human seats · scoring and stars · progress saved on the device · exhibits · objections · adjournments with a limit per side · timers per level · voice output (speech synthesis) · voice input (speech recognition) where supported · suggested options.

---

## 1. Product principles
1. **Play first, then explain, then go deeper.** Never put a block of legal text before a decision.
2. **Every legal term can be tapped.** It shows a plain-language explanation, the legal rule, and the source (see §8).
3. **Label every legal statement as one of three kinds**: `REAL LAW` (purple tag), `GAME SIMPLIFICATION` (brass outline tag) or `FICTIONAL FACTS` (muted tag). The case file header always shows "Fictional case".
4. **Losing the case is not failing.** Players are scored on skill, separately from the verdict.
5. **No fake features.** No made-up online counts, leaderboards, seals or citations. The court is fictional ("Court No. 4"). No government emblems.

---

## 2. Visual language
A dark, cinematic courtroom with **parchment documents** layered on top. Depth comes from light falling on the bench, a floor drawn in perspective, and documents casting shadows. It must not look like a grid of dashboard cards.

Colour rules:
- Ink, brass and parchment carry the ceremony and the game's identity.
- **Purple is the only colour for primary actions.** There is one primary button per view.
- Role colours are used **only** to identify a character or player: seat trims, the left bar on transcript speakers, avatars, award chips.
- Semantic colours are used **only** for state and feedback.
- Never use pale lavender text for important information.

---

## 3. Design tokens (`src/styles/tokens.css`)
```css
:root{
  /* surfaces */
  --color-bg:#0E0C1A; --color-bg-deep:#08070F; --color-surface:#141225; --color-surface-raised:#1D1A33; --color-surface-high:#2B2548;
  --color-line:rgba(247,243,234,.10); --color-line-strong:rgba(247,243,234,.20);
  /* text */
  --color-ink:#F7F3EA;          /* main text on dark */
  --color-muted:#A9A4C2;        /* secondary text on dark, 7.4:1 on --color-surface */
  --color-ink-dark:#141225;     /* text on parchment */
  --color-muted-dark:#3B3754;   /* secondary text on parchment, 10:1 */
  --color-parchment:#F7F3EA; --color-parchment-line:#DCD5C4;
  /* brand */
  --color-primary:#5B3DF5; --color-primary-dark:#4428D6; --color-primary-disabled:#3A3460;
  --color-brass:#D6A84F;        /* labels, active phase, room code, accents. Never body text on parchment */
  /* semantic: fill / text-on-dark */
  --color-success:#2E8B57; --color-success-text:#5FD39A;
  --color-warning:#C78419; --color-warning-text:#F2B55A;
  --color-danger:#C94747;  --color-danger-text:#F08A8A;
  --color-info:#2563EB;
  /* roles */
  --color-judge:#8B5CF6; --color-prosecution:#2563EB; --color-defence:#D9468D;
  --color-accused:#EA580C; --color-witness:#0F8A83; --color-clerk:#64748B;
  /* type */
  --font-ui:'IBM Plex Sans','IBM Plex Sans Devanagari',system-ui,sans-serif;
  --font-court:'Spectral','Noto Serif Devanagari',Georgia,serif;
  --font-mono:'IBM Plex Mono',ui-monospace,monospace;
  --fs-12:.75rem; --fs-13:.8125rem; --fs-14:.875rem; --fs-15:.9375rem; --fs-16:1rem; --fs-18:1.125rem;
  --fs-21:1.3125rem; --fs-26:1.625rem; --fs-34:2.125rem; --fs-46:2.875rem; --fs-72:4.5rem; --fs-hero:clamp(4rem,9vw,8.25rem);
  /* spacing (4px base) */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:20px; --sp-6:24px; --sp-8:32px; --sp-10:40px; --sp-12:48px; --sp-16:64px;
  /* radius */
  --r-xs:3px; --r-sm:6px; --r-md:10px; --r-lg:12px; --r-xl:14px; --r-sheet:22px;
  /* shadow */
  --sh-doc:0 16px 40px rgba(0,0,0,.5); --sh-bench:0 20px 40px rgba(0,0,0,.45); --sh-primary:0 12px 32px rgba(91,61,245,.4);
  --glow-turn:0 0 22px color-mix(in srgb,var(--role) 60%,transparent);
  /* motion */
  --dur-instant:80ms; --dur-fast:160ms; --dur-base:240ms; --dur-slow:420ms; --dur-scene:800ms;
  --ease-out:cubic-bezier(.2,.7,.2,1); --ease-in-out:cubic-bezier(.6,0,.3,1); --ease-stamp:cubic-bezier(.3,1.6,.5,1);
  /* z layers */
  --z-arena:0; --z-hud:10; --z-dock:20; --z-drawer:40; --z-moment:60; --z-dialog:80; --z-toast:90;
}
@media (prefers-reduced-motion:reduce){:root{--dur-fast:0ms;--dur-base:0ms;--dur-slow:0ms;--dur-scene:0ms}}
```
Type usage:
- Spectral is for the court's voice: case titles, testimony, judgments, moment banners.
- Plex Sans is for all interface text.
- Plex Mono is for timers, timestamps, room codes and exhibit numbers.
- Body text is at least 15px; labels are at least 13px.
- Capitals with letter-spacing 0.12–0.2em are only for short kicker labels of 4 words or fewer.

Contrast is checked in CI (see ARCHITECTURE §11). The pairs that must pass AA:
- ink on bg, surface and raised
- muted on surface and raised
- ink-dark and muted-dark on parchment
- white on primary (5.9:1)
- the semantic `-text` colours on surface

Brass on parchment fails (2.0:1), so it is banned for text.

---

## 4. Screens

### 1a · Home
- **Layout:** full-bleed, 100dvh.
  - Background: 4 abstract columns (64px wide, a vertical gradient from surface to raised) at 120px side padding, with a brass radial light from above.
  - The bench is suggested at bottom centre: an 880×150 raised panel with a 3px brass top border.
  - Top bar (padding 28/48): wordmark on the left. On the right: Sound, Language and Sign-in, as 1px line-strong outlined buttons, 8px radius, 14px text.
- **Centre stack** (gap 22px):
  - Kicker "COURT NO. 4 · NOW IN SESSION" in brass.
  - Wordmark: Spectral 700, hero size, letter-spacing 0.12em.
  - Tagline "Step into the courtroom." in Spectral 34px.
  - Subtext "No legal background required. Learn by making the decisions." 18px muted, max 520px wide.
  - PLAY: 400×64, primary, 19px 700, letter-spacing 0.08em, primary shadow.
  - Two secondary buttons, "Play with friends" and "Case Lab · AI": 54px tall, 1px brass outline at 50% opacity.
  - "Continue: …" resume line, shown only when a saved session exists.
- **Ambient motion:** dust in the light beam (≤40 particles drawn on a canvas, opacity 0.04–0.12, drifting 6–14px/s) and a slow brass light breathing (opacity 0.12↔0.18, 8s). Both are off under reduced motion. The realtime/multiplayer code is **not** loaded on this screen.
- **Mobile:** columns hidden. Wordmark at 64px. The buttons fill the width (minus 24px margins) and sit in the bottom 40% of the screen within thumb reach, padded with `env(safe-area-inset-bottom)`.

### Mode select (follows PLAY)
A three-column row (one column on mobile):
- **Story cases**: built-in cases, Beginner to Expert.
- **Case Lab**: AI case. Pick a type, including "Surprise me"; the type picker shows only types whose flow is implemented (ARCHITECTURE §4).
- **Tutorial**: the 2–3 minute first-run tutorial.

Each column is a parchment "case folder" leaning at −1° to +1°, not a card grid. First-time players are routed to the Tutorial with a "Skip" link.

### Tutorial / onboarding (≈2–3 min, played rather than read)
Five beats inside a real mini-hearing (theft case, PW1 only):
1. The clerk calls the case (tap to continue) → teaches *the court has an order of events*.
2. You are the Prosecutor. Pick an open question from 3 options. One option is leading; if picked, the Defence AI objects, shows the **OBJECTION!** moment (1e), the judge sustains it, and a WHY card explains it → teaches the **leading question**.
3. Mark Exhibit P-1 by dragging the FIR onto the bench (or tapping "Mark P-1") → teaches **exhibits**.
4. Switch to Defence and ask one cross question, where leading is allowed → teaches **cross-examination**.
5. Judge decides: a one-line "Was it proved beyond reasonable doubt?" with the reasoning tree preview → teaches **burden of proof**.

The tutorial finishes with a "You now know 5 courtroom ideas" strip and goes to mode select. It saves `tutorialDone` in preferences.

### 1b · Role selection
- **Layout:** padding 48/64. A header with the case kicker and "Choose your seat" (Spectral 44).
- **Grid:** `1.35fr 1fr 1fr` × 2 rows, gap 16px.
  - The **selected role expands** into the large left tile: a role-tinted gradient from #2A1F4F to surface, a 2px role-colour border and a large figure bleeding off the right edge.
  - Its fields are WHO YOU ARE, WHAT YOU DO, HOW YOU PERFORM WELL and skill chips (rgba(247,243,234,.08) background, 6px radius).
  - Unselected roles are small tiles with a 4px role-colour top border, a name in Spectral 26, a one-line job and "Learn: …".
- The Clerk is narrated, not playable in single-player. In multiplayer the Clerk is playable only if the host enables "Clerk seat". "Spectate instead" is a text link.
- **Interaction:**
  - Clicking a small tile swaps it into the large slot (FLIP animation, 420ms ease-out).
  - Keyboard: arrow keys move between tiles, Enter selects; the tiles form a radiogroup with `aria-checked`.
  - CTA: "Enter court as {Role} →".
- **Role copy** (EN; Hindi lives in the content layer, not a word-for-word translation):

| Role | Objective | Skills | Learn |
|---|---|---|---|
| Judge | Run a fair hearing; decide only on the record | Rulings, admitting evidence, reasoning | Judicial reasoning |
| Public Prosecutor | Prove the charge beyond reasonable doubt | Chief exam, exhibits, arguments | Burden of proof |
| Defence Counsel | Create reasonable doubt; protect the accused's rights | Cross, objections, arguments | Reasonable doubt |
| Accused | Plead and respond to the evidence against you | Plea, explanation | Rights of the accused |
| Witness | Tell only what you saw; stay consistent | Truthful testimony, memory | Credibility |
| Clerk (MP only) | Call witnesses, read charges, mark exhibits | Procedure | Order of trial |

### Create / join room
- **Create:** host picks a case or Case Lab, difficulty, seats (human/AI per role), spectators allowed (on by default) and Clerk seat (off). The server returns the room code and token (ARCHITECTURE §6). Display name: 2–24 characters, trimmed, whitespace collapsed, no control characters.
- **Join:** a code field in `XXX-XXX-XXX` format (Crockford base32, no I/L/O/U), auto-uppercased, auto-hyphenated, with `inputmode="text"` and `autocapitalize="characters"`. Invite-link and QR entry fill the code in automatically.
- **Errors**, each a calm inline message under the field:
  - "That room code doesn't exist or has expired."
  - "This courtroom is full. You can watch as a spectator."
  - "Too many attempts. Try again in a minute."

### 1c · Lobby
- **Layout:** two columns, `1fr 480px`.
- **Left column:**
  - "Courtroom lobby" heading plus the connection badge (see §7).
  - Seat list: rows, not cards. Columns are an 8×44 role bar, name + role, presence, and readiness.
  - The HOST tag is brass, 13px 600.
  - An open seat reads "AI will play if empty".
  - A spectator count and the room expiry note.
- **Footer:** "Leave room" (outlined) and the Start button.
  - Start is only enabled for the host, when every human seat is Ready and the server reports `canStart`.
  - When disabled, the button explains why: "Start trial · waiting for Defence to be ready".
- **Right panel** (surface background):
  - ROOM CODE in mono 46px brass.
  - Copy-link and QR buttons. The copy feedback appears only after the clipboard write resolves; the fallback uses `execCommand`, and if that fails too: "Couldn't copy — select the code instead".
  - The case folder: parchment, rotated −1°, document shadow, showing type, court level, difficulty, title, one-line summary and "Fictional case · ~20 min".
- **Host-only:** reassign or kick a seat (with a confirm dialog) and toggle a seat between AI and human.
- **Non-host:** a "Ready" toggle (a primary-outlined button that fills when ready).
- **Start:** a 3-2-1 countdown is broadcast by the server (`COUNTDOWN` with `startsAt`). Clients render it from the server time offset.

### 1d · Courtroom arena (main game)
- **Grid:** rows `64px | 1fr | 196px`. The middle row is `1fr | 400px`.

**HUD (64px, surface):**
- Left: case title (Spectral 18) and "Court No. 4 · Day 1 · Beginner".
- Centre: a phase stepper (labels and 20px connector lines). The current phase is a brass pill with ink-dark text and `aria-current="step"`.
- Right: score and timer. The timer is in mono 18 with a 2px border coloured by state (§9).

**Arena (left, middle row):**
- Background: radial gradient from #2A2450 at the top to bg. The floor is drawn in perspective (`rotateX(38deg)`) with faint repeating lines.
- **Bench:** top centre. The judge figure stands over a 460×84 bench with a 3px brass top border and the bench shadow.
- **Counsel desks:** prosecution on the left, defence on the right, 220×64, with a 3px top border in the role colour.
- **Witness box:** centre, 240×70, with a brass top border. A speech bubble above it shows the **latest utterance** (parchment, Spectral 18, max 440px, with a tail).
- **Current actor:** a "YOUR TURN" or "{ROLE} SPEAKING" tag, a role-colour glow on the figure, and a 2px role border on the desk. Everyone else drops to 70% opacity.
- **Concept chip** (bottom-left): a "?" icon plus a tappable term with a dotted brass underline, plus a one-line rule. It changes whenever the step changes.

**Court Record (right, 400px, surface):**
- Tabs: Transcript · Exhibits · Orders · Law · Timeline (`role="tablist"`).
- Each transcript entry has a mono 13px timestamp, a speaker label in the role colour (13px 600) and 15px text.
- Clerk and system entries are muted.
- An exhibit-marked entry is highlighted in brass at 12% opacity.
- Feedback entries have a 3px semantic left bar and the semantic colour at 12% (§5).
- The list auto-scrolls only if the user is already within 80px of the bottom; otherwise a "New entries ↓" pill appears.

**Action dock (196px, surface):**
- Prompt line, e.g. "Cross-examine PW3 · question 2 of 3".
- Composer: a textarea with a 2px primary border when focused, a 600-character limit and a live counter after 450.
- Tool chips: Use exhibit…, Suggest questions (only in Beginner/Standard), Speak (only if speech recognition exists).
- Actions grid (360px): the primary action for the step, plus secondary actions.

**Actions available per step:**

| Step | Primary | Secondary |
|---|---|---|
| Chief (own witness) | Ask question | Show exhibit, End chief |
| Cross | Ask question | Show exhibit, End cross |
| Opponent asking | — | **Object** (enabled only when the question is in flight; see §6), Pass |
| Witness (you) | Answer | "I don't know / don't remember" |
| Judge during exam | — | Ask clarification, Admit/Reject exhibit |
| Objection pending (Judge) | Sustain / Overrule (1e) | — |
| Arguments | Submit argument | Cite exhibit, Cite law |
| Judgment (Judge) | Pronounce | Reserve (MP) |
| Request (counsel) | — | Request adjournment (shows remaining count), Request summons |

**Keyboard:**
- `Enter` submits (`Shift+Enter` for a new line), `O` objects, `E` opens exhibits, `R` opens the record, `?` shows the shortcuts.
- Every shortcut is also a visible button.

### 1e · Objection → ruling
- **Trigger:** an opponent counsel (human or AI) objects while a question is pending.
- **Sequence** (total ≈1.6s, skippable with a click or Esc):
  1. The arena dims to 60% (240ms).
  2. "OBJECTION!" (Spectral 118, rotated −3°, danger glow) scales from 1.25 to 1 using `--ease-stamp`, with a 520×6 danger underline wiping in from the left (160ms).
  3. Two quote panels slide up 12px and fade in: the question asked (with its role top border) and the objection with its ground.
  4. A dotted line (transform only) "travels" from the objector's desk to the bench (420ms). Then the **ruling sheet** (parchment) rises.
- **Ruling sheet:**
  - "YOUR RULING, JUDGE" plus the timer.
  - Sustained (filled ink) and Overruled (outlined), each with a subline explaining the effect.
  - A `REAL LAW` strip giving the rule and a "Learn more" link.
- **Non-judge players** see "Awaiting ruling…" in place of the buttons.
- **AI judge:** rules after 1.2s, then the result banner shows.
  - "Objection sustained." (success chip): the question is struck through in the transcript and the asker gets "Rephrase".
  - "Objection overruled." (muted chip): the witness answers.
- **Objection grounds**, offered only when valid for the step:
  - Leading: only in chief or re-exam.
  - Irrelevant, Argumentative, Insulting/annoying, Assumes facts not in evidence, Repetitive, Calls for speculation.
  - Irrelevant and Insulting map to REAL LAW cards (LEGAL-CONTENT); the others are labelled GAME SIMPLIFICATION.
- **Anti-spam:** a 3rd overruled objection in the same examination costs −2 Strategy and puts the Object button on a 1-question cooldown.

### 1f · Judgment
- **Layout:** two columns.
- **Left:**
  - "JUDGMENT PRONOUNCED" kicker.
  - Outcome headline (Spectral 72). A partial outcome shows on two lines, the second in brass Spectral 34 with the section.
  - Oral judgment excerpt (17px muted, in quotes).
  - Sentence line with the judge's name.
- **Right:** "HOW THE COURT REASONED", the reasoning tree from ARCHITECTURE §8, shown as rows.
  - Each row has a status disc (✓ success, ✕ danger, ! warning), the finding text, and a status word: Proved / Doubt / Applied / Not proved.
  - Rows reveal one by one, 180ms apart. Under reduced motion they appear instantly.
- **Sequence:** the clerk says "All rise" (1 line) → gavel-free judgment sound (§10) → the headline fades in from blur(4px) → the tree reveals → CTA "See your performance →".
- **Hidden-information rule:** before this screen nothing in the client contains `truth`, `correctOutcome` or reasoning data (ARCHITECTURE §7).

### 1g · Results + debrief
- **Left column (520px):**
  - "CASE CONCLUDED" and a one-line verdict-versus-you sentence. Examples: "Your side lost the charge of theft. You argued well." or "Your judgment matches the law and the evidence."
  - Six skill bars (170px label | bar | mono value), each a 10px brass bar on a raised track: Legal accuracy, Evidence, Procedure, Question quality, Strategy, Time. A Judge sees "Judicial reasoning" in place of Question quality.
  - Awards, only those actually earned (ARCHITECTURE §9).
- **Right:** a parchment debrief sheet with four sections:
  - WHAT YOU LEARNED (success label)
  - KEY LEGAL RULE (primary label, with a REAL LAW card)
  - WHAT YOU MISSED: up to 3 of your weakest moves, each as "You asked / Better" with why
  - BEST NEXT CASE
  - CTAs: Next case (primary) and "Replay as {other role}".
- **Multiplayer:** an extra "Room" tab with a table (Player | Role | Score), the awards list, and "Back to lobby" for the host / "Leave" for everyone.
- **Progress saved:** best score per case and per role; the tutorial and concepts learned (concept ids).

### 1h · Mobile courtroom (≤767px)
A single column; nothing scrolls inside anything else.
- **Top bar:** phase label "Prosecution evidence · 4/7", case title and timer, plus a 4px segmented progress bar.
- **Arena strip (250px):** the current speaker large in the centre (44px head), with the asker and opponent small at 55% opacity. The bench is a thin silhouette at the top.
- **Content:** the latest utterance (parchment), the latest feedback, and an "Open court record (n)" link.
- **Dock:** sticky at the bottom, with `padding-bottom: calc(12px + env(safe-area-inset-bottom))`.
  - Composer at least 48px tall.
  - A 48/48/1fr grid: mic, exhibit picker, primary.
  - Content gets a `scroll-padding-bottom` equal to the dock height so focused inputs aren't hidden.
- **Object button:** appears as a floating danger-outlined pill above the dock while an opponent's question is in flight.
- **Tablet (768–1023):** arena on top, record in a drawer from the right (360px), dock at the bottom.

### 1i · Mobile drawers
- The record, exhibits and law open in a bottom sheet (640px, 22px top radius, grab handle). It can be dragged down to close, closes on Esc, traps focus and returns focus to the opener.
- **Exhibit sheet:** parchment, with a mono exhibit number in primary, a status stamp (ADMITTED in success / CHALLENGED in warning / REJECTED in danger, rotated −6°), and the actions View · Challenge · Use in question.
- **Law card:** segmented Simple / Legal rule / Source, plus the status tag.

### 1j · System states
These are covered in §7. Every async surface has loading, success, failure, retry and (where it makes sense) cancel.

### Case file (brief), shown before court
- A parchment document view.
- **Header:** "FICTIONAL CASE" tag, case no., court, title, one-line summary.
- **Collapsible sections:** Story (Spectral 18/1.7), Timeline (mono time + event), People (role colour bars), Exhibits (numbered), Law (law cards).
- **Bottom:** "Your objective as {role}" (1–2 lines), plus Enter court.
- Expert difficulty hides "Law → Here's the question it raises".

---

## 5. Feedback system
- **When it appears:** after every graded move, as an inline transcript entry plus a toast on the arena (2.4s, `aria-live="polite"`).
- **Strong:** "Strong question · +2 Question quality", a 1-line WHAT, and success styling.
- **Okay:** a warning bar, "Okay · +1", WHAT and a BETTER MOVE.
- **Weak:** a danger bar with three parts:
  - "Weak · −2 Evidence strategy"
  - WHY: "You missed the chance to challenge the identification."
  - BETTER MOVE: the suggested line, plus a **Try again** button. Beginner always offers Try again (once per step); Standard offers it once per examination; Expert never does.
- **Teaching:** a first-time concept adds a "New idea: Leading question" chip that opens the law card. Concepts are recorded in progress.
- **Wording:** never just "WRONG". Always WHAT, then WHY, then BETTER.
- **Points:** come from the engine's score deltas (ARCHITECTURE §9). The client never computes authoritative points.

## 6. Turn and timer system
- Each step has an owner (role) and an optional deadline (`deadlineAt` from the server).
- **Timer states:**
  - NORMAL above 30%: ink border.
  - WARNING ≤30%: warning border plus a single soft tick at the threshold.
  - CRITICAL ≤10s: danger border, the number pulses in scale only (1→1.06, 600ms), plus an inset vignette on the arena edge at 0.15 opacity. Audio ticks for the last 5 seconds only if sound is on.
- **Reduced motion:** no pulse; the remaining seconds are announced at 10 and 5 through `aria-live="assertive"`.
- **Expiry:** the server applies the step's `timeoutAction` (e.g. "no question asked → End examination", worth −1 Time). Clients just render it.
- **Difficulty:**

| | Beginner | Standard | Expert |
|---|---|---|---|
| Timer per move | none (or 120s in MP) | 60s | 40s |
| Choices | 3 suggested + free text | free text, suggestions on request (−1) | free text only |
| Hints | concept chip + WHY on every move | WHY on weak moves | debrief only |
| Case design | one clear issue | conflicting evidence, one decisive item | subtle admissibility/credibility issues, plausible competing outcomes |
| Objection grounds shown | 3 relevant | all valid for step | all valid; no indication whether it applies |

## 7. Multiplayer presence and connection states
- **Connection badge** (HUD and lobby), each with a dot and a word:
  - CONNECTED (success)
  - RECONNECTING… (warning, pulsing dot)
  - CONNECTION LOST (danger)
  - RESUMING (info)
  - It must never show raw text such as `CHANNEL_ERROR`.
- **Per-seat presence**, on desk labels and in the lobby:
  - Online
  - Away (tab hidden for over 15s)
  - Reconnecting
  - Left
  - AI (the AI has taken over after the hold time)
- **Your own disconnect:** a non-blocking banner at the top: "Connection lost. Reconnecting… Your seat is held for 60 seconds. Nothing you typed is lost." The draft stays in memory. When back online, the client sends `REQUEST_RESUME` → the server returns a snapshot → "Resumed" toast.
- **Someone else's disconnect:** the turn pauses only if it's their turn. Their desk shows "Reconnecting · 0:42". After 60s the host chooses "Let AI play this seat" or "Keep waiting"; the default after 120s is AI.
- **Host disconnect:**
  - A blocking dialog for everyone: "GAME PAUSED · The host disconnected. Waiting 0:20".
  - Actions: Wait / Become host (the first ready player gets it, and the server makes the transfer atomic) / End room (any player may vote; a majority ends it).
  - Because state is server-authoritative, a host change doesn't lose anything.
- **Role unavailable:** a dialog that names who holds the seat. It offers the free seats and Spectate, and never reassigns anyone silently.
- **Room full:** offer Spectate. **Room expired:** "This courtroom has closed." plus Home.
- **Duplicate tab:** the newest tab takes the seat; the older one shows "Opened in another tab" with "Use here".
- **Spectators:** they see the public projection, the record and moments. They have no dock, and the object/ready controls are not rendered (the server rejects them anyway).

## 8. Legal explanation system (UI)
- `<Term id="cross_examination">` renders a dotted-brass underline with button semantics. Tap or focus opens a popover on desktop or a bottom sheet on mobile, with three tabs:
  - **Simple:** ≤30 words.
  - **Legal rule:** the advanced explanation, with "may"/"shall" kept exactly as the law says.
  - **Source:** Act, section, link to India Code, `verifiedAt`.
- **Status tag** on every card: `REAL LAW` (filled purple), `GAME SIMPLIFICATION` (brass outline, plus "In real courts: …" line) or `FICTIONAL FACTS`.
- Only show terms the current step uses, at most 1 chip on the arena. The Law tab lists all the case's cards.

## 9. Motion system
All motion uses only transform and opacity. Every moment can be skipped. Reduced motion swaps each animation for an instant state change plus an `aria-live` announcement.

| Moment | Spec |
|---|---|
| Court opens | Bench light fades up 0→1 (800ms), clerk line types in, then "Court is in session" kicker |
| Judge enters | Judge figure translateY(12px)→0 + fade, 420ms |
| Witness enters | Figure slides from the right edge to the box, 420ms ease-out; oath line |
| Turn change | Previous actor fades to 70%, new actor glow ramps 240ms; "YOUR TURN" tag drops 8px |
| Question sent | Composer text flies to the transcript (translate + scale 0.9), 240ms |
| Witness answer | Bubble scales 0.96→1 + fade, 240ms; Spectral text reveals word by word at 25ms/word (capped at 1.2s; instant if reduced motion) |
| Objection | §4 1e |
| Ruling | Sheet rises 24px; result chip stamps with --ease-stamp |
| Exhibit marked | Parchment slip drops on the bench, rotate(−4°→−1°), number stamp scales 1.4→1, 320ms |
| Evidence accepted/rejected | Stamp ADMITTED / REJECTED on the slip |
| Important testimony | When the engine flags `keyMoment`, the bubble border goes brass for 1.2s and "Witness testimony contradicted." or "Reasonable doubt detected." shows as a kicker |
| Strong/weak move | Toast slides up 12px; score number counts over 400ms |
| Timer critical | §6 |
| Judgment | §4 1f |
| Result | Bars fill left→right 600ms, 80ms stagger; awards fade in after |

## 10. Audio system (`src/audio`)
- **Engine:** WebAudio, created lazily on the first user gesture. Never autoplay.
- **Channels:** `ambience` (room tone, −30 dB loop), `ui`, `moments`, `voice` (speech synthesis).
- **Cues:** court-open (low string swell 1.2s), page-turn, exhibit-place (paper on wood), notify, objection (sharp low brass hit), ruling (2-note resolve), judgment (sustained chord), timer-tick, result.
  - The objection cue must be a brass hit, **not** a Hollywood gavel; avoid gavel sounds as the courtroom's identity.
- **Settings:** Sound on/off · Voice on/off · Reduce audio (ambience off, moments −6 dB).
- **Failure handling:** if the AudioContext is suspended, call `resume()` silently on the next gesture. If speech synthesis has no hi-IN voice, fall back to en-IN and show "Hindi voice not available on this device" once.
- **Voice input:**
  - Handle permission-denied ("Microphone blocked — you can type instead"), unsupported (hide the button), network, busy, and no-speech.
  - Use `hi-IN`/`en-IN` from the language setting.
  - Never required. Stop recognition when unmounting or when the step changes.

## 11. Loading, empty and error states
- **AI case generation:** a four-line checklist that progresses through "Opening the case file…" → "Reviewing witnesses…" → "Preparing exhibits…" → "Checking law against the library" → "Court is ready." Cancel aborts the request (AbortController).
- **AI failure:** "The case file could not be opened." with Try again / Play a built-in case. The user's choices are kept.
- **AI witness slow (>6s):** "The witness is thinking…" with animated dots. Past 20s, show "Ask again" (resends with the same `actionId`).
- **Empty states:**
  - Record: "No court record yet…"
  - Exhibits: "No exhibits marked yet. Exhibits get numbers like P-1 when shown to the court."
  - Progress: "Your first case is waiting."
- **Errors:** never show provider names, status codes or stack traces. Every error has a user message and a `requestId` hidden in the "Details" disclosure.

## 12. Accessibility
- **Semantics:**
  - Landmarks: header (HUD), main (arena + record), a `<form>` for the dock.
  - One h1 per screen (the case title in court); the record tabs and debrief sections use h2.
- **Live regions:**
  - `aria-live="polite"` for new transcript entries (speaker + text) and feedback.
  - `assertive` for objections, rulings, timer at 10s/5s, and connection lost.
- **Phase stepper:** an `<ol>` with `aria-current="step"`.
- **Dialogs** (ruling, host-disconnect, role-unavailable, drawers): `role="dialog"`, `aria-modal`, labelled, with a focus trap, Esc closes (except where a decision is required), and focus returns to the opener.
- **Focus ring:** `outline:2px solid var(--color-brass); outline-offset:2px` on all interactive elements, never removed.
- **Non-colour cues:** feedback uses an icon and a word (✓ Strong / ! Okay / ✕ Weak); roles use a name label as well as colour.
- **Hit targets:** at least 44×44 (48 on mobile).
- **Font scaling:** text resizes to 200% with no loss of content.
- **Hindi:** `lang="hi"` on Hindi strings; Noto Serif Devanagari for the court voice.

## Files
- `design/Adalat Game Design v7.dc.html`: hi-fi frames 1a–1j (open in a browser; `support.js` must sit next to it)
- `current_source/`: the v6 prototype to migrate from (game, cases, AI adapter, multiplayer adapter, AI API, vercel config)
- `ARCHITECTURE.md`, `LEGAL-CONTENT.md`: engineering and legal specs

## 13. Responsive QA matrix
Test at 320, 360, 390, 414, 768, 1024, 1280, 1440 and 1920 px, portrait and landscape. Fail the build if any of these occur:
- horizontal scroll
- clipped text
- the dock covering a focused input
- a dialog taller than the viewport without internal scrolling
- the arena figures overlapping the speech bubble

At 1024 and below the HUD stepper collapses to "Phase 4/7 · Prosecution evidence".
