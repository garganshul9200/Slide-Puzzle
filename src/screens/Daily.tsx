import { getDailyArt } from '../game/art';
import { DAILY_GRID } from '../game/config';
import { fmtCountdown, msUntilMidnight } from '../game/utils';
import { useStore } from '../state/store';
import { ChunkyButton, Icon, Panel, useTicker } from '../components/ui';

export function DailyScreen() {
  const s = useStore();
  useTicker(1000);
  const done = s.dailyDone.filter(Boolean).length;

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl" style={{ color: 'var(--t-text)' }}>
          Daily Challenge
        </h1>
        <span className="q-chip" style={{ color: 'var(--t-accent2)' }}>
          <Icon name="timer" size={13} /> {fmtCountdown(msUntilMidnight())}
        </span>
      </div>
      <p className="mt-1 text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
        Three fresh puzzles · each solve <span style={{ color: 'var(--t-gold)' }}>skips one locked level</span>.
        Resets at midnight UTC — no do-overs!
      </p>

      {s.dailyDone.map((isDone, i) => {
        const n = DAILY_GRID[i];
        return (
          <Panel key={`${s.dailyDay}-${i}`} className="anim-rise mt-3.5 p-3.5">
            <div className="flex items-center gap-3.5">
              <div className="relative shrink-0">
                <img
                  src={getDailyArt(s.dailyDay, i)}
                  alt={`Daily puzzle ${i + 1}`}
                  className="h-[72px] w-[72px] rounded-xl"
                  draggable={false}
                  style={{
                    boxShadow: '0 0 0 3px var(--t-frame)',
                    filter: isDone ? 'saturate(.5) brightness(.8)' : undefined,
                  }}
                />
                {isDone && (
                  <span
                    className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ background: 'rgba(0,0,0,.35)', color: 'var(--t-accent)' }}
                  >
                    <Icon name="check" size={30} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl leading-tight" style={{ color: 'var(--t-text)' }}>
                  Puzzle {i + 1}
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
                  {n}×{n} grid
                </div>
                <span className="q-chip mt-1" style={{ color: isDone ? 'var(--t-accent)' : 'var(--t-gold)' }}>
                  <Icon name={isDone ? 'check' : 'skip'} size={12} />
                  {isDone ? 'Level skipped!' : 'Reward: +1 level skip'}
                </span>
              </div>
              <ChunkyButton
                color={isDone ? 'slate' : 'teal'}
                icon={isDone ? 'check' : 'play'}
                disabled={isDone}
                onClick={() => s.startGame({ mode: 'daily', level: 1, dailyIndex: i })}
              >
                {isDone ? 'Done' : 'Play'}
              </ChunkyButton>
            </div>
          </Panel>
        );
      })}

      {done === 3 ? (
        <Panel className="anim-pop mt-4 p-4 text-center">
          <div className="font-display text-xl" style={{ color: 'var(--t-gold)' }}>
            Perfect sweep!
          </div>
          <p className="mt-1 text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
            You skipped 3 levels today. New challenges arrive at midnight UTC.
          </p>
        </Panel>
      ) : (
        <Panel className="mt-4 p-4">
          <h3 className="font-display text-lg" style={{ color: 'var(--t-accent)' }}>How it works</h3>
          <ul className="mt-1.5 space-y-1.5 text-sm font-semibold" style={{ color: 'var(--t-sub)' }}>
            <li className="flex gap-2"><Icon name="sun" size={16} className="mt-0.5 shrink-0" /> Puzzles are generated from the server date — changing your clock won't spawn new ones.</li>
            <li className="flex gap-2"><Icon name="skip" size={16} className="mt-0.5 shrink-0" /> Finish puzzle 1 → level {s.unlockedLevel + 1} unlocks. Finish all three → skip 3 levels.</li>
            <li className="flex gap-2"><Icon name="lock" size={16} className="mt-0.5 shrink-0" /> Each daily puzzle can only be played once per day.</li>
          </ul>
        </Panel>
      )}
    </div>
  );
}
