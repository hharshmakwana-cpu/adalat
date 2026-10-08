// Multiplayer sync helpers shared by server and client (pure, testable).

/** Server: trim a game projection to only the log entries the client doesn't have yet. */
export function sliceLog(game, logFrom) {
  if (!game || typeof logFrom !== 'number' || logFrom < 0 || logFrom > game.log.length) return { ...game, logFrom: 0, logLen: game ? game.log.length : 0 };
  return { ...game, log: game.log.slice(logFrom), logFrom, logLen: game.log.length };
}

/** Client: merge an incoming (possibly partial) room view into the previous one. Older versions are ignored. */
export function mergeView(prev, next) {
  if (!next) return prev;
  if (!prev) return next;
  const pv = prev.room ? prev.room.version : -1, nv = next.room ? next.room.version : -1;
  if (nv < pv) return prev;
  const out = { ...prev, ...next, case: next.case || prev.case, seatModes: next.seatModes || prev.seatModes, players: next.players || prev.players };
  if (next.game) {
    const g = next.game;
    if (g.logFrom > 0 && prev.game && prev.game.sessionId === g.sessionId && prev.game.log.length >= g.logFrom) out.game = { ...g, log: prev.game.log.slice(0, g.logFrom).concat(g.log) };
    else out.game = g;
  }
  return out;
}

/** Client: at most one state fetch in flight; any number of pings while busy collapse into one follow-up fetch. */
export function createPuller(fetchFn) {
  let inflight = null, wanted = -1, have = -1;
  const run = async () => {
    do { const before = have; const v = await fetchFn(); if (typeof v === 'number') have = Math.max(have, v); if (have <= before) break; } while (wanted > have);
  };
  return {
    request(version = Infinity) {
      if (version !== Infinity && version <= have) return inflight || Promise.resolve();
      wanted = Math.max(wanted, version === Infinity ? have + 1 : version);
      if (inflight) return inflight;
      inflight = run().finally(() => { inflight = null; });
      return inflight;
    },
    seen(version) { have = Math.max(have, version); },
    get have() { return have; },
    get busy() { return !!inflight; }
  };
}
