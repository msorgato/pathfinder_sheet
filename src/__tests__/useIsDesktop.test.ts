import { describe, it, expect, vi, afterEach } from 'vitest';
import { getIsDesktop, DESKTOP_QUERY } from '../lib/useIsDesktop';

describe('getIsDesktop', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('defaults to mobile when matchMedia is unavailable', () => {
    vi.stubGlobal('window', {});
    expect(getIsDesktop()).toBe(false);
  });

  it('follows the 1024px media query', () => {
    const matchMedia = vi.fn((q: string) => ({ matches: q === DESKTOP_QUERY }));
    vi.stubGlobal('window', { matchMedia });
    expect(getIsDesktop()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
  });
});
