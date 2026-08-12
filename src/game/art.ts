/**
 * Procedural level artwork.
 *
 * Every level (and every daily challenge) gets a unique, deterministic,
 * seeded painting rendered to a cached canvas data-URL. This keeps the
 * bundle tiny, loads instantly on any device, stays sharp at every DPI,
 * and guarantees 100 distinct images + infinite daily images with zero
 * shipped assets.
 *
 * In the native build these slots are replaced by assets/images/levels/
 * 001.jpg ... 100.jpg served through React Native FastImage — the rest of
 * the pipeline (lazy load, cache, preload-next) is identical.
 */

import { hashSeed, mulberry32 } from './utils';

type Rng = () => number;
type DrawFn = (ctx: CanvasRenderingContext2D, s: number, rng: Rng, pal: string[]) => void;

/** Saturated, high-contrast palettes — tiles must stay readable mid-slide. */
const PALETTES: string[][] = [
  ['#0b2530', '#12455a', '#2ec4b6', '#8ee3cf', '#ffbf47', '#ff6b6b'],
  ['#1a1033', '#3d2b73', '#7b4dd6', '#ff5d8f', '#ffb85c', '#f9f5ff'],
  ['#04151f', '#0d3b4f', '#17a398', '#8ee3cf', '#ffd166', '#ef476f'],
  ['#2b0f0e', '#7a2e2b', '#e0532f', '#ff9f1c', '#ffe066', '#fdf0d5'],
  ['#0f2027', '#203a43', '#2c5364', '#59c1bd', '#a8e6cf', '#ffd3b6'],
  ['#141420', '#3a0ca3', '#4361ee', '#4cc9f0', '#f72585', '#ffe66d'],
  ['#10221b', '#1e5143', '#3e8e5a', '#95d5b2', '#f4a261', '#e76f51'],
  ['#250902', '#660708', '#a4161a', '#e5383b', '#ffba08', '#fff3d6'],
];

const cache = new Map<string, string>();
const CACHE_MAX = 48;
const SIZE = 640;

function rgba(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function vgrad(ctx: CanvasRenderingContext2D, s: number, c1: string, c2: string): void {
  const g = ctx.createLinearGradient(0, 0, 0, s);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}

function starfield(
  ctx: CanvasRenderingContext2D,
  s: number,
  rng: Rng,
  color: string,
  count: number,
  maxY: number,
): void {
  for (let i = 0; i < count; i++) {
    const x = rng() * s;
    const y = rng() * maxY;
    const r = 0.5 + rng() * 1.7;
    ctx.fillStyle = rgba(color, 0.25 + rng() * 0.7);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function sunDisc(ctx: CanvasRenderingContext2D, s: number, rng: Rng, color: string): void {
  const x = s * (0.25 + rng() * 0.5);
  const y = s * (0.16 + rng() * 0.2);
  const r = s * (0.09 + rng() * 0.05);
  const glow = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * 3.2);
  glow.addColorStop(0, rgba(color, 0.5));
  glow.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Layered mountain ridges under a sun — the classic "postcard" opener. */
const mountains: DrawFn = (ctx, s, rng, pal) => {
  vgrad(ctx, s, pal[1], pal[0]);
  starfield(ctx, s, rng, pal[5], 60, s * 0.55);
  sunDisc(ctx, s, rng, pal[4]);
  const layers = 4;
  const layerColors = [pal[2], pal[3], pal[1], pal[0]];
  for (let L = 0; L < layers; L++) {
    const base = s * (0.42 + L * 0.15);
    const amp = s * (0.045 + rng() * 0.055) * (1 + L * 0.4);
    ctx.fillStyle = rgba(layerColors[L], 0.96);
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.lineTo(0, base);
    const steps = 6 + Math.floor(rng() * 4);
    let y = base;
    for (let i = 1; i <= steps; i++) {
      const x = (s / steps) * i;
      y = base + (rng() - 0.5) * 2 * amp * 0.6;
      ctx.lineTo(x - s / steps / 2, Math.max(s * 0.06, y - amp * (0.5 + rng() * 0.9)));
      ctx.lineTo(x, y);
    }
    ctx.lineTo(s, y);
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
  }
};

/** Rolling neon wave bands — strong horizontal cues for sliding. */
const waves: DrawFn = (ctx, s, rng, pal) => {
  vgrad(ctx, s, pal[1], pal[0]);
  starfield(ctx, s, rng, pal[5], 40, s * 0.35);
  sunDisc(ctx, s, rng, pal[4]);
  const bands = 5;
  const cols = [pal[2], pal[3], pal[4], pal[5], pal[2]];
  for (let b = 0; b < bands; b++) {
    const yTop = s * (0.36 + b * 0.13);
    const amp = s * (0.018 + rng() * 0.03);
    const freq = 2 + rng() * 3;
    const phase = rng() * Math.PI * 2;
    ctx.fillStyle = rgba(cols[b], 0.88 - b * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, s);
    ctx.lineTo(0, yTop);
    for (let x = 0; x <= s; x += 8) {
      ctx.lineTo(x, yTop + Math.sin((x / s) * Math.PI * 2 * freq + phase) * amp);
    }
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
  }
};

/** Bauhaus quarter-circles — bold geometry, ideal for 4x4+. */
const bauhaus: DrawFn = (ctx, s, rng, pal) => {
  ctx.fillStyle = pal[5];
  ctx.fillRect(0, 0, s, s);
  const cells = 4;
  const cs = s / cells;
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      const col = pal[Math.floor(rng() * 5)];
      ctx.save();
      ctx.translate(c * cs + cs / 2, r * cs + cs / 2);
      ctx.rotate(Math.floor(rng() * 4) * (Math.PI / 2));
      ctx.translate(-cs / 2, -cs / 2);
      ctx.fillStyle = col;
      const shape = Math.floor(rng() * 4);
      ctx.beginPath();
      if (shape === 0) {
        ctx.arc(cs / 2, cs / 2, cs / 2, 0, Math.PI * 2);
      } else if (shape === 1) {
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, cs, 0, Math.PI / 2);
        ctx.closePath();
      } else if (shape === 2) {
        ctx.arc(cs / 2, cs, cs / 2, Math.PI, 0);
        ctx.closePath();
      } else {
        ctx.moveTo(0, 0);
        ctx.lineTo(cs, 0);
        ctx.lineTo(0, cs);
        ctx.closePath();
      }
      ctx.fill();
      ctx.restore();
    }
  }
};

/** Ringed planet, nebulae and a dense starfield. */
const cosmos: DrawFn = (ctx, s, rng, pal) => {
  const g = ctx.createRadialGradient(s / 2, s * 0.38, s * 0.08, s / 2, s / 2, s * 0.78);
  g.addColorStop(0, pal[1]);
  g.addColorStop(1, pal[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  starfield(ctx, s, rng, pal[5], 150, s);
  for (let i = 0; i < 2; i++) {
    const nx = s * (0.2 + rng() * 0.6);
    const ny = s * (0.2 + rng() * 0.6);
    const nr = s * (0.18 + rng() * 0.15);
    const neb = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
    neb.addColorStop(0, rgba(pal[3 + i], 0.2));
    neb.addColorStop(1, rgba(pal[3 + i], 0));
    ctx.fillStyle = neb;
    ctx.fillRect(nx - nr, ny - nr, nr * 2, nr * 2);
  }
  const cx = s * (0.35 + rng() * 0.3);
  const cy = s * (0.32 + rng() * 0.22);
  const r = s * (0.13 + rng() * 0.06);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.45);
  ctx.strokeStyle = rgba(pal[4], 0.85);
  ctx.lineWidth = s * 0.022;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.9, r * 0.55, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  const pg = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r);
  pg.addColorStop(0, pal[3]);
  pg.addColorStop(1, pal[2]);
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = rgba(pal[5], 0.95);
  ctx.beginPath();
  ctx.arc(s * (0.15 + rng() * 0.7), s * (0.6 + rng() * 0.25), s * 0.025, 0, Math.PI * 2);
  ctx.fill();
};

/** Aurora ribbons over a dark pine silhouette. */
const aurora: DrawFn = (ctx, s, rng, pal) => {
  vgrad(ctx, s, pal[0], '#020608');
  starfield(ctx, s, rng, pal[5], 90, s * 0.7);
  const cols = [pal[2], pal[3], pal[4]];
  for (let i = 0; i < 3; i++) {
    const yBase = s * (0.22 + i * 0.17);
    const thick = s * (0.07 + rng() * 0.05);
    const f1 = 1.5 + rng() * 2;
    const f2 = f1 + 0.8;
    const p1 = rng() * 6.28;
    const p2 = rng() * 6.28;
    ctx.fillStyle = rgba(cols[i], 0.5);
    ctx.beginPath();
    ctx.moveTo(0, yBase + Math.sin(p1) * s * 0.04);
    for (let x = 0; x <= s; x += 10) {
      ctx.lineTo(x, yBase + Math.sin((x / s) * 6.28 * f1 + p1) * s * 0.05);
    }
    for (let x = s; x >= 0; x -= 10) {
      ctx.lineTo(
        x,
        yBase + thick + Math.sin((x / s) * 6.28 * f2 + p2) * s * 0.04,
      );
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = rgba(pal[0], 0.98);
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.lineTo(0, s * 0.82);
  for (let x = 0; x <= s; x += s / 9) {
    ctx.lineTo(x + s / 18, s * (0.74 + rng() * 0.05));
    ctx.lineTo(x + s / 9, s * 0.84);
  }
  ctx.lineTo(s, s);
  ctx.closePath();
  ctx.fill();
};

/** Mosaic of glossy orbs — playful, great for the early levels. */
const meadow: DrawFn = (ctx, s, rng, pal) => {
  vgrad(ctx, s, pal[1], pal[0]);
  const rows = 6;
  const cs = s / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < rows; c++) {
      const cx = (c + 0.5 + (r % 2 === 0 ? 0 : 0.35)) * cs;
      const cy = (r + 0.5) * cs;
      const rad = cs * (0.34 + rng() * 0.12);
      const col = pal[2 + Math.floor(rng() * 4)];
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = rgba(pal[5], 0.55);
      ctx.beginPath();
      ctx.arc(cx - rad * 0.32, cy - rad * 0.32, rad * 0.22, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

const STYLES: DrawFn[] = [mountains, waves, bauhaus, cosmos, aurora, meadow];

function styleFor(seed: number): number {
  return Math.floor(mulberry32(seed ^ 0x9e3779b9)() * STYLES.length);
}

function make(seed: number): string {
  const key = `art-${seed}`;
  const hit = cache.get(key);
  if (hit) {
    // Refresh LRU order.
    cache.delete(key);
    cache.set(key, hit);
    return hit;
  }
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const rng = mulberry32(seed);
  const pal = PALETTES[Math.floor(rng() * PALETTES.length)];
  STYLES[styleFor(seed)](ctx, SIZE, rng, pal);
  const url = canvas.toDataURL('image/jpeg', 0.92);
  cache.set(key, url);
  if (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  return url;
}

/** Artwork for main-quest level 1..100. */
export function getLevelArt(level: number): string {
  return make(hashSeed(level, 0x51ed, 7919));
}

/** Artwork for a daily challenge — deterministic per UTC day + slot. */
export function getDailyArt(day: string, index: number): string {
  const dayNum = parseInt(day.replace(/-/g, ''), 10) % 1000000;
  return make(hashSeed(dayNum, index + 1, 0xda17));
}

/** Warm the cache for an upcoming level (called after a win / on hover). */
export function preloadArt(level: number): void {
  try {
    getLevelArt(level);
  } catch {
    /* non-fatal */
  }
}

const ADJ = [
  'Amber', 'Velvet', 'Crimson', 'Hidden', 'Golden', 'Frozen', 'Emerald', 'Midnight',
  'Coral', 'Misty', 'Ancient', 'Neon', 'Lunar', 'Wild', 'Silent', 'Radiant',
];
const NOUN = [
  'Peaks', 'Shores', 'Grove', 'Nebula', 'Dunes', 'Falls', 'Meadow', 'Reef',
  'Canyon', 'Orbit', 'Bloom', 'Valley', 'Temple', 'Harbor', 'Ridge', 'Lagoon',
];

export function getLevelName(level: number): string {
  const rng = mulberry32(hashSeed(level, 0xa0e, 31));
  return `${ADJ[Math.floor(rng() * ADJ.length)]} ${NOUN[Math.floor(rng() * NOUN.length)]}`;
}
