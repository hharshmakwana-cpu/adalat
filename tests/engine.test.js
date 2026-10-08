import { describe, it, expect } from 'vitest';
import { BUILTIN, getBuiltin } from '../shared/cases.js';
import { createGame, runAI, applyMove, currentTurn, project, summary, correctOf, ROLES, HIDDEN_KEYS } from '../shared/engine.js';

const seats = (role) => Object.fromEntries(ROLES.map(r => [r, r === role ? 'human' : 'ai']));
const start = (C, role, level = C.level) => runAI(createGame(C, { sessionId: 's', level, seats: seats(role), now: 0, seed: 7 }), C, 0).state;
function play(C, role, pick) {
  let s = start(C, role); let n = 0;
  while (s.status === 'court' && n++ < 100) {
    const t = currentTurn(s, C); const r = applyMove(s, C, role, { type: 'CHOOSE', index: pick(s, t) }, n * 1000);
    expect(r.ok).toBe(true); s = runAI(r.state, C, n * 1000).state;
  }
  return s;
}
const best = (s, t) => t.step === 'answer' ? (s.choices[t.q] ?? 0) : t.step === 'verdict' ? Math.max(0, t.o.findIndex(o => o.v === correctOf(getBuiltin(s.caseId), s.flags))) : t.o.reduce((b, o, i) => ((o.g ?? 0) > (t.o[b].g ?? 0) ? i : b), 0);

describe('engine — full trials', () => {
  for (const C of BUILTIN) for (const role of ROLES) {
    it(`${C.id} completes as ${role} and scores 100 with best play`, () => {
      const s = play(C, role, best);
      expect(s.status).toBe('done');
      expect(summary(s, role).overall).toBe(100);
      expect(s.verdict.v).toBe(s.verdict.correct);
    });
  }
  it('is deterministic for the same seed', () => {
    const C = getBuiltin('L2'); expect(JSON.stringify(play(C, 'def', best).log.map(e => e.text))).toBe(JSON.stringify(play(C, 'def', best).log.map(e => e.text)));
  });
});

describe('engine — rules', () => {
  const C = getBuiltin('L1');
  it('rejects a move from the wrong role', () => { const s = start(C, 'def'); expect(applyMove(s, C, 'judge', { type: 'CHOOSE', index: 0 }, 0).code).toBe('NOT_YOUR_TURN'); });
  it('rejects out-of-range options', () => { const s = start(C, 'pros'); expect(applyMove(s, C, 'pros', { type: 'CHOOSE', index: 9 }, 0).code).toBe('INVALID_ACTION'); });
  it('rejects an early timeout and accepts it after the deadline', () => {
    const s = runAI(createGame(getBuiltin('L2'), { sessionId: 's', level: 2, seats: seats('pros'), now: 0, seed: 1 }), getBuiltin('L2'), 0).state;
    expect(applyMove(s, getBuiltin('L2'), 'pros', { type: 'TIMEOUT' }, 1000).code).toBe('INVALID_ACTION');
    const r = applyMove(s, getBuiltin('L2'), 'pros', { type: 'TIMEOUT' }, s.deadlineAt + 1);
    expect(r.ok).toBe(true); expect(r.state.moves.at(-1).timeout).toBe(true); expect(r.state.moves.at(-1).g).toBe(0);
  });
  it('a leading question in chief leads to an objection moment when defence objects', () => {
    let s = start(C, 'pros'); // pros human; defence AI objects at best
    while (currentTurn(s, C) && currentTurn(s, C).step !== 'chief') s = runAI(applyMove(s, C, 'pros', { type: 'CHOOSE', index: best(s, currentTurn(s, C)) }, 0).state, C, 0).state;
    const t = currentTurn(s, C); const lead = t.o.findIndex(o => o.f === 'lead1');
    const after = runAI(applyMove(s, C, 'pros', { type: 'CHOOSE', index: lead }, 0).state, C, 0).state;
    expect(after.moments.some(m => m.type === 'objection')).toBe(true);
    expect(after.moments.some(m => m.type === 'sustained')).toBe(true);
  });
  it('free-text answers are graded deterministically by case keywords', () => {
    let s = start(C, 'pros');
    const t = currentTurn(s, C); expect(t.free).toBe(1);
    const r = applyMove(s, C, 'pros', { type: 'SUBMIT_TEXT', text: 'Theft under BNS 303 — he dishonestly took her phone without consent.' }, 0);
    expect(r.state.moves.at(-1).g).toBe(2);
  });
  it('the witness is graded on truthfulness, never on helping a side', () => {
    let s = start(C, 'witness'); const t = currentTurn(s, C); expect(t.step).toBe('answer');
    const truthful = s.choices[t.q] ?? 0;
    expect(applyMove(s, C, 'witness', { type: 'CHOOSE', index: truthful }, 0).state.moves.at(-1).g).toBe(2);
    expect(applyMove(s, C, 'witness', { type: 'CHOOSE', index: (truthful + 1) % t.o.length }, 0).state.moves.at(-1).g).toBe(0);
  });
  it('enforces the adjournment limit', () => {
    const C2 = getBuiltin('L2'); let s = start(C2, 'def'); s = { ...s, adj: { pros: 0, def: 9 } };
    while (currentTurn(s, C2) && currentTurn(s, C2).step !== 'summon') { const t = currentTurn(s, C2); s = runAI(applyMove(s, C2, 'def', { type: 'CHOOSE', index: best(s, t) }, 0).state, C2, 0).state; }
    const t = currentTurn(s, C2); const i = t.o.findIndex(o => /^adj/.test(o.f || ''));
    expect(applyMove(s, C2, 'def', { type: 'CHOOSE', index: i }, 0).code).toBe('ADJOURN_LIMIT');
  });
});

describe('projection — hidden information', () => {
  for (const C of BUILTIN) it(`${C.id}: no answers leak before the reveal`, () => {
    let s = start(C, 'def'); let n = 0;
    while (s.status === 'court' && n++ < 100) {
      for (const viewer of [{ role: 'def' }, { role: 'judge' }, { role: null, spectator: true }]) {
        const p = project(s, C, viewer); const json = JSON.stringify(p);
        for (const k of HIDDEN_KEYS) expect(json.includes('"' + k + '"')).toBe(false);
        expect(p.reveal).toBe(null);
        if (p.turn) for (const o of p.turn.options) expect(Object.keys(o).sort()).toEqual(['disabled', 't']);
        if (viewer.role !== 'def') expect(p.myMoves.every(m => m)).toBe(true);
      }
      const t = currentTurn(s, C); s = runAI(applyMove(s, C, 'def', { type: 'CHOOSE', index: best(s, t) }, n).state, C, n).state;
    }
    expect(project(s, C, { role: 'def' }).reveal).not.toBe(null);
  });
  it('a viewer only receives their own feedback', () => {
    const C = getBuiltin('L1'); const s = play(C, 'def', best);
    const live = { ...s, status: 'court' }; const p = project(live, C, { role: 'pros' });
    expect(p.myMoves.length).toBe(s.moves.filter(m => m.role === 'pros').length);
  });
});
