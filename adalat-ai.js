// Vercel serverless function: POST /api/adalat-ai  { prompt } -> { text }
// FREE option: set GEMINI_API_KEY (from aistudio.google.com) in Vercel → Environment Variables.
// Paid option: set ANTHROPIC_API_KEY instead. If both are set, Gemini is used.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 40000) return res.status(400).json({ error: 'Bad prompt' });
  try {
    let text = '';
    if (process.env.GEMINI_API_KEY) {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.8, thinkingConfig: { thinkingBudget: 0 } }
        })
      });
      if (!r.ok) return res.status(502).json({ error: 'AI provider error', status: r.status, detail: (await r.text()).slice(0, 300) });
      const j = await r.json();
      text = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).map(p => p.text || '').join('');
    } else if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] })
      });
      if (!r.ok) return res.status(502).json({ error: 'AI provider error', status: r.status });
      const j = await r.json();
      text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    } else {
      return res.status(500).json({ error: 'No AI key set. Add GEMINI_API_KEY in Vercel → Settings → Environment Variables.' });
    }
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}
