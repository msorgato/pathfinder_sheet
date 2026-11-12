import type { AbilityKey, BonusType, Modifier, ModifierTarget } from '../types';
import { getSkill } from './skills';

export const ABILITY_SHORT: Record<AbilityKey, string> = {
  str: 'FOR', dex: 'DES', con: 'COS', int: 'INT', wis: 'SAG', cha: 'CAR',
};

export const BONUS_TYPE_LABELS: Record<BonusType, string> = {
  alchemical: 'alchemico',
  armor: 'armatura',
  circumstance: 'circostanza',
  competence: 'competenza',
  deflection: 'deviazione',
  dodge: 'schivare',
  enhancement: 'potenziamento',
  inherent: 'intrinseco',
  insight: 'cognitivo',
  luck: 'fortuna',
  morale: 'morale',
  natural: 'armatura naturale',
  profane: 'profano',
  racial: 'razziale',
  resistance: 'resistenza',
  sacred: 'sacro',
  shield: 'scudo',
  size: 'taglia',
  trait: 'tratto',
  untyped: 'senza tipo',
};

export const BONUS_TYPES = Object.keys(BONUS_TYPE_LABELS) as BonusType[];

/** Targets offered in the effect editor (single skills are chosen separately). */
export const TARGET_OPTIONS: { key: string; label: string; target: ModifierTarget }[] = [
  { key: 'attack:all', label: 'Tiri per colpire', target: { kind: 'attack', scope: 'all' } },
  { key: 'attack:melee', label: 'Tiri per colpire in mischia', target: { kind: 'attack', scope: 'melee' } },
  { key: 'attack:ranged', label: 'Tiri per colpire a distanza', target: { kind: 'attack', scope: 'ranged' } },
  { key: 'damage:all', label: 'Danni delle armi', target: { kind: 'damage', scope: 'all' } },
  { key: 'damage:melee', label: 'Danni in mischia', target: { kind: 'damage', scope: 'melee' } },
  { key: 'damage:ranged', label: 'Danni a distanza', target: { kind: 'damage', scope: 'ranged' } },
  { key: 'ac', label: 'Classe Armatura', target: { kind: 'ac' } },
  { key: 'save:all', label: 'Tutti i tiri salvezza', target: { kind: 'save', save: 'all' } },
  { key: 'save:fort', label: 'Tempra', target: { kind: 'save', save: 'fort' } },
  { key: 'save:ref', label: 'Riflessi', target: { kind: 'save', save: 'ref' } },
  { key: 'save:will', label: 'Volontà', target: { kind: 'save', save: 'will' } },
  { key: 'skill:all', label: 'Tutte le abilità', target: { kind: 'skill', skillId: 'all' } },
  { key: 'abilityCheck', label: 'Prove di caratteristica', target: { kind: 'abilityCheck' } },
  { key: 'initiative', label: 'Iniziativa', target: { kind: 'initiative' } },
  { key: 'cmb', label: 'CMB', target: { kind: 'cmb' } },
  { key: 'cmd', label: 'CMD', target: { kind: 'cmd' } },
  ...(['str', 'dex', 'con', 'int', 'wis', 'cha'] as AbilityKey[]).map(a => ({
    key: `ability:${a}`, label: `Caratteristica ${ABILITY_SHORT[a]}`, target: { kind: 'ability', ability: a } as ModifierTarget,
  })),
];

export function targetKey(t: ModifierTarget): string {
  switch (t.kind) {
    case 'ability': return `ability:${t.ability}`;
    case 'attack': case 'damage': return `${t.kind}:${t.scope}`;
    case 'save': return `save:${t.save}`;
    case 'skill': return `skill:${t.skillId}`;
    default: return t.kind;
  }
}

export function targetLabel(t: ModifierTarget): string {
  if (t.kind === 'skill' && t.skillId !== 'all') return getSkill(t.skillId)?.name ?? t.skillId;
  return TARGET_OPTIONS.find(o => o.key === targetKey(t))?.label ?? targetKey(t);
}

const signed = (v: number) => (v >= 0 ? `+${v}` : `${v}`);

/** e.g. "+2 morale ai Tiri per colpire" → compact "+2 morale · Tiri per colpire". */
export function modifierLabel(mod: Modifier): string {
  const type = mod.type === 'untyped' ? '' : ` ${BONUS_TYPE_LABELS[mod.type]}`;
  return `${signed(mod.value)}${type} · ${targetLabel(mod.target)}`;
}
