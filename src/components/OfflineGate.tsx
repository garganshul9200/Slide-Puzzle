import { Icon } from './ui';

/** Full-screen blocker — app waits here until the device is back online. */
export function OfflineGate() {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'linear-gradient(165deg, #061820 0%, #0a2a38 100%)' }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      aria-describedby="offline-desc"
    >
      <div className="app-safe flex w-full max-w-sm flex-col items-center px-8 text-center">
        <span
          className="flex h-20 w-20 items-center justify-center rounded-3xl"
          style={{ background: 'rgba(255,255,255,.06)', color: '#ffb638' }}
        >
          <Icon name="globe" size={40} />
        </span>
        <h1
          id="offline-title"
          className="font-display mt-5 text-3xl"
          style={{ color: '#f2f7f5' }}
        >
          No Internet
        </h1>
        <p
          id="offline-desc"
          className="mt-2 text-sm font-semibold leading-relaxed"
          style={{ color: '#8fb3c2' }}
        >
          Slide Puzzle needs a connection to keep playing. Internet is not
          working — the app will resume automatically when you’re back online.
        </p>
        <div className="mt-6 flex items-center gap-2.5 text-xs font-black uppercase tracking-widest" style={{ color: '#ffb638' }}>
          <span
            className="h-2.5 w-2.5 animate-pulse rounded-full"
            style={{ background: '#ffb638' }}
          />
          Waiting for connection
        </div>
        <div
          className="mt-4 h-1.5 w-40 overflow-hidden rounded-full"
          style={{ background: 'rgba(255,255,255,.08)' }}
        >
          <div
            className="h-full w-1/2 animate-pulse rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #2ec4b6, transparent)' }}
          />
        </div>
      </div>
    </div>
  );
}
