import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { audio } from '../audio/audio';
import { initializeAdMob, prepareInterstitialAd, prepareRewardedAd, tickPlaytime } from '../ads/admob';
import { BannerAd } from '../components/BannerAd';
import { Board } from '../components/Board';
import { Confetti } from '../components/fx';
import {
  AdOverlay,
  CompleteOverlay,
  HintShopModal,
  PauseMenu,
  TutorialOverlay,
} from '../components/overlays';
import { Icon, IconButton, StatPill } from '../components/ui';
import { getDailyArt, getLevelArt, getLevelName, preloadArt } from '../game/art';
import { DAILY_GRID, PAR_MOVES, TOTAL_LEVELS, gridForLevel } from '../game/config';
import {
  applySlide,
  bestHintMove,
  createSolved,
  isSolved,
  shuffleBoard,
  slideFromClick,
} from '../game/puzzle';
import type { Board as BoardModel } from '../game/puzzle';
import type { RewardSummary } from '../game/types';
import { buzz, fmtClock } from '../game/utils';
import { useOnline } from '../hooks/useOnline';
import { useStore } from '../state/store';

type Phase = 'shuffle' | 'play' | 'won';

function ControlBtn({
  icon,
  label,
  onClick,
  onDown,
  onUp,
  badge,
}: {
  icon: string;
  label: ReactNode;
  onClick?: () => void;
  onDown?: () => void;
  onUp?: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      className="q-control relative"
      onClick={() => {
        audio.tap();
        onClick?.();
      }}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onPointerCancel={onUp}
    >
      {badge !== undefined && <span className="q-badge">{badge}</span>}
      <Icon name={icon} size={21} />
      <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
    </button>
  );
}

export function GameScreen() {
  const params = useStore((s) => s.screen.game);
  const mode = params?.mode ?? 'main';
  const level = params?.level ?? 1;
  const dailyIndex = params?.dailyIndex ?? 0;

  const n = mode === 'main' ? gridForLevel(level) : DAILY_GRID[dailyIndex];
  const dayRef = useRef(useStore.getState().dailyDay);
  const img = useMemo(
    () => (mode === 'main' ? getLevelArt(level) : getDailyArt(dayRef.current, dailyIndex)),
    [mode, level, dailyIndex],
  );

  const vibration = useStore((s) => s.settings.vibration);
  const premium = useStore((s) => s.premium);
  const hintsLeft = useStore((s) => s.hintsLeft);
  const nav = useStore((s) => s.nav);
  const saveSnapshot = useStore((s) => s.saveSnapshot);
  const tutorialDone = useStore((s) => s.tutorialDone);
  const snapshot = useStore((s) => s.inProgress);
  const online = useOnline();

  const restored =
    !!snapshot &&
    snapshot.mode === mode &&
    snapshot.level === level &&
    snapshot.n === n &&
    (mode === 'daily' ? (snapshot.dailyIndex ?? 0) === dailyIndex : true);

  const [board, setBoard] = useState<BoardModel>(() =>
    restored ? snapshot!.board.slice() : createSolved(n),
  );
  const [phase, setPhase] = useState<Phase>(restored ? 'play' : 'shuffle');
  const [cascade, setCascade] = useState(false);
  const [moves, setMoves] = useState(restored ? snapshot!.moves : 0);
  const [elapsed, setElapsed] = useState(restored ? snapshot!.elapsedMs : 0);
  const [paused, setPaused] = useState(false);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [shakeValue, setShakeValue] = useState<number | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [doubled, setDoubled] = useState(false);
  const [burst, setBurst] = useState(0);
  const [hintShop, setHintShop] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [adKind, setAdKind] = useState<'rewarded' | 'interstitial' | null>(null);

  const undoStack = useRef<BoardModel[]>([]);
  const hintsUsed = useRef(restored ? snapshot!.hintsUsed : 0);
  const elapsedRef = useRef(elapsed);
  const movesRef = useRef(moves);
  const boardRef = useRef(board);
  const phaseRef = useRef(phase);
  const pausedRef = useRef(paused);
  const rewardKindRef = useRef<'hint' | 'double' | 'restart'>('hint');
  const pendingNextRef = useRef(false);
  const timedInterstitialRef = useRef(false);
  boardRef.current = board;
  phaseRef.current = phase;
  pausedRef.current = paused;
  movesRef.current = moves;

  /* ---------------------------- shuffle-in animation --------------------------- */
  useEffect(() => {
    if (restored) return;
    const target = shuffleBoard(n);
    const t1 = window.setTimeout(() => {
      setCascade(true);
      setBoard(target);
    }, 140);
    const t2 = window.setTimeout(() => {
      setCascade(false);
      setPhase('play');
    }, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ----------------------------------- timer ----------------------------------- */
  useEffect(() => {
    if (phase !== 'play' || paused || adKind) return;
    let uiAcc = 0;
    const iv = window.setInterval(() => {
      elapsedRef.current += 100;
      uiAcc += 100;
      // Keep ref precise; only re-render the screen ~4×/sec for the clock pill.
      if (uiAcc >= 250) {
        uiAcc = 0;
        setElapsed(elapsedRef.current);
      }
    }, 100);
    return () => clearInterval(iv);
  }, [phase, paused, adKind]);

  /* Timed interstitial — every 10 minutes of active puzzle playtime. */
  useEffect(() => {
    if (premium || phase !== 'play' || paused || adKind || hintShop || showHelp) return;
    const iv = window.setInterval(() => {
      if (tickPlaytime(1000)) {
        timedInterstitialRef.current = true;
        setAdKind('interstitial');
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [premium, phase, paused, adKind, hintShop, showHelp]);

  /* pause when the tab is hidden — the timer can never be cheated */
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && phaseRef.current === 'play') setPaused(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  /* Freeze the run while offline so the timer doesn't advance under the gate. */
  useEffect(() => {
    if (!online && phaseRef.current === 'play') setPaused(true);
  }, [online]);

  useEffect(() => {
    if (tutorialDone) setShowHelp(false);
  }, [tutorialDone]);

  /* Warm AdMob only for free players. */
  useEffect(() => {
    if (premium) return;
    void initializeAdMob().then(() =>
      Promise.all([prepareRewardedAd(), prepareInterstitialAd()]),
    );
  }, [premium]);

  /* ------------------------- mid-game persistence (main) ------------------------ */
  useEffect(() => {
    // Never persist before real play starts — a solved-board snapshot would
    // let a resumed game win instantly.
    if (mode !== 'main' || phase !== 'play' || movesRef.current === 0) return;
    const t = window.setTimeout(() => {
      saveSnapshot({
        level,
        mode,
        board,
        n,
        moves,
        elapsedMs: elapsedRef.current,
        hintsUsed: hintsUsed.current,
      });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, moves]);

  /* --------------------------------- board size --------------------------------- */
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(280);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      const r = el.getBoundingClientRect();
      setSize(Math.max(200, Math.floor(Math.min(r.width - 6, r.height - 6))));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ----------------------------------- actions ---------------------------------- */

  const win = useCallback(
    (finalMoves: number) => {
      setPhase('won');
      phaseRef.current = 'won';
      audio.win();
      buzz([30, 50, 30, 50, 90], vibration);
      setBurst((b) => b + 1);
      saveSnapshot(null);
      window.setTimeout(() => {
        const res = useStore.getState().completeLevel({
          level,
          mode,
          dailyIndex,
          moves: finalMoves,
          timeMs: elapsedRef.current,
          hintsUsed: hintsUsed.current,
        });
        setSummary(res);
      }, 1500);
    },
    [level, mode, dailyIndex, vibration, saveSnapshot],
  );

  const handleTap = useCallback(
    (pos: number) => {
      if (phaseRef.current !== 'play' || pausedRef.current) return;
      const slide = slideFromClick(boardRef.current, n, pos);
      if (!slide) {
        audio.invalid();
        buzz(50, vibration);
        const v = boardRef.current[pos];
        setShakeValue(v);
        window.setTimeout(() => setShakeValue(null), 380);
        return;
      }
      const next = applySlide(boardRef.current, slide);
      undoStack.current.push(boardRef.current);
      if (undoStack.current.length > 600) undoStack.current.shift();
      const nextMoves = movesRef.current + 1;
      movesRef.current = nextMoves; // sync before win() reads it
      setBoard(next);
      setMoves(nextMoves);
      audio.slide(Math.min(slide.length, 6));
      buzz(12, vibration);
      if (isSolved(next)) win(nextMoves);
    },
    [n, vibration, win],
  );
  const handleTapRef = useRef(handleTap);
  handleTapRef.current = handleTap;

  const onUndo = () => {
    if (phaseRef.current !== 'play' || pausedRef.current) return;
    const prev = undoStack.current.pop();
    if (!prev) {
      audio.invalid();
      return;
    }
    setBoard(prev);
    audio.tap();
    buzz(8, vibration);
  };

  const onHint = () => {
    if (phaseRef.current !== 'play' || pausedRef.current) return;
    const store = useStore.getState();
    if (!store.premium && store.hintsLeft <= 0) {
      setHintShop(true);
      return;
    }
    const pos = bestHintMove(boardRef.current, n);
    if (pos === null) return;
    store.consumeHint();
    hintsUsed.current += 1;
    audio.hint();
    buzz(15, vibration);
    setHighlight(pos);
    window.setTimeout(() => {
      setHighlight(null);
      handleTapRef.current(pos);
    }, store.settings.reduceMotion ? 120 : 520);
  };

  const restart = () => {
    undoStack.current = [];
    hintsUsed.current = 0;
    setMoves(0);
    movesRef.current = 0;
    setElapsed(0);
    elapsedRef.current = 0;
    setSummary(null);
    setDoubled(false);
    setPaused(false);
    setHighlight(null);
    setPhase('shuffle');
    setBoard(createSolved(n));
    saveSnapshot(null);
    const target = shuffleBoard(n);
    window.setTimeout(() => {
      setCascade(true);
      setBoard(target);
    }, 120);
    window.setTimeout(() => {
      setCascade(false);
      setPhase('play');
    }, 1480);
    audio.slide(2);
    // Prefetch next rewarded unit after a successful mix.
    void prepareRewardedAd();
  };

  /** Mix / replay — Premium skips the ad; everyone else watches a rewarded unit. */
  const requestRestart = () => {
    if (premium) {
      restart();
      return;
    }
    rewardKindRef.current = 'restart';
    setAdKind('rewarded');
  };

  const quit = () => {
    if (mode === 'main') {
      if (movesRef.current > 0 && phaseRef.current === 'play') {
        saveSnapshot({
          level,
          mode,
          board: boardRef.current,
          n,
          moves: movesRef.current,
          elapsedMs: elapsedRef.current,
          hintsUsed: hintsUsed.current,
        });
      } else {
        saveSnapshot(null);
      }
      nav({ name: 'map' });
    } else {
      saveSnapshot(null);
      nav({ name: 'daily' });
    }
  };

  const goNext = () => {
    const store = useStore.getState();
    if (mode === 'main') {
      if (level >= TOTAL_LEVELS) {
        nav({ name: 'map' });
        return;
      }
      if (store.shouldInterstitial()) {
        pendingNextRef.current = true;
        setAdKind('interstitial');
        return;
      }
      preloadArt(level + 1);
      store.startGame({ mode: 'main', level: level + 1 });
      return;
    }
    const nextIdx = store.dailyDone.findIndex((d, i) => !d && i !== dailyIndex);
    if (nextIdx >= 0) store.startGame({ mode: 'daily', level: 1, dailyIndex: nextIdx });
    else nav({ name: 'daily' });
  };

  const onAdDone = (completed: boolean) => {
    const store = useStore.getState();
    if (completed && adKind === 'rewarded') {
      if (rewardKindRef.current === 'restart') {
        store.watchAdReward('restart');
        setAdKind(null);
        restart();
        return;
      }
      if (rewardKindRef.current === 'double') {
        const amt = store.watchAdReward('double');
        audio.coin();
        setDoubled(true);
        store.toast(`Doubled! +${amt} coins`, 'coin');
      } else {
        store.watchAdReward('hint');
        store.toast('+1 hint — tap the bulb!', 'bulb');
      }
      void prepareRewardedAd();
    } else if (!completed && rewardKindRef.current === 'restart') {
      store.toast('Watch the full ad to mix the board', 'play');
    }
    if (adKind === 'interstitial') {
      if (completed) store.noteInterstitialShown();
      void prepareInterstitialAd();
      if (pendingNextRef.current) {
        pendingNextRef.current = false;
        timedInterstitialRef.current = false;
        setAdKind(null);
        if (mode === 'main' && level < TOTAL_LEVELS) {
          preloadArt(level + 1);
          store.startGame({ mode: 'main', level: level + 1 });
        } else {
          nav({ name: 'daily' });
        }
        return;
      }
      timedInterstitialRef.current = false;
      setAdKind(null);
      return;
    }
    setAdKind(null);
  };

  /* ------------------------------ keyboard controls ----------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== 'play' || pausedRef.current) return;
      const b = boardRef.current;
      const blank = b.indexOf(0);
      const br = Math.floor(blank / n);
      const bc = blank % n;
      let pos = -1;
      if (e.key === 'ArrowLeft' && bc < n - 1) pos = blank + 1;
      else if (e.key === 'ArrowRight' && bc > 0) pos = blank - 1;
      else if (e.key === 'ArrowUp' && br < n - 1) pos = blank + n;
      else if (e.key === 'ArrowDown' && br > 0) pos = blank - n;
      if (pos >= 0) {
        e.preventDefault();
        handleTapRef.current(pos);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [n]);

  /* ----------------------------------- render ----------------------------------- */

  const interactive = phase === 'play' && !paused && !adKind && !hintShop && !showHelp;
  const nextLabel =
    mode === 'main'
      ? level >= TOTAL_LEVELS
        ? 'Quest Complete!'
        : `Level ${level + 1}`
      : 'Next Puzzle';

  return (
    <div className="flex h-full flex-col px-3 pt-3">
      <Confetti burst={burst} />

      <header className="flex items-center gap-2">
        <IconButton name="pause" label="Pause" onClick={() => setPaused(true)} />
        <div className="q-pill min-w-0 flex-1">
          <span className="font-display truncate text-[15px]" style={{ color: 'var(--t-text)' }}>
            {mode === 'main' ? `Lv ${level} · ${getLevelName(level)}` : `Daily Puzzle ${dailyIndex + 1}`}
          </span>
        </div>
        <span className="q-chip shrink-0">{n}×{n}</span>
      </header>

      <div className="mt-2 flex items-center justify-center gap-2">
        <StatPill icon="moves" value={moves} color="var(--t-accent2)" />
        <StatPill icon="timer" value={fmtClock(elapsed)} color="var(--t-accent)" />
        <StatPill icon="star" value={`par ${PAR_MOVES[n]}`} color="var(--t-gold)" />
      </div>

      <div ref={wrapRef} className="flex min-h-0 flex-1 items-center justify-center py-2">
        <Board
          n={n}
          board={board}
          img={img}
          size={size}
          cascade={cascade}
          interactive={interactive}
          highlight={highlight}
          shakeValue={shakeValue}
          peeking={peeking}
          won={phase === 'won'}
          onTileClick={handleTap}
        />
      </div>

      <div className="flex items-center justify-center gap-2.5 pb-2">
        <ControlBtn icon="undo" label="Undo" onClick={onUndo} />
        <ControlBtn
          icon="eye"
          label="Peek"
          onDown={() => setPeeking(true)}
          onUp={() => setPeeking(false)}
        />
        <ControlBtn
          icon="bulb"
          label="Hint"
          onClick={onHint}
          badge={premium ? '∞' : String(hintsLeft)}
        />
        <ControlBtn icon="restart" label="Mix" onClick={requestRestart} />
      </div>

      {/* Bottom banner — hidden for premium and while a full-screen ad is up. */}
      <BannerAd enabled={!premium && !adKind} className="-mx-3" />

      {paused && phase === 'play' && (
        <PauseMenu
          moves={moves}
          elapsed={elapsed}
          onResume={() => setPaused(false)}
          onRestart={() => {
            setPaused(false);
            requestRestart();
          }}
          onHelp={() => {
            setPaused(false);
            setShowHelp(true);
          }}
          onQuit={quit}
        />
      )}

      {summary && phase === 'won' && (
        <CompleteOverlay
          summary={summary}
          mode={mode}
          level={mode === 'main' ? level : dailyIndex}
          moves={moves}
          timeMs={elapsed}
          doubled={doubled}
          onDouble={() => {
            rewardKindRef.current = 'double';
            setAdKind('rewarded');
          }}
          onNext={goNext}
          onReplay={requestRestart}
          onExit={() => nav({ name: mode === 'main' ? 'map' : 'daily' })}
          nextLabel={nextLabel}
        />
      )}

      {hintShop && (
        <HintShopModal
          onClose={() => setHintShop(false)}
          onWatchAd={() => {
            rewardKindRef.current = 'hint';
            setAdKind('rewarded');
          }}
        />
      )}

      {showHelp && <TutorialOverlay />}

      {adKind && <AdOverlay kind={adKind} onDone={onAdDone} />}
    </div>
  );
}
