import React, { useState } from 'react';
import { STR, ROLE_INFO, ROLE_ORDER, type Lang } from '../i18n';
import { LawCard } from '../components/ui';
import { CASE_META } from '../../shared/cases.js';

export function Home({ lang, onPlay, onFriends, onLab }: { lang: Lang; onPlay: () => void; onFriends: () => void; onLab: () => void }) {
  const t = STR[lang];
  return (
    <section className="home" aria-labelledby="h-home">
      <div className="home-cols" aria-hidden="true"><span /><span /><span /><span /></div>
      <div className="home-light" aria-hidden="true" />
      <div className="home-bench" aria-hidden="true" />
      <span className="kicker">{t.courtNow}</span>
      <h1 id="h-home">ADALAT</h1>
      <p className="tagline">{t.tagline}</p>
      <p className="muted" style={{ fontSize: 'var(--fs-18)', maxWidth: 520 }}>{t.sub}</p>
      <div className="home-actions">
        <button className="btn btn-primary btn-lg" onClick={onPlay}>{t.play}</button>
        <div className="row">
          <button className="btn btn-brass" onClick={onFriends}>{t.friends}</button>
          <button className="btn btn-brass" onClick={onLab}>{t.lab}</button>
        </div>
      </div>
    </section>
  );
}

export function Cases({ lang, progress, onPick, onLab, onBack }: { lang: Lang; progress: any; onPick: (id: string) => void; onLab: () => void; onBack: () => void }) {
  const t = STR[lang];
  return (
    <div className="wrap">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.chooseCase}</h1></div>
      <div className="folders">
        {CASE_META.map((c: any) => {
          const unlocked = c.level === 1 || progress.passed['L' + (c.level - 1)] || progress.passed[c.id];
          const best = Math.max(0, ...Object.values(progress.best[c.id] || {}).map(Number));
          return (
            <button key={c.id} className="folder" disabled={!unlocked} onClick={() => onPick(c.id)} aria-describedby={c.id + '-d'}>
              <span className="k">CRIMINAL · {t.level.toUpperCase()} {c.level} · {[t.beginner, t.standard, t.expert][c.level - 1].toUpperCase()}</span>
              <h3>{c.title}</h3>
              <p id={c.id + '-d'}>{c.oneLine}</p>
              <p style={{ fontSize: 13 }}>{unlocked ? (c.learn?.[lang] || c.learn?.en) + (best ? ' · ' + (lang === 'hi' ? 'सर्वश्रेष्ठ ' : 'Best ') + best + '%' : '') : '🔒 ' + t.locked}</p>
              <span className="tag tag-fic" style={{ alignSelf: 'flex-start', color: 'var(--color-muted-dark)', background: 'rgba(20,18,37,.08)' }}>FICTIONAL CASE · ~{c.estimatedMinutes} min</span>
            </button>
          );
        })}
        <button className="folder" onClick={onLab} style={{ background: 'var(--color-surface-raised)', color: 'var(--color-ink)' }}>
          <span className="k" style={{ color: 'var(--color-brass)' }}>CASE LAB · AI</span>
          <h3>{t.labTitle}</h3>
          <p style={{ color: 'var(--color-muted)' }}>{t.labSub}</p>
        </button>
      </div>
      <p className="muted" style={{ fontSize: 14 }}>{t.comingSoon}</p>
    </div>
  );
}

export function Roles({ lang, caseTitle, level, onPick, onBack, initial }: { lang: Lang; caseTitle: string; level: number; onPick: (r: string) => void; onBack: () => void; initial?: string }) {
  const t = STR[lang]; const [sel, setSel] = useState(initial || 'def');
  const order = [sel, ...ROLE_ORDER.filter(r => r !== sel)];
  const move = (e: React.KeyboardEvent) => {
    const i = ROLE_ORDER.indexOf(sel);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setSel(ROLE_ORDER[(i + 1) % ROLE_ORDER.length]); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setSel(ROLE_ORDER[(i + ROLE_ORDER.length - 1) % ROLE_ORDER.length]); }
  };
  return (
    <div className="wrap">
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}><button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button>
        <div><span className="kicker">{caseTitle} · {[t.beginner, t.standard, t.expert][level - 1]}</span><h1 className="court" style={{ fontSize: 'var(--fs-34)' }}>{t.chooseSeat}</h1></div></div>
      <div className="roles" role="radiogroup" aria-label={t.chooseSeat} onKeyDown={move}>
        {order.map(r => { const R = ROLE_INFO[r]; const on = r === sel;
          return (
            <button key={r} role="radio" aria-checked={on} tabIndex={on ? 0 : -1} className="role-tile" style={{ ['--role' as any]: R.color }} onClick={() => setSel(r)}>
              <h3>{R.name[lang]}</h3>
              {on ? <dl><div><dt>{t.who}</dt><dd>{R.who[lang]}</dd></div><div><dt>{t.what}</dt><dd>{R.what[lang]}</dd></div><div><dt>{t.win}</dt><dd>{R.win[lang]}</dd></div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{R.skills.map(s => <span key={s} className="chip">{s}</span>)}</div></dl>
                : <><p className="muted" style={{ fontSize: 15 }}>{R.what[lang]}</p><p style={{ fontSize: 14, marginTop: 'auto' }}>{t.learn}: {R.learn[lang]}</p></>}
            </button>
          ); })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="muted">{t.othersAi}</span>
        <button className="btn btn-primary" onClick={() => onPick(sel)}>{t.enterAs} {ROLE_INFO[sel].name[lang]} →</button>
      </div>
    </div>
  );
}

export function Brief({ lang, pub, role, onEnter, onBack }: { lang: Lang; pub: any; role: string; onEnter: () => void; onBack: () => void }) {
  const t = STR[lang];
  return (
    <div className="wrap" style={{ maxWidth: 940 }}>
      <button className="icon-btn" onClick={onBack} aria-label={t.back}>←</button>
      <article className="doc">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="tag tag-fic" style={{ color: 'var(--color-muted-dark)', background: 'rgba(20,18,37,.08)' }}>{t.fictional}</span>{pub.generated && <span className="tag tag-sim" style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>CASE LAB · AI</span>}</div>
          <span className="muted" style={{ fontSize: 13 }}>{t.caseFile} · {pub.caseNo}</span>
          <h1>{pub.title}</h1>
          <span className="muted">{pub.court}</span>
          <p style={{ fontSize: 'var(--fs-18)' }}>{pub.oneLine}</p>
        </div>
        {lang === 'hi' && !pub.generated && <p className="muted" style={{ fontSize: 14 }}>{t.enNote}</p>}
        <section className="story"><h2>{t.story}</h2>{pub.story.map((p: string, i: number) => <p key={i}>{p}</p>)}</section>
        <details open><summary>{t.timeline}</summary><div className="tl">{pub.timeline.map(([w, x]: any, i: number) => <React.Fragment key={i}><span className="mono" style={{ fontSize: 13 }}>{w}</span><span>{x}</span></React.Fragment>)}</div></details>
        <details><summary>{t.people}</summary><div style={{ display: 'grid', gap: 8 }}>{pub.people.map(([n, r, note]: any, i: number) => <div key={i}><b>{n}</b> — {r}{note ? <span className="muted"> · {note}</span> : null}</div>)}</div></details>
        <details><summary>{t.exhibits}</summary><div style={{ display: 'grid', gap: 8 }}>{pub.exhibits.map((x: any) => <div key={x[0]}><span className="mono" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>{x[0]}</span> <b>{x[1]}</b> — {x[2]}</div>)}</div></details>
        <details><summary>{t.law}</summary><div style={{ display: 'grid', gap: 10, color: 'var(--color-ink)' }}>{pub.laws.map((l: any) => <LawCard key={l.id} law={l} lang={lang} t={t} />)}</div></details>
        <div style={{ borderTop: '1px solid var(--color-parchment-line)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2>{t.objective} · {ROLE_INFO[role].name[lang]}</h2><p>{ROLE_INFO[role].win[lang]}</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onEnter}>{t.enterCourt} →</button>
      </article>
    </div>
  );
}
