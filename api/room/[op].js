// /api/room/:op — create | join | role | ready | seat | start | resume | leave | transfer-host | kick
// Every call: verified user token → server-derived player. Body fields like name/role/host are requests, never proof.
import crypto from 'node:crypto';
import { route, readJson, parse, fail, db, requireUser, rateLimit, ipOf, logSec, signRoomToken, verifyRoomToken, ping } from '../_lib/server.js';
import { RoomOps } from '../../shared/schemas.js';
import { genRoomCode, CODE_RE } from '../../shared/text.js';
import { getBuiltin } from '../../shared/cases.js';
import { createGame, runAI, project, publicCase, ROLES, summary, awards } from '../../shared/engine.js';
import { sliceLog } from '../../shared/sync.js';

const MAX_SEATS = 5, MAX_SPECTATORS = 20, HOST_STALE_MS = 20000, ONLINE_MS = 35000;

async function loadRoom(roomId) {
  const { data: room } = await db().from('rooms').select('*').eq('id', roomId).maybeSingle();
  if (!room) fail('ROOM_NOT_FOUND', 404);
  if (['expired', 'ended'].includes(room.status) || new Date(room.expires_at) < new Date()) fail('ROOM_EXPIRED', 410);
  return room;
}
async function players(roomId) { const { data } = await db().from('room_players').select('*').eq('room_id', roomId).order('joined_at'); return data || []; }
async function seatModes(roomId) { const { data } = await db().from('room_seat_modes').select('*').eq('room_id', roomId); return Object.fromEntries((data || []).map(r => [r.role, r.mode])); }
async function me(room, user) {
  const { data } = await db().from('room_players').select('*').eq('room_id', room.id).eq('user_id', user.id).maybeSingle();
  if (!data) fail('NOT_IN_ROOM', 403); return data;
}
const touch = (pid) => db().from('room_players').update({ last_seen: new Date().toISOString() }).eq('id', pid);
const bump = (room, extra = {}) => db().from('rooms').update({ updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + (room.status === 'in_game' ? 2 * 3600e3 : 30 * 60e3)).toISOString(), ...extra }).eq('id', room.id);

const PUB = new Map(); // static public case objects are immutable — cache per instance
const pubCase = (id) => { if (!PUB.has(id)) { const C = getBuiltin(id); PUB.set(id, C ? publicCase(C) : null); } return PUB.get(id); };

/** Full snapshot (lobby / reconnect). Pass lite:true during play to skip seat modes and the static case file. */
export async function view(room, pl, myPlayer, { lite = false, logFrom } = {}) {
  const modes = lite ? null : await seatModes(room.id); const C = getBuiltin(room.case_id); const now = Date.now();
  const hostP = pl.find(p => p.user_id === room.host_user);
  const out = {
    room: { id: room.id, code: room.code, status: room.status, version: room.version, level: room.level, caseId: room.case_id, expiresAt: room.expires_at, allowSpectators: room.allow_spectators, hostPlayerId: hostP ? hostP.id : null, hostOnline: !!hostP && now - new Date(hostP.last_seen).getTime() < HOST_STALE_MS },
    players: pl.map(p => ({ id: p.id, name: p.display_name, role: p.role, ready: p.ready, spectator: p.is_spectator, online: now - new Date(p.last_seen).getTime() < ONLINE_MS, isHost: p.user_id === room.host_user })),
    seatModes: modes ? Object.fromEntries(ROLES.map(r => [r, modes[r] || 'ai'])) : undefined,
    me: { playerId: myPlayer.id, role: myPlayer.role, spectator: myPlayer.is_spectator, isHost: myPlayer.user_id === room.host_user },
    case: lite ? undefined : pubCase(room.case_id), game: null, results: null
  };
  if (room.state && C) {
    out.game = sliceLog(project(room.state, C, { role: myPlayer.is_spectator ? null : myPlayer.role, spectator: myPlayer.is_spectator }), logFrom);
    if (room.state.status === 'done') {
      const seated = pl.filter(p => p.role && !p.is_spectator).map(p => ({ id: p.id, name: p.display_name, role: p.role }));
      out.results = { table: seated.map(p => ({ ...p, ...summary(room.state, p.role) })), awards: awards(room.state, seated) };
    }
  }
  return out;
}

export default route(async (req, { requestId }) => {
  const op = String(req.query.op || ''); const schema = RoomOps[op]; if (!schema) fail('NOT_FOUND', 404);
  const body = parse(schema, readJson(req, 8 * 1024)); const user = await requireUser(req); const ip = ipOf(req);

  if (op === 'create') {
    await rateLimit('create:' + user.id, 3600, 5); await rateLimit('createip:' + ip, 3600, 20);
    if (!getBuiltin(body.caseId)) fail('INVALID_INPUT', 400);
    let room = null; let lastErr = null;
    for (let i = 0; i < 5 && !room; i++) {
      const code = genRoomCode(n => crypto.randomBytes(n));
      const { data, error } = await db().from('rooms').insert({ code, host_user: user.id, case_id: body.caseId, level: body.level, allow_spectators: body.allowSpectators }).select('*').single();
      if (!error) room = data; else { lastErr = error; if (error.code !== '23505') break; }
    }
    if (!room) { console.log(JSON.stringify({ room_insert_error: lastErr && lastErr.code, msg: String(lastErr && lastErr.message).slice(0, 160) })); fail('DB_ROOM_INSERT', 503, { pg: lastErr && lastErr.code }); }
    await db().from('room_seat_modes').insert(ROLES.map(r => ({ room_id: room.id, role: r, mode: r === body.role ? 'human' : 'ai' })));
    const { data: p } = await db().from('room_players').insert({ room_id: room.id, user_id: user.id, display_name: body.displayName, role: body.role, ready: true }).select('*').single();
    logSec('room_create', { requestId, userId: user.id, roomId: room.id });
    return { token: signRoomToken({ rid: room.id, pid: p.id, uid: user.id }), ...(await view(room, [p], p)) };
  }

  if (op === 'join') {
    await rateLimit('join:' + ip, 60, 10); await rateLimit('joinh:' + ip, 3600, 30);
    if (!CODE_RE.test(body.code)) fail('ROOM_NOT_FOUND', 404);
    const { data: room } = await db().from('rooms').select('*').eq('code', body.code).maybeSingle();
    if (!room || ['expired', 'ended', 'finished'].includes(room.status) || new Date(room.expires_at) < new Date()) { logSec('join_bad_code', { requestId, userId: user.id }); fail('ROOM_NOT_FOUND', 404); }
    let pl = await players(room.id); const existing = pl.find(p => p.user_id === user.id);
    if (existing) { await touch(existing.id); await ping(room.id, { kind: 'session_replaced', playerId: existing.id, version: room.version }); return { token: signRoomToken({ rid: room.id, pid: existing.id, uid: user.id }), ...(await view(room, pl, existing)) }; }
    const seated = pl.filter(p => !p.is_spectator); const specs = pl.filter(p => p.is_spectator);
    let role = body.wantRole || null; let spectator = !!body.spectate || room.status !== 'lobby';
    if (spectator) { if (!room.allow_spectators || specs.length >= MAX_SPECTATORS) fail('ROOM_FULL', 409); role = null; }
    else {
      if (seated.length >= MAX_SEATS) fail('ROOM_FULL', 409, { canSpectate: room.allow_spectators });
      if (role) { const holder = pl.find(p => p.role === role); if (holder) fail('ROLE_TAKEN', 409, { holder: holder.display_name, free: ROLES.filter(r => !pl.some(p => p.role === r)) }); }
    }
    const { data: p, error } = await db().from('room_players').insert({ room_id: room.id, user_id: user.id, display_name: body.displayName, role, is_spectator: spectator }).select('*').single();
    if (error) fail(role ? 'ROLE_TAKEN' : 'UNAVAILABLE', 409);
    if (role) await db().from('room_seat_modes').update({ mode: 'human' }).eq('room_id', room.id).eq('role', role);
    await bump(room); pl = await players(room.id); await ping(room.id, { kind: 'lobby', version: room.version });
    logSec('room_join', { requestId, userId: user.id, roomId: room.id });
    return { token: signRoomToken({ rid: room.id, pid: p.id, uid: user.id }), ...(await view(room, pl, p)) };
  }

  // All remaining ops need the room token as well as the user token.
  // Fast path: room + my player in parallel, token checked before any write.
  verifyRoomToken(req.headers['x-room-token'], { roomId: body.roomId, userId: user.id });
  const [room, mine0] = await Promise.all([loadRoom(body.roomId), db().from('room_players').select('*').eq('room_id', body.roomId).eq('user_id', user.id).maybeSingle().then(r => r.data)]);
  if (!mine0) fail('NOT_IN_ROOM', 403);
  let mine = mine0;
  const isHost = room.host_user === user.id;

  // Heartbeat: presence only — no game state is read or returned.
  if (op === 'heartbeat') { await touch(mine.id); return { ok: true, version: room.version, status: room.status }; }

  const [, , pl0] = await Promise.all([touch(mine.id), rateLimit('room:' + mine.id, 60, 120), players(room.id)]);

  // Full snapshot for first load / reconnect / lobby.
  if (op === 'resume') return view(room, pl0, mine);
  // Game-only state for in-play syncs: no seat modes, no case file, only new log entries.
  if (op === 'state') return view(room, pl0, mine, { lite: true, logFrom: body.logFrom });

  if (op === 'role') {
    if (room.status !== 'lobby' || mine.is_spectator) fail('INVALID_ACTION', 409);
    if (body.role) {
      const holder = (await players(room.id)).find(p => p.role === body.role && p.id !== mine.id);
      if (holder) fail('ROLE_TAKEN', 409, { holder: holder.display_name });
    }
    const old = mine.role;
    const { error } = await db().from('room_players').update({ role: body.role, ready: false }).eq('id', mine.id);
    if (error) fail('ROLE_TAKEN', 409);
    if (old) await db().from('room_seat_modes').update({ mode: 'ai' }).eq('room_id', room.id).eq('role', old);
    if (body.role) await db().from('room_seat_modes').update({ mode: 'human' }).eq('room_id', room.id).eq('role', body.role);
  } else if (op === 'ready') {
    if (room.status !== 'lobby' || !mine.role) fail('INVALID_ACTION', 409);
    await db().from('room_players').update({ ready: body.ready }).eq('id', mine.id);
  } else if (op === 'seat') {
    if (!isHost || room.status !== 'lobby') fail('FORBIDDEN', 403);
    const holder = (await players(room.id)).find(p => p.role === body.role);
    if (body.mode === 'ai' && holder) fail('SEAT_OCCUPIED', 409);
    await db().from('room_seat_modes').update({ mode: body.mode }).eq('room_id', room.id).eq('role', body.role);
  } else if (op === 'kick') {
    if (!isHost) fail('FORBIDDEN', 403);
    const { data: k } = await db().from('room_players').select('*').eq('id', body.playerId).eq('room_id', room.id).maybeSingle();
    if (!k || k.user_id === user.id) fail('INVALID_ACTION', 409);
    await db().from('room_players').delete().eq('id', k.id);
    if (k.role) await db().from('room_seat_modes').update({ mode: 'ai' }).eq('room_id', room.id).eq('role', k.role);
    if (room.state && k.role) { const st = { ...room.state, seats: { ...room.state.seats, [k.role]: 'ai' } }; await db().from('rooms').update({ state: st }).eq('id', room.id); }
  } else if (op === 'transfer-host' || op === 'leave') {
    const pl = await players(room.id);
    const hostP = pl.find(p => p.user_id === room.host_user);
    const hostStale = !hostP || Date.now() - new Date(hostP.last_seen).getTime() > HOST_STALE_MS;
    if (op === 'transfer-host' && !isHost && !hostStale) fail('FORBIDDEN', 403);
    if (op === 'leave') {
      await db().from('room_players').delete().eq('id', mine.id);
      if (mine.role) await db().from('room_seat_modes').update({ mode: 'ai' }).eq('room_id', room.id).eq('role', mine.role);
      if (room.state && mine.role) { const st = { ...room.state, seats: { ...room.state.seats, [mine.role]: 'ai' } }; const r = runAI(st, getBuiltin(room.case_id), Date.now()); await db().from('rooms').update({ state: r.state, version: room.version + 1 }).eq('id', room.id).eq('version', room.version); }
    }
    const left = (await players(room.id));
    if (!left.length) await db().from('rooms').update({ status: 'ended' }).eq('id', room.id);
    else if (op === 'leave' ? isHost : true) {
      const next = left.filter(p => p.user_id !== (op === 'transfer-host' && isHost ? user.id : room.host_user)).sort((a, b) => (a.is_spectator - b.is_spectator) || (new Date(a.joined_at) - new Date(b.joined_at)))[0]
        || (op === 'transfer-host' && !isHost ? mine : null);
      const target = op === 'transfer-host' && !isHost ? mine : next;
      if (target) await db().from('rooms').update({ host_user: target.user_id }).eq('id', room.id);
    }
    logSec(op === 'leave' ? 'room_leave' : 'host_transfer', { requestId, userId: user.id, roomId: room.id });
    await bump(room); await ping(room.id, { kind: 'lobby', version: room.version + 1 });
    if (op === 'leave') return { left: true };
  } else if (op === 'start') {
    if (!isHost) fail('FORBIDDEN', 403);
    if (room.status !== 'lobby') fail('INVALID_ACTION', 409);
    const pl = await players(room.id); const modes = await seatModes(room.id);
    const notReady = pl.filter(p => p.role && !p.is_spectator && !p.ready);
    if (notReady.length) fail('NOT_READY', 409, { waiting: notReady.map(p => p.display_name) });
    const seats = Object.fromEntries(ROLES.map(r => { const p = pl.find(x => x.role === r && !x.is_spectator); return [r, p ? p.id : 'ai']; }));
    for (const r of ROLES) if (modes[r] === 'human' && seats[r] === 'ai') seats[r] = 'ai'; // empty human seat → AI plays it
    const C = getBuiltin(room.case_id); const now = Date.now();
    let st = createGame(C, { sessionId: crypto.randomUUID(), level: room.level, seats, now, seed: crypto.randomBytes(4).readUInt32LE(0) });
    st = runAI(st, C, now).state;
    const { error } = await db().from('rooms').update({ state: st, status: 'in_game', version: room.version + 1 }).eq('id', room.id).eq('version', room.version);
    if (error) fail('STALE', 409);
    await bump({ ...room, status: 'in_game' }); await ping(room.id, { kind: 'game', version: room.version + 1 });
    logSec('game_start', { requestId, userId: user.id, roomId: room.id });
  }
  if (op !== 'start') await ping(room.id, { kind: 'lobby', version: room.version });
  const fresh = await loadRoom(room.id); mine = await me(fresh, user);
  return view(fresh, await players(room.id), mine);
});
