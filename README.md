# Adalat — putting the game live

The game is a single web page (`index.html`). The AI features (live cases, AI lawyers & witnesses, AI judge, AI teacher) need a small server function so your AI key stays secret. Everything below is free to start.

## Easiest route: Vercel (≈15 minutes, no coding)

1. **Get a FREE AI key** — go to **aistudio.google.com** → sign in with Google → **Get API key → Create API key**. No card needed. (Paid alternative: an Anthropic key from console.anthropic.com.)
2. **Make this folder** on your computer:
   ```
   adalat/
     index.html          ← the downloaded game file (rename it to index.html)
     api/adalat-ai.js    ← from this package
   ```
3. **Sign up at vercel.com** (log in with Google or GitHub) → *Add New → Project* → drag the `adalat` folder in.
4. Before you click Deploy, open **Environment Variables** and add:
   - `GEMINI_API_KEY` = your free Google key  (or `ANTHROPIC_API_KEY` if you chose Anthropic)
   - (optional) `GEMINI_MODEL` = model name (default `gemini-2.5-flash`)
5. Click **Deploy**. You get a link like `adalat.vercel.app`. Add your own domain later under *Settings → Domains*.

The game finds the AI by itself at `/api/adalat-ai` — no settings to change.

## Already have a website?
- **WordPress / Wix / Squarespace:** host the game on Vercel as above, then put a button or an `<iframe src="https://adalat.vercel.app" style="width:100%;height:100vh;border:0">` on your page.
- **Your own server:** serve `index.html`, and make any endpoint that accepts `POST {prompt}` and returns `{text}` (copy the logic from `api/adalat-ai.js`). If it lives at a different address, add this line in `index.html` before the other scripts:
  `<script>window.ADALAT_CONFIG={endpoint:'https://your-site.com/your-endpoint'}</script>`

## What works without AI
The three built-in levels play fully without AI. AI Live cases, AI witnesses answering typed questions, AI grading of free-text arguments and the AI teacher review need internet + the server function.

## Voice
Read-aloud and "Speak" use the browser's built-in speech features (best in Chrome/Edge on desktop and Android). English (India) and Hindi are both supported where the device has those voices.

## Online multiplayer (Supabase — free)
1. Sign up at **supabase.com** → *New project* (any name, any region close to India, e.g. Mumbai).
2. Open **Project Settings → API**. Copy the **Project URL** and the **anon public** key (the anon key is meant to be public — safe in a web page).
✅ **Already done for you** — your project (`pgbftpzfekttizcvhzyl`) is built into `index.html`. Steps 1–3 are only needed if you ever switch projects.
3. Give the keys to the game, either way:
   - **Easiest:** open your live game → *Online multiplayer* box → paste both → **Save** (saved in that browser only), **or**
   - **For everyone automatically:** in `index.html`, right after `<head>`, add
     `<script>window.ADALAT_CONFIG={supabaseUrl:'https://xxxx.supabase.co',supabaseKey:'YOUR_ANON_KEY'}</script>`
     then re-upload to GitHub (Vercel updates in ~1 minute).
4. How to play: the host picks a role → **Create a room** → **Copy invite link** → sends it on WhatsApp. Friends open the link, pick a different role, tap **Join**. The host chooses the level (or AI Live case) and starts. Every move appears live on all phones; empty seats are played by AI.

No database tables are needed — the game uses Supabase Realtime channels only.

## Costs
Vercel's free plan is enough to start. The Google Gemini free tier has daily limits (roughly a few hundred requests a day) — one full AI Live case uses about 30–40 requests, so expect around 5–10 AI cases per day for free. The 3 built-in levels and multiplayer use no AI quota.
