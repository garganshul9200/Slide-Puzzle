import { useSyncExternalStore } from 'react';
import { Network } from '@capacitor/network';

async function readConnected(): Promise<boolean> {
  try {
    const status = await Network.getStatus();
    return status.connected;
  } catch {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }
}

type Listener = () => void;

/** Shared connectivity store — one Network listener / poll for the whole app. */
const onlineStore = (() => {
  let online: boolean =
    typeof navigator !== 'undefined' ? navigator.onLine : true;
  const listeners = new Set<Listener>();
  let started = false;
  let poll: number | null = null;
  let handle: { remove: () => Promise<void> } | null = null;

  const emit = () => {
    for (const l of listeners) l();
  };

  const apply = (connected: boolean) => {
    if (online === connected) return;
    online = connected;
    syncPoll();
    emit();
  };

  const syncPoll = () => {
    if (online) {
      if (poll !== null) {
        window.clearInterval(poll);
        poll = null;
      }
      return;
    }
    if (poll !== null) return;
    // Only poll while offline so we resume quickly when the link returns.
    poll = window.setInterval(() => {
      void readConnected().then(apply);
    }, 2000);
  };

  const start = () => {
    if (started) return;
    started = true;

    void (async () => {
      apply(await readConnected());
      try {
        handle = await Network.addListener('networkStatusChange', (s) => {
          apply(s.connected);
        });
      } catch {
        /* web without plugin — window events below are enough */
      }
    })();

    window.addEventListener('online', () => apply(true));
    window.addEventListener('offline', () => apply(false));
    syncPoll();
  };

  return {
    subscribe(listener: Listener) {
      start();
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot() {
      return online;
    },
    /** Imperative read (tests / non-React). */
    get() {
      return online;
    },
    /** Tear down for tests only. */
    async _dispose() {
      if (poll !== null) window.clearInterval(poll);
      poll = null;
      await handle?.remove();
      handle = null;
      started = false;
      listeners.clear();
    },
  };
})();

/**
 * Live connectivity. Defaults to `navigator.onLine` so the cold-start path
 * never flashes the OfflineGate before the first Capacitor status check.
 * One shared Network listener / offline-only poll for the whole app.
 */
export function useOnline(): boolean {
  return useSyncExternalStore(onlineStore.subscribe, onlineStore.getSnapshot, () => true);
}
