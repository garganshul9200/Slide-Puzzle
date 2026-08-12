import { useEffect, useRef, useState } from 'react';
import { audio } from '../audio/audio';
import { BANDS, TOTAL_LEVELS } from '../game/config';
import { buzz } from '../game/utils';
import { useStore } from '../state/store';
import { Icon, Panel, ProgressBar, StatPill } from '../components/ui';

const WAVE = ['flex-start', 'center', 'flex-end', 'center'] as const;

export function LevelMapScreen() {
  const unlockedLevel = useStore((s) => s.unlockedLevel);
  const completedLevels = useStore((s) => s.completedLevels);
  const stars = useStore((s) => s.stars);
  const startGame = useStore((s) => s.startGame);
  const toast = useStore((s) => s.toast);
  const vibration = useStore((s) => s.settings.vibration);

  const refs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [shakeLv, setShakeLv] = useState<number | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      refs.current[unlockedLevel]?.scrollIntoView({ block: 'center' });
    }, 120);
    return () => clearTimeout(t);
  }, [unlockedLevel]);

  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0);

  const onNode = (lv: number, locked: boolean) => {
    if (locked) {
      audio.invalid();
      buzz(60, vibration);
      setShakeLv(lv);
      window.setTimeout(() => setShakeLv(null), 400);
      toast('Locked — win the previous level, or earn daily skips', 'lock');
      return;
    }
    startGame({ mode: 'main', level: lv });
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl" style={{ color: 'var(--t-text)' }}>Quest Map</h1>
        <StatPill icon="star" value={`${totalStars}/${TOTAL_LEVELS * 3}`} color="var(--t-gold)" />
      </div>
      <div className="mt-2">
        <ProgressBar value={completedLevels.length} max={TOTAL_LEVELS} color="var(--t-accent)" />
      </div>

      {BANDS.map((band) => (
        <div key={band.from} className="relative mt-6">
          <div className="absolute bottom-2 left-1/2 top-2 -z-0 border-l-2 border-dashed" style={{ borderColor: 'var(--t-edge)' }} />
          <div className="relative z-10 flex justify-center">
            <Panel className="flex items-center gap-2 px-4 py-2">
              <span className="font-display text-lg" style={{ color: 'var(--t-accent)' }}>{band.name}</span>
              <span className="q-chip">{band.from}–{band.to}</span>
              <span className="q-chip" style={{ color: 'var(--t-gold)' }}>{band.n}×{band.n}</span>
            </Panel>
          </div>

          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: band.to - band.from + 1 }, (_, i) => band.from + i).map((lv, i) => {
              const completed = completedLevels.includes(lv);
              const current = lv === unlockedLevel;
              const locked = lv > unlockedLevel;
              const earned = stars[lv] ?? 0;
              return (
                <div key={lv} className="flex" style={{ justifyContent: WAVE[i % 4] }}>
                  <button
                    type="button"
                    ref={(el) => { refs.current[lv] = el; }}
                    onClick={() => onNode(lv, locked)}
                    className={[
                      'relative z-10 flex h-[60px] w-[60px] flex-col items-center justify-center rounded-2xl font-display text-xl transition-transform',
                      shakeLv === lv ? 'anim-shake' : '',
                      current ? 'anim-glowpulse scale-110' : '',
                    ].join(' ')}
                    style={{
                      background: current
                        ? 'linear-gradient(160deg, #ffd166, var(--t-gold))'
                        : completed
                          ? 'var(--t-accent)'
                          : 'var(--t-panel2)',
                      color: current ? '#4d2c00' : completed ? '#04241f' : 'var(--t-sub)',
                      border: completed && !current ? '2px solid rgba(255,255,255,.25)' : '2px solid var(--t-edge)',
                      boxShadow: '0 5px 0 rgba(0,0,0,.28)',
                      opacity: locked ? 0.55 : 1,
                    }}
                    aria-label={`Level ${lv}${locked ? ' (locked)' : ''}`}
                  >
                    {locked ? <Icon name="lock" size={20} /> : current ? <Icon name="play" size={22} /> : <span>{lv}</span>}
                    {completed && (
                      <span className="flex gap-[2px]" style={{ color: current ? '#4d2c00' : '#ffd166' }}>
                        {[0, 1, 2].map((k) => (
                          <Icon key={k} name="star" size={9} className={k < earned ? '' : 'opacity-30'} />
                        ))}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <p className="mt-8 text-center text-xs font-bold" style={{ color: 'var(--t-sub)' }}>
        New regions unlock as you quest — daily challenges skip locked levels.
      </p>
    </div>
  );
}
