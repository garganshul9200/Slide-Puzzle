import { useState } from 'react';
import { audio } from '../audio/audio';
import { AdOverlay } from '../components/overlays';
import { ChunkyButton, Icon, Modal, Panel, ProgressBar, Toggle } from '../components/ui';
import { AVATARS, COUNTRIES, SHOP, THEMES, xpProgress } from '../game/config';
import { fmtNum, fmtTime } from '../game/utils';
import { useStore } from '../state/store';

function Avatar({ id, size = 56 }: { id: number; size?: number }) {
  const a = AVATARS[id % AVATARS.length];
  const mouth = id % 3;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill={a.bg} stroke="rgba(0,0,0,.25)" strokeWidth="2.5" />
      <circle cx="23" cy="27" r="4.2" fill={a.face} />
      <circle cx="41" cy="27" r="4.2" fill={a.face} />
      {mouth === 0 && <path d="M22 41q10 9 20 0" stroke={a.face} strokeWidth="3.4" fill="none" strokeLinecap="round" />}
      {mouth === 1 && <ellipse cx="32" cy="43" rx="7" ry="5" fill={a.face} />}
      {mouth === 2 && <path d="M22 43q5 5 10 0q5 5 10 0" stroke={a.face} strokeWidth="3.2" fill="none" strokeLinecap="round" />}
    </svg>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="q-panel px-3 py-2">
      <div className="text-[10px] font-black uppercase tracking-wider" style={{ color: 'var(--t-sub)' }}>{label}</div>
      <div className="font-display text-lg leading-tight" style={{ color: 'var(--t-text)' }}>{value}</div>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h2 className="font-display mt-5 flex items-center gap-2 text-xl" style={{ color: 'var(--t-accent)' }}>
      <Icon name={icon} size={20} /> {children}
    </h2>
  );
}

export function ProfileScreen() {
  const s = useStore();
  const prog = xpProgress(s.xp);
  const [info, setInfo] = useState<'privacy' | 'terms' | null>(null);
  const [adOpen, setAdOpen] = useState(false);
  const [buying, setBuying] = useState(false);

  const st = s.stats;
  const avgTime = st.wins ? fmtTime(st.totalTimeMs / st.wins) : '—';
  const avgMoves = st.wins ? (st.totalMoves / st.wins).toFixed(1) : '—';

  const buyPremium = () => {
    if (s.premium || buying) return;
    setBuying(true);
    window.setTimeout(() => {
      useStore.getState().buyPremium();
      audio.jingle();
      setBuying(false);
    }, 1200);
  };

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      {/* identity */}
      <Panel className="p-4">
        <div className="flex items-center gap-3.5">
          <button type="button" onClick={() => s.setProfile({ avatarId: (s.avatarId + 1) % AVATARS.length })} aria-label="Change avatar">
            <Avatar id={s.avatarId} />
          </button>
          <div className="min-w-0 flex-1">
            <input
              className="q-input font-display"
              value={s.username}
              maxLength={16}
              onChange={(e) => s.setProfile({ username: e.target.value })}
              aria-label="Username"
            />
            <div className="mt-1 flex items-center gap-2">
              <select
                className="q-select"
                value={s.country}
                onChange={(e) => s.setProfile({ country: e.target.value })}
                aria-label="Country"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {s.premium && (
                <span className="q-chip" style={{ color: 'var(--t-gold)', borderColor: 'var(--t-gold)' }}>
                  <Icon name="crown" size={12} /> PREMIUM
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl" style={{ color: 'var(--t-accent2)' }}>Lv {prog.level}</div>
            <div className="text-[10px] font-black uppercase" style={{ color: 'var(--t-sub)' }}>{fmtNum(s.xp)} XP</div>
          </div>
        </div>
        <div className="mt-2.5">
          <ProgressBar value={prog.into} max={prog.need} color="var(--t-accent2)" />
        </div>
        <div className="mt-2 text-[11px] font-bold" style={{ color: 'var(--t-sub)' }}>
          Device account <span className="opacity-70">{s.deviceId.slice(0, 13)}…</span> · progress saved automatically
        </div>
      </Panel>

      {/* stats */}
      <SectionTitle icon="grid">Statistics</SectionTitle>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <MiniStat label="Played" value={fmtNum(st.gamesPlayed)} />
        <MiniStat label="Wins" value={fmtNum(st.wins)} />
        <MiniStat label="Levels" value={`${s.completedLevels.length}/100`} />
        <MiniStat label="Avg time" value={avgTime} />
        <MiniStat label="Avg moves" value={avgMoves} />
        <MiniStat label="Total moves" value={fmtNum(st.totalMoves)} />
        <MiniStat label="Hints used" value={fmtNum(st.hintsUsed)} />
        <MiniStat label="Ads watched" value={fmtNum(st.adsWatched)} />
        <MiniStat label="Perfect runs" value={fmtNum(st.perfectRuns)} />
        <MiniStat label="Dailies done" value={fmtNum(st.dailyCompleted)} />
        <MiniStat label="Best streak" value={`${st.longestStreak}d`} />
        <MiniStat label="Streak" value={`${s.streak}d`} />
      </div>

      {/* themes */}
      <SectionTitle icon="palette">Themes</SectionTitle>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {THEMES.map((t) => {
          const owned = s.ownedThemes.includes(t.id);
          const active = s.themeId === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className="q-panel flex flex-col items-center gap-1.5 p-2.5 transition-transform active:scale-95"
              style={{ borderColor: active ? 'var(--t-gold)' : undefined }}
              onClick={() => { audio.tap(); s.buyTheme(t.id); }}
            >
              <span className="flex gap-1">
                {[t.vars.bg2, t.vars.accent, t.vars.gold].map((c, i) => (
                  <span key={i} className="h-4 w-4 rounded-full" style={{ background: c, border: '1px solid rgba(0,0,0,.25)' }} />
                ))}
              </span>
              <span className="text-xs font-extrabold" style={{ color: 'var(--t-text)' }}>{t.name}</span>
              <span className="q-chip" style={{ color: active ? 'var(--t-gold)' : owned ? 'var(--t-accent)' : t.premiumOnly ? 'var(--t-accent2)' : 'var(--t-sub)' }}>
                {active ? 'Active' : owned ? 'Apply' : t.premiumOnly ? 'Premium' : `${t.cost}`}
                {!active && !owned && !t.premiumOnly && <Icon name="coin" size={10} />}
                {t.premiumOnly && !owned && <Icon name="crown" size={10} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* store */}
      <SectionTitle icon="cart">Store</SectionTitle>
      <div className="mt-2 space-y-2">
        <Panel className="flex items-center gap-3 p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--t-panel2)', color: 'var(--t-gold)' }}>
            <Icon name="coin" size={22} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-extrabold" style={{ color: 'var(--t-text)' }}>+{SHOP.rewardedCoins} Coins</div>
            <div className="text-[11px] font-bold" style={{ color: 'var(--t-sub)' }}>Watch a short ad</div>
          </div>
          <ChunkyButton size="sm" color="violet" icon="play" onClick={() => setAdOpen(true)}>Free</ChunkyButton>
        </Panel>
        <Panel className="flex items-center gap-3 p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: 'var(--t-panel2)', color: 'var(--t-accent)' }}>
            <Icon name="bulb" size={22} />
          </span>
          <div className="flex-1">
            <div className="text-sm font-extrabold" style={{ color: 'var(--t-text)' }}>Hint refill +1</div>
            <div className="text-[11px] font-bold" style={{ color: 'var(--t-sub)' }}>Instant, {SHOP.hintRefillCost} coins</div>
          </div>
          <ChunkyButton size="sm" color="gold" icon="coin" disabled={s.coins < SHOP.hintRefillCost} onClick={() => s.buyHintWithCoins()}>
            Buy
          </ChunkyButton>
        </Panel>
        <Panel className="p-4" >
          <div className="flex items-center gap-2">
            <Icon name="crown" size={22} className="shrink-0" />
            <div className="font-display text-xl" style={{ color: 'var(--t-gold)' }}>Tile Quest Premium</div>
          </div>
          <ul className="mt-1.5 space-y-1 text-[13px] font-bold" style={{ color: 'var(--t-sub)' }}>
            <li>· No ads, ever</li>
            <li>· Unlimited hints</li>
            <li>· Exclusive Space theme</li>
            <li>· Premium badge on leaderboards</li>
          </ul>
          {s.premium ? (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-xl py-2.5 font-extrabold" style={{ background: 'var(--t-panel2)', color: 'var(--t-accent)' }}>
              <Icon name="check" size={18} /> Premium active
            </div>
          ) : (
            <ChunkyButton color="gold" size="lg" icon="crown" className="mt-3 w-full" disabled={buying} onClick={buyPremium}>
              {buying ? 'Processing…' : `Unlock · ${SHOP.premiumLabel}`}
            </ChunkyButton>
          )}
        </Panel>
        <ChunkyButton color="slate" size="sm" className="w-full" icon="restart" onClick={() => s.toast('No prior purchases found on this device', 'info')}>
          Restore Purchases
        </ChunkyButton>
      </div>

      {/* settings */}
      <SectionTitle icon="gear">Settings</SectionTitle>
      <Panel className="mt-2 px-4 py-2">
        <Toggle icon="music" label="Music" on={s.settings.music} onChange={(v) => s.updateSettings({ music: v })} />
        {s.settings.music && (
          <input type="range" min={0} max={100} defaultValue={Math.round(s.settings.musicVol * 100)} className="q-range mb-1" aria-label="Music volume"
            onChange={(e) => s.updateSettings({ musicVol: Number(e.target.value) / 100 })} />
        )}
        <Toggle icon="sound" label="Sound effects" on={s.settings.sfx} onChange={(v) => s.updateSettings({ sfx: v })} />
        {s.settings.sfx && (
          <input type="range" min={0} max={100} defaultValue={Math.round(s.settings.sfxVol * 100)} className="q-range mb-1" aria-label="Effects volume"
            onChange={(e) => s.updateSettings({ sfxVol: Number(e.target.value) / 100 })} />
        )}
        <Toggle icon="vibe" label="Vibration" on={s.settings.vibration} onChange={(v) => s.updateSettings({ vibration: v })} />
        <Toggle icon="eye" label="Reduced motion" on={s.settings.reduceMotion} onChange={(v) => s.updateSettings({ reduceMotion: v })} />
        <Toggle icon="info" label="Large text" on={s.settings.largeText} onChange={(v) => s.updateSettings({ largeText: v })} />
        <div className="flex items-center justify-between py-2.5">
          <span className="flex items-center gap-2.5 font-bold" style={{ color: 'var(--t-text)' }}>
            <Icon name="globe" size={18} className="opacity-80" /> Language
          </span>
          <span className="q-chip">English · more soon</span>
        </div>
      </Panel>

      {/* about */}
      <SectionTitle icon="heart">About</SectionTitle>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ChunkyButton color="slate" size="sm" onClick={() => setInfo('privacy')}>Privacy Policy</ChunkyButton>
        <ChunkyButton color="slate" size="sm" onClick={() => setInfo('terms')}>Terms of Service</ChunkyButton>
        <ChunkyButton color="slate" size="sm" icon="star" onClick={() => s.toast('Thanks for the love!', 'heart')}>Rate the App</ChunkyButton>
        <a href="mailto:support@tilequest.game" className="q-btn q-btn-slate q-btn-sm no-underline">
          <Icon name="info" size={15} /> Support
        </a>
      </div>
      <p className="mt-4 text-center text-[11px] font-bold" style={{ color: 'var(--t-sub)' }}>
        Tile Quest v1.0.0 · offline-first · cloud sync with Firebase in store builds
      </p>

      {adOpen && (
        <AdOverlay
          kind="rewarded"
          onDone={(completed) => {
            setAdOpen(false);
            if (completed) {
              const amt = useStore.getState().watchAdReward('coins');
              audio.coin();
              useStore.getState().toast(`+${amt} coins`, 'coin');
            }
          }}
        />
      )}

      {info && (
        <Modal onClose={() => setInfo(null)}>
          <h2 className="font-display text-2xl" style={{ color: 'var(--t-text)' }}>
            {info === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed" style={{ color: 'var(--t-sub)' }}>
            {info === 'privacy'
              ? 'Tile Quest stores your progress on your device. In store builds, an anonymous Firebase account syncs progress to the cloud — no name, email or personal data is ever required. Ads are simulated in this preview and no tracking SDKs run.'
              : 'Play fairly: timer and daily resets are validated against UTC time and tamper-resistant day keys. Purchases in this preview are simulated. Premium removes ads and unlocks unlimited hints in the full release.'}
          </p>
          <ChunkyButton color="gold" className="mt-4 w-full" onClick={() => setInfo(null)}>Got it</ChunkyButton>
        </Modal>
      )}
    </div>
  );
}
