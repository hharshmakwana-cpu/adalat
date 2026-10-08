// /api/adalat-ai/:task — health (GET, no AI spend) | generate-case | witness | review
// Typed tasks only: the server writes the prompts. Rate-limited per user and per IP. Output is schema-validated.
import { route, readJson, parse, fail, mpConfigured, requireUser, rateLimit, ipOf, logSec } from '../_lib/server.js';
import { ask, aiConfigured, strictJson } from '../_lib/ai.js';
import { z } from 'zod';
import { GeneratedCase, caseProblems, normalizeGenerated } from '../../shared/schemas.js';
import { LAW, LAW_IDS_FOR_TYPE } from '../../shared/legal.js';
import { normalizeText } from '../../shared/text.js';

const CITIES = ['Pune', 'Jaipur', 'Kochi', 'Lucknow', 'Bhopal', 'Guwahati', 'Indore', 'Nagpur', 'Patna', 'Coimbatore', 'Chandigarh', 'Surat', 'Mysuru', 'Ranchi', 'Dehradun', 'Visakhapatnam', 'Madurai', 'Raipur', 'Amritsar', 'Shillong', 'Varanasi', 'Bhubaneswar', 'Jodhpur', 'Panaji'];
const SETTINGS = ['a railway station', 'a housing society', 'a family shop', 'a college hostel', 'a wedding function', 'a hospital', 'a local market', 'an online marketplace', 'a bank branch', 'a farm village', 'a factory', 'an auto-rickshaw ride', 'a festival fair', 'a delivery job', 'a rented flat', 'a mobile repair shop'];
const TWISTS = ['an unclear CCTV clip', 'a witness related to the complainant', 'a delayed FIR', 'a disputed signature', 'a phone location record', 'a medical report that only partly fits', 'an alibi from a friend', 'money traced through UPI', 'a confession made to police', 'two witnesses who disagree on the time', 'a WhatsApp chat', 'a late forensic report'];
const pick = a => a[Math.floor(Math.random() * a.length)];
const LANG = l => l === 'hi' ? 'simple Hindi (Devanagari; keep exhibit ids like P-1 and the JSON keys in English)' : 'simple, plain English';

const Gen = z.object({ type: z.enum(['theft', 'cyber', 'cheating', 'road']), level: z.number().int().min(1).max(3), lang: z.enum(['en', 'hi']), avoid: z.array(z.string().max(160)).max(15).default([]) }).strict();
const Wit = z.object({ witness: z.string().min(2).max(80), question: z.string().min(3).max(600), fact: z.string().min(3).max(420), lang: z.enum(['en', 'hi']) }).strict();
const Rev = z.object({ caseTitle: z.string().max(120), role: z.enum(['judge', 'pros', 'def', 'accused', 'witness']), lang: z.enum(['en', 'hi']), moves: z.array(z.object({ step: z.string().max(20), g: z.number().int().min(0).max(2), text: z.string().max(320) })).max(30) }).strict();

function genPrompt(b, problems) {
  const ids = LAW_IDS_FOR_TYPE[b.type]; const lawList = ids.map(id => `${id}: ${LAW[id].title} — ${LAW[id].simple.en}`).join('\n');
  const truth = b.level === 1 ? pick(['full', 'full', 'part']) : b.level === 2 ? pick(['full', 'part', 'acq']) : pick(['part', 'acq', 'acq', 'full']);
  const diff = { 1: 'BEGINNER: one clear issue, obvious clues, the strong option is clearly best.', 2: 'STANDARD: conflicting evidence; one decisive item; options are closer.', 3: 'EXPERT: a subtle evidence or credibility issue; outcomes are plausibly competing; weak options sound reasonable.' }[b.level];
  return `You design one ORIGINAL, fictional Indian criminal trial for a law-learning GAME. Players have no legal background.
Case type: ${b.type}. ${diff}
Setting (must use): city ${pick(CITIES)}; ${pick(SETTINGS)}; key evidence twist: ${pick(TWISTS)}; month ${pick(['January', 'March', 'May', 'July', 'September', 'November'])} 2026.
${b.avoid.length ? 'Do NOT resemble these already-played cases: ' + b.avoid.join(' | ') : ''}
The legally correct result on full evidence must be "${truth}" (full = guilty as charged, part = guilty of a lesser offence only, acq = not guilty, benefit of doubt).
LAW: you may ONLY cite these library ids in "lawIds" and refer to them by name in text. Never invent a section number.
${lawList}
Write in ${LANG(b.lang)}. Use a fictional court ("Court No. 4, Judicial Magistrate First Class, <city>"). Invented, uncommon names.
GAME DESIGN RULES:
- 12–20 turns in order: filing(pros) → charges(judge) → plea(accused, options: "Not guilty…" g2, "I plead guilty…" g2 with f "guilty") → prosecution chief(pros) → objection(def) only if a chief option was leading (that option sets f "lead1"; the objection turn has cond {"all":["lead1"],"none":["guilty"]}; the correct objection option sets f "obj1") → ruling(judge, cond all ["obj1"]; first option starts "Sustained") → answer(witness, q = the chief turn id, same number of options, each option is how the witness answers the matching question) → cross(def, free 1, k keywords) → answer → evidence(pros, cites exhibit ids) → answer → args(pros, free 1) → args(def, free 1) → verdict(judge, options with v full/part/acq) → sentence(judge, cond {"verdictNot":"acq"}).
- Every non-answer, non-verdict turn: 2–3 options, each with g (2 strong, 1 okay, 0 weak), c (law|evi|wit|obj|rsn) and why (1 plain sentence that teaches the rule). Trial turns after plea have cond {"none":["guilty"]}.
- Plant a weakness the defence can discover in cross: the strong cross option sets a flag (e.g. "idWeak"), and "correct" uses it: {"default":"full","ifFlags":[["idWeak","part"]]} (adapt to the intended result).
- ph: 0 filing, 1 charges/plea, 2 prosecution evidence, 3 defence evidence, 4 arguments, 5 verdict/sentence. Turn ids: short lowercase like "t1".
Return ONLY one JSON object with keys: type, title ("State vs. NAME"), court, caseNo, oneLine, names{judge,pros,def,accused}, story[3-5 short paragraphs], timeline[[when,what]], people[[name,role,note]], exhibits[["P-1",name,what it shows]], lawIds[], turns[], correct, explain{full,part,acq}, lesson{title,points[3-4]}.
${problems ? 'Your previous attempt failed these checks — fix them: ' + problems.join('; ') : ''}`;
}

async function guard(req, task, perUser, perIp) {
  const ip = ipOf(req);
  await rateLimit('ai' + task + 'ip:' + ip, 3600, perIp);
  if (mpConfigured()) { const u = await requireUser(req); await rateLimit('ai' + task + ':' + u.id, 3600, perUser); return u.id; }
  return null; // degraded mode: IP limits only (documented)
}

export default route(async (req, { requestId }) => {
  const task = String(req.query.task || '');
  if (task === 'health') return { ok: aiConfigured(), multiplayer: mpConfigured() }; // config check only — spends no AI quota
  if (req.method !== 'POST') fail('METHOD_NOT_ALLOWED', 405);
  if (!aiConfigured()) fail('AI_UNAVAILABLE', 503);

  if (task === 'generate-case') {
    const b = parse(Gen, readJson(req, 8 * 1024)); const uid = await guard(req, 'gen', 6, 20);
    let problems = null; const t0 = Date.now(); const deadline = t0 + 56000;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0 && Date.now() > t0 + 24000) break; // not enough time left for a second try
      let text; try { text = await ask(genPrompt(b, problems), { maxTokens: 3800, json: true, timeoutMs: 45000, deadline }); }
      catch (e) { logSec('ai_fail', { requestId, userId: uid, code: 'gen' + attempt }); if (attempt === 0) fail('AI_UNAVAILABLE', 503); break; }
      const raw = strictJson(text); if (!raw) { problems = ['output was not valid JSON']; continue; }
      const r = GeneratedCase.safeParse(normalizeGenerated(raw, b.type)); if (!r.success) { problems = r.error.issues.slice(0, 6).map(i => i.path.join('.') + ' ' + i.message); continue; }
      if (r.data.type !== b.type) { problems = ['type must be ' + b.type]; continue; }
      const p = caseProblems(r.data); if (p.length) { problems = p.slice(0, 8); continue; }
      logSec('ai_case_ok', { requestId, userId: uid });
      return { case: { ...r.data, level: b.level, generated: true, verificationStatus: 'library_refs_only' } };
    }
    logSec('ai_case_rejected', { requestId, userId: uid, code: (problems || []).join(',').slice(0, 80) });
    fail('AI_INVALID', 422);
  }

  if (task === 'witness') {
    const b = parse(Wit, readJson(req, 4 * 1024)); await guard(req, 'wit', 80, 300);
    const prompt = `You are ${normalizeText(b.witness, 80)}, an ordinary witness in an Indian trial, under oath. You were asked: "${normalizeText(b.question)}".
Your answer must say ONLY this, in your own natural words, 1–2 short sentences, in ${LANG(b.lang)}: "${normalizeText(b.fact, 420)}". Add no new facts. Output only the spoken answer.`;
    try { return { text: normalizeText(await ask(prompt, { maxTokens: 160 }), 420) }; } catch { fail('AI_UNAVAILABLE', 503); }
  }

  if (task === 'review') {
    const b = parse(Rev, readJson(req, 16 * 1024)); await guard(req, 'rev', 10, 40);
    const tx = b.moves.map(m => `${m.step} (${['weak', 'okay', 'strong'][m.g]}): ${normalizeText(m.text, 300)}`).join('\n');
    const prompt = `You are a friendly Indian law teacher. A beginner played the ${b.role} in a mock trial "${normalizeText(b.caseTitle, 120)}". Their moves:\n${tx}\nIn ${LANG(b.lang)}, write 4 short sentences: one thing done well, the key legal idea, one mistake to avoid, one real-life tip. Do not cite any section number. No headings.`;
    try { return { text: normalizeText(await ask(prompt, { maxTokens: 400 }), 1200) }; } catch { fail('AI_UNAVAILABLE', 503); }
  }
  fail('NOT_FOUND', 404);
}, { methods: ['GET', 'POST'] });
