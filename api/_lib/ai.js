// AI provider access (server only). Typed tasks with token budgets, timeouts, one retry, one fallback provider.
// Clients never see provider or model names.
let cache = { groq: null, gemini: null, at: 0 };
const fresh = () => Date.now() - cache.at < 6 * 3600 * 1000;
async function call(url, opts, ms) { const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms); try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(t); } }

export const aiConfigured = () => !!(process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY);

async function groqModels() {
  if (cache.groq && fresh()) return cache.groq;
  const r = await call('https://api.groq.com/openai/v1/models', { headers: { authorization: 'Bearer ' + process.env.GROQ_API_KEY.trim() } }, 8000);
  if (!r.ok) throw new Error('groq models ' + r.status);
  const ids = ((await r.json()).data || []).filter(m => m.active !== false).map(m => m.id).filter(id => !/whisper|tts|guard|embed|vision|audio|orpheus|playai|compound/i.test(id));
  const score = id => (/gpt-oss-120b/i.test(id) ? 100 : 0) + (/llama.*(70b|maverick|scout)/i.test(id) ? 80 : 0) + (/qwen|kimi|deepseek/i.test(id) ? 60 : 0) + (/gpt-oss-20b/i.test(id) ? 50 : 0) + (/instant|8b/i.test(id) ? 20 : 0);
  cache.groq = [process.env.GROQ_MODEL, ...ids.sort((a, b) => score(b) - score(a))].filter(Boolean).slice(0, 2); cache.at = Date.now();
  return cache.groq;
}
async function groq(prompt, { maxTokens, json }) {
  for (const model of await groqModels()) {
    let r; try {
      r = await call('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.GROQ_API_KEY.trim() },
        body: JSON.stringify({ model, max_tokens: maxTokens, temperature: 0.8, ...(json ? { response_format: { type: 'json_object' } } : {}), messages: [{ role: 'user', content: prompt }] }) }, 25000);
    } catch { continue; }
    if (r.ok) { const j = await r.json(); const text = j.choices?.[0]?.message?.content || ''; if (text) return text; continue; }
    if (r.status === 401 || r.status === 403) break; if (r.status === 404) cache.groq = null;
  }
  throw new Error('groq failed');
}
async function geminiModels() {
  if (cache.gemini && fresh()) return cache.gemini;
  const r = await call('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() } }, 8000);
  if (!r.ok) throw new Error('gemini models ' + r.status);
  const ids = ((await r.json()).models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name.replace(/^models\//, ''))
    .filter(id => /^gemini/i.test(id) && /flash/i.test(id) && !/image|tts|audio|live|embedding|thinking|exp|preview/i.test(id));
  const ver = id => parseFloat((id.match(/gemini-(\d+(\.\d+)?)/) || [0, 0])[1]) || 0;
  cache.gemini = [process.env.GEMINI_MODEL, ...ids.sort((a, b) => ver(b) - ver(a))].filter(Boolean).slice(0, 2); cache.at = Date.now();
  return cache.gemini;
}
async function gemini(prompt, { maxTokens, json }) {
  for (const model of await geminiModels()) {
    let r; try {
      r = await call(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY.trim() },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: maxTokens, temperature: 0.8, ...(json ? { responseMimeType: 'application/json' } : {}) } }) }, 25000);
    } catch { continue; }
    if (r.ok) { const j = await r.json(); const text = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join(''); if (text) return text; continue; }
    if ([400, 401, 403].includes(r.status)) break; if (r.status === 404) cache.gemini = null;
  }
  throw new Error('gemini failed');
}

/** One provider attempt + one fallback. Throws ApiError-compatible codes only. */
export async function ask(prompt, { maxTokens = 400, json = false } = {}) {
  if (prompt.length > 24000) { const e = new Error('PROMPT_TOO_LARGE'); e.code = 'PAYLOAD_TOO_LARGE'; e.status = 413; throw e; }
  const order = [process.env.GROQ_API_KEY && groq, process.env.GEMINI_API_KEY && gemini].filter(Boolean);
  for (const p of order) { try { return await p(prompt, { maxTokens, json }); } catch { /* try fallback */ } }
  const e = new Error('AI_UNAVAILABLE'); e.code = 'AI_UNAVAILABLE'; e.status = 503; throw e;
}

/** Strict JSON extraction — strips code fences only. Malformed or truncated output is REJECTED, never repaired. */
export function strictJson(text) {
  const t = String(text || '').replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(t); } catch { return null; }
}
