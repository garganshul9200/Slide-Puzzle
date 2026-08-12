import { getDailyArt, getLevelArt, getLevelName } from '../game/art';
import { TOTAL_LEVELS, gridForLevel, xpProgress } from '../game/config';
import { fmtCountdown, fmtNum, msUntilMidnight } from '../game/utils';
import { useStore } from '../state/store';
import { ChunkyButton, Icon, Panel, ProgressBar, StatPill, useTicker } from '../components/ui';

export function HomeScreen() {
  const s = useStore();
  useTicker(1000);

  const level = s.unlockedLevel;
  const n = gridForLevel(level);
  const art = getLevelArt(level);
  const prog = xpProgress(s.xp);
  const totalStars = Object.values(s.stars).reduce((a, b) => a + b, 0);
  const canContinue = s.inProgress !== null;
  const dailiesDone = s.dailyDone.filter(Boolean).length;

  const play = () => {
    if (canContinue && s.inProgress) {
      s.startGame({ mode: s.inProgress.mode, level: s.inProgress.level, dailyIndex: s.inProgress.dailyIndex });
    } else {
      s.startGame({ mode: 'main', level });
    }
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      {/* top status bar */}
      <div className="flex items-center justify-center gap-2">
        <StatPill icon="flame" value={s.streak} color="#ff7847" />
        <StatPill icon="coin" value={fmtNum(s.coins)} color="var(--t-gold)" />
        <StatPill icon="sparkle" value={`Lv ${prog.level}`} color="var(--t-accent2)" />
        {s.premium && <StatPill icon="crown" value="VIP" color="var(--t-accent)" />}
      </div>

      {/* logo */}
      <div className="anim-rise mt-5 text-center">
        <div className="mx-auto mb-2.5 flex w-fit items-end gap-1.5">
          {['var(--t-gold)', 'var(--t-accent)', 'var(--t-accent2)', 'var(--t-gold)'].map((c, i) => (
            <span
              key={i}
              className="anim-floaty rounded-md"
              style={{
                width: i % 2 ? 16 : 22,
                height: i % 2 ? 16 : 22,
                background: c,
                animationDelay: `${i * 0.35}s`,
                boxShadow: '0 3px 0 rgba(0,0,0,.3)',
              }}
            />
          ))}
        </div>
        <h1 className="font-display text-[52px] leading-none tracking-wide" style={{ color: 'var(--t-text)', textShadow: '0 4px 0 rgba(0,0,0,.35)' }}>
          TILE <span style={{ color: 'var(--t-gold)' }}>QUEST</span>
        </h1>
        <p className="mt-1.5 text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
          Slide the pieces. Restore the picture.
        </p>
      </div>

      {/* main play card */}
      <Panel className="anim-rise mt-5 p-4">
        <div className="flex items-center gap-3.5">
          <img src={art} alt="" className="h-[86px] w-[86px] shrink-0 rounded-xl" style={{ boxShadow: '0 0 0 3px var(--t-frame), 0 8px 18px rgba(0,0,0,.4)' }} draggable={false} />
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: 'var(--t-sub)' }}>
              {canContinue ? 'Continue' : 'Current level'}
            </div>
            <div className="font-display truncate text-2xl leading-tight" style={{ color: 'var(--t-text)' }}>
              {canContinue && s.inProgress?.mode === 'daily'
                ? `Daily ${(s.inProgress.dailyIndex ?? 0) + 1}`
                : `Level ${canContinue && s.inProgress ? s.inProgress.level : level}`}
            </div>
            <div className="truncate text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
              {canContinue && s.inProgress?.mode === 'daily'
                ? 'Daily challenge in progress'
                : getLevelName(canContinue && s.inProgress ? s.inProgress.level : level)}
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <span className="q-chip">{n}×{n}</span>
              <span className="q-chip" style={{ color: 'var(--t-gold)' }}>
                <Icon name="star" size={11} /> {totalStars}/{TOTAL_LEVELS * 3}
              </span>
            </div>
          </div>
        </div>
        <ChunkyButton color="gold" size="xl" icon="play" className="mt-3.5 w-full" onClick={play}>
          {canContinue && s.inProgress
            ? `Continue · Lv ${s.inProgress.level}`
            : level === 1 && s.completedLevels.length === 0
              ? 'Start Quest'
              : `Play Level ${level}`}
        </ChunkyButton>
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] font-bold" style={{ color: 'var(--t-sub)' }}>
            <span>Quest progress</span>
            <span>{s.completedLevels.length}/{TOTAL_LEVELS}</span>
          </div>
          <ProgressBar value={s.completedLevels.length} max={TOTAL_LEVELS} color="var(--t-accent)" />
        </div>
      </Panel>

      {/* daily challenge card */}
      <Panel className="anim-rise mt-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display flex items-center gap-2 text-xl" style={{ color: 'var(--t-accent)' }}>
            <Icon name="sun" size={22} /> Daily Challenge
          </h2>
          <span className="q-chip" style={{ color: 'var(--t-accent2)' }}>
            <Icon name="timer" size={12} /> {fmtCountdown(msUntilMidnight())}
          </span>
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          {s.dailyDone.map((done, i) => (
            <img
              key={i}
              src={getDailyArt(s.dailyDay, i)}
              alt={`Daily ${i + 1}`}
              className="h-14 w-14 rounded-lg"
              draggable={false}
              style={{
                opacity: done ? 0.55 : 1,
                boxShadow: done ? '0 0 0 2px var(--t-accent)' : '0 0 0 2px var(--t-frame)',
                filter: done ? 'saturate(.6)' : undefined,
              }}
            />
          ))}
          <div className="ml-1 text-xs font-bold leading-snug" style={{ color: 'var(--t-sub)' }}>
            {dailiesDone === 3 ? (
              <span style={{ color: 'var(--t-accent)' }}>All 3 done — come back tomorrow!</span>
            ) : (
              <>Solve one →<br />unlock one level</>
            )}
          </div>
        </div>
        <ChunkyButton color="teal" size="lg" icon="sun" className="mt-3 w-full" onClick={() => s.nav({ name: 'daily' })}>
          {dailiesDone > 0 ? `Dailies · ${dailiesDone}/3 done` : 'Open Daily Challenges'}
        </ChunkyButton>
      </Panel>

      {/* quick nav */}
      <div className="anim-rise mt-3 grid grid-cols-4 gap-2">
        {[
          { icon: 'map', label: 'Map', to: 'map' as const },
          { icon: 'trophy', label: 'Awards', to: 'awards' as const },
          { icon: 'palette', label: 'Themes', to: 'profile' as const },
          { icon: 'cart', label: 'Store', to: 'profile' as const },
        ].map((q) => (
          <button key={q.label} type="button" className="q-quick" onClick={() => s.nav({ name: q.to })}>
            <Icon name={q.icon} size={22} />
            <span>{q.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
