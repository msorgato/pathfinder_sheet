import { describe, it, expect } from 'vitest';
import { inStartupWindow, isStale, markRecovered, recoveryAllowed, shouldCheck } from '../lib/pwaRules';

const memoryStorage = () => {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('shouldCheck', () => {
  it('checks the first time, then at most every 5 minutes', () => {
    expect(shouldCheck(1_000, null)).toBe(true);
    expect(shouldCheck(60_000, 1_000)).toBe(false);
    expect(shouldCheck(1_000 + 5 * 60_000 - 1, 1_000)).toBe(false);
    expect(shouldCheck(1_000 + 5 * 60_000, 1_000)).toBe(true);
  });
});

describe('isStale', () => {
  it('is stale only for a different, non-empty published build', () => {
    expect(isStale('a', 'a')).toBe(false);
    expect(isStale('a', 'b')).toBe(true);
    expect(isStale('a', '')).toBe(false);
    expect(isStale('a', undefined)).toBe(false);
    expect(isStale('a', 42)).toBe(false);
  });
});

describe('inStartupWindow', () => {
  it('is true within 10 seconds of the page start', () => {
    expect(inStartupWindow(5_000, 0)).toBe(true);
    expect(inStartupWindow(10_000, 0)).toBe(true);
    expect(inStartupWindow(10_001, 0)).toBe(false);
  });
});

describe('recovery guard', () => {
  it('allows the recovery once per published version', () => {
    const s = memoryStorage();
    expect(recoveryAllowed(s, 'v2')).toBe(true);
    markRecovered(s, 'v2');
    expect(recoveryAllowed(s, 'v2')).toBe(false);
    expect(recoveryAllowed(s, 'v3')).toBe(true);
  });
  it('never runs without usable storage', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    expect(recoveryAllowed(broken, 'v2')).toBe(false);
    expect(() => markRecovered(broken, 'v2')).not.toThrow();
    expect(recoveryAllowed(undefined, 'v2')).toBe(false);
  });
});
