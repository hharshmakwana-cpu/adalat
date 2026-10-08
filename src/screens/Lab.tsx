import React, { useEffect, useRef, useState } from 'react';
import { STR, errText, type Lang } from '../i18n';
import { api, store, AppError } from '../lib/services';

export default function Lab({ lang, onReady, onBuiltin, onBack }: { lang: Lang; onReady: (c: any) => void; onBuiltin: () => void; onBack: () => void }) {
  const t = STR[lang];
  const [type, setType] = useState<'theft' | 'cyber' | 'cheating' | 'road'>('theft'); const [level, setLevel] = useState(1);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle'); const [step, setStep] = useState(0); const [err, setErr] = useState('');
  const ctl = useRef<AbortController | null>(null);
  useEffect(() => () => ctl.current?.abort(), []);
  useEffect(() => { if (state !== 'loading') return; const id = setInterval(() => setStep(s => Math.min(3, s + 1)), 4500); return () => clearInterval(id); }, [state]);
  const go = async () => {
    ctl.current?.abort(); const ac = new AbortController(); ctl.current = ac; setState('loading'); setStep(0); setErr('');
    try {
      const r = await api('/api/adalat-ai/generate-case', { type, level, lang, avoid: store.seen().slice(-15) }, { signal: ac.signal });
      if (ac.signal.aborted) return;
      const c = { ...r.case, id: 'AI-' + Date.now(), level, generated: true };
      store.addSeen((c.title + ' — ' + c.oneLine).slice(0, 160));
      onReady(c);
    } catch (e: any) { if (e && e.name === 'AbortError') return; setErr(e instanceof AppError ? e.code : 'UNKNOWN'); setState('error'); }
  };
  return (
    <div className="wrap" style={{ maxWidth: 820 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.labTitle}</h1></div>
      <p className="muted" style={{ fontSize: 'var(--fs-16)' }}>{t.labSub}</p>
      {state === 'loading' ? (
        <section aria-live="polite" style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h2 className="court" style={{ fontSize: 'var(--fs-26)' }}>{t.opening}</h2>
          {t.steps.map((s, i) => <span key={s} style={{ color: i < step ? 'var(--color-success-text)' : i === step ? 'var(--color-ink)' : 'var(--color-muted)' }}>{i < step ? '✓' : i === step ? '◐' : '○'} {s}{i === step ? '…' : ''}</span>)}
          <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => { ctl.current?.abort(); setState('idle'); }}>{t.cancel}</button>
        </section>
      ) : (
        <>
          <fieldset style={{ border: 0, padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <legend className="kicker" style={{ marginBottom: 10 }}>{t.caseType}</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {(Object.keys(t.types) as Array<keyof typeof t.types>).map(k => <button key={k} className="opt" style={{ gridTemplateColumns: '1fr' }} aria-pressed={type === k} onClick={() => setType(k as any)}>{t.types[k]}</button>)}
            </div>
          </fieldset>
          <div className="seg" role="group" aria-label={t.level}>{[1, 2, 3].map(n => <button key={n} aria-pressed={level === n} onClick={() => setLevel(n)}>{[t.beginner, t.standard, t.expert][n - 1]}</button>)}</div>
          <p className="muted" style={{ fontSize: 14 }}>{t.comingSoon}</p>
          {state === 'error' && <div role="alert" style={{ background: 'var(--color-surface)', borderTop: '4px solid var(--color-danger)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <b className="court" style={{ fontSize: 'var(--fs-21)' }}>{t.genFail}</b><span className="muted">{err === 'AI_INVALID' || err === 'RATE_LIMITED' ? errText(err, lang) : t.genFailSub}</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" onClick={go}>{lang === 'hi' ? 'फिर कोशिश करें' : 'Try again'}</button><button className="btn" onClick={onBuiltin}>{t.builtin}</button></div>
          </div>}
          {state !== 'error' && <button className="btn btn-primary btn-lg" onClick={go}>{t.generate}</button>}
        </>
      )}
    </div>
  );
}
