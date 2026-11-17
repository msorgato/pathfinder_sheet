import { create } from 'zustand';

export interface PwaUpdateState {
  /** A new version is installed and waiting. */
  needRefresh: boolean;
  /** The app runs an older build than the published one and no update arrived. */
  stale: boolean;
  /** The user chose "Dopo": the notice stays hidden until the app returns to the foreground. */
  dismissed: boolean;
  /** Applies the update (or the recovery); set by initPwaUpdates. */
  apply: () => void;
  dismiss: () => void;
  resurface: () => void;
}

export const usePwaStore = create<PwaUpdateState>()(set => ({
  needRefresh: false,
  stale: false,
  dismissed: false,
  apply: () => {},
  dismiss: () => set({ dismissed: true }),
  resurface: () => set({ dismissed: false }),
}));

/** Which notice to show: the update wins over the recovery; nothing when dismissed. */
export const noticeKind = (s: Pick<PwaUpdateState, 'needRefresh' | 'stale' | 'dismissed'>): 'update' | 'recover' | null =>
  s.dismissed ? null : s.needRefresh ? 'update' : s.stale ? 'recover' : null;
