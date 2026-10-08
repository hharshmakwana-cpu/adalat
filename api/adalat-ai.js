// Vercel serverless function: POST /api/adalat-ai  { prompt } -> { text }
// FREE keys (Vercel → Settings → Environment Variables, then Redeploy):
//   GROQ_API_KEY   (console.groq.com)      — fastest, tried first
//   GEMINI_API_KEY (aistudio.google.com)   — backup
// Models are discovered automatically from each provider, so retired model names never break the game.
// Optional overrides: GROQ_MODEL, GEMINI_MODEL.  Health check: open /api/adalat-ai in the browser.
let cache = { groq: null, gemini: null, at: 0 };

async function call(url, opts, ms) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(t); }
}
const fresh = () => Date.now() - cache.at < 6 * 3600 * 1000;

// ---------- Groq ----------
async function groqModels() {
  if (cache.groq && fresh()) return cache.groq;
  const r = await call('https://api.groq.com/openai/v1/models', { headers: { authorization: 'Bearer ' + process.env.GROQ_API_KEY.trim() } }, 8000);
  if (!r.ok) throw new Error(`groq models → ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const ids = ((await r.json()).data || []).filter(m => m.active !== false).map(m => m.id)
    .filter(id => !/whisper|tts|guard|embed|vision|audio|orpheus|playai|compound/i.test(id));
  const score = id => (/gpt-oss-120b/i.test(id) ? 100 : 0) + (/llama.*(70b|maverick|scout)/i.test(id) ? 80 : 0) + (/qwen|kimi|deepseek/i.test(id) ? 60 : 0)
    + (/gpt-oss-20b/i.test(id) ? 50 : 0) + (/instant|8b/i.test(id) ? 20 : 0) + ((id.match(/(\d+(\.\d+)?)/) || [0, 0])[1] * 0.01);
  cache.groq = [process.env.GROQ_MODEL, ...ids.sort((a, b) => score(b) - score(a))].filter(Boolean).slice(0, 4); cache.at = Date.now();
  return cache.groq;
}
async function groq(prompt) {
  let last = '';
  for (const model of await groqModels()) {
    let r;
    try {
      r = await call('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY.trim() },
        body: JSON.stringify({ model, max_tokens: 4096, temperature: 0.8, messages: [{ role: 'user', content: prompt }] })
      }, 25000);
    } catch (e) { last = `groq ${model} → timeout`; continue; }
    if (r.ok) {
      const j = await r.json(); const text = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';
      if (text) return { text, model: 'groq/' + model };
      last = `groq ${model} → empty`; continue;
    }
    last = `groq ${model} → ${r.status}: ${(await r.text()).slice(0, 150)}`;
    if (r.status === 401 || r.status === 403) break;
    if (r.status === 404) cache.groq = null;
  }
  throw new Error(last);
}

// ---------- Gemini ----------
async function geminiModels() {
  if (cache.gemini && fresh()) return cache.gemini;
  const r = await call('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() } }, 8000);
  if (!r.ok) throw new Error(`gemini models → ${r.status}: ${(await r.text()).slice(0, 150)}`);
  const ids = ((await r.json()).models || [])
    .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(id => /^gemini/i.test(id) && /flash/i.test(id) && !/image|tts|audio|live|embedding|thinking|exp|preview/i.test(id));
  const ver = id => parseFloat((id.match(/gemini-(\d+(\.\d+)?)/) || [0, 0])[1]) || 0;
  const score = id => ver(id) * 10 + (/lite/i.test(id) ? 3 : 5) + (/latest/i.test(id) ? 1 : 0);
  cache.gemini = [process.env.GEMINI_MODEL, ...ids.sort((a, b) => score(b) - score(a))].filter(Boolean).slice(0, 4); cache.at = Date.now();
  return cache.gemini;
}
async function gemini(prompt) {
  let last = '';
  for (const model of await geminiModels()) {
    let r;
    try {
      r = await call(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 4096, temperature: 0.8 } })
      }, 25000);
    } catch (e) { last = `gemini ${model} → timeout`; continue; }
    if (r.ok) {
      const j = await r.json();
      const text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
      if (text) return { text, model: 'gemini/' + model };
      last = `gemini ${model} → empty`; continue;
    }
    last = `gemini ${model} → ${r.status}: ${(await r.text()).slice(0, 150)}`;
    if (r.status === 400 || r.status === 401 || r.status === 403) break;
    if (r.status === 404) cache.gemini = null;
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
    const t0 = Date.now(); const info = {};
    try { if (process.env.GROQ_API_KEY) info.groqModels = await groqModels(); } catch (e) { info.groqModels = String(e.message); }
    try { if (process.env.GEMINI_API_KEY) info.geminiModels = await geminiModels(); } catch (e) { info.geminiModels = String(e.message); }
    try { const out = await ask('Reply with just the word: ready'); return res.status(200).json({ ok: true, model: out.model, reply: out.text.trim(), seconds: ((Date.now() - t0) / 1000).toFixed(1), ...info }); }
    catch (e) { return res.status(200).json({ ok: false, problem: String(e.message || e), ...info }); }
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 40000) return res.status(400).json({ error: 'Bad prompt' });
  try { const out = await ask(prompt); res.status(200).json({ text: out.text }); }
  catch (e) { res.status(502).json({ error: 'AI provider error', detail: String(e.message || e) }); }
}
