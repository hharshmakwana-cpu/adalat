import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { STATUS_LABEL } from '../../shared/legal.js';
import type { Lang, Strings } from '../i18n';

// ---------- screen-reader announcer ----------
const AnnCtx = createContext<(msg: string, assertive?: boolean) => void>(() => {});
export function Announcer({ children }: { children: React.ReactNode }) {
  const [polite, setPolite] = useState(''); const [loud, setLoud] = useState('');
  const say = (m: string, a = false) => { if (a) { setLoud(''); setTimeout(() => setLoud(m), 30); } else { setPolite(''); setTimeout(() => setPolite(m), 30); } };
  return <AnnCtx.Provider value={say}>{children}<div className="sr-only" aria-live="polite">{polite}</div><div className="sr-only" aria-live="assertive">{loud}</div></AnnCtx.Provider>;
}
export const useAnnounce = () => useContext(AnnCtx);

// ---------- accessible dialog / bottom sheet (focus trap + restore) ----------
export function Dialog({ title, onClose, children, dismissable = true }: { title: string; onClose?: () => void; children: React.ReactNode; dismissable?: boolean }) {
  const ref = useRef<HTMLDivElement>(null); const opener = useRef<Element | null>(null);
  useEffect(() => {
    opener.current = document.activeElement; const el = ref.current!;
    const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('button,[href],input,textarea,select,[tabindex]:not([tabindex="-1"])')).filter(x => !x.hasAttribute('disabled'));
    (focusables()[0] || el).focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissable && onClose) { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') { const f = focusables(); if (!f.length) return; const first = f[0], last = f[f.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('keydown', key); (opener.current as HTMLElement | null)?.focus?.(); };
  }, []);
  return (
    <div className="backdrop" onMouseDown={e => { if (e.target === e.currentTarget && dismissable && onClose) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h2 style={{ fontFamily: 'var(--font-court)', fontSize: 'var(--fs-21)' }}>{title}</h2>
          {dismissable && onClose && <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>}
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusTag({ status }: { status: string }) {
  const cls = status === 'simplification' ? 'tag tag-sim' : 'tag tag-law';
  return <span className={cls}>{(STATUS_LABEL as any)[status] || 'REAL LAW'}</span>;
}

/** Three-layer law card: Simple → Legal rule → Source. */
export function LawCard({ law, lang, t, compact }: { law: any; lang: Lang; t: Strings; compact?: boolean }) {
  const [tab, setTab] = useState<'simple' | 'legal' | 'source'>('simple');
  const head = law.section ? `${law.actShort} §${law.section}` : law.actShort;
  return (
    <div style={{ background: 'var(--color-surface-raised)', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700 }}>{head} · {law.title}</span><StatusTag status={law.status} />
      </div>
      <div className="seg" role="tablist" aria-label={law.title}>
        {(['simple', 'legal', 'source'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} aria-pressed={tab === k} onClick={() => setTab(k)}>{k === 'simple' ? t.simple : k === 'legal' ? t.legalRule : t.source}</button>)}
      </div>
      {tab === 'simple' && <p>{law.simple[lang] || law.simple.en}</p>}
      {tab === 'legal' && <p className="muted" style={{ color: 'var(--color-ink)' }}>{law.legal.en}{law.punishment ? <><br /><b>Punishment:</b> {law.punishment}</> : null}</p>}
      {tab === 'source' && <p className="muted">{law.act}{law.section ? ', s.' + law.section : ''}. {law.source}{law.checkedAt ? ' · checked ' + law.checkedAt : ''}{law.inRealCourts ? <><br />{law.inRealCourts}</> : null}</p>}
      {!compact && law.here ? <p style={{ fontSize: 'var(--fs-14)' }}><b>In this case:</b> {law.here}</p> : null}
    </div>
  );
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => { const id = setTimeout(onDone, 2600); return () => clearTimeout(id); }, [text]);
  return <div className="toast" role="status">{text}</div>;
}

const SKIN = ['#F2C9A6', '#DDA77F', '#BE8058', '#93603F'];
const HAIR = ['#1B1420', '#2E1F18', '#4A2E1E', '#6B6470'];
const hashOf = (s: string) => { let h = 7; for (const ch of s || '') h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; };
/** Vector courtroom character (bust). Role sets the outfit; the name seeds skin, hair and face so every case looks different. */
export function Figure({ role, size, initials, name }: { role: string; size: number; initials: string; name?: string }) {
  const color = ({ judge: 'var(--color-judge)', pros: 'var(--color-prosecution)', def: 'var(--color-defence)', accused: 'var(--color-accused)', witness: 'var(--color-witness)' } as any)[role];
  const h = hashOf((name || '') + initials + role); const skin = SKIN[h % 4]; const hair = HAIR[(h >> 3) % 4]; const style = (h >> 5) % 4; const glasses = role === 'judge' ? (h >> 8) % 2 === 0 : (h >> 8) % 5 === 0;
  const robe = role === 'judge' || role === 'pros' || role === 'def';
  const cloth = role === 'witness' ? '#0F8A83' : role === 'accused' ? '#C8561C' : '#2C2742';
  const w = Math.round(size * 1.7);
  return (
    <div className="fig" style={{ ['--role' as any]: color }} aria-hidden="true">
      <svg width={w} height={Math.round(w * 1.1)} viewBox="0 0 100 110">
        <circle cx="50" cy="44" r="34" fill={color} opacity=".18" />
        {style === 1 && <path d="M29 40 Q28 78 36 84 L64 84 Q72 78 71 40 Z" fill={hair} />}
        <path d={'M10 110 Q10 78 34 72 L66 72 Q90 78 90 110 Z'} fill={cloth} />
        {robe && <><path d="M34 72 L50 100 L40 110 M66 72 L50 100 L60 110" fill="none" stroke="#45405E" strokeWidth="2" /><path d="M38 72 L50 94 L62 72 Z" fill="#F7F3EA" /><rect x="45.5" y="78" width="4" height="12" rx="1" fill="#fff" /><rect x="50.5" y="78" width="4" height="12" rx="1" fill="#fff" /></>}
        {role === 'judge' && <path d="M10 110 Q12 84 30 76 L34 110 Z M90 110 Q88 84 70 76 L66 110 Z" fill="#D6A84F" opacity=".85" />}
        {role === 'witness' && <path d="M44 72 L50 82 L56 72" fill="none" stroke="#0A5F5A" strokeWidth="2.5" />}
        {role === 'accused' && <path d="M40 72 L50 80 L60 72" fill="#9E4314" />}
        {(role === 'pros' || role === 'def') && <circle cx="70" cy="88" r="3" fill={color} />}
        <rect x="44" y="60" width="12" height="14" rx="5" fill={skin} />
        <ellipse cx="50" cy="44" rx="18" ry="21" fill={skin} />
        {style === 0 && <path d="M32 42 Q31 22 50 21 Q69 22 68 42 Q64 30 50 30 Q38 30 32 42 Z" fill={hair} />}
        {style === 1 && <path d="M32 46 Q30 21 50 21 Q70 21 68 46 Q66 30 56 29 Q46 34 34 36 Z" fill={hair} />}
        {style === 2 && <><circle cx="50" cy="20" r="8" fill={hair} /><path d="M32 42 Q31 23 50 23 Q69 23 68 42 Q62 31 50 31 Q38 31 32 42 Z" fill={hair} /></>}
        {style === 3 && <path d="M33 38 Q36 25 50 25 Q64 25 67 38 Q60 33 54 34 Q44 30 33 38 Z" fill={hair} opacity=".9" />}
        <g className="eyes"><ellipse cx="43" cy="45" rx="2.2" ry="2.6" fill="#1B1420" /><ellipse cx="57" cy="45" rx="2.2" ry="2.6" fill="#1B1420" /></g>
        <path d="M39 39 Q43 37 46 39 M54 39 Q57 37 61 39" stroke={hair} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {glasses && <g fill="none" stroke="#3B3754" strokeWidth="1.4"><circle cx="43" cy="45" r="5" /><circle cx="57" cy="45" r="5" /><path d="M48 45 L52 45" /></g>}
        <path d="M50 47 Q48 52 50 53" stroke="#00000033" strokeWidth="1.4" fill="none" />
        <ellipse className="mouth" cx="50" cy="57" rx="4.5" ry="1.6" fill="#7A3B32" />
      </svg>
    </div>
  );
}
export const initialsOf = (name: string) => (name || '?').replace(/^(PW\d+|DW\d+)\s*/, '').replace(/^(Shri|Smt\.?|Adv\.|SI|HC|Insp\.|Dr\.)\s*/, '').split(/[\s·,]+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
