import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGame, runAI, applyMove, project, summary, ROLES, LEVELS } from '../../shared/engine.js';
import { api, supa, store, AppError } from '../lib/services';

/** Single-player: the engine runs in the browser. */
export function useLocalGame(C: any, role: string, level: number) {
  const fresh = () => {
    const seats = Object.fromEntries(ROLES.map((r: string) => [r, r === role ? 'human' : 'ai']));
    const now = Date.now();
    return runAI(createGame(C, { sessionId: crypto.randomUUID(), level, seats, now, seed: (Math.random() * 2 ** 32) >>> 0 }), C, now).state;
  };
  const [st, setSt] = useState<any>(fresh);
  const prev = useRef<any>(null);
  const act = useCallback((move: any) => {
    setSt((s: any) => { const r = applyMove(s, C, role, move, Date.now()); if (!r.ok) return s; prev.current = s; return runAI(r.state, C, Date.now()).state; });
  }, [C, role]);
  const tryAgain = useCallback(() => { if (prev.current) { setSt(prev.current); prev.current = null; } }, []);
  const view = useMemo(() => project(st, C, { role }), [st, C, role]);
  const canRetry = level === 1 && !!prev.current && (() => { const m = view.myMoves[view.myMoves.length - 1]; return !!m && m.g < 2; })();
  return { view, act, tryAgain: canRetry ? tryAgain : null, skills: summary(st, role), restart: () => setSt(fresh()) };
}

export type Conn = 'connected' | 'reconnecting' | 'lost' | 'resuming';
/** Multiplayer: the server is authoritative. We send intents and pull our own projection on every version ping. */
export function useRoom(session: { roomId: string; token: string } | null, onGone: (code: string) => void) {
  const [data, setData] = useState<any>(null); const [conn, setConn] = useState<Conn>('resuming'); const [error, setError] = useState<string | null>(null);
  const ver = useRef(-1); const alive = useRef(true); const busy = useRef(false);
  const pull = useCallback(async () => {
    if (!session) return;
    try {
      const v = await api('/api/room/resume', { roomId: session.roomId }, { roomToken: session.token });
      if (!alive.current) return;
      const gv = v.room.version ?? 0; if (gv >= ver.current) { ver.current = gv; setData(v); }
      setConn('connected');
    } catch (e: any) {
      if (!alive.current) return;
      if (e instanceof AppError && ['ROOM_EXPIRED', 'ROOM_NOT_FOUND', 'NOT_IN_ROOM', 'ROOM_TOKEN_INVALID'].includes(e.code)) { store.setRoom(null); onGone(e.code); }
      else setConn('reconnecting');
    }
  }, [session]);

  useEffect(() => {
    alive.current = true; if (!session) return;
    let channel: any = null; let sb: any = null;
    pull();
    (async () => {
      try {
        sb = await supa(); const { data: s } = await sb.auth.getSession(); if (s.session) sb.realtime.setAuth(s.session.access_token);
        channel = sb.channel('room:' + session.roomId, { config: { private: true } })
          .on('broadcast', { event: 'sync' }, (msg: any) => { if (msg.payload?.kind === 'session_replaced' && data && msg.payload.playerId === data.me?.playerId) return; pull(); })
          .subscribe((status: string) => { if (!alive.current) return; if (status === 'SUBSCRIBED') { setConn('connected'); pull(); } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setConn('reconnecting'); else if (status === 'CLOSED') setConn('lost'); });
      } catch { setConn('reconnecting'); }
    })();
    const beat = setInterval(pull, 15000);
    const vis = () => { if (document.visibilityState === 'visible') { setConn('resuming'); pull(); } };
    const online = () => { setConn('resuming'); pull(); }; const offline = () => setConn('lost');
    document.addEventListener('visibilitychange', vis); window.addEventListener('online', online); window.addEventListener('offline', offline);
    return () => { alive.current = false; clearInterval(beat); document.removeEventListener('visibilitychange', vis); window.removeEventListener('online', online); window.removeEventListener('offline', offline); if (channel && sb) sb.removeChannel(channel); };
  }, [session && session.roomId]);

  const op = useCallback(async (name: string, body: any = {}) => {
    if (!session) return; setError(null);
    try { const v = await api('/api/room/' + name, { roomId: session.roomId, ...body }, { roomToken: session.token }); if (v && v.room) { ver.current = v.room.version ?? ver.current; setData(v); } return v; }
    catch (e: any) { setError(e.code || 'UNKNOWN'); throw e; }
  }, [session]);
  const act = useCallback(async (move: any) => {
    if (!session || !data || !data.game || busy.current) return; busy.current = true; setError(null);
    try { const v = await api('/api/game/action', { roomId: session.roomId, actionId: crypto.randomUUID(), turnId: data.game.turnId, baseVersion: data.room.version, move }, { roomToken: session.token }); ver.current = v.room.version; setData(v); }
    catch (e: any) { setError(e.code || 'UNKNOWN'); if (e.code === 'STALE' || e.code === 'WRONG_TURN') pull(); }
    finally { busy.current = false; }
  }, [session, data]);
  return { data, conn, error, op, act, pull, levelInfo: data ? (LEVELS as any)[data.room.level] : null };
}
