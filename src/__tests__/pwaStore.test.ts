import { describe, it, expect, beforeEach } from 'vitest';
import { noticeKind, usePwaStore } from '../store/pwaStore';

describe('pwa update store', () => {
  beforeEach(() => usePwaStore.setState({ needRefresh: false, stale: false, dismissed: false }));

  it('shows nothing by default, the update when ready, the recovery when stuck', () => {
    expect(noticeKind(usePwaStore.getState())).toBeNull();
    usePwaStore.setState({ stale: true });
    expect(noticeKind(usePwaStore.getState())).toBe('recover');
    usePwaStore.setState({ needRefresh: true });
    expect(noticeKind(usePwaStore.getState())).toBe('update');
  });

  it('"Dopo" hides the notice until the app returns to the foreground', () => {
    usePwaStore.setState({ needRefresh: true });
    usePwaStore.getState().dismiss();
    expect(noticeKind(usePwaStore.getState())).toBeNull();
    usePwaStore.getState().resurface();
    expect(noticeKind(usePwaStore.getState())).toBe('update');
  });
});
