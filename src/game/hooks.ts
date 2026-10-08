import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, runAI, applyMove, project, summary, ROLES, LEVELS } from '../../shared/engine.js';
import { mergeView, createPuller } from '../../shared/sync.js';
import { api, supa, store, AppError } from '../lib/services';

/** Single-player: the engine runs in the browser. act() resolves immediately. */
export function useLocalGame(C: any, role: string, level: number) {
  const fresh = () => {
    const seats = Object.fromEntries(ROLES.map((r: string) => [r, r === role ? 'human' : 'ai']));
    const now = Date.now();
    return runAI(createGame(C, { sessionId: crypto.randomUUID(), level, seats, now, seed: (Math.random() * 2 ** 32) >>> 0 }), C, now).state;
  };
  const [st, setSt] = useState<any>(fresh);
  const prev = useRef<any>(null);
  const act = useCallback(async (move: any) => {
    setSt((s: any) => { const r = applyMove(s, C, role, move, Date.now()); if (!r.ok) return s; prev.current = s; return runAI(r.state, C, Date.now()).state; });
  }, [C, role]);
  const tryAgain = useCallback(() => { if (prev.current) { setSt(prev.current); prev.current = null; } }, []);
  const view = useMemo(() => project(st, C, { role }), [st, C, role]);
  const last = view.myMoves[view.myMoves.length - 1];
  const canRetry = level === 1 && !!prev.current && !!last && last.g < 2;
  return { view, act, tryAgain: canRetry ? tryAgain : null, skills: summary(st, role), restart: () => setSt(fresh()) };
}

export type Conn = 'connected' | 'reconnecting' | 'lost' | 'resuming';
const DEV = (import.meta as any).env?.DEV;
const metrics = { actions: 0, actionMs: [] as number[], pulls: 0, pings: 0, bytes: 0 };
if (DEV) (window as any).__adalatNet = metrics;

/**
 * Multiplayer: the server is authoritative.
 * - Full snapshot (`resume`) only on first load, reconnect and tab resume.
 * - In play, other players' pings trigger a coalesced `state` pull carrying only new log entries.
 * - Our own action uses its response directly; our own ping is ignored by version.
 * - Heartbeat is presence-only (no state).
 */
export function useRoom(session: { roomId: string; token: string } | null, onGone: (code: string) => void) {
  const [data, setData] = useState<any>(null); const [conn, setConn] = useState<Conn>('resuming'); const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const dataRef = useRef<any>(null); const alive = useRef(true); const busy = useRef(false);
  const apply = useCallback((v: any) => { if (!v || !alive.current) return; const m = mergeView(dataRef.current, v); dataRef.current = m; setData(m); if (m.room) puller.current.seen(m.room.version); }, []);
  const handleErr = useCallback((e: any) => {
    if (!alive.current) return;
    if (e instanceof AppError && ['ROOM_EXPIRED', 'ROOM_NOT_FOUND', 'NOT_IN_ROOM', 'ROOM_TOKEN_INVALID'].includes(e.code)) { store.setRoom(null); onGone(e.code); }
    else setConn('reconnecting');
  }, [onGone]);
  const fetchState = useCallback(async (full: boolean) => {
    if (!session) return null; metrics.pulls++;
    const d = dataRef.current; const inPlay = !full && d && d.game;
    const v = await api('/api/room/' + (inPlay ? 'state' : 'resume'), inPlay ? { roomId: session.roomId, logFrom: d.game.log.length } : { roomId: session.roomId }, { roomToken: session.token });
    apply(v); setConn('connected'); return v.room?.version ?? null;
  }, [session, apply]);
  const puller = useRef(createPuller(() => fetchState(false).catch(e => { handleErr(e); return null; })));
  const full = useCallback(() => { setConn(c => (c === 'connected' ? c : 'resuming')); return fetchState(true).catch(handleErr); }, [fetchState, handleErr]);

  useEffect(() => {
    alive.current = true; if (!session) return;
    let channel: any = null; let sb: any = null;
    full();
    (async () => {
      try {
        sb = await supa(); const { data: s } = await sb.auth.getSession(); if (s.session) sb.realtime.setAuth(s.session.access_token);
        channel = sb.channel('room:' + session.roomId, { config: { private: true } })
          .on('broadcast', { event: 'sync' }, (msg: any) => {
            metrics.pings++; const p = msg.payload || {}; const me = dataRef.current?.me?.playerId;
            if (p.kind === 'session_replaced' && p.playerId === me) return;
            if (typeof p.version === 'number' && p.version <= puller.current.have) return; // already have it (e.g. our own action)
            if (p.kind === 'lobby' || !dataRef.current?.game) full(); else puller.current.request(p.version ?? Infinity);
          })
          .subscribe((status: string) => { if (!alive.current) return; if (status === 'SUBSCRIBED') setConn('connected'); else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConn('reconnecting'); else if (status === 'CLOSED') setConn('lost'); });
      } catch { setConn('reconnecting'); }
    })();
    const beat = setInterval(() => {
      api('/api/room/heartbeat', { roomId: session.roomId }, { roomToken: session.token })
        .then(h => { setConn('connected'); if (h.version > puller.current.have) puller.current.request(h.version); })
        .catch(handleErr);
    }, 15000);
    const vis = () => { if (document.visibilityState === 'visible') full(); };
    const online = () => full(); const offline = () => setConn('lost');
    document.addEventListener('visibilitychange', vis); window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { alive.current = false; clearInterval(beat); document.removeEventListener('visibilitychange', vis); window.removeEventListener('online', online); window.removeEventListener('offline', offline); if (channel && sb) sb.removeChannel(channel); };
  }, [session && session.roomId]);

  const op = useCallback(async (name: string, body: any = {}) => {
    if (!session) return; setError(null);
    try { const v = await api('/api/room/' + name, { roomId: session.roomId, ...body }, { roomToken: session.token }); if (v && v.room) apply(v); return v; }
    catch (e: any) { setError(e.code || 'UNKNOWN'); throw e; }
  }, [session, apply]);
  const act = useCallback(async (move: any) => {
    const d = dataRef.current; if (!session || !d || !d.game || busy.current) return; busy.current = true; setSending(true); setError(null);
    const t = performance.now(); metrics.actions++;
    try {
      const v = await api('/api/game/action', { roomId: session.roomId, actionId: crypto.randomUUID(), turnId: d.game.turnId, baseVersion: d.room.version, move, logFrom: d.game.log.length }, { roomToken: session.token });
      apply(v); if (DEV) { metrics.actionMs.push(Math.round(performance.now() - t)); console.debug('[adalat] action', metrics.actionMs.at(-1), 'ms', v.timing || ''); }
    } catch (e: any) { setError(e.code || 'UNKNOWN'); if (e.code === 'STALE' || e.code === 'WRONG_TURN') puller.current.request(); }
    finally { busy.current = false; setSending(false); }
  }, [session, apply]);
  return { data, conn, error, op, act, sending, pull: full, levelInfo: data ? (LEVELS as any)[data.room.level] : null };
}
