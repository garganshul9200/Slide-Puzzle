import { audio } from '../audio/audio';
import { ACHIEVEMENTS, MISSIONS, type Mission } from '../game/config';
import { useStore } from '../state/store';
import { ChunkyButton, Icon, Panel, ProgressBar } from '../components/ui';

function MissionRow({ m }: { m: Mission }) {
  const stats = useStore((s) => s.stats);
  const claimed = useStore((s) => s.claimedMissions.includes(m.id));
  const claimMission = useStore((s) => s.claimMission);
  const progress = Math.min(stats[m.stat], m.target);
  const ready = progress >= m.target && !claimed;

  return (
    <Panel className="p-3">
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{
            background: claimed ? 'var(--t-panel2)' : ready ? 'var(--t-gold)' : 'var(--t-panel2)',
            color: claimed ? 'var(--t-sub)' : ready ? '#4d2c00' : 'var(--t-accent2)',
          }}
        >
          <Icon name={claimed ? 'check' : 'gift'} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-extrabold" style={{ color: 'var(--t-text)' }}>
            {m.name}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <ProgressBar value={progress} max={m.target} className="h-2 flex-1" color={claimed ? 'var(--t-edge)' : 'var(--t-accent)'} />
            <span className="text-[11px] font-black" style={{ color: 'var(--t-sub)' }}>
              {progress}/{m.target}
            </span>
          </div>
        </div>
        {claimed ? (
          <span className="q-chip" style={{ color: 'var(--t-sub)' }}>Claimed</span>
        ) : (
          <ChunkyButton
            size="sm"
            color={ready ? 'gold' : 'slate'}
            disabled={!ready}
            icon="coin"
            onClick={() => {
              if (claimMission(m)) audio.coin();
            }}
          >
            +{m.coins}
          </ChunkyButton>
        )}
      </div>
    </Panel>
  );
}

export function AwardsScreen() {
  const achievements = useStore((s) => s.achievements);
  const dailyMissions = MISSIONS.filter((m) => !m.weekly);
  const weeklyMissions = MISSIONS.filter((m) => m.weekly);

  return (
    <div className="h-full overflow-y-auto px-4 pb-28 pt-4">
      <h1 className="font-display text-3xl" style={{ color: 'var(--t-text)' }}>Awards</h1>

      <h2 className="font-display mt-4 flex items-center gap-2 text-xl" style={{ color: 'var(--t-accent)' }}>
        <Icon name="flag" size={20} /> Today's Missions
      </h2>
      <div className="mt-2 space-y-2">
        {dailyMissions.map((m) => <MissionRow key={m.id} m={m} />)}
      </div>

      <h2 className="font-display mt-5 flex items-center gap-2 text-xl" style={{ color: 'var(--t-accent2)' }}>
        <Icon name="timer" size={20} /> Weekly Mission
      </h2>
      <div className="mt-2 space-y-2">
        {weeklyMissions.map((m) => <MissionRow key={m.id} m={m} />)}
      </div>

      <h2 className="font-display mt-5 flex items-center gap-2 text-xl" style={{ color: 'var(--t-gold)' }}>
        <Icon name="trophy" size={20} /> Achievements
        <span className="q-chip ml-auto">{achievements.length}/{ACHIEVEMENTS.length}</span>
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {ACHIEVEMENTS.map((a) => {
          const got = achievements.includes(a.id);
          return (
            <div
              key={a.id}
              className="q-panel flex items-start gap-2.5 p-3"
              style={{
                opacity: got ? 1 : 0.62,
                borderColor: got ? 'var(--t-gold)' : undefined,
                boxShadow: got ? '0 0 16px rgba(255,182,56,.18)' : undefined,
              }}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: got ? 'var(--t-gold)' : 'var(--t-panel2)',
                  color: got ? '#4d2c00' : 'var(--t-sub)',
                }}
              >
                <Icon name={got ? a.icon : 'lock'} size={19} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-extrabold" style={{ color: 'var(--t-text)' }}>
                  {a.name}
                </div>
                <div className="text-[11px] font-semibold leading-tight" style={{ color: 'var(--t-sub)' }}>
                  {a.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
