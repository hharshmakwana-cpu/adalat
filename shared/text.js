// Input normalisation and validation shared by client and server. All user/AI text is rendered as plain text (React escapes).
const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2066-\u2069]/g;

export function normalizeText(s, max = 600) {
  return String(s ?? '').normalize('NFC').replace(CTRL, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, max);
}
export function validName(s) {
  const v = normalizeText(s, 40).replace(/\s+/g, ' ');
  if (v.length < 2) return { ok: false, value: v, error: 'NAME_SHORT' };
  if (v.length > 24) return { ok: false, value: v.slice(0, 24), error: 'NAME_LONG' };
  if (/[<>{}]/.test(v)) return { ok: false, value: v, error: 'NAME_CHARS' };
  return { ok: true, value: v };
}
export function meaningful(s) { const v = normalizeText(s); return v.replace(/[^\p{L}\p{N}]/gu, '').length >= 3; }

// Crockford base32 without I L O U; 9 chars ≈ 45 bits.
export const CODE_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_RE = /^[0-9A-HJKMNP-TV-Z]{9}$/;
export function genRoomCode(randomBytes) {
  const b = randomBytes(9); let out = '';
  for (let i = 0; i < 9; i++) out += CODE_ALPHABET[b[i] & 31];
  return out;
}
export function cleanCode(input) {
  return String(input || '').toUpperCase().replace(/[IL]/g, '1').replace(/O/g, '0').replace(/[^0-9A-Z]/g, '').slice(0, 9);
}
export const formatCode = (c) => (c || '').replace(/(.{3})(?=.)/g, '$1-');
export function looksLikeSecret(s) { return /service_role|sb_secret_|eyJhbGciOi[^.]+\.[^.]*cm9sZSI6InNlcnZpY2Vfcm9sZS/i.test(String(s || '')); }
