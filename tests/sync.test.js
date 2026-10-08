import { describe, it, expect } from 'vitest';
import { sliceLog, mergeView, createPuller } from '../shared/sync.js';
import { BUILTIN, getBuiltin } from '../shared/cases.js';
import { createGame, runAI, applyMove, currentTurn, project, correctOf, ROLES, LEVELS } from '../shared/engine.js';

const seats = (role) => Object.fromEntries(ROLES.map(r => [r, r === role ? 'human' : 'ai']));
const tick = () => new Promise(r => setTimeout(r, 0));

describe('sync — log deltas', () => {
  const C = getBuiltin('L1');
  let s = runAI(createGame(C, { sessionId: 'S', level: 1, seats: seats('def'), now: 0, seed: 1 }), C, 0).state;
  const full = project(s, C, { role: 'def' });
  it('sends only new log entries after logFrom', () => {
    const d = sliceLog(full, full.log.length - 1);
    expect(d.log.length).toBe(1); expect(d.logLen).toBe(full.log.length);
  });
  it('falls back to full log for bad logFrom', () => { expect(sliceLog(full, 99999).log.length).toBe(full.log.length); expect(sliceLog(full, undefined).logFrom).toBe(0); });
  it('merge reconstructs the exact full log', () => {
    const t = currentTurn(s, C); const r = runAI(applyMove(s, C, 'def', { type: 'CHOOSE', index: 0 }, 1).state, C, 1).state;
    const next = project(r, C, { role: 'def' });
    const prev = { room: { version: 1 }, game: full, case: { id: 'L1' } };
    const merged = mergeView(prev, { room: { version: 2 }, game: sliceLog(next, full.log.length) });
    expect(merged.game.log).toEqual(next.log); expect(merged.case).toEqual({ id: 'L1' });
  });
  it('ignores an older version arriving late', () => {
    const prev = { room: { version: 5 }, game: full };
    expect(mergeView(prev, { room: { version: 4 }, game: { ...full, log: [] } })).toBe(prev);
  });
  it('a delta from a different session is not spliced onto old data', () => {
    const prev = { room: { version: 1 }, game: { ...full, sessionId: 'OLD' } };
    const g = { ...sliceLog(full, 2), sessionId: 'NEW' };
    expect(mergeView(prev, { room: { version: 2 }, game: g }).game.log.length).toBe(g.log.length);
  });
});

describe('sync — coalesced pulls', () => {
  it('many pings while a fetch is in flight produce at most one follow-up fetch', async () => {
    let calls = 0, v = 1; let release;
    const p = createPuller(() => { calls++; return new Promise(r => { release = () => r(v); }); });
    p.request(2); p.request(3); p.request(4); p.request(5);
    expect(calls).toBe(1);
    v = 5; release(); await tick(); await tick();
    expect(calls).toBe(1); // first fetch already returned v5 → no follow-up needed
  });
  it('a ping for a version we already have is ignored (own action)', async () => {
    let calls = 0; const p = createPuller(async () => { calls++; return 9; });
    p.seen(7); await p.request(7); expect(calls).toBe(0);
  });
  it('a newer ping arriving mid-fetch triggers exactly one more fetch', async () => {
    let calls = 0; const vals = [3, 6]; let release;
    const p = createPuller(() => { calls++; const val = vals.shift(); return new Promise(r => { release = () => r(val); }); });
    p.request(3); p.request(6);
    release(); await tick(); await tick(); expect(calls).toBe(2);
    release(); await tick(); await tick(); expect(calls).toBe(2);
  });
});

describe('levels — difficulty and no required typing', () => {
  it('timers tighten: L1 none, L2 45s, L3 30s', () => { expect(LEVELS[1].timer).toBe(0); expect(LEVELS[2].timer).toBe(45); expect(LEVELS[3].timer).toBe(30); });
  for (const C of BUILTIN) for (const role of ROLES) it(`${C.id} as ${role} is finishable with taps only`, () => {
    let s = runAI(createGame(C, { sessionId: 's', level: C.level, seats: seats(role), now: 0, seed: 3 }), C, 0).state; let n = 0;
    while (s.status === 'court' && n++ < 100) {
      const t = currentTurn(s, C); expect(t.o.length).toBeGreaterThanOrEqual(2);
      const i = t.step === 'verdict' ? Math.max(0, t.o.findIndex(o => o.v === correctOf(C, s.flags))) : 0;
      const r = applyMove(s, C, role, { type: 'CHOOSE', index: i }, n * 1000); expect(r.ok).toBe(true); s = runAI(r.state, C, n * 1000).state;
    }
    expect(s.status).toBe('done');
  });
  it('level 1 has no countdown', () => {
    const C = getBuiltin('L1'); const s = runAI(createGame(C, { sessionId: 's', level: 1, seats: seats('def'), now: 0, seed: 3 }), C, 0).state;
    expect(s.deadlineAt).toBe(null);
  });
});
