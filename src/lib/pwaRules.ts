/** Decision rules of the PWA update check, kept pure so they can be tested without a browser. */

export const CHECK_GAP_MS = 5 * 60 * 1000;
export const CHECK_INTERVAL_MS = 30 * 60 * 1000;
export const STARTUP_WINDOW_MS = 10 * 1000;
/** How long to wait for the service worker to report an update before treating the app as stuck. */
export const STUCK_AFTER_MS = 8 * 1000;
export const RECOVERY_KEY = 'pwa-recovered-for';

/** An update check is due when none was made yet or the last one is at least `minGapMs` old. */
export const shouldCheck = (now: number, lastCheck: number | null, minGapMs = CHECK_GAP_MS) =>
  lastCheck === null || now - lastCheck >= minGapMs;

/** The published build differs from the running one (an empty or missing published id is never stale). */
export const isStale = (running: string, published: unknown): boolean =>
  typeof published === 'string' && published.length > 0 && published !== running;

/** True shortly after the page started, when there is no user work to lose yet. */
export const inStartupWindow = (now: number, pageStart: number, windowMs = STARTUP_WINDOW_MS) =>
  now - pageStart <= windowMs;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

/** The recovery runs once per published version. Without usable storage it never runs (no reload loops). */
export function recoveryAllowed(storage: ReadableStorage | undefined, published: string): boolean {
  try {
    return !!storage && storage.getItem(RECOVERY_KEY) !== published;
  } catch {
    return false;
  }
}

export function markRecovered(storage: WritableStorage | undefined, published: string): void {
  try {
    storage?.setItem(RECOVERY_KEY, published);
  } catch {
    /* storage unavailable: recoveryAllowed will refuse next time */
  }
}
