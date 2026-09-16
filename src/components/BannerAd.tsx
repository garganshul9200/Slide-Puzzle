import { useEffect, useState } from 'react';
import { hideBannerAd, isNativeAds, showBannerAd } from '../ads/admob';
import { cn } from '../utils/cn';

const WEB_BANNER_H = 50;

/**
 * Bottom banner slot for the play screen.
 * Native: AdMob overlay + spacer so controls stay clear.
 * Web: simulated strip so layout matches device builds.
 */
export function BannerAd({
  enabled,
  className,
}: {
  enabled: boolean;
  className?: string;
}) {
  const native = isNativeAds();
  const [height, setHeight] = useState(enabled ? (native ? 56 : WEB_BANNER_H) : 0);

  useEffect(() => {
    if (!enabled) {
      setHeight(0);
      void hideBannerAd();
      return;
    }

    if (!native) {
      setHeight(WEB_BANNER_H);
      return;
    }

    let alive = true;
    void showBannerAd((h) => {
      if (alive) setHeight(h);
    });

    return () => {
      alive = false;
      void hideBannerAd();
    };
  }, [enabled, native]);

  if (!enabled || height <= 0) return null;

  return (
    <div
      className={cn('relative shrink-0 overflow-hidden', className)}
      style={{ height }}
      role="complementary"
      aria-label="Advertisement"
    >
      {/* Explicit Ad label so the slot is never mistaken for game UI (Families). */}
      <span
        className="pointer-events-none absolute left-2 top-1 z-10 rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest"
        style={{ background: 'rgba(0,0,0,.55)', color: '#ffb638' }}
      >
        Ad
      </span>
      {!native && (
        <div
          className="flex h-full w-full items-center justify-center gap-2 text-[11px] font-black uppercase tracking-widest"
          style={{
            background: 'linear-gradient(90deg, #1a2433, #243044 50%, #1a2433)',
            color: '#8b93a7',
            borderTop: '1px solid rgba(255,255,255,.08)',
          }}
        >
          Banner · simulated
        </div>
      )}
    </div>
  );
}
