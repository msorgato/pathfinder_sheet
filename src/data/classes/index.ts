import type { ClassDefinition, CustomClassDefinition } from '../../types';
import { useDataStore } from '../../store/dataStore';
import { BARBARIAN } from './barbarian';
import { BARD } from './bard';
import { CLERIC } from './cleric';
import { DRUID } from './druid';
import { FIGHTER } from './fighter';
import { MONK } from './monk';
import { PALADIN } from './paladin';
import { RANGER } from './ranger';
import { ROGUE } from './rogue';
import { SORCERER } from './sorcerer';
import { WIZARD } from './wizard';

export type AnyClassDefinition = ClassDefinition | CustomClassDefinition;

/** True when `cls` is a static built-in class (bab is a string enum). */
export function isBuiltinClass(cls: AnyClassDefinition): cls is ClassDefinition {
  return typeof cls.bab === 'string';
}

export const CLASSES: ClassDefinition[] = [
  BARBARIAN,
  BARD,
  CLERIC,
  DRUID,
  FIGHTER,
  MONK,
  PALADIN,
  RANGER,
  ROGUE,
  SORCERER,
  WIZARD,
];

export const getClass = (id: string): AnyClassDefinition | undefined => {
  const builtin = CLASSES.find(c => c.id === id);
  if (builtin) return builtin;
  return useDataStore.getState().publishedCustomClasses.find(c => c.id === id);
};

export function getAllClasses(): AnyClassDefinition[] {
  return [...CLASSES, ...useDataStore.getState().publishedCustomClasses];
}
