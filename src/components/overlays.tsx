/** Full-screen game overlays: pause, level complete, chest, ads, tutorial, daily reward. */

import { useEffect, useMemo, useState } from 'react';
import { audio } from '../audio/audio';
import { DAILY_REWARDS, SHOP, xpProgress } from '../game/config';
import type { ChestReward, RewardSummary } from '../game/types';
import { buzz, fmtTime } from '../game/utils';
import { useStore } from '../state/store';
import { ChunkyButton, Icon, Modal, ProgressBar, useCountUp } from './ui';
import { Confetti } from './fx';

/* --------------------------------- pause ----------------------------------- */

export function PauseMenu({
  moves,
  elapsed,
  onResume,
  onRestart,
  onHelp,
  onQuit,
}: {
  moves: number;
  elapsed: number;
  onResume: () => void;
  onRestart: () => void;
  onHelp: () => void;
  onQuit: () => void;
}) {
  return (
    <Modal dismissable={false}>
      <h2 className="font-display text-center text-3xl" style={{ color: 'var(--t-text)' }}>
        Paused
      </h2>
      <div className="my-3 flex justify-center gap-4 text-sm font-bold" style={{ color: 'var(--t-sub)' }}>
        <span className="flex items-center gap-1.5"><Icon name="moves" size={16} />{moves} moves</span>
        <span className="flex items-center gap-1.5"><Icon name="timer" size={16} />{fmtTime(elapsed)}</span>
      </div>
      <div className="flex flex-col gap-2.5">
        <ChunkyButton color="gold" size="lg" icon="play" onClick={onResume}>Resume</ChunkyButton>
        <ChunkyButton color="teal" icon="restart" onClick={onRestart}>Restart Puzzle</ChunkyButton>
        <ChunkyButton color="slate" icon="info" onClick={onHelp}>How to Play</ChunkyButton>
        <ChunkyButton color="coral" icon="back" onClick={onQuit}>Quit to Map</ChunkyButton>
      </div>
    </Modal>
  );
}

/* ----------------------------- level complete ------------------------------ */

export function CompleteOverlay({
  summary,
  mode,
  level,
  moves,
  timeMs,
  doubled,
  onDouble,
  onNext,
  onReplay,
  onExit,
  nextLabel,
}: {
  summary: RewardSummary;
  mode: 'main' | 'daily';
  level: number;
  moves: number;
  timeMs: number;
  doubled: boolean;
  onDouble: () => void;
  onNext: () => void;
  onReplay: () => void;
  onExit: () => void;
  nextLabel: string;
}) {
  const premium = useStore((s) => s.premium);
  const xp = useStore((s) => s.xp);
  const coinsShown = useCountUp(summary.coinsEarned * (doubled ? 2 : 1), 800, 900);
  const xpShown = useCountUp(summary.xpEarned, 900, 1000);
  const prog = xpProgress(xp);
  const leveledUp = summary.xpLevel > summary.xpLevelBefore;

  useEffect(() => {
    const timers: number[] = [];
    for (let i = 0; i < summary.stars; i++) {
      timers.push(window.setTimeout(() => audio.star(i), 380 + i * 270));
    }
    return () => timers.forEach(clearTimeout);
  }, [summary.stars]);

  return (
    <Modal dismissable={false}>
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--t-sub)' }}>
          {mode === 'main' ? `Level ${level}` : `Daily Challenge ${level + 1}`}
        </div>
        <h2 className="font-display text-4xl" style={{ color: 'var(--t-gold)' }}>
          Puzzle Solved!
        </h2>

        <div className="mt-2 flex items-end justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="anim-star inline-block"
              style={{
                animationDelay: `${0.38 + i * 0.27}s`,
                color: i < summary.stars ? 'var(--t-gold)' : 'var(--t-edge)',
                filter: i < summary.stars ? 'drop-shadow(0 0 8px rgba(255,182,56,.6))' : undefined,
              }}
            >
              <Icon name="star" size={i === 1 ? 54 : 40} />
            </span>
          ))}
        </div>

        <div className="mx-auto mt-3 grid max-w-[280px] grid-cols-2 gap-2 text-sm">
          <div className="q-mini-stat">
            <Icon name="moves" size={15} />
            <span><b>{moves}</b> moves {summary.bestMoves && moves > 0 && <em className="q-best">best!</em>}</span>
          </div>
          <div className="q-mini-stat">
            <Icon name="timer" size={15} />
            <span><b>{fmtTime(timeMs)}</b> {summary.bestTime && <em className="q-best">best!</em>}</span>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-3 rounded-xl px-3 py-2" style={{ background: 'var(--t-panel2)' }}>
          <span className="flex items-center gap-1.5 font-extrabold" style={{ color: 'var(--t-gold)' }}>
            <Icon name="coin" size={18} /> +{coinsShown}
          </span>
          {doubled && <span className="q-best">×2 doubled!</span>}
          {!premium && !doubled && (
            <ChunkyButton size="sm" color="violet" icon="play" onClick={onDouble}>
              Double · Ad
            </ChunkyButton>
          )}
        </div>

        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs font-bold" style={{ color: 'var(--t-sub)' }}>
            <span className="flex items-center gap-1"><Icon name="sparkle" size={13} />XP +{xpShown}</span>
            <span>Lv {prog.level}{leveledUp && <em className="q-best">LEVEL UP!</em>}</span>
          </div>
          <ProgressBar value={prog.into} max={prog.need} color="var(--t-accent2)" />
        </div>

        {summary.newUnlocked !== null && (
          <div className="anim-pop mt-3 flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-extrabold" style={{ background: 'var(--t-panel2)', color: 'var(--t-accent)', animationDelay: '.5s' }}>
            <Icon name="lock" size={16} className="opacity-0" />
            <Icon name="check" size={16} />
            {mode === 'daily' ? `Level ${summary.newUnlocked} unlocked via daily skip!` : `Level ${summary.newUnlocked} unlocked!`}
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5">
          <ChunkyButton color="gold" size="lg" iconRight="skip" onClick={onNext}>{nextLabel}</ChunkyButton>
          <div className="flex gap-2.5">
            <ChunkyButton color="teal" className="flex-1" icon="restart" onClick={onReplay}>Replay</ChunkyButton>
            <ChunkyButton color="slate" className="flex-1" icon="map" onClick={onExit}>Map</ChunkyButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------ mystery chest ------------------------------ */

export function ChestOverlay({ reward, onClose }: { reward: ChestReward; onClose: () => void }) {
  const [opened, setOpened] = useState(false);
  const [burst, setBurst] = useState(0);

  const open = () => {
    if (opened) return;
    audio.chest();
    setOpened(true);
    setBurst((b) => b + 1);
  };

  return (
    <Modal dismissable={false}>
      <Confetti burst={burst} />
      <div className="text-center">
        <div className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: 'var(--t-sub)' }}>
          Every 5 levels
        </div>
        <h2 className="font-display text-3xl" style={{ color: 'var(--t-gold)' }}>Mystery Chest!</h2>

        <button type="button" onClick={open} className="relative mx-auto mt-4 block h-32 w-40 cursor-pointer" aria-label="Open chest">
          {/* chest body */}
          <div className="absolute bottom-0 left-1/2 h-20 w-36 -translate-x-1/2 rounded-b-2xl rounded-t-md" style={{ background: 'linear-gradient(#8a4f28,#5c3018)', boxShadow: '0 10px 24px rgba(0,0,0,.5), inset 0 2px 0 rgba(255,255,255,.15)' }}>
            <div className="absolute left-1/2 top-0 h-full w-6 -translate-x-1/2" style={{ background: 'rgba(255,182,56,.85)' }} />
          </div>
          {/* lid */}
          <div
            className="absolute left-1/2 top-6 h-12 w-36 origin-bottom -translate-x-1/2 rounded-t-2xl transition-transform duration-500"
            style={{
              background: 'linear-gradient(#a05c2e,#6f3c1e)',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,.2)',
              transform: opened ? 'translateX(-50%) rotateX(70deg) translateY(-14px)' : 'translateX(-50%)',
            }}
          >
            <div className="absolute bottom-0 left-1/2 h-4 w-6 -translate-x-1/2 rounded-sm" style={{ background: 'var(--t-gold)' }} />
          </div>
          {!opened && (
            <div className="anim-glowpulse absolute inset-0 rounded-2xl" />
          )}
        </button>

        {opened ? (
          <div className="anim-pop mt-4">
            <div className="flex items-center justify-center gap-2 text-2xl font-black" style={{ color: 'var(--t-gold)' }}>
              <Icon name={reward.kind === 'coins' ? 'coin' : 'bulb'} size={26} />
              +{reward.amount} {reward.kind === 'coins' ? 'Coins' : reward.amount === 1 ? 'Hint' : 'Hints'}
            </div>
            <ChunkyButton color="gold" size="lg" className="mt-4 w-full" onClick={onClose}>Collect</ChunkyButton>
          </div>
        ) : (
          <p className="mt-4 text-sm font-bold" style={{ color: 'var(--t-sub)' }}>Tap the chest to open it</p>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------ simulated ads ------------------------------ */

const FAKE_ADS = [
  { title: 'Gem Blast Saga', sub: 'Match gems. Blast boredom.', c1: '#7b4dd6', c2: '#ff5d8f', icon: 'gem' },
  { title: 'Sky Farm Heroes', sub: 'Build your floating farm!', c1: '#17a398', c2: '#4cc9f0', icon: 'sparkle' },
  { title: 'Drift Kings 2', sub: 'Outrun the neon night.', c1: '#e0532f', c2: '#ffb638', icon: 'bolt' },
];

/**
 * Ad placement shim. On web this renders a simulated interstitial/rewarded
 * unit with a real countdown; in the native build the same component wraps
 * react-native-google-mobile-ads and fires the identical callbacks.
 */
export function AdOverlay({
  kind,
  onDone,
}: {
  kind: 'rewarded' | 'interstitial';
  onDone: (completed: boolean) => void;
}) {
  const [left, setLeft] = useState(5);
  const ad = useMemo(() => FAKE_ADS[Math.floor(Math.random() * FAKE_ADS.length)], []);

  useEffect(() => {
    const iv = window.setInterval(() => setLeft((l) => Math.max(0, l - 1)), 1000);
    return () => clearInterval(iv);
  }, []);

  const ready = left === 0;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col" style={{ background: '#05060a' }}>
      <div className="flex items-center justify-between px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#8b93a7' }}>
        <span>Sponsored</span>
        {ready ? (
          kind === 'interstitial' ? (
            <button type="button" className="q-ad-close" onClick={() => onDone(true)} aria-label="Close ad">
              <Icon name="close" size={16} />
            </button>
          ) : (
            <span style={{ color: '#ffb638' }}>Reward ready!</span>
          )
        ) : (
          <span className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: '#ffb638' }} />
            {left}s
          </span>
        )}
      </div>

      <div className="relative mx-4 flex flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl" style={{ background: `linear-gradient(150deg, ${ad.c1}, ${ad.c2})` }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="anim-floaty absolute rounded-2xl opacity-25"
            style={{
              width: 40 + i * 22,
              height: 40 + i * 22,
              left: `${(i * 23 + 8) % 85}%`,
              top: `${(i * 31 + 12) % 78}%`,
              background: '#ffffff',
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
        <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white/20 text-white shadow-2xl">
          <Icon name={ad.icon} size={52} />
        </span>
        <h3 className="font-display relative mt-5 text-4xl text-white" style={{ textShadow: '0 3px 0 rgba(0,0,0,.3)' }}>
          {ad.title}
        </h3>
        <p className="relative mt-1 font-bold text-white/90">{ad.sub}</p>
        <span className="relative mt-6 rounded-full bg-white/25 px-6 py-2.5 font-display text-lg text-white">
          PLAY FREE
        </span>
        <p className="relative mt-2 text-[11px] font-semibold text-white/60">Simulated ad — no real ads in preview</p>
      </div>

      <div className="flex h-24 items-center justify-center gap-4 px-6">
        <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: '#1a1f2e' }}>
          <div className="h-full rounded-full transition-all duration-1000 ease-linear" style={{ width: `${((5 - left) / 5) * 100}%`, background: '#ffb638' }} />
        </div>
        {kind === 'rewarded' && (
          <ChunkyButton color="gold" disabled={!ready} icon="gift" onClick={() => onDone(true)}>
            {ready ? 'Claim Reward' : `${left}s`}
          </ChunkyButton>
        )}
      </div>
    </div>
  );
}

/* -------------------------------- tutorial --------------------------------- */

export function TutorialOverlay() {
  const finishTutorial = useStore((s) => s.finishTutorial);
  const [page, setPage] = useState(0);

  const pages = [
    {
      icon: 'grid',
      title: 'Slide to Solve',
      body: 'Tap any tile next to the empty slot to slide it home. Tap a tile farther away in the same row or column and the whole line slides. Rebuild the picture to win!',
    },
    {
      icon: 'sun',
      title: 'Daily Challenges',
      body: 'Three fresh puzzles land every day at midnight (UTC). Each one you solve instantly unlocks a locked main level — do all three to skip ahead by 3!',
    },
    {
      icon: 'bulb',
      title: 'Tools of the Quest',
      body: 'Stuck? Hints auto-play the smartest move (3 free daily). Undo is unlimited, and holding the Eye button peeks at the finished picture. Earn stars, coins and XP on every solve.',
    },
  ];
  const p = pages[page];
  const last = page === pages.length - 1;

  return (
    <Modal dismissable={false}>
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl" style={{ background: 'var(--t-panel2)', color: 'var(--t-gold)' }}>
          <Icon name={p.icon} size={40} />
        </span>
        <h2 className="font-display mt-3 text-3xl" style={{ color: 'var(--t-text)' }}>{p.title}</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed" style={{ color: 'var(--t-sub)' }}>{p.body}</p>
        <div className="mt-4 flex justify-center gap-1.5">
          {pages.map((_, i) => (
            <span key={i} className="h-2 rounded-full transition-all" style={{ width: i === page ? 22 : 8, background: i === page ? 'var(--t-gold)' : 'var(--t-edge)' }} />
          ))}
        </div>
        <div className="mt-5 flex gap-2.5">
          <ChunkyButton color="slate" className="flex-1" onClick={finishTutorial}>Skip</ChunkyButton>
          <ChunkyButton color="gold" className="flex-1" iconRight={last ? 'play' : undefined} onClick={() => (last ? finishTutorial() : setPage(page + 1))}>
            {last ? "Let's Play" : 'Next'}
          </ChunkyButton>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------ login reward ------------------------------- */

export function LoginRewardModal({ streak }: { streak: number }) {
  const claim = useStore((s) => s.pendingReward);
  const claimPendingReward = useStore((s) => s.claimPendingReward);
  const vibration = useStore((s) => s.settings.vibration);
  if (!claim) return null;

  const icon = claim.kind === 'coins' ? 'coin' : claim.kind === 'hints' ? 'bulb' : claim.kind === 'skip' ? 'skip' : 'palette';

  return (
    <Modal dismissable={false}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-sm font-black" style={{ color: 'var(--t-accent)' }}>
          <Icon name="flame" size={18} /> {streak}-day streak
        </div>
        <h2 className="font-display text-3xl" style={{ color: 'var(--t-gold)' }}>Daily Reward</h2>

        <div className="mt-3 grid grid-cols-7 gap-1">
          {DAILY_REWARDS.map((r, i) => {
            const active = i === claim.day - 1;
            const done = i < claim.day - 1;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-0.5 rounded-lg py-1.5"
                style={{
                  background: active ? 'var(--t-gold)' : 'var(--t-panel2)',
                  color: active ? '#4d2c00' : done ? 'var(--t-accent)' : 'var(--t-sub)',
                  boxShadow: active ? '0 0 18px rgba(255,182,56,.5)' : undefined,
                }}
              >
                <span className="text-[9px] font-black">D{i + 1}</span>
                <Icon name={done ? 'check' : r.kind === 'coins' ? 'coin' : r.kind === 'hints' ? 'bulb' : r.kind === 'skip' ? 'skip' : 'palette'} size={13} />
              </div>
            );
          })}
        </div>

        <div className="anim-pop mt-4 flex items-center justify-center gap-2 text-2xl font-black" style={{ color: 'var(--t-gold)' }}>
          <Icon name={icon} size={28} /> {claim.label}
        </div>

        <ChunkyButton
          color="gold"
          size="lg"
          className="mt-4 w-full"
          icon="gift"
          onClick={() => {
            audio.coin();
            buzz([20, 30, 20], vibration);
            claimPendingReward();
          }}
        >
          Claim Day {claim.day}
        </ChunkyButton>
      </div>
    </Modal>
  );
}

/* ------------------------------ hint purchase ------------------------------ */

export function HintShopModal({ onClose, onWatchAd }: { onClose: () => void; onWatchAd: () => void }) {
  const coins = useStore((s) => s.coins);
  const buyHintWithCoins = useStore((s) => s.buyHintWithCoins);
  return (
    <Modal onClose={onClose}>
      <h2 className="font-display text-center text-2xl" style={{ color: 'var(--t-text)' }}>Out of Hints</h2>
      <p className="mt-1 text-center text-sm font-semibold" style={{ color: 'var(--t-sub)' }}>
        Free hints refill daily. Get more now:
      </p>
      <div className="mt-4 flex flex-col gap-2.5">
        <ChunkyButton color="violet" icon="play" onClick={() => { onWatchAd(); onClose(); }}>
          Watch Ad · +1 Hint
        </ChunkyButton>
        <ChunkyButton color="gold" icon="coin" disabled={coins < SHOP.hintRefillCost} onClick={() => { if (buyHintWithCoins()) onClose(); }}>
          {SHOP.hintRefillCost} Coins · +1 Hint
        </ChunkyButton>
        <ChunkyButton color="slate" onClick={onClose}>Maybe Later</ChunkyButton>
      </div>
    </Modal>
  );
}
