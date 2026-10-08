// Strict schemas for every message that crosses a trust boundary (client→server, AI→server).
import { z } from 'zod';
import { LAW_IDS_FOR_TYPE, isLawId } from './legal.js';
import { CODE_RE } from './text.js';

const Text = (min, max) => z.string().transform(s => s.normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').trim()).pipe(z.string().min(min).max(max));
export const Role = z.enum(['judge', 'pros', 'def', 'accused', 'witness']);
export const Move = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CHOOSE'), index: z.number().int().min(0).max(5) }),
  z.object({ type: z.literal('SUBMIT_TEXT'), text: Text(3, 600) }),
  z.object({ type: z.literal('TIMEOUT') })
]);
export const Envelope = z.object({
  roomId: z.string().uuid(), actionId: z.string().uuid(), turnId: z.number().int().min(0), baseVersion: z.number().int().min(0), move: Move
}).strict();

export const DisplayName = Text(2, 24).refine(s => !/[<>{}]/.test(s), 'NAME_CHARS');
export const RoomOps = {
  create: z.object({ displayName: DisplayName, caseId: z.enum(['L1', 'L2', 'L3']), level: z.number().int().min(1).max(3), role: Role.nullable(), allowSpectators: z.boolean().default(true) }).strict(),
  join: z.object({ code: z.string().regex(CODE_RE), displayName: DisplayName, wantRole: Role.nullable().optional(), spectate: z.boolean().optional() }).strict(),
  role: z.object({ roomId: z.string().uuid(), role: Role.nullable() }).strict(),
  ready: z.object({ roomId: z.string().uuid(), ready: z.boolean() }).strict(),
  seat: z.object({ roomId: z.string().uuid(), role: Role, mode: z.enum(['human', 'ai']) }).strict(),
  start: z.object({ roomId: z.string().uuid() }).strict(),
  resume: z.object({ roomId: z.string().uuid(), lastVersion: z.number().int().min(0).optional() }).strict(),
  leave: z.object({ roomId: z.string().uuid() }).strict(),
  'transfer-host': z.object({ roomId: z.string().uuid() }).strict(),
  kick: z.object({ roomId: z.string().uuid(), playerId: z.string().uuid() }).strict()
};

// ---------- AI-generated case (game-aware, turn-based). The AI writes facts and choices; law comes only from the library. ----------
const S = (max) => z.string().min(1).max(max);
const Opt = z.object({ t: S(320), g: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(), c: z.enum(['law', 'evi', 'wit', 'obj', 'rsn']).optional(), why: S(260).optional(), f: z.string().regex(/^[a-zA-Z0-9]{1,16}$/).optional(), v: z.enum(['full', 'part', 'acq']).optional() }).strict();
const Turn = z.object({
  id: z.string().regex(/^[a-z0-9]{1,8}$/), ph: z.number().int().min(0).max(5),
  step: z.enum(['filing', 'charges', 'plea', 'chief', 'objection', 'ruling', 'answer', 'cross', 'evidence', 'summon', 'args', 'verdict', 'sentence']),
  role: Role, p: S(220), w: S(80).optional(), q: z.string().optional(), free: z.union([z.literal(0), z.literal(1)]).optional(),
  k: z.array(S(24)).max(12).optional(), cond: z.object({ all: z.array(z.string()).optional(), none: z.array(z.string()).optional(), verdictNot: z.enum(['full', 'part', 'acq']).optional() }).strict().optional(),
  o: z.array(Opt).min(2).max(3)
}).strict();
export const GeneratedCase = z.object({
  type: z.enum(['theft', 'cyber', 'cheating', 'road']), title: S(90), court: S(120), caseNo: S(40), oneLine: S(200),
  names: z.object({ judge: S(60), pros: S(60), def: S(60), accused: S(60) }).strict(),
  story: z.array(S(420)).min(3).max(6), timeline: z.array(z.tuple([S(40), S(120)])).min(3).max(6),
  people: z.array(z.tuple([S(60), S(60), S(120)])).min(2).max(6), exhibits: z.array(z.tuple([z.string().regex(/^[PD]-\d$/), S(50), S(140)])).min(2).max(6),
  lawIds: z.array(z.string()).min(2).max(6), turns: z.array(Turn).min(10).max(26),
  correct: z.object({ default: z.enum(['full', 'part', 'acq']), ifFlags: z.array(z.tuple([z.string(), z.enum(['full', 'part', 'acq'])])).max(4).default([]) }).strict(),
  explain: z.object({ full: S(500), part: S(500), acq: S(500) }).strict(),
  lesson: z.object({ title: S(140), points: z.array(S(200)).min(3).max(5) }).strict()
}).strict();

/** Deterministic quality gate. Returns a list of problems; empty = playable. The AI is never its own validator. */
export function caseProblems(c) {
  const p = []; const allowed = LAW_IDS_FOR_TYPE[c.type] || [];
  for (const id of c.lawIds) { if (!isLawId(id)) p.push('unknown law id ' + id); else if (!allowed.includes(id)) p.push('law ' + id + ' not allowed for ' + c.type); }
  const ids = new Set(); const exIds = new Set(c.exhibits.map(e => e[0])); const setFlags = new Set(['guilty', 'v']);
  c.turns.forEach(t => t.o.forEach(o => o.f && setFlags.add(o.f)));
  let lastPh = 0; let verdicts = 0;
  c.turns.forEach((t, i) => {
    if (ids.has(t.id)) p.push('duplicate turn ' + t.id); ids.add(t.id);
    if (t.ph < lastPh) p.push('phase goes backwards at ' + t.id); lastPh = t.ph;
    if (t.step === 'answer') {
      const q = c.turns.slice(0, i).find(x => x.id === t.q);
      if (!q) p.push('answer ' + t.id + ' has no question'); else if (q.o.length !== t.o.length) p.push('answer ' + t.id + ' option count differs from ' + q.id);
      if (!t.w) p.push('answer ' + t.id + ' missing witness');
    } else if (t.step === 'verdict') {
      verdicts++; const vs = new Set(t.o.map(o => o.v)); if (!['full', 'part', 'acq'].every(v => vs.has(v))) p.push('verdict must offer full, part and acq');
    } else {
      if (!t.o.some(o => o.g === 2)) p.push('turn ' + t.id + ' has no strong option');
      if (t.o.some(o => o.g === undefined || !o.why || !o.c)) p.push('turn ' + t.id + ' option missing g/c/why');
      if (t.free && !(t.k && t.k.length >= 3)) p.push('free turn ' + t.id + ' needs 3+ keywords');
    }
    for (const f of [...(t.cond?.all || []), ...(t.cond?.none || [])]) if (!setFlags.has(f)) p.push('turn ' + t.id + ' depends on unset flag ' + f);
    for (const o of t.o) for (const ref of (o.t.match(/\b[PD]-\d\b/g) || [])) if (!exIds.has(ref)) p.push('turn ' + t.id + ' cites missing exhibit ' + ref);
  });
  if (verdicts !== 1) p.push('need exactly one verdict turn');
  if (c.turns[0]?.step !== 'filing') p.push('first turn must be filing');
  if (!c.turns.some(t => t.step === 'plea')) p.push('missing plea');
  if (!c.turns.some(t => t.step === 'cross')) p.push('missing cross-examination');
  for (const [f] of c.correct.ifFlags) if (!setFlags.has(f)) p.push('outcome depends on unset flag ' + f);
  const dates = c.timeline.map(x => x[0]); if (new Set(dates).size !== dates.length) p.push('timeline has duplicate times');
  return p;
}
