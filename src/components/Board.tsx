/**
 * The puzzle board. Tiles are absolutely positioned and moved purely with
 * GPU-composited transforms, so slides stay at 60fps even on 6x6 grids.
 * The image is sliced per-tile with background-position math — no canvas
 * chopping, no extra DOM per frame.
 */

import { useMemo } from 'react';
import type { Board as BoardModel } from '../game/puzzle';
import { cn } from '../utils/cn';

const PAD = 9;

export function Board({
  n,
  board,
  img,
  size,
  cascade,
  interactive,
  highlight,
  shakeValue,
  peeking,
  won,
  onTileClick,
}: {
  n: number;
  board: BoardModel;
  img: string;
  size: number;
  /** True while the shuffle-in animation plays. */
  cascade: boolean;
  interactive: boolean;
  /** Position to glow (hint). */
  highlight: number | null;
  /** Tile value that should shake (invalid move). */
  shakeValue: number | null;
  peeking: boolean;
  won: boolean;
  onTileClick: (pos: number) => void;
}) {
  const cell = (size - PAD * 2) / n;

  const posOf = useMemo(() => {
    const m = new Array<number>(n * n);
    board.forEach((v, i) => {
      m[v] = i;
    });
    return m;
  }, [board, n]);

  const values = useMemo(
    () => Array.from({ length: n * n - 1 }, (_, i) => i + 1),
    [n],
  );

  const blankPos = posOf[0];
  const blankR = Math.floor(blankPos / n);
  const blankC = blankPos % n;

  return (
    <div
      className="relative select-none touch-manipulation"
      style={{
        width: size,
        height: size,
        borderRadius: 22,
        background: 'var(--t-boardbg)',
        boxShadow:
          'inset 0 2px 12px rgba(0,0,0,.5), 0 0 0 4px var(--t-frame), 0 20px 44px rgba(0,0,0,.42)',
      }}
    >
      {/* empty slot marker */}
      <div
        className="absolute rounded-lg"
        style={{
          width: cell - 7,
          height: cell - 7,
          transform: `translate(${PAD + blankC * cell + 3.5}px, ${PAD + blankR * cell + 3.5}px)`,
          transition: 'transform var(--slide-ms,160ms) ease',
          background: 'rgba(0,0,0,0.3)',
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,.55)',
        }}
      />

      {values.map((v) => {
        const pos = posOf[v];
        const r = Math.floor(pos / n);
        const c = pos % n;
        const gr = Math.floor((v - 1) / n);
        const gc = (v - 1) % n;
        const highlighted = highlight === pos;
        return (
          <div
            key={v}
            className="absolute"
            style={{
              width: cell - 7,
              height: cell - 7,
              transform: `translate(${PAD + c * cell + 3.5}px, ${PAD + r * cell + 3.5}px)`,
              transition: cascade
                ? 'transform 640ms cubic-bezier(.2,1.1,.35,1)'
                : 'transform var(--slide-ms,160ms) cubic-bezier(.25,.9,.3,1.15)',
              transitionDelay: cascade ? `${((v * 7) % (n * n)) * 16}ms` : '0ms',
              zIndex: 2,
            }}
            onClick={interactive ? () => onTileClick(pos) : undefined}
          >
            <div
              className={cn(
                'relative h-full w-full overflow-hidden rounded-lg',
                interactive && 'cursor-pointer',
                shakeValue === v && 'anim-shake',
              )}
              style={{
                backgroundImage: `url(${img})`,
                backgroundSize: `${n * 100}% ${n * 100}%`,
                backgroundPosition: `${(gc / (n - 1)) * 100}% ${(gr / (n - 1)) * 100}%`,
                boxShadow: highlighted
                  ? 'inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 3px var(--t-gold), 0 0 24px rgba(255,182,56,.85)'
                  : won
                    ? 'inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 1px rgba(255,255,255,.35)'
                    : 'inset 0 1px 0 rgba(255,255,255,.28), inset 0 -2px 0 rgba(0,0,0,.32), 0 3px 8px rgba(0,0,0,.38)',
                filter: won ? 'brightness(1.06) saturate(1.08)' : undefined,
              }}
            >
              {highlighted && (
                <div
                  className="anim-hintpulse pointer-events-none absolute inset-0"
                  style={{ boxShadow: 'inset 0 0 0 3px var(--t-gold)' }}
                />
              )}
            </div>
          </div>
        );
      })}

      {/* peek / win reveal: the whole picture */}
      <div
        className="pointer-events-none absolute overflow-hidden"
        style={{
          inset: PAD - 2,
          borderRadius: 16,
          opacity: peeking || won ? 1 : 0,
          transition: 'opacity .3s ease',
          zIndex: 6,
        }}
      >
        <img
          src={img}
          alt=""
          draggable={false}
          className={cn('h-full w-full', won && 'anim-reveal')}
        />
        {won && (
          <div
            className="absolute inset-0"
            style={{
              boxShadow: 'inset 0 0 0 3px rgba(255,214,102,.9), inset 0 0 60px rgba(255,182,56,.35)',
            }}
          />
        )}
      </div>
    </div>
  );
}
