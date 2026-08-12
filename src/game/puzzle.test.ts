/**
 * Unit tests for the puzzle engine.
 * Run with: npx vitest run
 */

import { describe, expect, it } from 'vitest';
import {
  applySlide,
  bestHintMove,
  countInversions,
  createSolved,
  isSolvable,
  isSolved,
  manhattan,
  shuffleBoard,
  slideFromClick,
} from './puzzle';
import { mulberry32 } from './utils';

describe('board model', () => {
  it('creates a solved board with the blank last', () => {
    for (const n of [3, 4, 5, 6]) {
      const b = createSolved(n);
      expect(b).toHaveLength(n * n);
      expect(isSolved(b)).toBe(true);
      expect(b[b.length - 1]).toBe(0);
    }
  });

  it('detects unsolved boards', () => {
    const b = createSolved(3);
    [b[0], b[1]] = [b[1], b[0]];
    expect(isSolved(b)).toBe(false);
  });
});

describe('solvability', () => {
  it('solved boards are solvable on every grid size', () => {
    for (const n of [3, 4, 5, 6]) expect(isSolvable(createSolved(n), n)).toBe(true);
  });

  it('rejects the classic unsolvable 3x3 (tiles 7 and 8 swapped)', () => {
    expect(isSolvable([1, 2, 3, 4, 5, 6, 8, 7, 0], 3)).toBe(false);
  });

  it('handles even-grid blank row parity', () => {
    // Blank on bottom row (row 4 from bottom... n=4 -> rowFromBottom=1): needs even inversions.
    expect(isSolvable(createSolved(4), 4)).toBe(true);
    const b = createSolved(4);
    [b[0], b[1]] = [b[1], b[0]]; // one inversion, blank still at bottom -> unsolvable
    expect(countInversions(b)).toBe(1);
    expect(isSolvable(b, 4)).toBe(false);
  });
});

describe('shuffleBoard', () => {
  it('always produces solvable, scrambled boards (500 trials, all sizes)', () => {
    for (const n of [3, 4, 5, 6]) {
      const goal = createSolved(n);
      for (let i = 0; i < 125; i++) {
        const rng = mulberry32(i * 7919 + n);
        const b = shuffleBoard(n, rng);
        expect(isSolvable(b, n)).toBe(true);
        expect(isSolved(b)).toBe(false);
        const misplaced = b.reduce((acc, v, k) => acc + (v !== goal[k] ? 1 : 0), 0);
        expect(misplaced).toBeGreaterThanOrEqual(Math.ceil(n * n * 0.6));
      }
    }
  });

  it('is deterministic for a given seed', () => {
    const a = shuffleBoard(4, mulberry32(42));
    const b = shuffleBoard(4, mulberry32(42));
    expect(a).toEqual(b);
  });
});

describe('slides', () => {
  it('returns null for clicks not sharing a row/column with the blank', () => {
    const b = [1, 2, 3, 4, 0, 5, 6, 7, 8]; // blank center (pos 4)
    expect(slideFromClick(b, 3, 0)).toBeNull();
    expect(slideFromClick(b, 3, 8)).toBeNull();
  });

  it('slides a single adjacent tile', () => {
    const b = [1, 2, 3, 4, 0, 5, 6, 7, 8];
    const slide = slideFromClick(b, 3, 5);
    expect(slide).toEqual([5]);
    const next = applySlide(b, slide!);
    expect(next).toEqual([1, 2, 3, 4, 5, 0, 6, 7, 8]);
  });

  it('slides a whole row segment toward the blank, ordered correctly', () => {
    const b = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // blank at row 0 col 0
    const slide = slideFromClick(b, 3, 2); // tiles 1,2 shift left
    expect(slide).toEqual([1, 2]);
    const next = applySlide(b, slide!);
    expect(next).toEqual([1, 2, 0, 3, 4, 5, 6, 7, 8]);
  });

  it('slides columns from both directions', () => {
    const b = [1, 2, 3, 4, 5, 6, 0, 7, 8]; // blank bottom-left (pos 6)
    const up = slideFromClick(b, 3, 0); // column above blank
    expect(up).toEqual([3, 0]);
    expect(applySlide(b, up!)).toEqual([0, 2, 3, 1, 5, 6, 4, 7, 8]);
  });
});

describe('manhattan + hints', () => {
  it('is zero only when solved', () => {
    const b = createSolved(3);
    expect(manhattan(b, 3)).toBe(0);
    const s = shuffleBoard(3, mulberry32(7));
    expect(manhattan(s, 3)).toBeGreaterThan(0);
  });

  it('hint moves are always legal single steps adjacent to the blank', () => {
    for (let i = 0; i < 200; i++) {
      const n = 3 + (i % 4);
      const b = shuffleBoard(n, mulberry32(i * 131 + 5));
      const hint = bestHintMove(b, n, mulberry32(i));
      expect(hint).not.toBeNull();
      const slide = slideFromClick(b, n, hint!);
      expect(slide).not.toBeNull();
      expect(slide).toHaveLength(1);
    }
  });

  it('a hint improves or holds the heuristic on typical scrambles', () => {
    let improvedOrEqual = 0;
    for (let i = 0; i < 100; i++) {
      const b = shuffleBoard(3, mulberry32(i * 977 + 3));
      const hint = bestHintMove(b, 3, mulberry32(i))!;
      const delta = manhattan(applySlide(b, [hint]), 3) - manhattan(b, 3);
      if (delta <= 0) improvedOrEqual++;
    }
    expect(improvedOrEqual).toBeGreaterThan(60);
  });
});
