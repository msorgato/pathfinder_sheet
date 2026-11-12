import { useMemo } from 'react';
import type { Character } from '../../types';
import { deriveStats } from '../../utils/derivedStats';
import type { DerivedStats, Stat } from '../../utils/derivedStats';

/** Memoized derived stats: the single source for every value shown or rolled. */
export function useDerivedStats(char: Character): DerivedStats {
  return useMemo(() => deriveStats(char), [char]);
}

/** CSS class for a value raised or lowered by active modifiers. */
export function statTone(stat: Stat): string {
  if (stat.total > stat.base) return 'is-buffed';
  if (stat.total < stat.base) return 'is-debuffed';
  return '';
}
