/** Visual FX: ambient floating particles + confetti cannons (canvas, 60fps). */

import { useEffect, useRef } from 'react';

export function AmbientParticles({
  colors,
  reduce,
}: {
  colors: [string, string, string];
  reduce: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [c0, c1, c2] = colors;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const palette = [c0, c1, c2];
    const count = reduce ? 0 : 22;
    const ps = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1.2 + Math.random() * 3.4,
      c: palette[(Math.random() * palette.length) | 0],
      vx: (Math.random() - 0.5) * 0.16,
      vy: -(0.08 + Math.random() * 0.26),
      tw: Math.random() * 6.28,
    }));
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);
    let raf = 0;
    let running = true;
    const draw = (t: number) => {
      if (!running) return;
      if (document.hidden) {
        raf = requestAnimationFrame(draw);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.x += p.vx + Math.sin(t / 2400 + p.tw) * 0.1;
        p.y += p.vy;
        if (p.y < -8) {
          p.y = h + 8;
          p.x = Math.random() * w;
        }
        if (p.x < -8) p.x = w + 8;
        if (p.x > w + 8) p.x = -8;
        ctx.globalAlpha = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(t / 900 + p.tw));
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    if (reduce) draw(0);
    else raf = requestAnimationFrame(draw);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [c0, c1, c2, reduce]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-0" />;
}

export function Confetti({ burst, colors }: { burst: number; colors?: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (burst <= 0) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = (canvas.width = window.innerWidth);
    const h = (canvas.height = window.innerHeight);
    const cols = colors?.length
      ? colors
      : ['#ffb638', '#ff5d73', '#2ec4b6', '#4cc9f0', '#ffffff'];

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      rot: number; vr: number; w: number; h: number;
      c: string; life: number; round: boolean;
    }
    const ps: Particle[] = [];
    const spawn = (x: number, y: number, ang: number, spread: number, count: number) => {
      for (let i = 0; i < count; i++) {
        const a = ang + (Math.random() - 0.5) * spread;
        const sp = 7 + Math.random() * 8;
        ps.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 3,
          rot: Math.random() * 6.28,
          vr: (Math.random() - 0.5) * 0.3,
          w: 5 + Math.random() * 6,
          h: 3 + Math.random() * 4,
          c: cols[(Math.random() * cols.length) | 0],
          life: 150 + Math.random() * 60,
          round: Math.random() < 0.3,
        });
      }
    };
    spawn(w * 0.12, h * 0.72, -Math.PI / 3, 0.7, 60);
    spawn(w * 0.88, h * 0.72, (-2 * Math.PI) / 3, 0.7, 60);
    spawn(w * 0.5, h * 0.38, -Math.PI / 2, 1.5, 44);

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vy += 0.14;
        p.vx *= 0.992;
        p.vy *= 0.992;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= 1;
        if (p.life <= 0 || p.y > h + 20) {
          ps.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.c;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2.4, 0, 6.283);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (ps.length) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, w, h);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[80]" />;
}
