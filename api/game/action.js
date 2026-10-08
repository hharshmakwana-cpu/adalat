// /api/game/action — the ONLY way to change a multiplayer game. The server derives the actor, checks seat, turn,
// phase, version and action id, then runs the shared engine. Clients never send state, score, turn, truth or verdict outcome.
import { route, readJson, parse, fail, db, requireUser, rateLimit, logSec, verifyRoomToken, ping } from '../_lib/server.js';
import { Envelope } from '../../shared/schemas.js';
import { getBuiltin } from '../../shared/cases.js';
import { applyMove, runAI, currentTurn } from '../../shared/engine.js';
import { view } from '../room/[op].js';

export default route(async (req, { requestId }) => {
  const env = parse(Envelope, readJson(req, 8 * 1024)); const user = await requireUser(req);
  const { data: room } = await db().from('rooms').select('*').eq('id', env.roomId).maybeSingle();
  if (!room) fail('ROOM_NOT_FOUND', 404);
  verifyRoomToken(req.headers['x-room-token'], { roomId: room.id, userId: user.id });
  if (room.status !== 'in_game' || !room.state || new Date(room.expires_at) < new Date()) fail('INVALID_ACTION', 409);
  const { data: player } = await db().from('room_players').select('*').eq('room_id', room.id).eq('user_id', user.id).maybeSingle();
  if (!player) fail('NOT_IN_ROOM', 403);
  await rateLimit('act:' + player.id, 10, 20);
  const reject = (code, status = 409) => { logSec('action_rejected', { requestId, userId: user.id, roomId: room.id, code }); fail(code, status); };
  if (player.is_spectator || !player.role) reject('SPECTATOR', 403);

  const C = getBuiltin(room.case_id); const s = room.state; const t = currentTurn(s, C);
  if (env.baseVersion !== room.version) fail('STALE', 409);
  if (env.turnId !== s.turnId) reject('WRONG_TURN');
  if (!t || t.role !== player.role) reject('NOT_YOUR_TURN');
  if (s.seats[player.role] !== player.id) reject('NOT_YOUR_SEAT', 403);

  const { error: dupErr } = await db().from('room_actions').insert({ action_id: env.actionId, room_id: room.id, turn_id: s.turnId, version: room.version, actor_player: player.id, move_type: env.move.type });
  if (dupErr) reject('DUPLICATE_ACTION');

  const now = Date.now();
  const r = applyMove(s, C, player.role, env.move, now);
  if (!r.ok) { await db().from('room_actions').delete().eq('action_id', env.actionId); reject(r.code || 'INVALID_ACTION'); }
  const after = runAI(r.state, C, now).state;
  const status = after.status === 'done' ? 'finished' : 'in_game';
  const { data: upd } = await db().from('rooms').update({ state: after, version: room.version + 1, status, updated_at: new Date().toISOString(), expires_at: new Date(now + 2 * 3600e3).toISOString() })
    .eq('id', room.id).eq('version', room.version).select('id');
  if (!upd || !upd.length) { await db().from('room_actions').delete().eq('action_id', env.actionId); fail('STALE', 409); }
  await ping(room.id, { kind: 'game', version: room.version + 1 });
  const fresh = { ...room, state: after, version: room.version + 1, status };
  const { data: pl } = await db().from('room_players').select('*').eq('room_id', room.id).order('joined_at');
  return view(fresh, pl || [], player);
});
