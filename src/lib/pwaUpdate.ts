import { registerSW } from 'virtual:pwa-register';
import { usePwaStore } from '../store/pwaStore';
import {
  CHECK_INTERVAL_MS, STUCK_AFTER_MS, inStartupWindow, isStale, markRecovered, recoveryAllowed, shouldCheck,
} from './pwaRules';

/** Reads the identifier of the published build; null when it cannot be read. */
async function fetchPublishedBuild(): Promise<string | null> {
  try {
    const res = await fetch('/version.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as { build?: unknown };
    return typeof data.build === 'string' ? data.build : null;
  } catch {
    return null;
  }
}

/** Last resort for a stuck app: drop the service workers and every cache, then reload. */
async function hardReset(published: string): Promise<void> {
  markRecovered(safeSessionStorage(), published);
  try {
    const registrations = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((registrations ?? []).map(r => r.unregister()));
    const keys = await caches?.keys?.();
    await Promise.all((keys ?? []).map(k => caches.delete(k)));
  } catch {
    /* reload anyway */
  }
  window.location.reload();
}

function safeSessionStorage(): Storage | undefined {
  try { return window.sessionStorage; } catch { return undefined; }
}

/**
 * Registers the service worker and keeps looking for new versions while the app stays open:
 * on start, when it returns to the foreground, when the network is back and every 30 minutes.
 * A version found right after start is applied at once; later one waits for the user (UpdatePrompt).
 * If the published build differs and no update shows up, the app recovers (start) or offers to (in use).
 */
export function initPwaUpdates(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const pageStart = Date.now();
  let registration: ServiceWorkerRegistration | undefined;
  let lastCheck: number | null = null;
  let waiting = false;
  let stuckTimer: ReturnType<typeof setTimeout> | undefined;
  let publishedStale: string | null = null;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      waiting = true;
      clearTimeout(stuckTimer);
      if (inStartupWindow(Date.now(), pageStart)) {
        void updateSW(true); // nothing to lose yet: apply without asking
      } else {
        usePwaStore.setState({ needRefresh: true, dismissed: false });
      }
    },
    onRegisteredSW(_url, reg) {
      registration = reg;
      void checkNow();
    },
    onRegisterError() {
      void checkNow();
    },
  });

  usePwaStore.setState({
    apply: () => {
      const s = usePwaStore.getState();
      if (s.needRefresh) void updateSW(true);
      else if (s.stale && publishedStale) void hardReset(publishedStale);
    },
  });

  async function checkNow(): Promise<void> {
    const now = Date.now();
    if (!shouldCheck(now, lastCheck)) return;
    lastCheck = now;
    const atStartup = inStartupWindow(now, pageStart);
    try { await registration?.update(); } catch { /* offline or blocked: the version file decides */ }
    const published = await fetchPublishedBuild();
    if (waiting || !isStale(__APP_BUILD__, published) || !published) return;
    publishedStale = published;
    clearTimeout(stuckTimer);
    // Give the service worker time to report the update; if it does not, the app is stuck.
    stuckTimer = setTimeout(() => {
      if (waiting) return;
      if (atStartup && recoveryAllowed(safeSessionStorage(), published)) void hardReset(published);
      else usePwaStore.setState({ stale: true, dismissed: false });
    }, STUCK_AFTER_MS);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    usePwaStore.getState().resurface();
    void checkNow();
  });
  window.addEventListener('online', () => void checkNow());
  setInterval(() => { if (document.visibilityState === 'visible') void checkNow(); }, CHECK_INTERVAL_MS);
}
