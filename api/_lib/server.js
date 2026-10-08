// Shared server helpers: errors, JSON responses, body limits, request ids, identity, rate limits, security log.
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export class ApiError extends Error { constructor(code, status = 400, extra) { super(code); this.code = code; this.status = status; this.extra = extra; } }
export const fail = (code, status, extra) => { throw new ApiError(code, status, extra); };
export const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 16);
export const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || '0.0.0.0';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export function readJson(req, max = 16 * 1024) {
  let b = req.body;
  if (b == null || b === '') return {};
  if (typeof b === 'string') { if (b.length > max) fail('PAYLOAD_TOO_LARGE', 413); try { b = JSON.parse(b); } catch { fail('INVALID_JSON', 400); } }
  else if (Buffer.isBuffer(b)) { if (b.length > max) fail('PAYLOAD_TOO_LARGE', 413); try { b = JSON.parse(b.toString('utf8')); } catch { fail('INVALID_JSON', 400); } }
  else if (JSON.stringify(b).length > max) fail('PAYLOAD_TOO_LARGE', 413);
  if (typeof b !== 'object' || Array.isArray(b)) fail('INVALID_JSON', 400);
  return b;
}
export function parse(schema, body) {
  const r = schema.safeParse(body);
  if (!r.success) fail('INVALID_INPUT', 400, { fields: r.error.issues.slice(0, 5).map(i => i.path.join('.')) });
  return r.data;
}

/** Wrap a handler: request id, method check, uniform errors (never leaks provider/stack details). */
export function route(fn, { methods = ['POST'] } = {}) {
  return async (req, res) => {
    const requestId = crypto.randomUUID(); const t0 = Date.now();
    res.setHeader('x-request-id', requestId); res.setHeader('cache-control', 'no-store');
    try {
      if (!methods.includes(req.method)) fail('METHOD_NOT_ALLOWED', 405);
      const out = await fn(req, { requestId });
      res.status(200).json(out);
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 500; const code = e instanceof ApiError ? e.code : 'UNKNOWN';
      if (status === 404 && code === 'ROOM_NOT_FOUND') await sleep(300); // uniform response time against code enumeration
      console.log(JSON.stringify({ requestId, path: req.url, code, status, ms: Date.now() - t0, err: status >= 500 ? String(e && e.message).slice(0, 160) : undefined }));
      res.status(status).json({ code, requestId, ...(e instanceof ApiError && e.extra ? { detail: e.extra } : {}) });
    }
  };
}

let admin = null;
export const mpConfigured = () => !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export function db() {
  if (!mpConfigured()) fail('MP_NOT_CONFIGURED', 503);
  if (!admin) admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

/** Identity comes ONLY from the verified Supabase access token — never from the request body. */
export async function requireUser(req) {
  const h = String(req.headers.authorization || ''); const tok = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!tok || tok.length > 4096) fail('AUTH_REQUIRED', 401);
  const { data, error } = await db().auth.getUser(tok);
  if (error || !data || !data.user) fail('AUTH_REQUIRED', 401);
  return data.user;
}

const mem = new Map(); // fallback limiter (per instance) when the database is not configured
export async function rateLimit(key, windowS, max) {
  if (!mpConfigured()) {
    const now = Date.now(); const e = mem.get(key);
    if (!e || now - e.t > windowS * 1000) { mem.set(key, { t: now, n: 1 }); return; }
    if (++e.n > max) fail('RATE_LIMITED', 429); return;
  }
  const { data, error } = await db().rpc('hit_rate', { p_key: key, p_window_s: windowS, p_max: max });
  if (error) fail('UNAVAILABLE', 503);
  if (!data) { logSec('rate_limited', { code: key.split(':')[0] }); fail('RATE_LIMITED', 429); }
}

export async function logSec(event, { requestId, userId, roomId, code } = {}) {
  if (!mpConfigured()) { console.log(JSON.stringify({ sec: event, requestId, code })); return; }
  try { await db().from('security_log').insert({ event, request_id: requestId || null, user_hash: userId ? hash(userId) : null, room_id: roomId || null, code: code || null }); } catch { /* never block on logging */ }
}

// Room token: HMAC-signed, short-lived, binds a user to one seat in one room. Checked in addition to the user token.
const b64 = (b) => Buffer.from(b).toString('base64url');
export function signRoomToken(p, ttlS = 2 * 3600) {
  const secret = process.env.ROOM_TOKEN_SECRET; if (!secret || secret.length < 32) fail('MP_NOT_CONFIGURED', 503);
  const body = b64(JSON.stringify({ ...p, exp: Math.floor(Date.now() / 1000) + ttlS }));
  return body + '.' + b64(crypto.createHmac('sha256', secret).update(body).digest());
}
export function verifyRoomToken(tok, { roomId, userId }) {
  const secret = process.env.ROOM_TOKEN_SECRET; if (!secret) fail('MP_NOT_CONFIGURED', 503);
  const [body, sig] = String(tok || '').split('.'); if (!body || !sig) fail('ROOM_TOKEN_INVALID', 401);
  const want = crypto.createHmac('sha256', secret).update(body).digest(); const got = Buffer.from(sig, 'base64url');
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) fail('ROOM_TOKEN_INVALID', 401);
  const p = JSON.parse(Buffer.from(body, 'base64url').toString());
  if (p.exp < Date.now() / 1000 || p.rid !== roomId || p.uid !== userId) fail('ROOM_TOKEN_INVALID', 401);
  return p;
}

/** Server-only fan-out on a PRIVATE channel. Payload is just a version ping — clients pull their own projection. */
export async function ping(roomId, payload) {
  try {
    await fetch(process.env.SUPABASE_URL + '/realtime/v1/api/broadcast', {
      method: 'POST', headers: { 'content-type': 'application/json', apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY },
      body: JSON.stringify({ messages: [{ topic: 'room:' + roomId, event: 'sync', payload, private: true }] })
    });
  } catch { /* clients also poll on reconnect */ }
}
