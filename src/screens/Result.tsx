import React, { useEffect, useState } from 'react';
import { STR, ROLE_INFO, type Lang } from '../i18n';
import { LawCard } from '../components/ui';
import { api, audio } from '../lib/services';
import { G, ROLE_GAME, starsFor, firstSentence } from '../game/presentation';

const OUT: any = { full: { en: 'Guilty as charged', hi: 'आरोप के अनुसार दोषी' }, part: { en: 'Guilty of a lesser offence only', hi: 'केवल कम गंभीर अपराध का दोषी' }, acq: { en: 'Not guilty — benefit of doubt', hi: 'निर्दोष — संदेह का लाभ' } };

export default function Result({ lang, pub, view, role, skills, table, awards, onNext, onReplay, onHome, hasNext, nextLabel }: {
  lang: Lang; pub: any; view: any; role: string | null; skills: any; table?: any[]; awards?: any[]; onNext?: () => void; onReplay: () => void; onHome: () => void; hasNext: boolean; nextLabel?: string }) {
  const t = STR[lang]; const g = G[lang]; const rv = view.reveal || {}; const correct = rv.correct;
  const score = skills?.overall ?? null; const stars = starsFor(score); const won = (score ?? 0) >= 65;
  const [shown, setShown] = useState(0); const [review, setReview] = useState(''); const [rvState, setRv] = useState<'idle' | 'loading' | 'error'>('idle');
  useEffect(() => { audio.cue('result'); const ids = [1, 2, 3].map(n => setTimeout(() => setShown(n), 220 * n)); return () => ids.forEach(clearTimeout); }, []);
  const lesson = rv.lesson?.points?.[0] || rv.lesson?.title || firstSentence((rv.explain || {})[correct] || '');
  const missed = (view.myMoves || []).filter((m: any) => m.g < 2 && (m.better || m.why)).slice(0, 3);
  const keyLaw = pub.laws.find((l: any) => l.status !== 'simplification') || pub.laws[0];
  const getReview = async () => {
    setRv('loading');
    try { const r = await api('/api/adalat-ai/review', { caseTitle: pub.title, role, lang, moves: (view.myMoves || []).slice(0, 30).map((m: any) => ({ step: m.step, g: m.g, text: String(m.text).slice(0, 300) })) }); setReview(r.text); setRv('idle'); }
    catch { setRv('error'); }
  };
  return (
    <div className="wrap" style={{ maxWidth: 720, alignItems: 'stretch' }}>
      <section className="win" aria-labelledby="h-win">
        <span className="win-i" aria-hidden="true">{won ? '🏆' : '💪'}</span>
        <h1 id="h-win">{role ? (won ? g.youWon : g.goodTry) : t.caseConcluded}</h1>
        {score !== null && <span className="win-score mono">{score}</span>}
        <span className="stars big" aria-label={stars + ' of 3 stars'}>{[0, 1, 2].map(i => <span key={i} data-on={i < stars && shown > i}>★</span>)}</span>
        <p className="muted">⚖️ {view.verdict ? view.verdict.text : OUT[correct]?.[lang]}</p>
      </section>

      {lesson && <section className="lesson"><span className="kicker">💡 {g.lesson}</span><p>{lesson}</p></section>}

      <div className="win-acts">
        {hasNext && onNext && <button className="btn btn-primary btn-lg" onClick={onNext}>▶ {nextLabel || g.nextLevel}</button>}
        <button className={'btn btn-lg' + (hasNext ? '' : ' btn-primary')} onClick={onReplay}>↺ {g.again}</button>
        <button className="btn" onClick={onHome}>{g.home}</button>
      </div>

      {table && table.length > 0 && (
        <section className="mp-table">
          {awards && awards.map((a: any) => { const p = table.find(x => x.id === a.playerId); return <div key={a.key} className="award">🏅 <b>{a.title}</b> · {p ? p.name : ''}</div>; })}
          {table.map(p => <div key={p.id} className="mp-row" style={{ ['--role' as any]: ROLE_INFO[p.role].color }}><span>{ROLE_GAME[p.role].icon} {p.name}</span><span className="muted">{ROLE_GAME[p.role].name[lang]}</span><span className="mono">{p.overall ?? '—'}</span></div>)}
        </section>
      )}

      <details className="more">
        <summary>{g.details}</summary>
        {skills && <div className="bars">{Object.entries(skills.dims).filter(([, v]) => v !== null).map(([k, v]: any) => (
          <div key={k} className="barrow"><span>{(t.dims as any)[k]}</span><div className="bartrack" role="meter" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100} aria-label={(t.dims as any)[k]}><span style={{ width: v + '%' }} /></div><span className="mono" style={{ textAlign: 'right' }}>{v}</span></div>))}</div>}
        <h3 className="kicker">{t.reasoned}</h3>
        <p>{(lang === 'hi' ? 'सही परिणाम: ' : 'Correct result: ') + (OUT[correct]?.[lang] || '')}</p>
        <p className="muted">{(rv.explain || {})[correct]}</p>
        {missed.length > 0 && <><h3 className="kicker">{t.missed}</h3>{missed.map((m: any, i: number) => <div key={i} className="missed"><p className="muted">“{m.text}”</p>{m.better && <p><b>{t.better}:</b> “{m.better}”</p>}</div>)}</>}
        {keyLaw && <><h3 className="kicker">{t.keyRule}</h3><LawCard law={keyLaw} lang={lang} t={t} compact /></>}
        {role && (review ? <p className="court" style={{ fontSize: 17 }}>{review}</p> : <button className="btn btn-sm" disabled={rvState === 'loading'} onClick={getReview}>{rvState === 'loading' ? t.reviewing : t.aiReview}</button>)}
        {rvState === 'error' && <p className="err">{lang === 'hi' ? 'समीक्षा अभी उपलब्ध नहीं।' : 'Review is unavailable right now.'}</p>}
      </details>
    </div>
  );
}
