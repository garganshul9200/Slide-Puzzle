import { useEffect } from 'react';
import { audio } from './audio/audio';
import { AmbientParticles } from './components/fx';
import { OfflineGate } from './components/OfflineGate';
import { ChestOverlay, LoginRewardModal, TutorialOverlay } from './components/overlays';
import { Icon } from './components/ui';
import { THEMES } from './game/config';
import type { ScreenName } from './game/types';
import { useOnline } from './hooks/useOnline';
import { AwardsScreen } from './screens/Awards';
import { DailyScreen } from './screens/Daily';
import { GameScreen } from './screens/GameScreen';
import { HomeScreen } from './screens/Home';
import { LevelMapScreen } from './screens/LevelMap';
import { ProfileScreen } from './screens/Profile';
import { useStore } from './state/store';
import { cn } from './utils/cn';

const NAV: { name: ScreenName; icon: string; label: string }[] = [
  { name: 'home', icon: 'home', label: 'Home' },
  { name: 'map', icon: 'map', label: 'Map' },
  { name: 'daily', icon: 'sun', label: 'Daily' },
  { name: 'awards', icon: 'trophy', label: 'Awards' },
  { name: 'profile', icon: 'user', label: 'You' },
];

export default function App() {
  const online = useOnline();
  const blocked = !online;
  const screen = useStore((s) => s.screen);
  const themeId = useStore((s) => s.themeId);
  const settings = useStore((s) => s.settings);
  const toasts = useStore((s) => s.toasts);
  const dismissToast = useStore((s) => s.dismissToast);
  const pendingReward = useStore((s) => s.pendingReward);
  const chestReward = useStore((s) => s.chestReward);
  const streak = useStore((s) => s.streak);
  const tutorialDone = useStore((s) => s.tutorialDone);
  const nav = useStore((s) => s.nav);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  /* Day rollover watcher (UTC) — drives dailies, hints, streaks, missions. */
  useEffect(() => {
    useStore.getState().onDayCheck();
    const iv = window.setInterval(() => useStore.getState().onDayCheck(), 20_000);
    return () => clearInterval(iv);
  }, []);

  /* Keep the audio engine in sync with player settings. Mute while offline. */
  useEffect(() => {
    audio.configure({
      music: settings.music && !blocked,
      sfx: settings.sfx && !blocked,
      musicVol: settings.musicVol,
      sfxVol: settings.sfxVol,
    });
  }, [settings.music, settings.sfx, settings.musicVol, settings.sfxVol, blocked]);

  const vars: Record<string, string> = {};
  (Object.entries(theme.vars) as [string, string][]).forEach(([k, v]) => {
    vars[`--t-${k}`] = v;
  });

  const inGame = screen.name === 'game';

  return (
    <div
      className={cn(
        'app-root h-full overflow-hidden',
        settings.largeText && 'large-text',
        settings.reduceMotion && 'reduce-motion',
      )}
      style={{
        ...vars,
        background: `linear-gradient(165deg, ${theme.vars.bg1} 0%, ${theme.vars.bg2} 100%)`,
      }}
      onPointerDown={() => {
        if (!blocked) audio.unlock();
      }}
    >
      <div
        className="app-glow"
        style={{
          background: `radial-gradient(60% 42% at 50% 0%, ${theme.vars.glow}, transparent 70%)`,
        }}
      />
      <AmbientParticles
        colors={[theme.vars.accent, theme.vars.gold, theme.vars.accent2]}
        reduce={settings.reduceMotion || blocked}
      />

      <div
        className="app-safe relative z-10 mx-auto flex h-full w-full max-w-[520px] flex-col"
        aria-hidden={blocked || undefined}
        style={blocked ? { pointerEvents: 'none' } : undefined}
      >
        <div className="min-h-0 flex-1">
          {screen.name === 'home' && <HomeScreen />}
          {screen.name === 'map' && <LevelMapScreen />}
          {screen.name === 'daily' && <DailyScreen />}
          {screen.name === 'awards' && <AwardsScreen />}
          {screen.name === 'profile' && <ProfileScreen />}
          {screen.name === 'game' && (
            <GameScreen
              key={`${screen.game?.mode ?? 'main'}-${screen.game?.level ?? 0}-${screen.game?.dailyIndex ?? 0}`}
            />
          )}
        </div>

        {!inGame && (
          <nav
            className="relative z-20 mx-3 mb-3 shrink-0 rounded-2xl px-2 py-1.5"
            style={{
              background: theme.vars.navbg,
              border: `1px solid ${theme.vars.edge}`,
              boxShadow: '0 10px 28px rgba(0,0,0,.3)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex">
              {NAV.map((item) => {
                const active = screen.name === item.name;
                return (
                  <button
                    key={item.name}
                    type="button"
                    className="q-nav-item"
                    onClick={() => {
                      audio.tap();
                      nav({ name: item.name });
                    }}
                  >
                    <span
                      className="flex h-8 w-14 items-center justify-center rounded-xl transition-all duration-200"
                      style={{
                        background: active ? theme.vars.accent : 'transparent',
                        color: active ? theme.vars.bg1 : theme.vars.sub,
                        transform: active ? 'translateY(-2px) scale(1.05)' : undefined,
                      }}
                    >
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span
                      className="text-[9px] font-black uppercase tracking-wide"
                      style={{ color: active ? theme.vars.text : theme.vars.sub }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </div>

      {!blocked && (
        <div className="app-toasts pointer-events-none fixed left-1/2 z-[95] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <button
              key={t.id}
              type="button"
              className="q-toast anim-toast pointer-events-auto"
              onClick={() => dismissToast(t.id)}
            >
              {t.icon && <Icon name={t.icon} size={17} />}
              <span>{t.text}</span>
            </button>
          ))}
        </div>
      )}

      {!blocked && pendingReward && !inGame && <LoginRewardModal streak={streak} />}
      {!blocked && !tutorialDone && <TutorialOverlay />}
      {!blocked && chestReward && (
        <ChestOverlay
          reward={chestReward}
          onClose={() => {
            audio.coin();
            useStore.getState().collectChest();
          }}
        />
      )}

      {blocked && <OfflineGate />}
    </div>
  );
}
