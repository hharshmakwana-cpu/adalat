// ADALAT game engine — pure and deterministic. The same file runs in the browser (single-player) and on the server (multiplayer).
// Nothing here touches the DOM, network, or clock: `now` and the RNG seed are passed in.
import { LAW, lawIdFor } from './legal.js';

export const ROLES = ['judge', 'pros', 'def', 'accused', 'witness'];
export const LEVELS = {
  1: { name: 'beginner', timer: 0, feedback: true, suggest: true, aiBest: 0.55, adjournLimit: 2 },
  2: { name: 'standard', timer: 45, feedback: true, suggest: true, aiBest: 0.7, adjournLimit: 2 },
  3: { name: 'expert', timer: 30, feedback: false, suggest: false, aiBest: 0.85, adjournLimit: 1 }
};
export const DIM_OF = { law: 'legal', evi: 'evidence', wit: 'questions', obj: 'procedure', rsn: 'reasoning', cred: 'credibility' };
export const DIMENSIONS = ['legal', 'evidence', 'procedure', 'questions', 'reasoning', 'credibility', 'time'];
const MAX_LOOP = 300;

export const isHuman = (seats, role) => !!seats && !!seats[role] && seats[role] !== 'ai';

function rng(seed, n) { let a = (seed ^ (n * 2654435761)) >>> 0; a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }

export function condOk(t, f) {
  const c = t.cond; if (!c) return true;
  if (typeof c === 'function') return !!c(f);
  if (c.all && !c.all.every(k => f[k])) return false;
  if (c.none && c.none.some(k => f[k])) return false;
  if (c.verdictNot && (!f.v || f.v === c.verdictNot)) return false;
  return true;
}
export function correctOf(C, f) {
  if (typeof C.correct === 'function') return C.correct(f);
  const r = C.correct || {}; if (f.guilty) return 'full';
  for (const [k, v] of r.ifFlags || []) if (f[k]) return v;
  return r.default || 'full';
}
function nextIndex(C, f, from) { let i = from; while (i < C.turns.length && !condOk(C.turns[i], f)) i++; return i; }
export const currentTurn = (s, C) => (s.status === 'court' && s.idx >= 0 && s.idx < C.turns.length ? C.turns[s.idx] : null);

export function nameFor(C, role, turn, lastWitness) {
  if (role === 'witness') return (turn && turn.w) || lastWitness || 'Witness';
  return (C.names && C.names[role]) || { judge: 'The Court', pros: 'Prosecution', def: 'Defence', accused: 'Accused', clerk: 'Court Clerk' }[role] || role;
}
const clerk = (text, ts) => ({ kind: 'clerk', role: 'clerk', who: 'Court Clerk', text, ts });

/** Create a fresh game. seats: { judge:'human'|'ai'|<playerId>, ... } */
export function createGame(C, { sessionId, level, seats, now, seed }) {
  const s = { sessionId, caseId: C.id, level: level || C.level || 1, seats: { ...seats }, version: 0, turnId: 0, idx: -1, ph: 0, status: 'court',
    flags: {}, choices: {}, log: [], moves: [], marked: [], adj: { pros: 0, def: 0 }, lastWitness: null, deadlineAt: null, seed: seed >>> 0, verdict: null, moments: [] };
  s.log.push(clerk('Court is in session. ' + C.title + ' — ' + (C.caseNo || ''), now));
  return advance(s, C, now);
}

function advance(s, C, now) {
  s.idx = nextIndex(C, s.flags, s.idx + 1); s.turnId += 1;
  if (s.idx >= C.turns.length) { s.status = 'done'; s.deadlineAt = null; s.log.push(clerk('The court rises.', now)); return s; }
  const t = C.turns[s.idx]; s.ph = t.ph;
  if (t.w && t.w !== s.lastWitness) { s.log.push(clerk(t.w + ' is called to the witness box and takes the oath.', now)); s.lastWitness = t.w; s.moments.push({ type: 'witness', turnId: s.turnId, who: t.w }); }
  const lim = LEVELS[s.level]?.timer || 0;
  s.deadlineAt = lim && isHuman(s.seats, t.role) ? now + lim * 1000 : null;
  return s;
}

export function optionsFor(s, C, t) {
  const lim = LEVELS[s.level]?.adjournLimit ?? 2;
  return (t.o || []).map(o => ({ t: o.t, disabled: !!(o.f && /^adj/.test(o.f) && (s.adj[t.role] || 0) >= lim) }));
}
function bestIndex(t) { let b = 0; (t.o || []).forEach((o, i) => { if ((o.g ?? 0) > (t.o[b].g ?? 0)) b = i; }); return b; }
function worstIndex(t) { let w = 0; (t.o || []).forEach((o, i) => { if ((o.g ?? 0) < (t.o[w].g ?? 0)) w = i; }); return w; }

/** Validate + apply one move by `role`. Returns { ok, code?, state, events }. Never mutates the input. */
export function applyMove(state, C, role, move, now) {
  const s = structuredClone(state); const t = currentTurn(s, C);
  if (!t) return { ok: false, code: 'INVALID_ACTION', state };
  if (t.role !== role) return { ok: false, code: 'NOT_YOUR_TURN', state };
  const events = []; const f = s.flags; let index, g, text, c = t.o?.[0]?.c || 'law', why = '', better = '', timeout = false;

  if (move.type === 'TIMEOUT') {
    if (!s.deadlineAt || now < s.deadlineAt - 500) return { ok: false, code: 'INVALID_ACTION', state };
    timeout = true;
  }
  if (t.step === 'answer') {
    const truthful = s.choices[t.q] ?? 0;
    index = timeout ? truthful : move.index; if (!(index >= 0 && index < t.o.length)) return { ok: false, code: 'INVALID_ACTION', state };
    g = index === truthful ? 2 : 0; c = 'cred'; text = t.o[index].t;
    why = g === 2 ? 'Truthful and consistent with what the witness knows.' : 'A witness must answer truthfully from what they personally know. The truthful answer was: “' + t.o[truthful].t + '”';
  } else if (t.step === 'verdict') {
    index = timeout ? 0 : move.index; if (!(index >= 0 && index < t.o.length)) return { ok: false, code: 'INVALID_ACTION', state };
    const o = t.o[index]; const corr = correctOf(C, f); f.v = o.v; g = o.v === corr ? 2 : 0; c = 'rsn'; text = o.t;
    why = (C.explain && C.explain[corr]) || ''; s.verdict = { v: o.v, text: o.t, correct: corr };
    events.push({ type: 'judgment', v: o.v });
  } else if (move.type === 'SUBMIT_TEXT' && t.free) {
    const low = String(move.text || '').toLowerCase(); const hits = (t.k || []).filter(k => low.includes(String(k).toLowerCase())).length;
    g = hits >= 2 ? 2 : hits === 1 ? 1 : 0; index = t.o.findIndex(o => o.g === g); if (index < 0) index = g ? bestIndex(t) : worstIndex(t);
    text = String(move.text); c = t.o[index].c || c;
    why = g === 2 ? 'Strong — you used the key facts of this case.' : t.o[bestIndex(t)].why || '';
  } else {
    if (timeout) index = worstIndex(t);
    else index = move.index;
    if (!(index >= 0 && index < t.o.length)) return { ok: false, code: 'INVALID_ACTION', state };
    const o = t.o[index]; const opts = optionsFor(s, C, t);
    if (!timeout && opts[index].disabled) return { ok: false, code: 'ADJOURN_LIMIT', state };
    g = timeout ? 0 : (o.g ?? 0); text = timeout ? '(No response in time.)' : o.t; c = o.c || c; why = timeout ? 'Time ran out before you acted.' : (o.why || '');
    if (o.needD1 && !f.d1) { g = Math.min(g, 1); why += ' (D-1 is not on record, so this point carries less weight.)'; }
  }
  const chosen = t.o[index] || {};
  if (!timeout && chosen.f && (t.step !== 'answer')) f[chosen.f] = true;
  if (g < 2 && t.step !== 'answer' && t.step !== 'verdict') better = t.o[bestIndex(t)].t;
  s.choices[t.id] = index;

  const who = nameFor(C, t.role, t, s.lastWitness);
  const kind = t.role === 'judge' && (t.step === 'ruling' || t.step === 'charges' || t.step === 'sentence' || t.step === 'verdict') ? 'order' : 'talk';
  s.log.push({ kind, role: t.role, who, text, step: t.step, ts: now, turnId: s.turnId });
  s.moves.push({ turnId: s.turnId, id: t.id, role: t.role, step: t.step, g, c, dim: DIM_OF[c] || 'legal', why, better, text, timeout });

  if (t.step === 'objection' && chosen.f && /^obj/.test(chosen.f) && !timeout) events.push({ type: 'objection', by: t.role, ground: /lead/i.test(text) ? 'leading' : /insult/i.test(text) ? 'insulting' : 'improper' });
  if (t.step === 'ruling') {
    if (/^sustain/i.test(text)) events.push({ type: 'sustained' });
    else if (/^overrul/i.test(text)) events.push({ type: 'overruled' });
    else if (/^grant/i.test(text) || chosen.adj) { const req = C.turns[s.idx - 1]?.role || 'def'; s.adj[req] = (s.adj[req] || 0) + 1; events.push({ type: 'adjourned' }); s.log.push(clerk('The case is adjourned. Next date of hearing fixed.', now)); }
    else if (/^refus/i.test(text)) events.push({ type: 'refused' });
  }
  if (['evidence', 'chief', 'ruling'].includes(t.step) && !timeout && !(t.step === 'ruling' && !/^grant/i.test(text))) {
    const ids = new Set((text.match(/\b[PD]-\d+\b/g) || []).concat(f.d1 && t.step === 'ruling' ? ['D-1'] : []));
    for (const id of ids) if ((C.exhibits || []).some(e => e[0] === id) && !s.marked.includes(id)) {
      s.marked.push(id); s.log.push({ kind: 'exhibit', role: 'clerk', who: 'Court Clerk', text: 'Exhibit ' + id + ' marked.', ts: now, exhibit: id }); events.push({ type: 'exhibit', id });
    }
  }
  events.push({ type: 'feedback', role: t.role, g });
  for (const e of events) s.moments.push({ ...e, turnId: s.turnId });
  if (s.moments.length > 60) s.moments = s.moments.slice(-60);
  s.version += 1;
  advance(s, C, now);
  return { ok: true, state: s, events };
}

/** The move an AI seat makes in the current turn. Deterministic for a given seed and version. */
export function aiMove(s, C) {
  const t = currentTurn(s, C); if (!t) return null;
  if (t.step === 'answer') return { type: 'CHOOSE', index: s.choices[t.q] ?? 0 };
  if (t.step === 'verdict') { const corr = correctOf(C, s.flags); const i = t.o.findIndex(o => o.v === corr); return { type: 'CHOOSE', index: i < 0 ? 0 : i }; }
  if (t.role === 'judge' || t.role === 'accused') return { type: 'CHOOSE', index: t.step === 'plea' ? 0 : bestIndex(t) };
  const opts = optionsFor(s, C, t); const p = LEVELS[s.level]?.aiBest ?? 0.7; const r = rng(s.seed, s.version * 31 + s.turnId);
  const b = bestIndex(t);
  if (r < p || t.o.length < 2) return { type: 'CHOOSE', index: opts[b].disabled ? 0 : b };
  const others = t.o.map((_, i) => i).filter(i => i !== b && !opts[i].disabled);
  return { type: 'CHOOSE', index: others.length ? others[Math.floor(rng(s.seed, s.version + 7) * others.length)] : b };
}

/** Advance through every AI-owned turn until a human must act (or the case ends). */
export function runAI(state, C, now) {
  let s = state; const events = [];
  for (let i = 0; i < MAX_LOOP; i++) {
    const t = currentTurn(s, C); if (!t || isHuman(s.seats, t.role)) break;
    const r = applyMove(s, C, t.role, aiMove(s, C), now + i);
    if (!r.ok) break; s = r.state; events.push(...r.events);
  }
  return { state: s, events };
}

/** Skill profile for one role (0–100 per dimension; null = not tested). */
export function summary(s, role) {
  const mv = s.moves.filter(m => m.role === role); const out = {};
  for (const d of DIMENSIONS) {
    if (d === 'time') { out.time = mv.length ? Math.max(0, 100 - 20 * mv.filter(m => m.timeout).length) : null; continue; }
    const xs = mv.filter(m => m.dim === d); out[d] = xs.length ? Math.round(xs.reduce((a, m) => a + m.g, 0) / (xs.length * 2) * 100) : null;
  }
  const vals = Object.values(out).filter(v => v !== null);
  const overall = mv.length ? Math.round(mv.reduce((a, m) => a + m.g, 0) / (mv.length * 2) * 100) : null;
  return { dims: out, overall, stars: overall === null ? 0 : overall >= 85 ? 3 : overall >= 65 ? 2 : overall >= 40 ? 1 : 0, moves: mv.length, tested: vals.length };
}

export function awards(s, players) {
  // players: [{id, name, role}] — only real, earned awards
  const list = []; const sum = Object.fromEntries(players.map(p => [p.id, summary(s, p.role)]));
  const adv = players.filter(p => p.role === 'pros' || p.role === 'def').sort((a, b) => (sum[b.id].overall ?? 0) - (sum[a.id].overall ?? 0));
  if (adv[0] && (sum[adv[0].id].overall ?? 0) >= 70) list.push({ key: 'best_advocate', title: 'Best Advocate', playerId: adv[0].id });
  const cross = players.filter(p => p.role === 'def' || p.role === 'pros').map(p => ({ p, n: s.moves.filter(m => m.role === p.role && m.step === 'cross' && m.g === 2).length })).sort((a, b) => b.n - a.n);
  if (cross[0] && cross[0].n >= 1) list.push({ key: 'sharpest_cross', title: 'Sharpest Cross', playerId: cross[0].p.id });
  const obj = players.map(p => ({ p, ok: s.moves.filter(m => m.role === p.role && m.step === 'objection' && m.g === 2).length, bad: s.moves.filter(m => m.role === p.role && m.step === 'objection' && m.g === 0).length })).sort((a, b) => b.ok - a.ok);
  if (obj[0] && obj[0].ok >= 1 && obj[0].bad === 0) list.push({ key: 'sharpest_objection', title: 'Sharpest Objection', playerId: obj[0].p.id });
  const j = players.find(p => p.role === 'judge'); if (j && (sum[j.id].dims.reasoning ?? 0) >= 80) list.push({ key: 'strongest_reasoning', title: 'Strongest Reasoning', playerId: j.id });
  const ev = players.filter(p => (sum[p.id].dims.evidence ?? 0) === 100); if (ev[0]) list.push({ key: 'evidence_master', title: 'Evidence Master', playerId: ev[0].id });
  const w = players.find(p => p.role === 'witness'); if (w && (sum[w.id].dims.credibility ?? 0) === 100) list.push({ key: 'credible_witness', title: 'Credible Witness', playerId: w.id });
  return list;
}

/** Public case file (no answers). */
export function publicCase(C) {
  const laws = (C.lawIds || (C.laws || []).map(l => ({ id: lawIdFor(l), here: l.here })))
    .map(x => typeof x === 'string' ? { id: x } : x).filter(x => x.id && LAW[x.id]).map(x => ({ ...LAW[x.id], here: x.here || '' }));
  return { id: String(C.id).split('-')[0], level: C.level, type: C.type, title: C.title, court: C.court, caseNo: C.caseNo, oneLine: C.oneLine, story: C.story || [], timeline: C.timeline || [],
    people: C.people || [], exhibits: C.exhibits || [], names: C.names || {}, levelName: C.levelName, learn: C.learn, laws, fictional: true, generated: !!C.generated };
}

/** What a given viewer may see. Hidden data (correct outcome, explanation, grades of untaken options, other seats' feedback) is excluded until the reveal. */
export function project(s, C, viewer) {
  const t = currentTurn(s, C); const done = s.status === 'done'; const role = viewer && viewer.role;
  const showFb = done || LEVELS[s.level]?.feedback;
  return {
    sessionId: s.sessionId, caseId: String(s.caseId).split('-')[0], version: s.version, turnId: s.turnId, status: s.status, ph: s.ph, level: s.level,
    log: s.log, marked: s.marked, adj: s.adj, deadlineAt: s.deadlineAt, moments: s.moments.slice(-12), seats: Object.fromEntries(ROLES.map(r => [r, isHuman(s.seats, r) ? 'human' : 'ai'])),
    turn: t ? { id: t.id, role: t.role, step: t.step, prompt: t.p, free: !!t.free, w: t.w || null, options: optionsFor(s, C, t), mine: !!role && role === t.role && !viewer.spectator, suggest: !!LEVELS[s.level]?.suggest } : null,
    verdict: s.verdict ? { v: s.verdict.v, text: s.verdict.text } : null,
    myMoves: role && showFb ? s.moves.filter(m => m.role === role).map(m => ({ turnId: m.turnId, step: m.step, g: m.g, dim: m.dim, why: m.why, better: m.better, text: m.text, timeout: m.timeout })) : [],
    reveal: done ? { correct: s.verdict ? s.verdict.correct : correctOf(C, s.flags), explain: C.explain || {}, lesson: C.lesson || null, moves: s.moves } : null
  };
}
export const HIDDEN_KEYS = ['correct', 'explain', 'flags', 'choices', 'seed', 'lesson', 'turns', 'k'];
