/** Shared UI kit: inline SVG icons, chunky game buttons, panels, modals. */

import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';
import { audio } from '../audio/audio';

/* ---------------------------------- icons ---------------------------------- */

const P: Record<string, ReactNode> = {
  home: (<><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /></>),
  map: (<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M19.4 4.6l-1.8 1.8M6.4 17.6l-1.8 1.8" /></>),
  trophy: (<><path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" /><path d="M8 5H4.5A3.5 3.5 0 0 0 8 9.5M16 5h3.5A3.5 3.5 0 0 1 16 9.5" /><path d="M12 13v4M8 21h8M10 17h4" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  play: <path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" stroke="none" />,
  pause: <path d="M8.5 5v14M15.5 5v14" strokeWidth="3" />,
  back: <path d="M15 5l-7 7 7 7" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  coin: (<><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2" /></>),
  star: <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" fill="currentColor" stroke="none" />,
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  undo: <path d="M4 9h10a6 6 0 0 1 0 12h-3M4 9l5-5M4 9l5 5" />,
  bulb: (<><path d="M12 3a6 6 0 0 1 3.7 10.7c-.7.6-.7 1.4-.7 2.3H9c0-.9 0-1.7-.7-2.3A6 6 0 0 1 12 3Z" /><path d="M9.5 19h5M10.5 21.5h3" /></>),
  gear: (<><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9 16.9 7.1M7.1 16.9l-2.2 2.2" /></>),
  chest: (<><path d="M3 9c0-3 4-5 9-5s9 2 9 5" /><rect x="3" y="9" width="18" height="11" rx="2" /><path d="M3 13h18M12 11v4" /></>),
  flame: <path d="M12 2c1 3 5 5.5 5 10a5 5 0 0 1-10 0c0-2 .9-3.5 2-5 .2 1.8 1 2.8 2 3-.8-3 0-6 1-8Z" fill="currentColor" stroke="none" />,
  check: <path d="M5 13l5 5 9-12" />,
  eye: (<><path d="M2 12c3-6 17-6 20 0-3 6-17 6-20 0Z" /><circle cx="12" cy="12" r="3" /></>),
  restart: <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5" />,
  gift: (<><rect x="4" y="11" width="16" height="9" rx="1" /><path d="M3 7h18v4H3zM12 7v13M12 7c-1.5-3.5-7.5-3.5-7.5 0M12 7c1.5-3.5 7.5-3.5 7.5 0" /></>),
  bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" fill="currentColor" stroke="none" />,
  crown: <path d="M3 8l4 4 5-7 5 7 4-4v11H3V8Z" fill="currentColor" stroke="none" />,
  shield: <path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3Z" />,
  palette: (<><path d="M12 3a9 9 0 1 0 0 18c1.6 0 2.1-1 1.6-2.1-.6-1.3.4-2.4 1.9-2.4H18a3.4 3.4 0 0 0 3-3.8A9 9 0 0 0 12 3Z" /><circle cx="8" cy="10" r="1.3" fill="currentColor" stroke="none" /><circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none" /><circle cx="16" cy="10" r="1.3" fill="currentColor" stroke="none" /></>),
  flag: <path d="M5 3v18M5 4h13l-3 4 3 4H5" />,
  compass: (<><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" fill="currentColor" stroke="none" /></>),
  moves: <path d="M7 8h14M18 5l3 3-3 3M17 16H3M6 13l-3 3 3 3" />,
  gem: (<><path d="M6 3h12l4 6-10 12L2 9l4-6Z" /><path d="M2 9h20M12 21 8 9l4-6 4 6-4 12" /></>),
  cart: (<><path d="M4 4h3l2.5 11H19l2-7H8" /><circle cx="10" cy="19" r="1.6" /><circle cx="17.5" cy="19" r="1.6" /></>),
  timer: (<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></>),
  info: (<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></>),
  heart: <path d="M12 21C4 15 2 10 5.5 6.5 8 4 11 5 12 8c1-3 4-4 6.5-1.5C22 10 20 15 12 21Z" fill="currentColor" stroke="none" />,
  sparkle: <path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3 2-7Z" fill="currentColor" stroke="none" />,
  sound: (<><path d="M4 9v6h4l6 5V4L8 9H4Z" /><path d="M17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11" /></>),
  music: (<><path d="M9 18V6l11-2v12" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="16" r="2" /></>),
  vibe: (<><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M12 18h.01M3.5 8c-1 2-1 6 0 8M20.5 8c1 2 1 6 0 8" /></>),
  skip: (<><path d="M5 5.5 13 12l-8 6.5Z" fill="currentColor" stroke="none" /><path d="M17 5v14" strokeWidth="3" /></>),
  grid: (<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" /></>),
};

export function Icon({
  name,
  size = 20,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      {P[name] ?? P.sparkle}
    </svg>
  );
}

/* --------------------------------- buttons --------------------------------- */

type BtnColor = 'gold' | 'teal' | 'coral' | 'slate' | 'violet' | 'ghost';
type BtnSize = 'sm' | 'md' | 'lg' | 'xl';

export function ChunkyButton({
  color = 'gold',
  size = 'md',
  icon,
  iconRight,
  children,
  onClick,
  disabled,
  className,
}: {
  color?: BtnColor;
  size?: BtnSize;
  icon?: string;
  iconRight?: string;
  children?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const iconSize = size === 'xl' ? 26 : size === 'lg' ? 21 : size === 'sm' ? 15 : 18;
  return (
    <button
      type="button"
      className={cn('q-btn', `q-btn-${color}`, `q-btn-${size}`, className)}
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        audio.click();
        onClick?.();
      }}
    >
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconRight && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}

/** Small round icon-only button used in HUDs. */
export function IconButton({
  name,
  onClick,
  label,
  size = 42,
  className,
  disabled,
}: {
  name: string;
  onClick?: () => void;
  label?: string;
  size?: number;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label ?? name}
      disabled={disabled}
      className={cn('q-icon-btn', className)}
      style={{ width: size, height: size }}
      onClick={() => {
        if (disabled) return;
        audio.click();
        onClick?.();
      }}
    >
      <Icon name={name} size={Math.round(size * 0.52)} />
    </button>
  );
}

/* --------------------------------- layout ---------------------------------- */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('q-panel', className)}>{children}</section>;
}

export function Modal({
  children,
  onClose,
  dismissable = true,
  wide,
}: {
  children: ReactNode;
  onClose?: () => void;
  dismissable?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="app-safe fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 anim-fade"
        onClick={dismissable ? onClose : undefined}
      />
      <div
        className={cn(
          'q-panel relative w-full p-5 anim-pop max-h-[90vh] overflow-y-auto',
          wide ? 'max-w-md' : 'max-w-sm',
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function Toggle({
  on,
  onChange,
  label,
  icon,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon?: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-between gap-3 py-2.5 text-left"
      onClick={() => {
        audio.tap();
        onChange(!on);
      }}
    >
      <span className="flex items-center gap-2.5 font-bold" style={{ color: 'var(--t-text)' }}>
        {icon && <Icon name={icon} size={18} className="opacity-80" />}
        {label}
      </span>
      <span
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ background: on ? 'var(--t-accent)' : 'var(--t-edge)' }}
      >
        <span
          className="absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all"
          style={{ left: on ? 26 : 4 }}
        />
      </span>
    </button>
  );
}

export function ProgressBar({
  value,
  max,
  color,
  className,
}: {
  value: number;
  max: number;
  color?: string;
  className?: string;
}) {
  const pct = max <= 0 ? 0 : Math.min(100, (value / max) * 100);
  return (
    <div className={cn('h-3 w-full overflow-hidden rounded-full', className)} style={{ background: 'var(--t-boardbg)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color ?? 'var(--t-gold)' }}
      />
    </div>
  );
}

export function StatPill({ icon, value, color }: { icon: string; value: ReactNode; color?: string }) {
  return (
    <span
      className="q-pill"
      style={color ? { color, borderColor: `${color}55` } : undefined}
    >
      <Icon name={icon} size={15} />
      <b className="font-extrabold">{value}</b>
    </span>
  );
}

/* --------------------------------- hooks ----------------------------------- */

export function useCountUp(target: number, duration = 900, delay = 0): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    let start = 0;
    const t0 = performance.now() + delay;
    const tick = (t: number) => {
      if (t < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, delay]);
  return v;
}

/** Ticks every `ms` — used for countdowns. */
export function useTicker(ms = 1000): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const iv = window.setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(iv);
  }, [ms]);
  return tick;
}
