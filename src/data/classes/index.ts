import type { ClassDefinition } from '../../types';
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

export const getClass = (id: string): ClassDefinition | undefined =>
  CLASSES.find(c => c.id === id);
