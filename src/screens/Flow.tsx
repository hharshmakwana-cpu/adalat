import React, { useState } from 'react';
import { type Lang, STR } from '../i18n';
import { Dialog, LawCard } from '../components/ui';
import { CASE_META } from '../../shared/cases.js';
import { G, ROLE_GAME, LEVEL_GAME, starsFor } from '../game/presentation';
import { ROLE_INFO } from '../i18n';

const ICON: Record<string, string> = { theft: '📱', road: '🚗', cyber: '💻', cheating: '🎭' };
const Stars = ({ n }: { n: number }) => <span className="stars" aria-label={n + ' of 3 stars'}>{[0, 1, 2].map(i => <span key={i} data-on={i < n}>★</span>)}</span>;

export function Home({ lang, onPlay, onFriends, onSettings }: { lang: Lang; onPlay: () => void; onFriends: () => void; onSettings: () => void }) {
  const g = G[lang];
  return (
    <section className="home" aria-labelledby="h-home">
      <div className="home-cols" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="home-light" aria-hidden="true" />
      <div className="home-float" aria-hidden="true"><span>📱</span><span>🧾</span><span>🎥</span><span>📍</span></div>
      <div className="home-bench" aria-hidden="true" />
      <h1 id="h-home">ADALAT</h1>
      <p className="tagline">{g.tagline}</p>
      <div className="home-actions">
        <button className="btn btn-primary btn-lg" onClick={onPlay}>▶ {g.play}</button>
        <button className="btn btn-brass btn-lg" style={{ fontSize: 'var(--fs-16)' }} onClick={onFriends}>👥 {g.friends}</button>
      </div>
      <button className="link-btn" onClick={onSettings}>⚙ {g.settings}</button>
    </section>
  );
}

/** Level progression: one case per level, stars, locks. */
export function Levels({ lang, progress, onPick, onBack, justUnlocked }: { lang: Lang; progress: any; onPick: (id: string) => void; onBack: () => void; justUnlocked?: number }) {
  const g = G[lang];
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="g-row"><button className="icon-btn" onClick={onBack} aria-label={STR[lang].back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{g.play}</h1></div>
      <div className="levels">
        {CASE_META.map((c: any) => {
          const unlocked = c.level === 1 || progress.passed['L' + (c.level - 1)] || progress.passed[c.id];
          const best = Math.max(0, ...Object.values(progress.best[c.id] || {}).map(Number));
          const L = LEVEL_GAME[c.level];
          return (
            <button key={c.id} className="lvl" disabled={!unlocked} data-new={justUnlocked === c.level} onClick={() => onPick(c.id)}>
              <span className="lvl-n">{unlocked ? L.icon : '🔒'}<small>{g.level} {c.level}</small></span>
              <span className="lvl-body">
                <b className="lvl-name">{L.name[lang].toUpperCase()}</b>
                <span className="lvl-case">{ICON[c.type] || '⚖️'} {c.title}</span>
                <span className="muted">{unlocked ? L.line[lang] : g.locked}</span>
              </span>
              <span className="lvl-side"><Stars n={starsFor(best || null)} />{best ? <small className="muted">{g.best} {best}</small> : null}{justUnlocked === c.level && <small className="lvl-badge">{g.unlocked}</small>}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Roles({ lang, onPick, onBack, initial }: { lang: Lang; onPick: (r: string) => void; onBack: () => void; initial?: string }) {
  const [info, setInfo] = useState<string | null>(null);
  return (
    <div className="wrap" style={{ maxWidth: 760 }}>
      <div className="g-row"><button className="icon-btn" onClick={onBack} aria-label={STR[lang].back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{G[lang].changeRole}</h1></div>
      <div className="role-pick" role="radiogroup">
        {Object.keys(ROLE_GAME).map(r => (
          <div key={r} className="role-row" style={{ ['--role' as any]: ROLE_INFO[r].color }}>
            <button role="radio" aria-checked={initial === r} className="role-big" onClick={() => onPick(r)}>
              <span className="role-i">{ROLE_GAME[r].icon}</span><span><b>{ROLE_GAME[r].name[lang]}</b><span className="muted">{ROLE_GAME[r].line[lang]}</span></span>
            </button>
            <button className="icon-btn" aria-label={'Learn more: ' + ROLE_GAME[r].name[lang]} onClick={() => setInfo(r)}>ℹ</button>
          </div>
        ))}
      </div>
      {info && <Dialog title={ROLE_GAME[info].icon + ' ' + ROLE_INFO[info].name[lang]} onClose={() => setInfo(null)}>
        <p>{ROLE_INFO[info].who[lang]}</p><p>{ROLE_INFO[info].what[lang]}</p><p className="muted">{ROLE_INFO[info].win[lang]}</p>
      </Dialog>}
    </div>
  );
}

/** "Before you start" — three facts and START. The full file is optional. */
export function Brief({ lang, pub, role, onEnter, onBack, onRole }: { lang: Lang; pub: any; role: string; onEnter: () => void; onBack: () => void; onRole: () => void }) {
  const g = G[lang]; const t = STR[lang]; const [full, setFull] = useState(false);
  const accused = pub.names?.accused || (pub.people?.find((p: any) => /accused/i.test(p[1])) || [])[0] || '—';
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button>
      <div className="brief">
        <span className="brief-case">{ICON[pub.type] || '⚖️'} {pub.title}</span>
        <div className="brief-facts">
          <div><span className="kicker">{g.who}</span><b>{accused}</b></div>
          <div><span className="kicker">{g.what}</span><b>{pub.oneLine}</b></div>
          <div><span className="kicker">{g.job}</span><b>{ROLE_GAME[role].icon} {ROLE_GAME[role].name[lang]} — {ROLE_GAME[role].line[lang]}</b></div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onEnter} autoFocus>▶ {g.start}</button>
        <div className="g-row" style={{ justifyContent: 'center' }}>
          <button className="link-btn" onClick={onRole}>{g.changeRole}</button>
          <button className="link-btn" onClick={() => setFull(true)}>{g.seeCase}</button>
        </div>
      </div>
      {full && <Dialog title={g.fullCase} onClose={() => setFull(false)}>
        <span className="tag tag-fic" style={{ alignSelf: 'flex-start' }}>{t.fictional}</span>
        {pub.story.map((p: string, i: number) => <p key={i}>{p}</p>)}
        <h3 className="kicker">{t.timeline}</h3>{pub.timeline.map(([w, x]: any, i: number) => <p key={i}><span className="mono muted">{w}</span> · {x}</p>)}
        <h3 className="kicker">{t.people}</h3>{pub.people.map(([n, r]: any, i: number) => <p key={i}><b>{n}</b> — {r}</p>)}
        <h3 className="kicker">{g.clues}</h3>{pub.exhibits.map((x: any) => <p key={x[0]}><span className="mono">{x[0]}</span> <b>{x[1]}</b> — {x[2]}</p>)}
        <h3 className="kicker">{t.law}</h3>{pub.laws.map((l: any) => <LawCard key={l.id} law={l} lang={lang} t={t} />)}
      </Dialog>}
    </div>
  );
}

export function Settings({ lang, prefs, upd, onClose, onLab }: { lang: Lang; prefs: any; upd: (p: any) => void; onClose: () => void; onLab: () => void }) {
  const g = G[lang];
  const Row = ({ label, on, k }: { label: string; on: boolean; k: string }) => (
    <div className="set-row"><span>{label}</span><button className="switch" role="switch" aria-checked={on} aria-label={label} onClick={() => upd({ [k]: !on })}><span /></button></div>
  );
  return (
    <Dialog title={'⚙ ' + g.settings} onClose={onClose}>
      <div className="set-row"><span>{g.language}</span><div className="seg" role="group" aria-label={g.language}><button aria-pressed={lang === 'en'} onClick={() => upd({ lang: 'en' })}>English</button><button aria-pressed={lang === 'hi'} lang="hi" onClick={() => upd({ lang: 'hi' })}>हिंदी</button></div></div>
      <Row label={g.sound} on={!!prefs.sound} k="sound" />
      <Row label={g.reducedAudio} on={!!prefs.reducedAudio} k="reducedAudio" />
      <Row label={g.voice} on={!!prefs.voice} k="voice" />
      <hr style={{ border: 0, borderTop: '1px solid var(--color-line)', width: '100%' }} />
      <button className="btn" onClick={onLab}>🧪 {g.practice}</button>
    </Dialog>
  );
}
