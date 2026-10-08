import React, { useEffect, useMemo, useRef, useState } from 'react';
import { STEPS } from '../../shared/cases.js';
import { LEVELS } from '../../shared/engine.js';
import { type Lang, errText } from '../i18n';
import { Dialog, LawCard, Figure, initialsOf, useAnnounce } from '../components/ui';
import { STR } from '../i18n';
import { audio, speech, listen, micSupported } from '../lib/services';
import { G, ROLE_GAME, LEVEL_GAME, STEP_GAME, stepHead, stepTerm, firstSentence, clueIcon } from '../game/presentation';

type Props = { pub: any; view: any; act: (m: any) => any; myRole: string | null; lang: Lang; voice: boolean; onFinished: () => void; onExit: () => void; pace?: number;
  tryAgain?: (() => void) | null; conn?: string; error?: string | null; spectator?: boolean; names?: Record<string, string>; sending?: boolean };

const ROLE_VAR: any = { judge: 'var(--color-judge)', pros: 'var(--color-prosecution)', def: 'var(--color-defence)', accused: 'var(--color-accused)', witness: 'var(--color-witness)', clerk: 'var(--color-clerk)' };
const SEATS = ['pros', 'witness', 'accused', 'def'] as const;

/**
 * Game state (view) is authoritative and ALWAYS immediately playable.
 * Everything in this component's local state is presentation only: which entry is "new", which overlay shows, which drawer is open.
 * No animation, sound or speech ever gates input.
 */
export default function Court({ pub, view, act, myRole, lang, voice, onFinished, onExit, tryAgain, conn, error, spectator, names, sending, pace = 1 }: Props) {
  const g = G[lang]; const t = STR[lang]; const say = useAnnounce();
  const [sel, setSel] = useState<number | null>(null); const [text, setText] = useState(''); const [writing, setWriting] = useState(false);
  const [fx, setFx] = useState<any>(null); const [sheet, setSheet] = useState<null | 'clues' | 'learn' | 'record' | 'why' | { clue: any }>(null);
  const [aiPill, setAiPill] = useState(''); const [flash, setFlash] = useState<string | null>(null);
  const [left, setLeft] = useState<number | null>(null); const [mic, setMic] = useState<null | (() => void)>(null);
  const lastLen = useRef(view.log.length); const seenMoments = useRef(new Set<string>()); const timedOut = useRef(-1); const spokeTurn = useRef(-1);

  const turn = view.turn; const playing = !!beat; const mine = !!turn && turn.mine && !spectator && view.status === 'court' && !playing;
  const busy = !!sending;

  // New log entries are played back as "story beats" so the player can follow what others did.
  // Beats are presentation only: the authoritative state is already updated; the player can tap Next / Skip anytime.
  const [beats, setBeats] = useState<any[]>([]); const [bi, setBi] = useState(0);
  const beat = bi < beats.length ? beats[bi] : null;
  const fresh = view.log.length - lastLen.current;
  useEffect(() => {
    const batch = view.log.slice(lastLen.current); const first = lastLen.current === 0; lastLen.current = view.log.length;
    if (!batch.length) return;
    const show = batch.filter((e: any) => (e.kind === 'talk' || e.kind === 'order' || e.kind === 'exhibit' || (e.kind === 'clerk' && /witness box|adjourned/i.test(e.text))) && !(e.role === myRole && e.kind !== 'clerk'));
    if (pace > 0 && show.length && !(first && show.length > 6)) { setBeats(show); setBi(0); }
    const last = batch[batch.length - 1]; say((last.who ? last.who + ': ' : '') + last.text);
  }, [view.log.length]);
  useEffect(() => {
    if (!beat) return;
    if (voice && beat.kind !== 'clerk') speech.say(beat.text, lang);
    if (beat.kind !== 'clerk') audio.cue('page');
    const ms = Math.min(5200, 1500 + String(beat.text).length * 32) * pace;
    const id = setTimeout(() => setBi(i => i + 1), ms); return () => clearTimeout(id);
  }, [bi, beats]);
  const skipBeats = () => { speech.stop(); setBi(beats.length); };
  useEffect(() => { if (!aiPill) return; const id = setTimeout(() => setAiPill(''), 900); return () => clearTimeout(id); }, [aiPill]);
  useEffect(() => { if (!flash) return; const id = setTimeout(() => setFlash(null), 700); return () => clearTimeout(id); }, [flash]);

  // Moments → short, non-blocking effects (pointer-events: none). Only judgment is larger.
  useEffect(() => {
    const upto = beat ? Math.max(-1, ...beats.slice(0, bi + 1).map((b: any) => b.turnId ?? -1)) : Infinity;
    for (const m of view.moments || []) {
      const key = m.turnId + ':' + m.type + ':' + (m.id || ''); if (seenMoments.current.has(key)) continue;
      if (m.turnId > upto) continue; // wait until the story reaches this moment
      seenMoments.current.add(key);
      if (m.type === 'objection') { setFx({ k: key, big: t.objection, tone: 'danger' }); audio.cue('objection'); say(t.objection, true); }
      else if (m.type === 'sustained' || m.type === 'overruled') { setFx({ k: key, big: m.type === 'sustained' ? t.sustained : t.overruled, tone: 'brass' }); audio.cue('ruling'); }
      else if (m.type === 'exhibit') { setFx({ k: key, big: clueIcon((pub.exhibits.find((x: any) => x[0] === m.id) || [])[1]) + ' ' + m.id, sub: lang === 'hi' ? 'सुराग मिला' : 'Clue found', tone: 'brass' }); audio.cue('exhibit'); }
      else if (m.type === 'adjourned') setFx({ k: key, big: t.adjourned, tone: 'brass' });
      else if (m.type === 'judgment') { setFx({ k: key, big: t.judgment, tone: 'brass', major: true }); audio.cue('judgment'); }
      else if (m.type === 'feedback' && m.role === myRole) audio.cue(m.g === 2 ? 'good' : 'weak');
    }
  }, [view.moments, bi, beats]);
  useEffect(() => { if (!fx) return; const id = setTimeout(() => setFx(null), fx.major ? 1100 : 650); return () => clearTimeout(id); }, [fx]);

  // Timer at 1 s resolution. The engine/server owns the deadline; we only render and request TIMEOUT once.
  useEffect(() => {
    if (!view.deadlineAt) { setLeft(null); return; }
    const tick = () => setLeft(Math.max(0, Math.ceil((view.deadlineAt - Date.now()) / 1000)));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [view.deadlineAt]);
  const total = (LEVELS as any)[view.level]?.timer || 45;
  const tState = left === null ? 'normal' : left <= 5 ? 'critical' : left <= total * 0.3 ? 'warning' : 'normal';
  useEffect(() => {
    if (left === null || !mine) return;
    if (left <= 5 && left > 0) audio.cue('tick');
    if (left === 10 || left === 5) say(left + ' ' + t.timeLeft, true);
    if (left === 0 && timedOut.current !== view.turnId) { timedOut.current = view.turnId; act({ type: 'TIMEOUT' }); }
  }, [left]);

  // New turn: reset selection; optional voice reads ONLY the line that set up this decision.
  useEffect(() => {
    setSel(null); setText(''); setWriting(false); mic && mic(); setMic(null);
    if (mine) { audio.cue('page'); if (voice && spokeTurn.current !== view.turnId) { spokeTurn.current = view.turnId; const l = [...view.log].reverse().find((e: any) => e.kind === 'talk'); if (l) speech.say(l.text, lang); } }
  }, [view.turnId]);
  useEffect(() => () => { speech.stop(); mic && mic(); }, []);

  const lastTalkReal = useMemo(() => [...view.log].reverse().find((e: any) => e.kind === 'talk' || e.kind === 'order'), [view.log.length]);
  const lastTalk = beat || lastTalkReal;
  const recent = useMemo(() => { const v = view.log.filter((e: any) => e.kind !== 'clerk'); const end = beat ? Math.max(0, v.indexOf(beat)) : v.length - 1; return v.slice(Math.max(0, end - 2), end); }, [view.log.length, beat]);
  const myLast = view.myMoves[view.myMoves.length - 1];
  const showFb = !!myLast && view.turnId > myLast.turnId && !(mine && sel !== null);
  const witnessName = turn?.w || [...view.log].reverse().find((e: any) => e.role === 'witness')?.who || ROLE_GAME.witness.name[lang];
  const seatName = (r: string) => r === 'witness' ? witnessName : (names && names[r]) || pub.names[r] || ROLE_GAME[r].name[lang];
  const active = beat ? beat.role : (flash || turn?.role);
  const expert = view.level === 3;
  const canSubmit = mine && !busy && (writing ? text.trim().length >= 3 : sel !== null && !turn.options[sel]?.disabled);
  const submit = (i?: number) => {
    if (!mine || busy) return;
    if (typeof i === 'number') { if (turn.options[i]?.disabled) return; setSel(i); act({ type: 'CHOOSE', index: i }); return; }
    if (writing && text.trim().length >= 3) act({ type: 'SUBMIT_TEXT', text: text.trim() });
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (playing && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setBi(i => i + 1); return; }
      if (!mine || (e.target as HTMLElement)?.tagName === 'TEXTAREA' || sheet) return;
      const n = parseInt(e.key, 10); if (n >= 1 && n <= (turn?.options.length || 0)) submit(n - 1);
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });
  const toggleMic = () => {
    if (mic) { mic(); setMic(null); return; }
    setWriting(true);
    const stop = listen(lang, s => setText(x => (x ? x + ' ' : '') + s), () => setMic(null));
    if (stop) setMic(() => stop);
  };
  const concept = turn && (STEPS as any)[turn.step]; const conceptText = concept ? (concept[lang] || concept.en) : null;
  const fbTone = myLast ? (myLast.g === 2 ? 'good' : myLast.g === 1 ? 'ok' : 'weak') : 'ok';

  return (
    <div className="g-wrap">
      <header className="g-hud">
        <button className="icon-btn" onClick={onExit} aria-label={g.exit}>✕</button>
        <div className="g-hud-mid">
          <span className="g-level">{LEVEL_GAME[view.level]?.icon} {g.level} {view.level}</span>
          <ol className="g-progress" aria-label="Progress">{[0, 1, 2, 3, 4, 5].map(i => <li key={i} data-on={i <= view.ph} aria-current={i === view.ph ? 'step' : undefined} />)}</ol>
        </div>
        {conn && conn !== 'connected' ? <span className="g-conn" role="status">○ {g.reconnecting}</span> : conn ? <span className="g-conn ok">● {g.connected}</span> : <span />}
        {left !== null && <span className="timer" data-state={tState} aria-label={left + ' ' + t.timeLeft}>{left}s</span>}
      </header>

      <section className="scene" aria-label="Courtroom">
        <div className="scene-light" aria-hidden="true" />
        <div className="char judge" data-active={active === 'judge'} style={{ ['--role' as any]: ROLE_VAR.judge }}>
          <Figure role="judge" size={52} initials={initialsOf(seatName('judge'))} name={seatName('judge')} />
          <div className="bench-top" /><span className="char-name">{seatName('judge')}{myRole === 'judge' ? ' · ' + (lang === 'hi' ? 'आप' : 'You') : ''}</span>
        </div>
        <div className="scene-row">
          {SEATS.map(r => (
            <div key={r} className={'char ' + r} data-active={active === r} style={{ ['--role' as any]: ROLE_VAR[r] }}>
              <Figure role={r} size={r === 'witness' ? 42 : 36} initials={initialsOf(seatName(r))} name={seatName(r)} />
              <span className="char-name">{myRole === r ? (lang === 'hi' ? 'आप' : 'You') : ROLE_GAME[r].name[lang]}</span>
            </div>
          ))}
        </div>
        {aiPill && <div className="ai-pill" role="status">{aiPill}</div>}
        {fx && <div key={fx.k} className={'fx ' + fx.tone + (fx.major ? ' major' : '')} aria-hidden="true" onClick={() => setFx(null)}><b>{fx.big}</b>{fx.sub && <span>{fx.sub}</span>}</div>}
      </section>

      <div className="g-feed" aria-live="off">
        {recent.map((e: any, i: number) => <p key={view.log.length + '-' + i} className="g-old"><b style={{ color: ROLE_VAR[e.role] }}>{e.who}:</b> {e.text}</p>)}
        {lastTalk && <div className={'bubble' + (beat || fresh > 0 ? ' new' : '') + (lastTalk.kind === 'clerk' || lastTalk.kind === 'exhibit' ? ' narr' : '')} key={beat ? 'b' + bi + beats.length : view.log.length}><span className="who" style={{ color: ROLE_VAR[lastTalk.role] }}>{lastTalk.kind === 'clerk' || lastTalk.kind === 'exhibit' ? (lang === 'hi' ? 'अदालत' : 'Court') : lastTalk.who}</span>{lastTalk.text}</div>}
      </div>

      {showFb && myLast && (
        <div className={'fbk ' + fbTone} role="status">
          <b>{myLast.g === 2 ? '✓ ' + g.great : myLast.g === 1 ? '! ' + g.ok : '✕ ' + g.weak}</b>
          {myLast.why && <span>{firstSentence(myLast.why)}</span>}
          <div className="fbk-acts">
            {(myLast.why || myLast.better) && <button className="link-btn" onClick={() => setSheet('why')}>{g.learnWhy}</button>}
            {tryAgain && <button className="link-btn" onClick={tryAgain}>↺ {g.tryAgain}</button>}
          </div>
        </div>
      )}

      <section className="g-move" aria-label={g.yourMove}>
        {playing ? (
          <div className="beat-bar" role="group" aria-label={lang === 'hi' ? 'क्या हुआ' : 'What happened'}>
            <span className="beat-dots" aria-label={(bi + 1) + ' / ' + beats.length}>{beats.map((_, i) => <i key={i} data-on={i <= bi} />)}</span>
            <button className="btn btn-primary btn-lg" onClick={() => setBi(i => i + 1)} autoFocus>{bi + 1 < beats.length ? (lang === 'hi' ? 'आगे ›' : 'Next ›') : turn?.mine ? (lang === 'hi' ? 'मेरी बारी ›' : 'My turn ›') : (lang === 'hi' ? 'आगे ›' : 'Continue ›')}</button>
            {beats.length - bi > 1 && <button className="link-btn" onClick={skipBeats}>{lang === 'hi' ? 'सब छोड़ें »' : 'Skip all »'}</button>}
          </div>
        ) : view.status === 'done' ? (
          <button className="btn btn-primary btn-lg" onClick={onFinished}>{g.finalCall} →</button>
        ) : mine ? (
          <>
            <div className="g-ask">
              <span className="g-ask-k" style={{ color: ROLE_VAR[turn.role] }}>{STEP_GAME[turn.step]?.icon} {g.yourMove}</span>
              <h2>{stepHead(turn.step, lang)}</h2>
              <p className="muted g-sub">{turn.prompt}</p>
            </div>
            {!writing ? (
              <div className="choices" role="group" aria-label={stepHead(turn.step, lang)}>
                {turn.options.map((o: any, i: number) => (
                  <button key={i} className="choice" data-picked={sel === i} disabled={o.disabled || busy} onClick={() => submit(i)}>
                    <span className="choice-k" aria-hidden="true">{i + 1}</span>
                    <span>{sel === i && busy ? g.checking : o.t}{o.disabled ? ' 🔒' : ''}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="g-write">
                <label className="sr-only" htmlFor="composer">{g.writeOwn}</label>
                <textarea id="composer" className="composer" maxLength={600} value={text} onChange={e => setText(e.target.value)} placeholder={turn.prompt} autoFocus />
                <div className="g-row">
                  <button className="btn btn-sm" onClick={() => { setWriting(false); mic && mic(); setMic(null); }}>← {lang === 'hi' ? 'विकल्प' : 'Choices'}</button>
                  {micSupported && <button className="btn btn-sm" aria-pressed={!!mic} onClick={toggleMic}>{mic ? '● ' + (lang === 'hi' ? 'रोकें' : 'Stop') : '🎙 ' + g.say}</button>}
                  <button className="btn btn-primary btn-sm" disabled={!canSubmit} onClick={() => submit()}>{busy ? g.checking : t.ask}</button>
                </div>
              </div>
            )}
            {turn.free && expert && !writing && <button className="link-btn" onClick={() => setWriting(true)}>✎ {g.writeOwn} <span className="muted">· bonus</span></button>}
          </>
        ) : (
          <p className="g-wait" role="status">{turn ? seatName(turn.role) + ' ' + g.waiting : '…'}</p>
        )}
        {error && <span className="err" role="alert">{errText(error, lang)}</span>}
      </section>

      <nav className="g-tools" aria-label="Tools">
        <button className="tool" onClick={() => setSheet('clues')}>📁 {g.clues}<span className="tool-n">{view.marked.length}</span></button>
        <button className="tool" onClick={() => setSheet('learn')}>ℹ️ {g.learn}</button>
        <button className="tool" onClick={() => setSheet('record')}>📜 {g.record}</button>
      </nav>

      {sheet === 'clues' && <Dialog title={g.clues} onClose={() => setSheet(null)}>
        <div className="clue-grid">{pub.exhibits.map((x: any) => { const on = view.marked.includes(x[0]);
          return <button key={x[0]} className="clue" data-on={on} onClick={() => setSheet({ clue: { x, on } })}><span className="clue-i">{clueIcon(x[1])}</span><b>{x[1]}</b><span className="muted">{on ? '✓ ' + g.onRecord : g.notYet}</span></button>; })}</div>
      </Dialog>}
      {sheet && typeof sheet === 'object' && 'clue' in sheet && <Dialog title={clueIcon(sheet.clue.x[1]) + ' ' + sheet.clue.x[1]} onClose={() => setSheet('clues')}>
        <p style={{ fontSize: 'var(--fs-18)' }}>{sheet.clue.x[2]}</p>
        <p className="muted mono" style={{ fontSize: 13 }}>{sheet.clue.x[0]} · {sheet.clue.on ? g.onRecord : g.notYet}</p>
        <div className="g-row">
          {sheet.clue.on && mine && turn.free && expert && <button className="btn btn-primary" onClick={() => { setWriting(true); setText(s => (s ? s + ' ' : '') + sheet.clue.x[0]); setSheet(null); }}>{g.useClue}</button>}
          <button className="btn" onClick={() => setSheet(null)}>{g.close}</button>
        </div>
      </Dialog>}
      {sheet === 'learn' && <Dialog title={g.learn} onClose={() => setSheet(null)}>
        {turn && conceptText && <div><span className="kicker">{g.legalIdea} · {stepTerm(turn.step, lang)}</span><p style={{ marginTop: 6 }}>{conceptText[1]}</p><span className="tag tag-sim" style={{ display: 'inline-block', marginTop: 8 }}>GAME SIMPLIFICATION</span></div>}
        {pub.laws.map((l: any) => <LawCard key={l.id} law={l} lang={lang} t={t} />)}
      </Dialog>}
      {sheet === 'record' && <Dialog title={g.record} onClose={() => setSheet(null)}>
        <div className="panel" style={{ padding: 0 }}>{view.log.map((e: any, i: number) => <div key={i} className="entry" data-kind={e.kind} style={{ ['--role' as any]: ROLE_VAR[e.role] }}><span className="t">{new Date(e.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><div><div className="w">{e.who}</div><div className="x">{e.text}</div></div></div>)}</div>
      </Dialog>}
      {sheet === 'why' && myLast && <Dialog title={g.learnWhy} onClose={() => setSheet(null)}>
        <p className="muted">“{myLast.text}”</p>
        {myLast.why && <p>{myLast.why}</p>}
        {myLast.better && <p><b>{t.better}:</b> “{myLast.better}”</p>}
      </Dialog>}
    </div>
  );
}
