import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { Envelope, RoomOps, GeneratedCase, caseProblems, normalizeGenerated } from '../shared/schemas.js';
import { normalizeText, validName, genRoomCode, CODE_RE, cleanCode, looksLikeSecret } from '../shared/text.js';
import { LAW, LAW_IDS_FOR_TYPE } from '../shared/legal.js';

const uuid = () => crypto.randomUUID();
const env = (extra = {}) => ({ roomId: uuid(), actionId: uuid(), turnId: 3, baseVersion: 2, move: { type: 'CHOOSE', index: 1 }, ...extra });

describe('protocol — forged fields are rejected', () => {
  it('accepts a valid envelope', () => expect(Envelope.safeParse(env()).success).toBe(true));
  for (const k of ['by', 'actorId', 'role', 'host', 'score', 'state', 'truth', 'correct', 'winner', 'verdict', 'turn'])
    it(`rejects a client-supplied "${k}"`, () => expect(Envelope.safeParse(env({ [k]: 'x' })).success).toBe(false));
  it('rejects unknown move types', () => expect(Envelope.safeParse(env({ move: { type: 'SET_SCORE', value: 100 } })).success).toBe(false));
  it('rejects oversized free text', () => expect(Envelope.safeParse(env({ move: { type: 'SUBMIT_TEXT', text: 'a'.repeat(601) } })).success).toBe(false));
  it('rejects non-uuid action ids (replay keys must be unique uuids)', () => expect(Envelope.safeParse(env({ actionId: '1' })).success).toBe(false));
  it('join rejects bad codes and hostile names', () => {
    expect(RoomOps.join.safeParse({ code: 'ABCD', displayName: 'Asha' }).success).toBe(false);
    expect(RoomOps.join.safeParse({ code: 'ABC123XYZ', displayName: '<script>' }).success).toBe(false);
    expect(RoomOps.join.safeParse({ code: 'ABC123XYZ', displayName: 'A'.repeat(40) }).success).toBe(false);
    expect(RoomOps.join.safeParse({ code: 'ABC123XYZ', displayName: 'Asha', host: true }).success).toBe(false);
  });
});

describe('input hygiene', () => {
  it('strips control and bidi characters', () => expect(normalizeText('a\u0000b\u202Ec  d')).toBe('abc d'));
  it('validates names', () => { expect(validName(' x ').ok).toBe(false); expect(validName('  Meher   P ').value).toBe('Meher P'); });
  it('room codes are 9 chars of Crockford base32', () => { for (let i = 0; i < 200; i++) expect(CODE_RE.test(genRoomCode(n => crypto.randomBytes(n)))).toBe(true); });
  it('cleans typed codes', () => expect(cleanCode('kx7-m42-qr9')).toBe('KX7M42QR9'));
  it('detects pasted server secrets', () => { expect(looksLikeSecret('sb_secret_abc')).toBe(true); expect(looksLikeSecret('eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYW5vbiJ9')).toBe(false); });
});

describe('legal library', () => {
  for (const [id, l] of Object.entries(LAW)) it(`${id} has required fields`, () => {
    for (const k of ['act', 'title', 'kind', 'simple', 'legal', 'source', 'status']) expect(l[k]).toBeTruthy();
    expect(l.simple.en.length).toBeLessThan(220);
    if (l.modality === 'may') expect(/\bmust presume\b|\balways\b/i.test(l.simple.en + l.legal.en)).toBe(false);
  });
  it('AI type allow-lists only reference library ids', () => { for (const ids of Object.values(LAW_IDS_FOR_TYPE)) for (const id of ids) expect(LAW[id]).toBeTruthy(); });
});

const sample = () => ({
  type: 'theft', title: 'State vs. Ira Dhal', court: 'Court No. 4, JMFC, Ranchi', caseNo: 'RCC 12/2026', oneLine: 'A bicycle disappears from a hostel stand.',
  names: { judge: 'Smt. K. Rao, JMFC', pros: 'Adv. P. Lal, APP', def: 'Adv. S. Bose', accused: 'Ira Dhal' },
  story: ['One.', 'Two.', 'Three.'], timeline: [['1 Mar, 9 am', 'Bike parked'], ['1 Mar, 6 pm', 'Bike missing'], ['3 Mar', 'Bike found']],
  people: [['Ravi', 'PW1 · owner', 'Hostel resident'], ['Ira Dhal', 'Accused', 'Says she borrowed it']], exhibits: [['P-1', 'FIR', 'Complaint'], ['P-2', 'Recovery memo', 'Found with accused']],
  lawIds: ['BNS-303', 'BNS-317', 'BURDEN'],
  turns: [
    { id: 't1', ph: 0, step: 'filing', role: 'pros', p: 'File', o: [{ t: 'Theft under BNS 303', g: 2, c: 'law', why: 'fits' }, { t: 'Robbery', g: 0, c: 'law', why: 'no force' }] },
    { id: 't2', ph: 1, step: 'charges', role: 'judge', p: 'Frame', o: [{ t: 'Charge framed', g: 2, c: 'rsn', why: 'ok' }, { t: 'Convict now', g: 0, c: 'rsn', why: 'no' }] },
    { id: 't3', ph: 1, step: 'plea', role: 'accused', p: 'Plead', o: [{ t: 'Not guilty', g: 2, c: 'law', why: 'trial' }, { t: 'Guilty', g: 2, c: 'law', why: 'ends', f: 'guilty' }] },
    { id: 't4', ph: 2, step: 'chief', role: 'pros', p: 'Ask', cond: { none: ['guilty'] }, o: [{ t: 'What happened?', g: 2, c: 'wit', why: 'open' }, { t: 'He stole it, right?', g: 0, c: 'wit', why: 'leading', f: 'lead1' }] },
    { id: 't5', ph: 2, step: 'objection', role: 'def', p: 'Object?', cond: { all: ['lead1'], none: ['guilty'] }, o: [{ t: 'Objection — leading', g: 2, c: 'obj', why: 'yes', f: 'obj1' }, { t: 'No objection', g: 0, c: 'obj', why: 'missed' }] },
    { id: 't6', ph: 2, step: 'ruling', role: 'judge', p: 'Rule', cond: { all: ['obj1'] }, o: [{ t: 'Sustained', g: 2, c: 'rsn', why: 'leading' }, { t: 'Overruled', g: 0, c: 'rsn', why: 'wrong' }] },
    { id: 't7', ph: 2, step: 'answer', role: 'witness', w: 'PW1 Ravi', q: 't4', cond: { none: ['guilty'] }, p: 'Answer', o: [{ t: 'It vanished.' }, { t: 'Yes.' }] },
    { id: 't8', ph: 2, step: 'cross', role: 'def', p: 'Cross', free: 1, k: ['lock', 'see', 'face'], cond: { none: ['guilty'] }, o: [{ t: 'You never saw who took it?', g: 2, c: 'wit', why: 'tests id', f: 'idWeak' }, { t: 'Are you lying?', g: 0, c: 'wit', why: 'insult' }] },
    { id: 't9', ph: 2, step: 'answer', role: 'witness', w: 'PW1 Ravi', q: 't8', cond: { none: ['guilty'] }, p: 'Answer', o: [{ t: 'No, I did not see.' }, { t: 'No!' }] },
    { id: 't10', ph: 4, step: 'args', role: 'pros', p: 'Argue', cond: { none: ['guilty'] }, o: [{ t: 'P-2 shows possession', g: 2, c: 'law', why: 'evidence' }, { t: 'He looks guilty', g: 0, c: 'law', why: 'no' }] },
    { id: 't11', ph: 5, step: 'verdict', role: 'judge', p: 'Decide', o: [{ t: 'Guilty of theft', v: 'full' }, { t: 'Guilty of retaining', v: 'part' }, { t: 'Not guilty', v: 'acq' }] }
  ],
  correct: { default: 'full', ifFlags: [['idWeak', 'part']] }, explain: { full: 'a', part: 'b', acq: 'c' }, lesson: { title: 'L', points: ['1', '2', '3'] }
});

describe('AI case quality gate', () => {
  it('accepts a well-formed case', () => { const r = GeneratedCase.safeParse(sample()); expect(r.success).toBe(true); expect(caseProblems(r.data)).toEqual([]); });
  it('rejects invented law ids', () => { const c = sample(); c.lawIds.push('BNS-999'); expect(caseProblems(GeneratedCase.parse(c)).some(p => /unknown law/.test(p))).toBe(true); });
  it('rejects law outside the type allow-list', () => { const c = sample(); c.lawIds.push('IT-66D'); expect(caseProblems(GeneratedCase.parse(c)).some(p => /not allowed/.test(p))).toBe(true); });
  it('rejects references to missing exhibits', () => { const c = sample(); c.turns[9].o[0].t = 'P-7 proves it'; expect(caseProblems(GeneratedCase.parse(c)).some(p => /missing exhibit/.test(p))).toBe(true); });
  it('rejects verdicts without all outcomes', () => { const c = sample(); c.turns[10].o.pop(); c.turns[10].o.push({ t: 'x', v: 'full' }); expect(caseProblems(GeneratedCase.parse(c)).length).toBeGreaterThan(0); });
  it('rejects missing fields and wrong types', () => { const c = sample(); delete c.explain; expect(GeneratedCase.safeParse(c).success).toBe(false); expect(GeneratedCase.safeParse({ ...sample(), story: 'one' }).success).toBe(false); });
  it('drops unknown keys (smuggled fields never reach the game)', () => { const r = GeneratedCase.safeParse({ ...sample(), html: '<img onerror=x>' }); expect(r.success).toBe(true); expect('html' in r.data).toBe(false); });
  it('normalises harmless shape differences but still validates law', () => { const c = sample(); c.timeline = c.timeline.map(([when, what]) => ({ when, what })); c.turns[7].free = true; const r = GeneratedCase.safeParse(normalizeGenerated(c, 'theft')); expect(r.success).toBe(true); expect(caseProblems(r.data)).toEqual([]); });
  it('rejects outcome rules that depend on flags nothing sets', () => { const c = sample(); c.correct.ifFlags = [['ghost', 'acq']]; expect(caseProblems(GeneratedCase.parse(c)).some(p => /unset flag/.test(p))).toBe(true); });
});
