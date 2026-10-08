import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { type Lang } from './i18n';
import { Announcer } from './components/ui';
import { store, audio, speech } from './lib/services';
import { CASE_META, generateCase } from '../shared/cases.js';
import { newSeed } from '../shared/generator.js';
import { publicCase } from '../shared/engine.js';
import { useLocalGame } from './game/hooks';
import { Home, Levels, Roles, Brief, Settings } from './screens/Flow';
import { G } from './game/presentation';

const Court = lazy(() => import('./screens/Court'));
const Result = lazy(() => import('./screens/Result'));
const Lab = lazy(() => import('./screens/Lab'));
const Friends = lazy(() => import('./screens/Friends'));

type Screen = 'home' | 'levels' | 'lab' | 'roles' | 'brief' | 'court' | 'friends';

function LocalCourt({ C, role, lang, voice, pace, onHome, onReplay, onNext }: any) {
  const { view, act, tryAgain, skills } = useLocalGame(C, role, C.level || 1);
  const [done, setDone] = useState(false); const [unlocked, setUnlocked] = useState(false);
  const pub = useMemo(() => publicCase(C), [C]);
  useEffect(() => {
    if (!done || C.generated) return;
    const key = 'L' + (C.level || 1); // progress is per level; every game is a new case
    const p = store.progress(); const was = !!p.passed[key]; p.best[key] = p.best[key] || {};
    p.best[key][role] = Math.max(p.best[key][role] || 0, skills.overall || 0);
    if ((skills.overall || 0) >= 50) p.passed[key] = true; store.setProgress(p);
    setUnlocked(!was && !!p.passed[key]);
  }, [done]);
  if (done) {
    const next = CASE_META.find((c: any) => c.level === (C.level || 1) + 1);
    const passed = !!store.progress().passed['L' + (C.level || 1)];
    return <Result lang={lang} pub={pub} view={view} role={role} skills={skills} onReplay={onReplay} onHome={onHome} hasNext={!C.generated && !!next && passed} nextLabel={unlocked ? '🔓 ' + G[lang].unlocked : undefined} onNext={() => next && onNext(next.id, unlocked ? next.level : undefined)} />;
  }
  return <Court pace={pace} pub={pub} view={view} act={act} myRole={role} lang={lang} voice={voice} tryAgain={tryAgain} onExit={onHome} onFinished={() => setDone(true)} />;
}

export default function App() {
  const [prefs, setPrefs] = useState(store.prefs());
  const lang: Lang = prefs.lang === 'hi' ? 'hi' : 'en';
  const [screen, setScreen] = useState<Screen>(() => (new URLSearchParams(location.search).get('room') || store.room() ? 'friends' : 'home'));
  const [C, setC] = useState<any>(null); const [role, setRole] = useState(prefs.role || 'def'); const [run, setRun] = useState(0);
  const [settings, setSettings] = useState(false); const [fresh, setFresh] = useState<number | undefined>();
  const upd = (p: any) => { const n = { ...prefs, ...p }; setPrefs(n); store.setPrefs(n); };
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { audio.enabled = !!prefs.sound; audio.reduced = !!prefs.reducedAudio; if (!prefs.voice) speech.stop(); }, [prefs]);
  useEffect(() => { const first = () => { audio.ensure(); window.removeEventListener('pointerdown', first); }; window.addEventListener('pointerdown', first); return () => window.removeEventListener('pointerdown', first); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [screen]);
  const go = (s: Screen) => { speech.stop(); setScreen(s); };
  // Every game is a brand-new generated case for that level. Default role → straight to START.
  const pick = (id: string) => { const lvl = Math.max(1, Math.min(3, Number(String(id).replace(/\D/g, '')) || 1)); setC(generateCase(lvl, newSeed())); go('brief'); };
  const pace = ({ relaxed: 1.4, normal: 1, fast: 0.55 } as any)[prefs.pace || 'normal'] || 1;
  const inGame = screen === 'court' || screen === 'friends';

  return (
    <Announcer>
      {!inGame && screen !== 'home' && (
        <header className="topbar"><div className="topbar-in">
          <button className="wordmark" onClick={() => go('home')} aria-label="ADALAT home">ADALAT</button>
          <button className="icon-btn" onClick={() => setSettings(true)} aria-label={G[lang].settings}>⚙</button>
        </div></header>
      )}
      <Suspense fallback={<div className="wrap"><p className="muted" role="status">{lang === 'hi' ? 'अदालत तैयार हो रही है…' : 'Preparing the courtroom…'}</p></div>}>
        {screen === 'home' && <Home lang={lang} onPlay={() => go('levels')} onFriends={() => go('friends')} onSettings={() => setSettings(true)} />}
        {screen === 'levels' && <Levels lang={lang} progress={store.progress()} justUnlocked={fresh} onPick={(id: string) => { setFresh(undefined); pick(id); }} onBack={() => go('home')} />}
        {screen === 'lab' && <Lab lang={lang} onReady={(c: any) => { setC(c); go('brief'); }} onBuiltin={() => go('levels')} onBack={() => go('home')} />}
        {screen === 'roles' && C && <Roles lang={lang} initial={role} onBack={() => go('brief')} onPick={(r: string) => { setRole(r); upd({ role: r }); go('brief'); }} />}
        {screen === 'brief' && C && <Brief lang={lang} pub={publicCase(C)} role={role} onBack={() => go(C.generated ? 'lab' : 'levels')} onRole={() => go('roles')} onEnter={() => { setRun(x => x + 1); go('court'); }} />}
        {screen === 'court' && C && <LocalCourt key={run} C={C} role={role} lang={lang} pace={pace} voice={!!prefs.voice} onHome={() => go('home')} onReplay={() => { pick('L' + (C.level || 1)); }} onNext={(id: string, lvl?: number) => { if (lvl) { setFresh(lvl); go('levels'); } else pick(id); }} />}
        {screen === 'friends' && <Friends lang={lang} pace={pace} voice={!!prefs.voice} onHome={() => { history.replaceState(null, '', '/'); go('home'); }} name={prefs.name || ''} setName={(n: string) => upd({ name: n })} />}
      </Suspense>
      {settings && <Settings lang={lang} prefs={prefs} upd={upd} onClose={() => setSettings(false)} onLab={() => { setSettings(false); go('lab'); }} />}
    </Announcer>
  );
}
