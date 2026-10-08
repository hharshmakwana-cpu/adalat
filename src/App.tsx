import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { STR, type Lang } from './i18n';
import { Announcer } from './components/ui';
import { store, audio, speech } from './lib/services';
import { getBuiltin, CASE_META } from '../shared/cases.js';
import { publicCase } from '../shared/engine.js';
import { useLocalGame } from './game/hooks';
import { Home, Cases, Roles, Brief } from './screens/Flow';

const Court = lazy(() => import('./screens/Court'));
const Result = lazy(() => import('./screens/Result'));
const Lab = lazy(() => import('./screens/Lab'));
const Friends = lazy(() => import('./screens/Friends'));

type Screen = 'home' | 'cases' | 'lab' | 'roles' | 'brief' | 'court' | 'friends';

function LocalCourt({ C, role, lang, voice, onHome, onReplay, onNext }: any) {
  const { view, act, tryAgain, skills } = useLocalGame(C, role, C.level || 1);
  const [done, setDone] = useState(false);
  const pub = useMemo(() => publicCase(C), [C]);
  useEffect(() => { // save progress (built-in cases only)
    if (!done || C.generated) return;
    const p = store.progress(); p.best[C.id] = p.best[C.id] || {};
    p.best[C.id][role] = Math.max(p.best[C.id][role] || 0, skills.overall || 0);
    if ((skills.overall || 0) >= 50) p.passed[C.id] = true; store.setProgress(p);
  }, [done]);
  if (done) {
    const next = CASE_META.find((c: any) => c.level === (C.level || 1) + 1);
    return <Result lang={lang} pub={pub} view={view} role={role} skills={skills} onReplay={onReplay} onHome={onHome} hasNext={!C.generated && !!next} onNext={() => next && onNext(next.id)} />;
  }
  return <Court pub={pub} view={view} act={act} myRole={role} lang={lang} voice={voice} tryAgain={tryAgain} onFinished={() => setDone(true)} />;
}

export default function App() {
  const [prefs, setPrefs] = useState(store.prefs());
  const lang: Lang = prefs.lang === 'hi' ? 'hi' : 'en'; const t = STR[lang];
  const [screen, setScreen] = useState<Screen>(() => (new URLSearchParams(location.search).get('room') || store.room() ? 'friends' : 'home'));
  const [C, setC] = useState<any>(null); const [role, setRole] = useState('def'); const [run, setRun] = useState(0);
  const upd = (p: any) => { const n = { ...prefs, ...p }; setPrefs(n); store.setPrefs(n); };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { audio.enabled = !!prefs.sound; audio.reduced = !!prefs.reducedAudio; if (!prefs.voice) speech.stop(); }, [prefs]);
  useEffect(() => { const first = () => { audio.ensure(); audio.cue('open'); window.removeEventListener('pointerdown', first); }; window.addEventListener('pointerdown', first); return () => window.removeEventListener('pointerdown', first); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const go = (s: Screen) => { speech.stop(); setScreen(s); };
  const pick = (id: string) => { setC(getBuiltin(id)); go('roles'); };

  return (
    <Announcer>
      <header className="topbar">
        <div className="topbar-in">
          <button className="wordmark" onClick={() => go('home')} aria-label="ADALAT home">ADALAT</button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div className="seg" role="group" aria-label={t.sound}><button aria-pressed={!!prefs.sound} onClick={() => upd({ sound: !prefs.sound })}>{t.sound}: {prefs.sound ? t.on : t.off}</button></div>
            <div className="seg" role="group" aria-label={t.voice}><button aria-pressed={!!prefs.voice} onClick={() => upd({ voice: !prefs.voice })}>{t.voice}: {prefs.voice ? t.on : t.off}</button></div>
            <div className="seg" role="group" aria-label="Language"><button aria-pressed={lang === 'en'} onClick={() => upd({ lang: 'en' })}>EN</button><button aria-pressed={lang === 'hi'} onClick={() => upd({ lang: 'hi' })} lang="hi">हिं</button></div>
          </div>
        </div>
      </header>
      <Suspense fallback={<div className="wrap"><p className="muted" role="status">{lang === 'hi' ? 'अदालत तैयार हो रही है…' : 'Preparing the courtroom…'}</p></div>}>
        {screen === 'home' && <Home lang={lang} onPlay={() => go('cases')} onFriends={() => go('friends')} onLab={() => go('lab')} />}
        {screen === 'cases' && <Cases lang={lang} progress={store.progress()} onPick={pick} onLab={() => go('lab')} onBack={() => go('home')} />}
        {screen === 'lab' && <Lab lang={lang} onReady={(c: any) => { setC(c); go('roles'); }} onBuiltin={() => go('cases')} onBack={() => go('home')} />}
        {screen === 'roles' && C && <Roles lang={lang} caseTitle={C.title} level={C.level || 1} initial={role} onBack={() => go(C.generated ? 'lab' : 'cases')} onPick={(r: string) => { setRole(r); go('brief'); }} />}
        {screen === 'brief' && C && <Brief lang={lang} pub={publicCase(C)} role={role} onBack={() => go('roles')} onEnter={() => { setRun(x => x + 1); go('court'); }} />}
        {screen === 'court' && C && <LocalCourt key={run} C={C} role={role} lang={lang} voice={!!prefs.voice} onHome={() => go('home')} onReplay={() => go('roles')} onNext={(id: string) => pick(id)} />}
        {screen === 'friends' && <Friends lang={lang} voice={!!prefs.voice} onHome={() => { history.replaceState(null, '', '/'); go('home'); }} name={prefs.name || ''} setName={(n: string) => upd({ name: n })} />}
      </Suspense>
    </Announcer>
  );
}
