/** Deterministic RNG, UTC date keys (anti clock-cheat) and formatting helpers. */

/** Mulberry32 — tiny, fast, seedable PRNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a style hash combining several integer parts into one seed. */
export function hashSeed(...parts: number[]): number {
  let h = 2166136261 >>> 0;
  for (const p of parts) {
    h ^= p | 0;
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * UTC day key, e.g. "2026-02-14".
 * UTC (not local time) so changing the phone timezone/clock cannot
 * re-roll dailies, hints or login streaks.
 */
export function dayKey(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}

export function weekKey(d: Date = new Date()): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function prevDayKey(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(Date.UTC(y, m - 1, d - 1)));
}

/** ms until next UTC midnight (daily challenge reset countdown). */
export function msUntilMidnight(now: Date = new Date()): number {
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${String(m).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;
}

export function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtClock(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
}

export function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(n);
}

/** Haptics (no-op where unsupported; gated by the player's setting). */
export function buzz(pattern: number | number[], enabled: boolean): void {
  if (!enabled) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export function makeDeviceId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* noop */
  }
  return `tq-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
