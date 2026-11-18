import { describe, it, expect } from 'vitest';
import {
  THROW_STAGGER_MS, diceScale, diceX, dieDuration, easeOutBack, easeOutCubic, visibleHeight,
} from '../components/dice3d/motion';

describe('3D throw layout', () => {
  const aspect = 384 / 220;
  const visW = visibleHeight() * aspect;

  it('up to ten dice stay inside the visible width, never larger than scale 1', () => {
    for (let n = 1; n <= 10; n++) {
      const s = diceScale(n, visW);
      expect(s).toBeLessThanOrEqual(1);
      const edge = Math.abs(diceX(n - 1, n, s)) + s; // center of the outermost die plus its radius
      expect(edge).toBeLessThanOrEqual(visW / 2);
    }
  });

  it('a single die is centered and full size', () => {
    expect(diceScale(1, visW)).toBe(1);
    expect(diceX(0, 1, 1)).toBe(0);
  });

  it('dice are laid out symmetrically', () => {
    expect(diceX(0, 3, 1)).toBeCloseTo(-diceX(2, 3, 1), 10);
    expect(diceX(1, 3, 1)).toBe(0);
  });

  it('the last staggered die still ends within the spin time', () => {
    for (let n = 1; n <= 5; n++) {
      expect((n - 1) * THROW_STAGGER_MS + dieDuration(1300, n)).toBeLessThanOrEqual(1300);
    }
  });

  it('easing starts at 0, ends at 1 and clamps', () => {
    [easeOutCubic, easeOutBack].forEach(f => {
      expect(f(0)).toBeCloseTo(0, 6);
      expect(f(1)).toBeCloseTo(1, 6);
      expect(f(2)).toBeCloseTo(1, 6);
    });
  });
});
