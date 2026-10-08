// Vercel serverless function: POST /api/adalat-ai  { prompt } -> { text }
// FREE keys (Vercel → Settings → Environment Variables, then Redeploy):
//   GROQ_API_KEY   (console.groq.com)  — fastest, used first if present
//   GEMINI_API_KEY (aistudio.google.com) — used as backup
// Health check: open https://YOUR-SITE.vercel.app/api/adalat-ai
const GEMINI_MODELS = () => [...new Set([process.env.GEMINI_MODEL, 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash'].filter(Boolean))];

async function post(url, headers, body, ms) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: ac.signal }); }
  finally { clearTimeout(t); }
}

async function groq(prompt) {
  const r = await post('https://api.groq.com/openai/v1/chat/completions', { authorization: 'Bearer ' + process.env.GROQ_API_KEY.trim() },
    { model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', max_tokens: 4096, temperature: 0.8, messages: [{ role: 'user', content: prompt }] }, 25000);
  if (!r.ok) throw new Error(`groq → ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const j = await r.json();
  const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
  if (!text) throw new Error('groq → empty answer');
  return { text, model: 'groq' };
}

async function gemini(prompt) {
  let last = '';
  for (const model of GEMINI_MODELS()) {
    let r;
    try {
      r = await post(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
        { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.8 } }, 20000);
    } catch (e) { last = `${model} → timeout`; continue; }
    if (r.ok) {
      const j = await r.json();
      const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
      if (text) return { text, model };
      last = 'Empty answer from ' + model; continue;
    }
    last = `${model} → ${r.status}: ${(await r.text()).slice(0, 200)}`;
    if (r.status === 400 || r.status === 401 || r.status === 403) break;
  }
  throw new Error(last);
}

async function ask(prompt) {
  const errors = [];
  if (process.env.GROQ_API_KEY) { try { return await groq(prompt); } catch (e) { errors.push(String(e.message || e)); } }
  if (process.env.GEMINI_API_KEY) { try { return await gemini(prompt); } catch (e) { errors.push(String(e.message || e)); } }
  if (!errors.length) throw new Error('No AI key found. Add GROQ_API_KEY or GEMINI_API_KEY in Vercel → Settings → Environment Variables, then Redeploy.');
  throw new Error(errors.join(' | '));
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const t0 = Date.now();
    try { const out = await ask('Reply with just the word: ready'); return res.status(200).json({ ok: true, model: out.model, reply: out.text.trim(), seconds: ((Date.now() - t0) / 1000).toFixed(1) }); }
    catch (e) { return res.status(200).json({ ok: false, problem: String(e.message || e) }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 40000) return res.status(400).json({ error: 'Bad prompt' });
  try { const out = await ask(prompt); res.status(200).json({ text: out.text }); }
  catch (e) { res.status(502).json({ error: 'AI provider error', detail: String(e.message || e) }); }
}
