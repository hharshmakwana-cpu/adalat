// Vercel serverless function: POST /api/adalat-ai  { prompt } -> { text }
// FREE option: set GEMINI_API_KEY (from aistudio.google.com) in Vercel → Settings → Environment Variables, then Redeploy.
// Health check: open https://YOUR-SITE.vercel.app/api/adalat-ai in the browser.
const GEMINI_MODELS = () => [process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'].filter(Boolean);

async function gemini(prompt) {
  let last = '';
  for (const model of [...new Set(GEMINI_MODELS())]) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.8 } })
    });
    if (r.ok) {
      const j = await r.json();
      const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
      if (text) return { text, model };
      last = 'Empty answer from ' + model;
      continue;
    }
    last = `${model} → ${r.status}: ${(await r.text()).slice(0, 300)}`;
    if (r.status === 400 || r.status === 401 || r.status === 403) break;
  }
  throw new Error(last);
}

async function anthropic(prompt) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY.trim(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error(`anthropic → ${r.status}: ${(await r.text()).slice(0, 300)}`);
  const j = await r.json();
  return { text: (j.content || []).filter(b => b.type === 'text').map(b => b.text).join(''), model: 'anthropic' };
}

export default async function handler(req, res) {
  const provider = process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'anthropic' : null;
  if (req.method === 'GET') {
    if (!provider) return res.status(200).json({ ok: false, problem: 'No AI key found. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.' });
    try { const out = await (provider === 'gemini' ? gemini : anthropic)('Reply with just the word: ready'); return res.status(200).json({ ok: true, provider, model: out.model, reply: out.text.trim() }); }
    catch (e) { return res.status(200).json({ ok: false, provider, problem: String(e.message || e) }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 40000) return res.status(400).json({ error: 'Bad prompt' });
  if (!provider) return res.status(500).json({ error: 'No AI key set. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.' });
  try {
    const out = await (provider === 'gemini' ? gemini : anthropic)(prompt);
    res.status(200).json({ text: out.text });
  } catch (e) {
    res.status(502).json({ error: 'AI provider error', detail: String(e.message || e) });
  }
}
