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

export function Figure({ role, size, initials }: { role: string; size: number; initials: string }) {
  const color = ({ judge: 'var(--color-judge)', pros: 'var(--color-prosecution)', def: 'var(--color-defence)', accused: 'var(--color-accused)', witness: 'var(--color-witness)' } as any)[role];
  return <div className="fig" style={{ ['--role' as any]: color, ['--s' as any]: size + 'px' }} aria-hidden="true"><div className="h">{initials}</div><div className="b" /></div>;
}
export const initialsOf = (name: string) => (name || '?').replace(/^(PW\d+|DW\d+)\s*/, '').replace(/^(Shri|Smt\.?|Adv\.|SI|HC|Insp\.|Dr\.)\s*/, '').split(/[\s·,]+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
