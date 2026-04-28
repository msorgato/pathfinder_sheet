import type { ClassDefinition } from '../types';
import { CLASSES as CLASSES_PART1 } from './classes_part1';
import { CLASSES_PART2 } from './classes_part2';

export const CLASSES: ClassDefinition[] = [...CLASSES_PART1, ...CLASSES_PART2];

export const getClass = (id: string): ClassDefinition | undefined =>
  CLASSES.find(c => c.id === id);
