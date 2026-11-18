import { describe, it, expect } from 'vitest';
import { rollHitTimes } from '../lib/diceSounds';

describe('rollHitTimes', () => {
  it('starts at once, increases and ends before the roll does', () => {
    const times = rollHitTimes(1300);
    expect(times).toHaveLength(8);
    expect(times[0]).toBe(0);
    times.slice(1).forEach((t, i) => expect(t).toBeGreaterThan(times[i]));
    expect(times[times.length - 1]).toBeLessThan(1300);
  });
  it('the clacks get slower: the gaps grow', () => {
    const t = rollHitTimes(1300);
    const gaps = t.slice(1).map((x, i) => x - t[i]);
    expect(gaps[gaps.length - 1]).toBeGreaterThan(gaps[0]);
  });
});
