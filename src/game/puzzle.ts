/**
 * Core sliding-puzzle engine — pure functions, fully unit-tested.
 *
 * Board model: array of length n*n. Values 1..n*n-1 are tiles,
 * 0 is the empty slot, the array index is the cell position
 * (row-major: row = floor(i / n), col = i % n).
 * Solved state is [1, 2, ..., n*n-1, 0].
 */

export type Board = number[];

export const createSolved = (n: number): Board =>
  Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));

export const isSolved = (b: Board): boolean =>
  b.every((v, i) => v === (i + 1) % b.length);

export function countInversions(b: Board): number {
  const vals = b.filter((v) => v !== 0);
  let inv = 0;
  for (let i = 0; i < vals.length; i++)
    for (let j = i + 1; j < vals.length; j++) if (vals[i] > vals[j]) inv++;
  return inv;
}

/**
 * Classic 15-puzzle solvability rule.
 * Odd grid: solvable iff inversions are even.
 * Even grid: solvable iff (inversions + blank row counted from the bottom,
 * 1-indexed) is odd.
 */
export function isSolvable(b: Board, n: number): boolean {
  const inv = countInversions(b);
  if (n % 2 === 1) return inv % 2 === 0;
  const blankRowFromBottom = n - Math.floor(b.indexOf(0) / n);
  return (inv + blankRowFromBottom) % 2 === 1;
}

/**
 * Fisher–Yates shuffle + solvability validation.
 * If the permutation is unsolvable, swapping any two non-empty tiles flips
 * the inversion parity and fixes it. Re-rolls until the board is genuinely
 * scrambled, so the player never starts from a near-solved state.
 */
export function shuffleBoard(n: number, rand: () => number = Math.random): Board {
  const goal = createSolved(n);
  for (let attempt = 0; attempt < 100; attempt++) {
    const b = goal.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    if (!isSolvable(b, n)) {
      const i = b.findIndex((v) => v !== 0);
      const j = b.findIndex((v, k) => v !== 0 && k > i);
      [b[i], b[j]] = [b[j], b[i]];
    }
    if (isSolved(b)) continue;
    const misplaced = b.reduce((acc, v, i) => acc + (v !== goal[i] ? 1 : 0), 0);
    if (misplaced >= Math.ceil(b.length * 0.6)) return b;
  }
  // Practically unreachable fallback: a 3-cycle is an even permutation,
  // solvable on every grid size.
  const b = goal.slice();
  [b[0], b[1], b[2]] = [b[1], b[2], b[0]];
  return b;
}

/**
 * Tiles that slide when the player taps `click`.
 * Supports multi-tile row/column slides: tapping any tile sharing a row or
 * column with the empty slot shifts the whole segment toward it.
 * Returns positions ordered "tile adjacent to empty first", or null.
 */
export function slideFromClick(b: Board, n: number, click: number): number[] | null {
  const blank = b.indexOf(0);
  if (click === blank || click < 0 || click >= b.length) return null;
  const br = Math.floor(blank / n);
  const bc = blank % n;
  const cr = Math.floor(click / n);
  const cc = click % n;
  const positions: number[] = [];
  if (br === cr) {
    const step = cc > bc ? 1 : -1;
    for (let c = bc + step; c !== cc + step; c += step) positions.push(cr * n + c);
    return positions;
  }
  if (bc === cc) {
    const step = cr > br ? 1 : -1;
    for (let r = br + step; r !== cr + step; r += step) positions.push(r * n + bc);
    return positions;
  }
  return null;
}

/** Applies an ordered slide (each listed tile hops one cell toward empty). */
export function applySlide(b: Board, positions: number[]): Board {
  const next = b.slice();
  let blank = next.indexOf(0);
  for (const p of positions) {
    next[blank] = next[p];
    next[p] = 0;
    blank = p;
  }
  return next;
}

/** Manhattan distance of all tiles from their goal cells (heuristic). */
export function manhattan(b: Board, n: number): number {
  let sum = 0;
  for (let i = 0; i < b.length; i++) {
    const v = b[i];
    if (v === 0) continue;
    sum +=
      Math.abs(Math.floor((v - 1) / n) - Math.floor(i / n)) +
      Math.abs(((v - 1) % n) - (i % n));
  }
  return sum;
}

/**
 * Hint engine: evaluates every single-step move adjacent to the empty slot
 * and picks the one that most reduces Manhattan distance.
 */
export function bestHintMove(
  b: Board,
  n: number,
  rand: () => number = Math.random,
): number | null {
  const blank = b.indexOf(0);
  const br = Math.floor(blank / n);
  const bc = blank % n;
  const candidates: number[] = [];
  if (br > 0) candidates.push(blank - n);
  if (br < n - 1) candidates.push(blank + n);
  if (bc > 0) candidates.push(blank - 1);
  if (bc < n - 1) candidates.push(blank + 1);
  if (candidates.length === 0) return null;
  const before = manhattan(b, n);
  let bestDelta = Infinity;
  let best: number[] = [];
  for (const p of candidates) {
    const delta = manhattan(applySlide(b, [p]), n) - before;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = [p];
    } else if (delta === bestDelta) {
      best.push(p);
    }
  }
  return best[Math.floor(rand() * best.length)];
}
