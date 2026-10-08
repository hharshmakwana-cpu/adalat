// Small client services: storage, API calls, lazy Supabase, audio cues, speech in/out.
import { looksLikeSecret } from '../../shared/text.js';

// ---------- storage (separated: prefs / progress / seen AI cases / room session) ----------
const read = (k: string, d: any) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const write = (k: string, v: any) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
export const store = {
  prefs: () => read('adalat:prefs', { lang: 'en', sound: true, voice: false, reducedAudio: false, name: '' }),
  setPrefs: (p: any) => write('adalat:prefs', p),
  progress: () => read('adalat:progress', { passed: {}, best: {}, concepts: [] }),
  setProgress: (p: any) => write('adalat:progress', p),
  seen: () => read('adalat:seen', [] as string[]),
  addSeen: (s: string) => write('adalat:seen', [...read('adalat:seen', []), s].slice(-30)),
  room: () => { try { return JSON.parse(sessionStorage.getItem('adalat:room') || 'null'); } catch { return null; } },
  setRoom: (r: any) => { try { r ? sessionStorage.setItem('adalat:room', JSON.stringify(r)) : sessionStorage.removeItem('adalat:room'); } catch { /* ignore */ } }
};
(function migrateV6() {
  try {
    const old = localStorage.getItem('adalat-progress-v2');
    if (old) { const o = JSON.parse(old) || {}; const p = store.progress(); for (const n of Object.keys(o.passed || {})) p.passed['L' + n] = true; store.setProgress(p); localStorage.removeItem('adalat-progress-v2'); }
    const nm = localStorage.getItem('adalat-name'); if (nm) { const pr = store.prefs(); pr.name = pr.name || nm; store.setPrefs(pr); localStorage.removeItem('adalat-name'); }
    localStorage.removeItem('adalat-seen-cases');
  } catch { /* ignore */ }
})();

// ---------- Supabase (loaded only when multiplayer or AI auth is needed) ----------
const SB_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const mpEnabled = !!(SB_URL && SB_KEY) && !looksLikeSecret(SB_KEY);
if (SB_KEY && looksLikeSecret(SB_KEY)) console.error('ADALAT: a server secret was configured as VITE_SUPABASE_ANON_KEY. Do not put a server secret in the browser. Multiplayer is disabled.');
let sbPromise: Promise<any> | null = null;
export function supa() {
  if (!mpEnabled) return Promise.reject(new AppError('MP_NOT_CONFIGURED'));
  if (!sbPromise) sbPromise = import('@supabase/supabase-js').then(m => m.createClient(SB_URL!, SB_KEY!, { auth: { persistSession: true, autoRefreshToken: true } }));
  return sbPromise;
}
export async function accessToken(): Promise<string | null> {
  if (!mpEnabled) return null;
  const sb = await supa(); const { data } = await sb.auth.getSession();
  if (data.session) return data.session.access_token;
  const r = await sb.auth.signInAnonymously(); if (r.error) throw new AppError('UNKNOWN');
  return r.data.session.access_token;
}

export class AppError extends Error { code: string; detail: any; requestId?: string; constructor(code: string, detail?: any, requestId?: string) { super(code); this.code = code; this.detail = detail; this.requestId = requestId; } }
export async function api(path: string, body?: any, opts: { signal?: AbortSignal; roomToken?: string; method?: string } = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  try { const tok = await accessToken(); if (tok) headers.authorization = 'Bearer ' + tok; } catch { /* AI degraded mode */ }
  if (opts.roomToken) headers['x-room-token'] = opts.roomToken;
  let r: Response;
  try { r = await fetch(path, { method: opts.method || 'POST', headers, body: body === undefined ? undefined : JSON.stringify(body), signal: opts.signal }); }
  catch (e: any) { if (e && e.name === 'AbortError') throw e; throw new AppError('NET'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new AppError(j.code || 'UNKNOWN', j.detail, j.requestId);
  return j;
}
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fall back */ }
  try { const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok; } catch { return false; }
}

// ---------- audio: synthesized cues (no autoplay; context is created on first user gesture) ----------
let ctx: AudioContext | null = null;
export const audio = {
  enabled: true, reduced: false,
  ensure() { if (!this.enabled) return null; try { ctx = ctx || new (window.AudioContext || (window as any).webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; } catch { return null; } },
  tone(freqs: number[], dur: number, type: OscillatorType = 'sine', gain = 0.12, gap = 0) {
    const c = this.ensure(); if (!c) return; const g0 = this.reduced ? gain * 0.5 : gain;
    freqs.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); const t = c.currentTime + i * gap; o.type = type; o.frequency.setValueAtTime(f, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(g0, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05); });
  },
  cue(name: string) {
    switch (name) {
      case 'open': return this.tone([196, 247, 294], 1.1, 'triangle', 0.08, 0.12);
      case 'page': return this.tone([900], 0.08, 'triangle', 0.04);
      case 'exhibit': return this.tone([330, 220], 0.18, 'square', 0.05, 0.06);
      case 'objection': return this.tone([110, 98], 0.35, 'sawtooth', 0.09, 0.05);
      case 'ruling': return this.tone([392, 523], 0.35, 'triangle', 0.08, 0.14);
      case 'judgment': return this.tone([262, 330, 392], 1.4, 'sine', 0.09, 0);
      case 'tick': return this.tone([1200], 0.05, 'square', 0.03);
      case 'good': return this.tone([523, 659], 0.22, 'sine', 0.07, 0.08);
      case 'weak': return this.tone([220], 0.25, 'triangle', 0.06);
      case 'result': return this.tone([392, 494, 587, 784], 0.5, 'triangle', 0.07, 0.1);
    }
  }
};

// ---------- speech ----------
export const speech = {
  ok: typeof window !== 'undefined' && 'speechSynthesis' in window,
  say(text: string, lang: string) { if (!this.ok) return; try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; const vs = speechSynthesis.getVoices(); const v = vs.find(v => v.lang === u.lang) || vs.find(v => v.lang.startsWith(lang === 'hi' ? 'hi' : 'en')); if (v) u.voice = v; u.rate = 0.95; speechSynthesis.speak(u); } catch { /* ignore */ } },
  stop() { try { this.ok && speechSynthesis.cancel(); } catch { /* ignore */ } }
};
export const micSupported = typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
export function listen(lang: string, onText: (s: string) => void, onEnd: (err?: string) => void): (() => void) | null {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) { onEnd('unsupported'); return null; }
  const r = new SR(); r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'; r.continuous = true; r.interimResults = false;
  r.onresult = (e: any) => { let s = ''; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) s += e.results[i][0].transcript; if (s) onText(s.trim()); };
  r.onerror = (e: any) => onEnd(e.error === 'not-allowed' || e.error === 'service-not-allowed' ? 'denied' : e.error === 'no-speech' ? 'nospeech' : e.error === 'audio-capture' ? 'busy' : 'network');
  r.onend = () => onEnd();
  try { r.start(); } catch { onEnd('busy'); return null; }
  return () => { try { r.stop(); } catch { /* ignore */ } };
}
