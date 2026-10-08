// Vercel serverless function: POST /api/adalat-ai  { prompt } -> { text }
// Keeps your Anthropic API key secret on the server.
// Set environment variables in Vercel: ANTHROPIC_API_KEY (required), ANTHROPIC_MODEL (optional).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string' || prompt.length > 40000) return res.status(400).json({ error: 'Bad prompt' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI provider error', status: r.status });
    const j = await r.json();
    const text = (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    res.status(200).json({ text });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
}
