import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STEPS } from '../../shared/cases.js';
import { STR, PHASES, ROLE_INFO, errText, type Lang } from '../i18n';
import { Dialog, LawCard, Toast, Figure, initialsOf, useAnnounce } from '../components/ui';
import { audio, speech, listen, micSupported } from '../lib/services';

type Props = { pub: any; view: any; act: (m: any) => void; myRole: string | null; lang: Lang; voice: boolean; onFinished: () => void;
  tryAgain?: (() => void) | null; conn?: string; error?: string | null; spectator?: boolean; names?: Record<string, string> };

const ROLE_VAR: any = { judge: 'var(--color-judge)', pros: 'var(--color-prosecution)', def: 'var(--color-defence)', accused: 'var(--color-accused)', witness: 'var(--color-witness)', clerk: 'var(--color-clerk)' };
const clock = (ts: number) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function Court({ pub, view, act, myRole, lang, voice, onFinished, tryAgain, conn, error, spectator, names }: Props) {
  const t = STR[lang]; const say = useAnnounce();
  const [shown, setShown] = useState(view.log.length > 8 ? view.log.length - 1 : 0);
  const [tab, setTab] = useState<'transcript' | 'exhibits' | 'orders' | 'law' | 'timeline'>('transcript');
  const [sel, setSel] = useState<number | null>(null); const [text, setText] = useState(''); const [mode, setMode] = useState<'choose' | 'write'>('choose');
  const [moment, setMoment] = useState<any>(null); const [toast, setToast] = useState(''); const [sheet, setSheet] = useState<any>(null);
  const [now, setNow] = useState(Date.now()); const [mic, setMic] = useState<null | (() => void)>(null); const [micMsg, setMicMsg] = useState('');
  const seenMoments = useRef(new Set<string>()); const timedOut = useRef<number>(-1); const recRef = useRef<HTMLDivElement>(null); const nearBottom = useRef(true);

  // Reveal new record entries one at a time so the court "speaks" in order.
  const busy = shown < view.log.length;
  useEffect(() => {
    if (!busy) return;
    const next = view.log[shown]; const ms = next.kind === 'clerk' || next.kind === 'exhibit' ? 650 : Math.min(2600, 700 + String(next.text).length * 14);
    if (next.kind !== 'clerk') audio.cue('page');
    if (voice && next.kind !== 'clerk') speech.say(next.text, lang);
    say((next.who ? next.who + ': ' : '') + next.text);
    const id = setTimeout(() => setShown(s => s + 1), shown === 0 ? 300 : ms);
    return () => clearTimeout(id);
  }, [shown, view.log.length, busy]);
  useEffect(() => { if (shown > view.log.length) setShown(view.log.length); }, [view.log.length]);

  // Moments fire when the record reaches the entry they belong to.
  useEffect(() => {
    for (const m of view.moments || []) {
      const key = m.turnId + ':' + m.type + ':' + (m.id || ''); if (seenMoments.current.has(key)) continue;
      const at = view.log.findIndex((e: any) => e.turnId === m.turnId && e.kind !== 'clerk'); if (at >= 0 && shown <= at) continue;
      seenMoments.current.add(key);
      if (m.type === 'objection') { setMoment({ big: t.objection, color: 'var(--color-danger)', sub: m.ground === 'leading' ? (lang === 'hi' ? 'सूचक प्रश्न' : 'Leading question') : '' }); audio.cue('objection'); say(t.objection, true); }
      else if (m.type === 'sustained' || m.type === 'overruled') { setToast(m.type === 'sustained' ? t.sustained : t.overruled); audio.cue('ruling'); say(m.type === 'sustained' ? t.sustained : t.overruled, true); }
      else if (m.type === 'adjourned') { setMoment({ big: t.adjourned, color: 'var(--color-brass)', sub: '' }); audio.cue('ruling'); }
      else if (m.type === 'refused') setToast(t.refused);
      else if (m.type === 'exhibit') { setToast('Exhibit ' + m.id + ' ' + t.exhibitMarked); audio.cue('exhibit'); }
      else if (m.type === 'judgment') { setMoment({ big: t.judgment, color: 'var(--color-brass)', sub: '' }); audio.cue('judgment'); }
      else if (m.type === 'feedback' && m.role === myRole) audio.cue(m.g === 2 ? 'good' : 'weak');
    }
  }, [shown, view.moments]);
  useEffect(() => { if (!moment) return; const id = setTimeout(() => setMoment(null), 1700); return () => clearTimeout(id); }, [moment]);

  // Timer: server/engine owns the deadline; we only render it and ask for TIMEOUT once.
  useEffect(() => { if (!view.deadlineAt) return; const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, [view.deadlineAt]);
  const left = view.deadlineAt ? Math.max(0, Math.ceil((view.deadlineAt - now) / 1000)) : null;
  const total = view.level === 3 ? 60 : 90;
  const tState = left === null ? 'normal' : left <= 10 ? 'critical' : left <= total * 0.3 ? 'warning' : 'normal';
  useEffect(() => {
    if (left === null || !view.turn?.mine || busy) return;
    if (left <= 5 && left > 0) audio.cue('tick');
    if (left === 10 || left === 5) say(left + ' ' + t.timeLeft, true);
    if (left === 0 && timedOut.current !== view.turnId) { timedOut.current = view.turnId; act({ type: 'TIMEOUT' }); }
  }, [left]);

  useEffect(() => { setSel(null); setText(''); setMode('choose'); mic && mic(); setMic(null); }, [view.turnId]);
  useEffect(() => () => { speech.stop(); mic && mic(); }, []);
  useEffect(() => { const el = recRef.current; if (el && nearBottom.current) el.scrollTop = el.scrollHeight; }, [shown, tab]);

  const visible = view.log.slice(0, shown);
  const lastTalk = [...visible].reverse().find((e: any) => e.kind === 'talk' || e.kind === 'order');
  const turn = view.turn; const mine = !!turn && turn.mine && !busy && !spectator;
  const activeRole = busy ? (view.log[shown]?.role) : turn?.role;
  const myLast = view.myMoves[view.myMoves.length - 1];
  const fbVisible = myLast && visible.some((e: any) => e.turnId === myLast.turnId);
  const stepInfo = turn && (STEPS as any)[turn.step]; const concept = stepInfo ? stepInfo[lang] || stepInfo.en : null;
  const witnessName = turn?.w || [...visible].reverse().find((e: any) => e.role === 'witness')?.who || (lang === 'hi' ? 'गवाह कटघरा' : 'Witness box');
  const seatName = (r: string) => r === 'witness' ? witnessName : (names && names[r]) || pub.names[r] || ROLE_INFO[r].name[lang];
  const canSubmit = mine && (mode === 'write' ? text.trim().length >= 3 : sel !== null && !turn.options[sel]?.disabled);
  const submit = () => { if (!canSubmit) return; act(mode === 'write' ? { type: 'SUBMIT_TEXT', text: text.trim() } : { type: 'CHOOSE', index: sel }); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (!mine || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      const n = parseInt(e.key, 10); if (n >= 1 && n <= (turn?.options.length || 0)) { setMode('choose'); setSel(n - 1); }
      if (e.key === 'Enter') submit();
      if (e.key.toLowerCase() === 'r') setTab('transcript'); if (e.key.toLowerCase() === 'e') setTab('exhibits');
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const toggleMic = () => {
    if (mic) { mic(); setMic(null); return; }
    setMode('write'); setMicMsg('');
    const stop = listen(lang, s => setText(x => (x ? x + ' ' : '') + s), err => { setMic(null); if (err === 'denied') setMicMsg(lang === 'hi' ? 'माइक्रोफ़ोन की अनुमति नहीं — आप लिख सकते हैं।' : 'Microphone blocked — you can type instead.'); else if (err === 'busy') setMicMsg(lang === 'hi' ? 'माइक्रोफ़ोन व्यस्त है।' : 'Microphone is busy.'); else if (err === 'network') setMicMsg(lang === 'hi' ? 'आवाज़ पहचान में नेटवर्क समस्या।' : 'Voice input had a network problem.'); });
    if (stop) setMic(() => stop);
  };

  const fbStyle = (g: number) => ({ ['--c' as any]: g === 2 ? 'var(--color-success)' : g === 1 ? 'var(--color-warning)' : 'var(--color-danger)', ['--t' as any]: g === 2 ? 'var(--color-success-text)' : g === 1 ? 'var(--color-warning-text)' : 'var(--color-danger-text)' });
  const orders = visible.filter((e: any) => e.kind === 'order' || e.kind === 'exhibit');

  return (
    <div className="wrap" style={{ gap: 16 }}>
      {conn && conn !== 'connected' && <div className="banner" role="status">{conn === 'lost' ? errText('NET', lang) : conn === 'reconnecting' ? (lang === 'hi' ? 'फिर से जुड़ रहे हैं… आपकी सीट सुरक्षित है।' : 'Reconnecting… your seat is held and nothing you typed is lost.') : t.resuming}</div>}
      <header className="hud">
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <h1 className="court" style={{ fontSize: 'var(--fs-18)' }}>{pub.title}</h1>
          <span className="muted" style={{ fontSize: 'var(--fs-13)' }}>Court No. 4 · {[t.beginner, t.standard, t.expert][view.level - 1]} · {PHASES[lang][view.ph]}</span>
        </div>
        <ol className="steps" aria-label="Trial stages">{PHASES[lang].map((p, i) => <li key={p} data-done={i <= view.ph} aria-current={i === view.ph ? 'step' : undefined} title={p}><span className="sr-only">{p}</span></li>)}</ol>
        {left !== null && <span className="timer" data-state={tState} aria-label={left + ' ' + t.timeLeft}>{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
      </header>

      <div className="court-grid">
        <main style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          <section className="arena" aria-label="Courtroom">
            <div className="seat" data-active={activeRole === 'judge'} style={{ ['--role' as any]: ROLE_VAR.judge }}>
              <span className="speaking">{myRole === 'judge' && !busy && turn?.role === 'judge' ? t.yourTurn : t.speaking}</span>
              <Figure role="judge" size={46} initials={initialsOf(seatName('judge'))} />
              <div className="bench"><div style={{ fontSize: 13, fontWeight: 600 }}>{seatName('judge')}{myRole === 'judge' ? ' · ' + (lang === 'hi' ? 'आप' : 'You') : ''}</div><div className="kicker" style={{ fontSize: 10 }}>COURT NO. 4 · BENCH</div></div>
            </div>
            <div className="seats-row">
              {(['pros', 'witness', 'accused', 'def'] as const).map(r => (
                <div key={r} className="seat" data-active={activeRole === r} style={{ ['--role' as any]: ROLE_VAR[r] }}>
                  <span className="speaking">{myRole === r && !busy && turn?.role === r ? t.yourTurn : t.speaking}</span>
                  <Figure role={r} size={r === 'witness' ? 40 : 32} initials={initialsOf(seatName(r))} />
                  <div className="desk"><div className="r">{ROLE_INFO[r].name[lang]}</div><div className="n">{seatName(r)}{myRole === r ? ' · ' + (lang === 'hi' ? 'आप' : 'You') : ''}</div></div>
                </div>
              ))}
            </div>
            {concept && <button className="concept" onClick={() => setSheet({ kind: 'step', title: concept[0], text: concept[1] })}><span className="kicker" aria-hidden="true">?</span><span><u>{concept[0]}</u> — {concept[1].split('.')[0]}.</span></button>}
          </section>

          {lastTalk && <div className="bubble" key={lastTalk.ts + lastTalk.text.slice(0, 8)}><span className="who" style={{ color: ROLE_VAR[lastTalk.role] }}>{lastTalk.who}</span>{lastTalk.text}</div>}

          {fbVisible && myLast && !busy && (
            <div className="fb" style={fbStyle(myLast.g)} role="status">
              <b>{myLast.g === 2 ? '✓ ' + t.strong : myLast.g === 1 ? '! ' + t.okay : '✕ ' + t.weak} · {myLast.g === 2 ? '+2' : myLast.g === 1 ? '+1' : '0'} {(t.dims as any)[myLast.dim] || ''}</b>
              {myLast.why && <span><b style={{ color: 'inherit' }}>{t.why}:</b> {myLast.why}</span>}
              {myLast.better && <span><b style={{ color: 'inherit' }}>{t.better}:</b> “{myLast.better}”</span>}
              {tryAgain && <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={tryAgain}>{t.tryAgain}</button>}
            </div>
          )}

          {!spectator && (
            <form className="dock" onSubmit={e => { e.preventDefault(); submit(); }} aria-label="Your actions">
              {view.status === 'done' && !busy ? (
                <button type="button" className="btn btn-primary btn-lg" onClick={onFinished}>{t.judgment} →</button>
              ) : mine ? (
                <>
                  <span className="kicker" style={{ color: ROLE_VAR[turn.role] }}>{t.yourTurn}</span>
                  <p style={{ fontSize: 'var(--fs-18)', fontWeight: 600 }}>{turn.prompt}</p>
                  {mode === 'choose' && (
                    <div className="opts" role="group" aria-label={t.choose}>
                      {turn.options.map((o: any, i: number) => (
                        <button type="button" key={i} className="opt" aria-pressed={sel === i} disabled={o.disabled} onClick={() => setSel(i)}>
                          <span className="key" aria-hidden="true">{i + 1}</span><span>{o.t}{o.disabled ? ' (' + (lang === 'hi' ? 'स्थगन सीमा पूरी' : 'adjournment limit reached') + ')' : ''}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {turn.free && (mode === 'write' ? (
                    <>
                      <label className="sr-only" htmlFor="composer">{t.typeOwn}</label>
                      <textarea id="composer" className="composer" maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder={turn.prompt} />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {pub.exhibits.filter((x: any) => view.marked.includes(x[0])).map((x: any) => <button type="button" key={x[0]} className="chip" onClick={() => setText(s => (s ? s + ' ' : '') + x[0])}>{x[0]}</button>)}
                        {micSupported && <button type="button" className="btn btn-sm" onClick={toggleMic} aria-pressed={!!mic}>{mic ? (lang === 'hi' ? '● सुन रहे हैं — रोकें' : '● Listening — stop') : '🎙 ' + (lang === 'hi' ? 'बोलें' : 'Speak')}</button>}
                        <button type="button" className="btn btn-sm" onClick={() => setMode('choose')}>{t.choose}</button>
                        <span className="muted mono" style={{ fontSize: 12, marginLeft: 'auto' }}>{text.length > 450 ? text.length + '/600' : ''}</span>
                      </div>
                      {micMsg && <span className="err">{micMsg}</span>}
                    </>
                  ) : <button type="button" className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setMode('write')}>✎ {t.typeOwn}</button>)}
                  <button type="submit" className="btn btn-primary" disabled={!canSubmit}>{t.ask} ↵</button>
                </>
              ) : (
                <p className="muted" role="status">{busy ? '…' : turn ? seatName(turn.role) + ' ' + t.waiting : '…'}</p>
              )}
              {error && <span className="err" role="alert">{errText(error, lang)}</span>}
            </form>
          )}
        </main>

        <aside className="record" aria-label={t.record}>
          <div className="tabs" role="tablist">
            {(['transcript', 'exhibits', 'orders', 'law', 'timeline'] as const).map(k => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{k === 'transcript' ? t.transcript : k === 'exhibits' ? t.exhibits : k === 'orders' ? t.orders : k === 'law' ? t.law : t.timeline}</button>)}
          </div>
          <div className="panel" ref={recRef} role="tabpanel" onScroll={e => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
            {tab === 'transcript' && (visible.length ? visible.map((e: any, i: number) => (
              <div key={i} className="entry" data-kind={e.kind} style={{ ['--role' as any]: ROLE_VAR[e.role] }}>
                <span className="t">{clock(e.ts)}</span>
                <div><div className="w">{e.who}</div><div className="x">{e.text}</div></div>
              </div>)) : <p className="muted">{t.noRecord}</p>)}
            {tab === 'orders' && (orders.length ? orders.map((e: any, i: number) => <div key={i} className="entry" data-kind={e.kind}><span className="t">{clock(e.ts)}</span><div className="x">{e.text}</div></div>) : <p className="muted">{t.noRecord}</p>)}
            {tab === 'exhibits' && (pub.exhibits.length ? pub.exhibits.map((x: any) => {
              const on = view.marked.includes(x[0]);
              return <div key={x[0]} className="slip"><span className="stamp" style={{ color: on ? 'var(--color-success)' : 'var(--color-muted-dark)' }}>{on ? t.marked : t.notMarked}</span>
                <span className="mono" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{x[0]}</span><b>{x[1]}</b><span style={{ fontSize: 14, color: 'var(--color-muted-dark)' }}>{x[2]}</span>
                <div style={{ display: 'flex', gap: 6 }}><button className="btn btn-sm" style={{ borderColor: 'var(--color-ink-dark)', color: 'var(--color-ink-dark)' }} onClick={() => setSheet({ kind: 'exhibit', x, on })}>{lang === 'hi' ? 'देखें' : 'View'}</button>
                  {on && mine && turn.free && <button className="btn btn-sm" style={{ borderColor: 'var(--color-ink-dark)', color: 'var(--color-ink-dark)' }} onClick={() => { setMode('write'); setText(s => (s ? s + ' ' : '') + x[0]); }}>{lang === 'hi' ? 'प्रश्न में जोड़ें' : 'Use in question'}</button>}</div>
              </div>; }) : <p className="muted">{t.noExhibits}</p>)}
            {tab === 'law' && pub.laws.map((l: any) => <LawCard key={l.id} law={l} lang={lang} t={t} />)}
            {tab === 'timeline' && pub.timeline.map(([w, x]: any, i: number) => <div key={i} className="entry"><span className="t" style={{ gridColumn: '1 / -1', fontSize: 13 }}>{w}</span><div style={{ gridColumn: '1 / -1' }}>{x}</div></div>)}
          </div>
        </aside>
      </div>

      {moment && <div className="moment" onClick={() => setMoment(null)} role="alert"><div><div className="big">{moment.big}</div><div className="bar" style={{ ['--c' as any]: moment.color }} />{moment.sub && <p style={{ textAlign: 'center', marginTop: 12, fontSize: 'var(--fs-18)' }}>{moment.sub}</p>}</div></div>}
      {toast && <Toast text={toast} onDone={() => setToast('')} />}
      {sheet && sheet.kind === 'step' && <Dialog title={sheet.title} onClose={() => setSheet(null)}><p>{sheet.text}</p><span className="tag tag-sim" style={{ alignSelf: 'flex-start' }}>GAME SIMPLIFICATION</span></Dialog>}
      {sheet && sheet.kind === 'exhibit' && <Dialog title={sheet.x[0] + ' · ' + sheet.x[1]} onClose={() => setSheet(null)}><div className="slip"><span className="stamp" style={{ color: sheet.on ? 'var(--color-success)' : 'var(--color-muted-dark)' }}>{sheet.on ? t.marked : t.notMarked}</span><p style={{ paddingTop: 18 }}>{sheet.x[2]}</p></div><span className="tag tag-fic" style={{ alignSelf: 'flex-start' }}>FICTIONAL FACTS</span></Dialog>}
    </div>
  );
}
