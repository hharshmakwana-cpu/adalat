import React, { useEffect, useState } from 'react';
import { STR, ROLE_INFO, type Lang } from '../i18n';
import { LawCard } from '../components/ui';
import { api, audio } from '../lib/services';

const OUT: any = { full: { en: 'Guilty as charged', hi: 'आरोप के अनुसार दोषी' }, part: { en: 'Guilty of a lesser offence only', hi: 'केवल कम गंभीर अपराध का दोषी' }, acq: { en: 'Not guilty — benefit of doubt', hi: 'निर्दोष — संदेह का लाभ' } };

export default function Result({ lang, pub, view, role, skills, table, awards, onNext, onReplay, onHome, hasNext }: {
  lang: Lang; pub: any; view: any; role: string | null; skills: any; table?: any[]; awards?: any[]; onNext?: () => void; onReplay: () => void; onHome: () => void; hasNext: boolean }) {
  const t = STR[lang]; const rv = view.reveal || {}; const correct = rv.correct; const v = view.verdict?.v;
  const [review, setReview] = useState(''); const [rvState, setRv] = useState<'idle' | 'loading' | 'error'>('idle');
  useEffect(() => { audio.cue('result'); }, []);
  const reasons = String((rv.explain || {})[correct] || '').split(/(?<=[.।])\s+/).filter(Boolean);
  const missed = (view.myMoves || []).filter((m: any) => m.g < 2 && (m.better || m.why)).slice(0, 3);
  const keyLaw = pub.laws.find((l: any) => l.status !== 'simplification') || pub.laws[0];
  const sideLine = !role || role === 'witness' || role === 'accused' ? '' : role === 'judge' ? (v === correct ? t.winSide : t.loseSide)
    : ((role === 'pros') === (correct !== 'acq') ? t.winSide : t.loseSide);
  const getReview = async () => {
    setRv('loading');
    try { const r = await api('/api/adalat-ai/review', { caseTitle: pub.title, role, lang, moves: (view.myMoves || []).slice(0, 30).map((m: any) => ({ step: m.step, g: m.g, text: String(m.text).slice(0, 300) })) }); setReview(r.text); setRv('idle'); }
    catch { setRv('error'); }
  };
  return (
    <div className="wrap">
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }} aria-labelledby="h-judg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <span className="kicker">{t.judgment}</span>
          <h1 id="h-judg" className="court" style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.05 }}>{view.verdict ? view.verdict.text : OUT[correct]?.[lang]}</h1>
          <p className="muted">{lang === 'hi' ? 'पूरे साक्ष्य पर कानून के अनुसार सही परिणाम: ' : 'The legally correct result on the full evidence: '}<b style={{ color: 'var(--color-brass)' }}>{OUT[correct]?.[lang]}</b></p>
          {sideLine && <p>{sideLine}</p>}
        </div>
        <div style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 24 }}>
          <h2 className="kicker" style={{ color: 'var(--color-muted)', marginBottom: 8 }}>{t.reasoned}</h2>
          {reasons.map((r, i) => <div key={i} className="reason"><span className="d" style={{ background: 'var(--color-surface-high)' }}>{i + 1}</span><span>{r}</span></div>)}
          <span className="tag tag-sim" style={{ display: 'inline-block', marginTop: 12 }}>GAME SIMPLIFICATION · {lang === 'hi' ? 'काल्पनिक तथ्य' : 'fictional facts'}</span>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <span className="kicker">{t.caseConcluded}</span>
          <h2 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.performance}{role ? ' · ' + ROLE_INFO[role].name[lang] : ''}</h2>
          {skills ? <div className="bars">{Object.entries(skills.dims).filter(([, val]) => val !== null).map(([k, val]: any) => (
            <div key={k} className="barrow"><span>{(t.dims as any)[k]}</span><div className="bartrack" role="meter" aria-valuenow={val} aria-valuemin={0} aria-valuemax={100} aria-label={(t.dims as any)[k]}><span style={{ width: val + '%' }} /></div><span className="mono" style={{ textAlign: 'right' }}>{val}</span></div>))}
            <p className="muted">{lang === 'hi' ? 'कुल' : 'Overall'} <b style={{ color: 'var(--color-ink)' }}>{skills.overall ?? '—'}</b> · {'★'.repeat(skills.stars)}{'☆'.repeat(3 - skills.stars)}</p></div> : <p className="muted">{lang === 'hi' ? 'आपने दर्शक के रूप में देखा।' : 'You watched as a spectator.'}</p>}
          {table && table.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="kicker" style={{ color: 'var(--color-muted)' }}>{t.awards}</h3>
              {awards && awards.length ? awards.map((a: any) => { const p = table.find(x => x.id === a.playerId); return <div key={a.key} style={{ background: 'var(--color-surface)', borderRadius: 10, padding: 12, borderLeft: '3px solid ' + (p ? ROLE_INFO[p.role].color : 'var(--color-brass)') }}><b style={{ color: 'var(--color-brass)' }}>{a.title}</b> · {p ? p.name : ''}</div>; }) : <p className="muted">—</p>}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15 }}>
                <thead><tr style={{ textAlign: 'left', color: 'var(--color-muted)' }}><th>{t.player}</th><th>{t.role}</th><th style={{ textAlign: 'right' }}>{t.score}</th></tr></thead>
                <tbody>{table.map(p => <tr key={p.id} style={{ borderTop: '1px solid var(--color-line)' }}><td style={{ padding: '8px 0' }}>{p.name}</td><td>{ROLE_INFO[p.role].name[lang]}</td><td className="mono" style={{ textAlign: 'right' }}>{p.overall ?? '—'}</td></tr>)}</tbody>
              </table>
            </div>
          )}
        </div>
        <article className="doc" style={{ gap: 18 }}>
          <h2 className="court" style={{ fontSize: 'var(--fs-26)', color: 'var(--color-ink-dark)', textTransform: 'none', letterSpacing: 0 }}>Debrief</h2>
          {rv.lesson && <div><h3 style={{ fontSize: 13, letterSpacing: '.12em', color: 'var(--color-success)' }}>{t.learned.toUpperCase()}</h3><p style={{ fontWeight: 600 }}>{rv.lesson.title}</p><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{rv.lesson.points.map((p: string, i: number) => <li key={i}>{p}</li>)}</ul></div>}
          {keyLaw && <div style={{ color: 'var(--color-ink)' }}><h3 style={{ fontSize: 13, letterSpacing: '.12em', color: 'var(--color-primary)', marginBottom: 6 }}>{t.keyRule.toUpperCase()}</h3><LawCard law={keyLaw} lang={lang} t={t} compact /></div>}
          {missed.length > 0 && <div><h3 style={{ fontSize: 13, letterSpacing: '.12em', color: 'var(--color-danger)' }}>{t.missed.toUpperCase()}</h3>
            {missed.map((m: any, i: number) => <div key={i} style={{ borderTop: '1px solid var(--color-parchment-line)', paddingTop: 10, marginTop: 10 }}><p className="muted">“{m.text}”</p>{m.better && <p><b>{t.better}:</b> “{m.better}”</p>}{m.why && <p style={{ fontSize: 14 }}>{m.why}</p>}</div>)}</div>}
          {role && <div>{review ? <p style={{ fontFamily: 'var(--font-court)', fontSize: 17 }}>{review}</p> : <button className="btn btn-sm" style={{ borderColor: 'var(--color-ink-dark)', color: 'var(--color-ink-dark)' }} disabled={rvState === 'loading'} onClick={getReview}>{rvState === 'loading' ? t.reviewing : t.aiReview}</button>}{rvState === 'error' && <p className="err" style={{ color: 'var(--color-danger)' }}>{lang === 'hi' ? 'समीक्षा अभी उपलब्ध नहीं।' : 'Review is unavailable right now.'}</p>}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
            {hasNext && onNext && <button className="btn btn-primary" onClick={onNext}>{t.next} →</button>}
            <button className="btn" style={{ borderColor: 'var(--color-ink-dark)', color: 'var(--color-ink-dark)' }} onClick={onReplay}>{t.replay}</button>
            <button className="btn" style={{ borderColor: 'var(--color-ink-dark)', color: 'var(--color-ink-dark)' }} onClick={onHome}>{t.home}</button>
          </div>
        </article>
      </section>
    </div>
  );
}
