import type { ArmorCategory, MaterialId, WeaponHandedness } from '../types';

/** What a material can be applied to. */
export type MaterialTarget = 'weapon' | 'armor' | 'shield';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  applies: MaterialTarget[];
  /** Makes the item masterwork (the masterwork cost is included in the material price). */
  masterwork: boolean;
  /** Weight multiplier. */
  weightFactor: number;
  /**
   * Armor check penalty reduction of the material. It replaces the masterwork
   * reduction (it does not add to it).
   */
  acpReduction?: Partial<Record<MaterialTarget, number>>;
  /** Added to the maximum Dexterity bonus of armor and shields. */
  maxDexBonus?: number;
  /** Subtracted from the arcane spell failure chance (percentage points). */
  arcaneFailureReduction?: number;
  /** Armor counts as one category lighter for speed (not for proficiency). */
  lighterForSpeed?: boolean;
  /** Flat modifier to weapon damage rolls. */
  damageModifier?: number;
  /** Cold iron doubles the base price and costs +2,000 mo more once the item is enhanced. */
  doublesPrice?: boolean;
  enhancementSurcharge?: number;
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  mithral: {
    id: 'mithral', name: 'Mithral', applies: ['weapon', 'armor', 'shield'], masterwork: true, weightFactor: 0.5,
    acpReduction: { armor: 3, shield: 3 }, maxDexBonus: 2, arcaneFailureReduction: 10, lighterForSpeed: true,
  },
  adamantine: {
    id: 'adamantine', name: 'Adamantio', applies: ['weapon', 'armor'], masterwork: true, weightFactor: 1,
  },
  'cold-iron': {
    id: 'cold-iron', name: 'Ferro freddo', applies: ['weapon'], masterwork: false, weightFactor: 1,
    doublesPrice: true, enhancementSurcharge: 2000,
  },
  'alchemical-silver': {
    id: 'alchemical-silver', name: 'Argento alchemico', applies: ['weapon'], masterwork: false, weightFactor: 1,
    damageModifier: -1,
  },
  darkwood: {
    id: 'darkwood', name: 'Legnoscuro', applies: ['weapon', 'shield'], masterwork: true, weightFactor: 0.5,
    acpReduction: { shield: 2 },
  },
};

export const MATERIAL_IDS = Object.keys(MATERIALS) as MaterialId[];

export const materialsFor = (target: MaterialTarget): MaterialDef[] =>
  MATERIAL_IDS.map(id => MATERIALS[id]).filter(m => m.applies.includes(target));

export interface PriceContext {
  target: MaterialTarget;
  armorCategory?: ArmorCategory;
  handedness?: WeaponHandedness;
  /** Original (non-material) weight in kg. */
  weightKg: number;
}

const ARMOR_COST: Record<MaterialId, Partial<Record<ArmorCategory, number>>> = {
  mithral: { light: 1000, medium: 4000, heavy: 9000, shield: 1000, tower: 1000 },
  adamantine: { light: 5000, medium: 10000, heavy: 15000 },
  'cold-iron': {}, 'alchemical-silver': {}, darkwood: {},
};

/** Extra cost of making the item from the material (cold iron is handled as a price multiplier). */
export function materialCost(id: MaterialId, ctx: PriceContext): number {
  const halfKgs = Math.ceil(ctx.weightKg / 0.5);
  switch (id) {
    case 'mithral':
      return ctx.target === 'weapon' ? 500 * halfKgs : ARMOR_COST.mithral[ctx.armorCategory ?? 'light'] ?? 0;
    case 'adamantine':
      return ctx.target === 'weapon' ? 3000 : ARMOR_COST.adamantine[ctx.armorCategory ?? 'light'] ?? 0;
    case 'alchemical-silver':
      return ctx.handedness === 'light' ? 20 : ctx.handedness === 'two-handed' ? 180 : 90;
    case 'darkwood':
      return 10 * halfKgs;
    default:
      return 0;
  }
}

/** Note shown on the item and on its attacks (effects against damage reduction and hardness). */
export function materialNote(id: MaterialId, target: MaterialTarget, armorCategory?: ArmorCategory): string | undefined {
  switch (id) {
    case 'mithral': return 'Mithral: supera la RD/argento';
    case 'adamantine':
      if (target === 'weapon') return 'Adamantio: supera la RD/adamantio e ignora la Durezza inferiore a 20';
      return `Adamantio: RD ${armorCategory === 'heavy' ? 3 : armorCategory === 'medium' ? 2 : 1}/—`;
    case 'cold-iron': return 'Ferro freddo: supera la RD/ferro freddo';
    case 'alchemical-silver': return 'Argento alchemico: supera la RD/argento';
    default: return undefined;
  }
}
