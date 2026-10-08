import React, { useEffect, useState } from 'react';
import { STR, ROLE_INFO, ROLE_ORDER, errText, type Lang } from '../i18n';
import { api, store, mpEnabled, copyText, AppError } from '../lib/services';
import { useRoom } from '../game/hooks';
import { cleanCode, formatCode, validName } from '../../shared/text.js';
import { CASE_META } from '../../shared/cases.js';
import { Dialog } from '../components/ui';
import Court from './Court';
import Result from './Result';

export default function Friends({ lang, voice, onHome, name, setName }: { lang: Lang; voice: boolean; onHome: () => void; name: string; setName: (n: string) => void }) {
  const t = STR[lang];
  const [session, setSession] = useState<any>(() => store.room());
  const [gone, setGone] = useState('');
  if (!mpEnabled) return <div className="wrap" style={{ maxWidth: 720 }}><button className="icon-btn" onClick={onHome} aria-label={t.back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.mpTitle}</h1><p className="muted">{t.mpOff}</p></div>;
  if (!session) return <Entry lang={lang} name={name} setName={setName} onBack={onHome} onIn={(s: any) => { store.setRoom(s); setSession(s); }} notice={gone ? errText(gone, lang) : ''} />;
  return <Room lang={lang} voice={voice} session={session} onLeave={(code?: string) => { store.setRoom(null); setSession(null); setGone(code || ''); }} />;
}

function Entry({ lang, name, setName, onBack, onIn, notice }: any) {
  const t = STR[lang]; const [code, setCode] = useState(() => cleanCode(new URLSearchParams(location.search).get('room') || ''));
  const [caseId, setCaseId] = useState('L1'); const [level, setLevel] = useState(1); const [role, setRole] = useState('def');
  const [err, setErr] = useState(notice || ''); const [busy, setBusy] = useState(false); const [taken, setTaken] = useState<any>(null);
  const nm = validName(name);
  const run = async (fn: () => Promise<any>) => { if (!nm.ok) { setErr(lang === 'hi' ? 'नाम 2–24 अक्षरों का हो।' : 'Name must be 2–24 characters.'); return; } setBusy(true); setErr(''); try { const v = await fn(); onIn({ roomId: v.room.id, token: v.token }); } catch (e: any) { if (e.code === 'ROLE_TAKEN') setTaken(e.detail); else setErr(errText(e.code, lang)); } finally { setBusy(false); } };
  const create = () => run(() => api('/api/room/create', { displayName: nm.value, caseId, level, role, allowSpectators: true }));
  const join = (wantRole?: string | null, spectate?: boolean) => run(() => api('/api/room/join', { code, displayName: nm.value, wantRole: wantRole ?? null, spectate: !!spectate }));
  return (
    <div className="wrap" style={{ maxWidth: 960 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.mpTitle}</h1></div>
      <div className="form-row" style={{ maxWidth: 360 }}><label htmlFor="nm">{t.yourName}</label><input id="nm" className="input" maxLength={24} value={name} onChange={e => setName(e.target.value)} autoComplete="nickname" /></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        <section style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="h-c">
          <h2 id="h-c" className="court" style={{ fontSize: 'var(--fs-26)' }}>{t.create}</h2>
          <div className="form-row"><label htmlFor="cs">Case</label><select id="cs" className="input" value={caseId} onChange={e => { setCaseId(e.target.value); setLevel(Number(e.target.value.slice(1))); }}>{CASE_META.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
          <div className="seg" role="group" aria-label={t.level}>{[1, 2, 3].map(n => <button key={n} aria-pressed={level === n} onClick={() => setLevel(n)}>{[t.beginner, t.standard, t.expert][n - 1]}</button>)}</div>
          <div className="form-row"><label htmlFor="rl">{t.role}</label><select id="rl" className="input" value={role} onChange={e => setRole(e.target.value)}>{ROLE_ORDER.map(r => <option key={r} value={r}>{ROLE_INFO[r].name[lang]}</option>)}</select></div>
          <button className="btn btn-primary" disabled={busy} onClick={create}>{t.createBtn}</button>
        </section>
        <section style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }} aria-labelledby="h-j">
          <h2 id="h-j" className="court" style={{ fontSize: 'var(--fs-26)' }}>{t.join}</h2>
          <div className="form-row"><label htmlFor="cd">{t.code}</label><input id="cd" className="input mono" style={{ fontSize: 22, letterSpacing: '.08em' }} inputMode="text" autoCapitalize="characters" autoComplete="off" placeholder="XXX-XXX-XXX" value={formatCode(code)} onChange={e => setCode(cleanCode(e.target.value))} /></div>
          <button className="btn btn-primary" disabled={busy || code.length !== 9} onClick={() => join(null)}>{t.joinBtn}</button>
          <button className="btn btn-sm" disabled={busy || code.length !== 9} onClick={() => join(null, true)}>{t.spectate}</button>
        </section>
      </div>
      {err && <p className="err" role="alert">{err}</p>}
      {taken && <Dialog title={t.roleTaken} onClose={() => setTaken(null)}><p>{(lang === 'hi' ? 'यह सीट इनके पास है: ' : 'This seat is held by ') + (taken.holder || '')}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{(taken.free || []).map((r: string) => <button key={r} className="btn btn-sm" style={{ borderLeft: '3px solid ' + ROLE_INFO[r].color }} onClick={() => { setTaken(null); join(r); }}>{ROLE_INFO[r].name[lang]}</button>)}<button className="btn btn-sm" onClick={() => { setTaken(null); join(null, true); }}>{t.spectate}</button></div></Dialog>}
    </div>
  );
}

function Room({ lang, voice, session, onLeave }: any) {
  const t = STR[lang]; const { data, conn, error, op, act } = useRoom(session, (code: string) => onLeave(code));
  const [copied, setCopied] = useState<'' | 'ok' | 'fail'>(''); const [roleErr, setRoleErr] = useState<any>(null); const [showResult, setShowResult] = useState(false);
  useEffect(() => { if (data?.game?.status !== 'done') setShowResult(false); }, [data?.game?.status]);
  if (!data) return <div className="wrap"><p className="muted" role="status">{conn === 'reconnecting' || conn === 'lost' ? errText('NET', lang) : t.resuming}</p></div>;
  const me = data.me; const isHost = me.isHost; const hostGone = !data.room.hostOnline && !isHost;
  const leave = async () => { try { await op('leave'); } catch { /* still leave locally */ } onLeave(); };
  const names = Object.fromEntries(data.players.filter((p: any) => p.role).map((p: any) => [p.role, p.name + ' (' + (lang === 'hi' ? 'खिलाड़ी' : 'player') + ')']));

  if (data.game && (data.game.status === 'court' || !showResult)) {
    return <>
      {hostGone && <HostGone lang={lang} onTake={() => op('transfer-host').catch(() => {})} onLeave={leave} />}
      <Court pub={data.case} view={data.game} act={act} myRole={me.spectator ? null : me.role} lang={lang} voice={voice} conn={conn} error={error} spectator={me.spectator || !me.role} names={names} onFinished={() => setShowResult(true)} />
    </>;
  }
  if (data.game && showResult) {
    const mine = data.results?.table.find((p: any) => p.id === me.playerId);
    return <Result lang={lang} pub={data.case} view={data.game} role={me.spectator ? null : me.role} skills={mine || null} table={data.results?.table} awards={data.results?.awards} onReplay={leave} onHome={leave} hasNext={false} />;
  }

  const invite = location.origin + '/?room=' + data.room.code;
  const waiting = data.players.filter((p: any) => p.role && !p.spectator && !p.ready).map((p: any) => p.name);
  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.lobby}</h1>
        <span className="conn" style={{ color: conn === 'connected' ? 'var(--color-success-text)' : conn === 'lost' ? 'var(--color-danger-text)' : 'var(--color-warning-text)' }} role="status">{conn === 'connected' ? t.connected : conn === 'lost' ? t.lost : conn === 'reconnecting' ? t.reconnecting : t.resuming}</span>
      </div>
      {hostGone && <HostGone lang={lang} onTake={() => op('transfer-host').catch(() => {})} onLeave={leave} />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
        <section aria-label="Seats">
          <div className="seatlist">
            {ROLE_ORDER.map(r => { const p = data.players.find((x: any) => x.role === r);
              return <div key={r} style={{ ['--role' as any]: ROLE_INFO[r].color }}>
                <span className="bar" />
                <div><div style={{ fontWeight: 600 }}>{p ? p.name : <span className="muted">{t.openSeat}</span>}{p?.isHost && <span className="kicker" style={{ marginLeft: 8 }}>{t.host}</span>}</div><div className="muted" style={{ fontSize: 14 }}>{ROLE_INFO[r].name[lang]}</div></div>
                <span style={{ fontSize: 13, color: p ? (p.online ? 'var(--color-success-text)' : 'var(--color-warning-text)') : 'var(--color-muted)' }}>{p ? (p.online ? '● Online' : '◐ Away') : 'AI'}</span>
                {p ? <span style={{ fontSize: 13 }}>{p.ready ? '✓ ' + t.ready : t.notReady}</span>
                  : !me.spectator && <button className="btn btn-sm" onClick={() => op('role', { role: r }).catch((e: any) => setRoleErr(e.detail || {}))}>{lang === 'hi' ? 'यह सीट लें' : 'Take seat'}</button>}
              </div>; })}
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>{data.players.filter((p: any) => p.spectator).length} {lang === 'hi' ? 'दर्शक' : 'spectators'} · {lang === 'hi' ? 'निष्क्रिय रहने पर रूम 30 मिनट में बंद' : 'Room closes after 30 minutes of inactivity'}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="btn" onClick={leave}>{t.leave}</button>
            {me.role && !isHost && <button className={'btn ' + (data.players.find((p: any) => p.id === me.playerId)?.ready ? '' : 'btn-primary')} onClick={() => op('ready', { ready: !data.players.find((p: any) => p.id === me.playerId)?.ready })}>{data.players.find((p: any) => p.id === me.playerId)?.ready ? t.notReady : t.ready}</button>}
            {isHost && <button className="btn btn-primary" disabled={waiting.length > 0} onClick={() => op('start').catch(() => {})}>{waiting.length ? t.start + ' · ' + (lang === 'hi' ? 'प्रतीक्षा: ' : 'waiting for ') + waiting.join(', ') : t.start}</button>}
          </div>
          {error && <p className="err" role="alert">{errText(error, lang)}</p>}
        </section>
        <section style={{ background: 'var(--color-surface)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span className="kicker" style={{ color: 'var(--color-muted)' }}>{t.code.toUpperCase()}</span>
          <span className="mono" style={{ fontSize: 'clamp(28px, 5vw, 44px)', color: 'var(--color-brass)', letterSpacing: '.06em', userSelect: 'all' }}>{formatCode(data.room.code)}</span>
          <button className="btn" onClick={async () => { const ok = await copyText(invite); setCopied(ok ? 'ok' : 'fail'); setTimeout(() => setCopied(''), 2500); }}>{copied === 'ok' ? '✓ ' + t.copied : t.copy}</button>
          {copied === 'fail' && <span className="err" role="alert">{t.copyFail}</span>}
          {data.case && <div className="folder" style={{ cursor: 'default' }}><span className="k">CRIMINAL · {[t.beginner, t.standard, t.expert][data.room.level - 1].toUpperCase()}</span><h3>{data.case.title}</h3><p>{data.case.oneLine}</p><span style={{ fontSize: 13 }}>{t.fictional}</span></div>}
        </section>
      </div>
      {roleErr && <Dialog title={t.roleTaken} onClose={() => setRoleErr(null)}><p>{(lang === 'hi' ? 'यह सीट इनके पास है: ' : 'This seat is held by ') + (roleErr.holder || '')}</p></Dialog>}
    </div>
  );
}

function HostGone({ lang, onTake, onLeave }: any) {
  const t = STR[lang]; const [left, setLeft] = useState(20);
  useEffect(() => { const id = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000); return () => clearInterval(id); }, []);
  return <Dialog title={t.hostGone} dismissable={false}><p className="muted">{lang === 'hi' ? 'प्रतीक्षा' : 'Waiting'} · <span className="mono">0:{String(left).padStart(2, '0')}</span></p>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="btn btn-primary" disabled={left > 0} onClick={onTake}>{t.becomeHost}</button><button className="btn btn-danger" onClick={onLeave}>{t.leave}</button></div></Dialog>;
}
