import type { Modifier } from '../types';

/** What an ability can be added to. */
export type AbilityTarget = 'melee' | 'ranged' | 'armor' | 'shield';

export interface ExtraDice {
  count: number;
  die: number;
  /** Damage type shown on the badge, e.g. "fuoco". */
  label: string;
}

/**
 * A special ability of a magic weapon, armor or shield. Costs and names come from the
 * source wiki's tables: an ability either counts as a bonus equivalent (`bonus`) or has
 * a flat price (`costGp`), never both.
 */
export interface ItemAbility {
  id: string;
  name: string;
  applies: AbilityTarget[];
  bonus?: number;
  costGp?: number;
  /** Extra damage dice, rolled on their own. */
  extraDice?: ExtraDice;
  /** Doubles the threat range (Affilata). */
  keen?: boolean;
  /** Typed modifiers applied while the armor/shield is worn. */
  modifiers?: Modifier[];
  /** Effects that are not automated, shown on the attack or on the item. */
  note?: string;
}

const W: AbilityTarget[] = ['melee', 'ranged'];
const A: AbilityTarget[] = ['armor', 'shield'];
const skill = (skillId: string, value: number): Modifier => ({ target: { kind: 'skill', skillId }, type: 'competence', value });

export const ITEM_ABILITIES: ItemAbility[] = [
  // ── Weapons, +1 ─────────────────────────────────────────────────────────
  { id: 'infuocata', name: 'Infuocata', applies: W, bonus: 1, extraDice: { count: 1, die: 6, label: 'fuoco' } },
  { id: 'gelida', name: 'Gelida', applies: W, bonus: 1, extraDice: { count: 1, die: 6, label: 'freddo' } },
  { id: 'folgorante', name: 'Folgorante', applies: W, bonus: 1, extraDice: { count: 1, die: 6, label: 'elettricità' } },
  { id: 'corrosiva', name: 'Corrosiva', applies: W, bonus: 1, extraDice: { count: 1, die: 6, label: 'acido' } },
  { id: 'tonante', name: 'Tonante', applies: W, bonus: 1, note: 'Tonante: danni sonori extra sui colpi critici, il bersaglio può restare assordato' },
  { id: 'pietosa', name: 'Pietosa', applies: W, bonus: 1, extraDice: { count: 1, die: 6, label: 'non letale' }, note: 'Pietosa: tutti i danni sono non letali' },
  { id: 'affilata', name: 'Affilata', applies: ['melee'], bonus: 1, keen: true, note: 'Affilata: solo armi perforanti o taglienti' },
  { id: 'anatema', name: 'Anatema', applies: W, bonus: 1, note: 'Anatema: contro il tipo designato +2 ai tiri per colpire e ai danni, +2d6 di danni' },
  { id: 'difensiva', name: 'Difensiva', applies: ['melee'], bonus: 1, note: 'Difensiva: azione per trasferire il bonus di potenziamento alla CA' },
  { id: 'tocco-fantasma', name: 'Tocco Fantasma', applies: ['melee'], bonus: 1, note: 'Tocco Fantasma: colpisce le creature incorporee senza il 50% di fallimento' },
  { id: 'planare', name: 'Planare', applies: W, bonus: 1, note: 'Planare: danni extra contro gli esterni del piano designato' },
  { id: 'distanza', name: 'Distanza', applies: ['ranged'], bonus: 1, note: 'Distanza: raddoppia il raggio di gittata' },
  { id: 'ritornante', name: 'Ritornante', applies: ['ranged'], bonus: 1, note: 'Ritornante: torna in mano dopo il lancio' },
  // ── Weapons, +2 and above ───────────────────────────────────────────────
  { id: 'esplosione-fiamme', name: 'Esplosione di Fiamme', applies: W, bonus: 2, extraDice: { count: 1, die: 6, label: 'fuoco' }, note: 'Esplosione di Fiamme: +1d10 fuoco sul critico (×3: 2d10, ×4: 3d10)' },
  { id: 'esplosione-ghiaccio', name: 'Esplosione di Ghiaccio', applies: W, bonus: 2, extraDice: { count: 1, die: 6, label: 'freddo' }, note: 'Esplosione di Ghiaccio: +1d10 freddo sul critico (×3: 2d10, ×4: 3d10)' },
  { id: 'esplosione-folgorante', name: 'Esplosione Folgorante', applies: W, bonus: 2, extraDice: { count: 1, die: 6, label: 'elettricità' }, note: 'Esplosione Folgorante: +1d10 elettricità sul critico (×3: 2d10, ×4: 3d10)' },
  { id: 'esplosione-corrosiva', name: 'Esplosione Corrosiva', applies: W, bonus: 2, extraDice: { count: 1, die: 6, label: 'acido' }, note: 'Esplosione Corrosiva: +1d10 acido sul critico (×3: 2d10, ×4: 3d10)' },
  { id: 'sacra', name: 'Sacra', applies: W, bonus: 2, note: 'Sacra: +2d6 danni contro i malvagi' },
  { id: 'sacrilega', name: 'Sacrilega', applies: W, bonus: 2, note: 'Sacrilega: +2d6 danni contro i buoni' },
  { id: 'assiomatica', name: 'Assiomatica', applies: W, bonus: 2, note: 'Assiomatica: +2d6 danni contro i caotici' },
  { id: 'anarchica', name: 'Anarchica', applies: W, bonus: 2, note: 'Anarchica: +2d6 danni contro i legali' },
  { id: 'ferimento', name: 'Ferimento', applies: ['melee'], bonus: 2, note: 'Ferimento: ogni colpo causa sanguinamento 1' },
  { id: 'velocita', name: 'Velocità', applies: W, bonus: 3, note: 'Velocità: un attacco extra con attacco completo, al bonus più alto' },
  { id: 'energia-luminosa', name: 'Energia Luminosa', applies: W, bonus: 4, note: 'Energia Luminosa: infligge danni da energia luminosa, ignora i bonus di armatura' },
  { id: 'danzante', name: 'Danzante', applies: ['melee'], bonus: 4, note: 'Danzante: combatte da sola per 4 round' },
  { id: 'vorpal', name: 'Vorpal', applies: ['melee'], bonus: 5, note: 'Vorpal: con un 20 naturale e conferma decapita il bersaglio' },
  { id: 'imperturbabile-arma', name: 'Imperturbabile', applies: W, costGp: 3000, note: 'Imperturbabile: l\'arma non può essere disarmata' },

  // ── Armor and shields ───────────────────────────────────────────────────
  { id: 'fortificazione-leggera', name: 'Fortificazione (Leggera)', applies: A, bonus: 1, note: 'Fortificazione leggera: 25% di ignorare colpi critici e attacchi furtivi' },
  { id: 'fortificazione-moderata', name: 'Fortificazione (Moderata)', applies: A, bonus: 3, note: 'Fortificazione moderata: 75% di ignorare colpi critici e attacchi furtivi' },
  { id: 'fortificazione-pesante', name: 'Fortificazione (Pesante)', applies: A, bonus: 5, note: 'Fortificazione pesante: 100% di ignorare colpi critici e attacchi furtivi' },
  { id: 'ombra', name: 'Ombra', applies: ['armor'], costGp: 3750, modifiers: [skill('stealth', 5)] },
  { id: 'ombra-migliorata', name: 'Ombra Migliorata', applies: ['armor'], costGp: 15000, modifiers: [skill('stealth', 10)] },
  { id: 'ombra-superiore', name: 'Ombra Superiore', applies: ['armor'], costGp: 33750, modifiers: [skill('stealth', 15)] },
  { id: 'scivolosa', name: 'Scivolosa', applies: ['armor'], costGp: 3750, modifiers: [skill('escape_artist', 5)] },
  { id: 'scivolosa-migliorata', name: 'Scivolosa Migliorata', applies: ['armor'], costGp: 15000, modifiers: [skill('escape_artist', 10)] },
  { id: 'scivolosa-superiore', name: 'Scivolosa Superiore', applies: ['armor'], costGp: 33750, modifiers: [skill('escape_artist', 15)] },
  { id: 'resistenza-incantesimi-13', name: 'Resistenza agli Incantesimi (13)', applies: A, bonus: 2, note: 'Resistenza agli incantesimi 13' },
  { id: 'resistenza-incantesimi-15', name: 'Resistenza agli Incantesimi (15)', applies: A, bonus: 3, note: 'Resistenza agli incantesimi 15' },
  { id: 'resistenza-incantesimi-17', name: 'Resistenza agli Incantesimi (17)', applies: A, bonus: 4, note: 'Resistenza agli incantesimi 17' },
  { id: 'resistenza-incantesimi-19', name: 'Resistenza agli Incantesimi (19)', applies: A, bonus: 5, note: 'Resistenza agli incantesimi 19' },
  { id: 'resistenza-energia', name: 'Resistenza all\'Energia', applies: A, costGp: 18000, note: 'Resistenza 10 a un tipo di energia' },
  { id: 'resistenza-veleno', name: 'Resistenza al Veleno', applies: A, costGp: 2250, note: 'Resistenza al veleno: bonus di resistenza ai TS contro i veleni' },
  { id: 'tocco-fantasma-armatura', name: 'Tocco Fantasma', applies: A, bonus: 3, note: 'Tocco Fantasma: effetti da incorporeo' },
  { id: 'specchio', name: 'Specchio', applies: A, bonus: 1, note: 'Specchio: riflette gli attacchi di raggio' },
  { id: 'guardia', name: 'Guardia', applies: ['shield'], bonus: 1, note: 'Guardia: protegge da sbilanciamenti e disarmi' },
  { id: 'attirare-frecce', name: 'Attirare Frecce', applies: ['shield'], bonus: 1, note: 'Attirare Frecce: devia i proiettili contro chi lo porta' },
  { id: 'ariete', name: 'Ariete', applies: ['shield'], bonus: 1, note: 'Ariete: attacco di spinta con lo scudo' },
  { id: 'riflettente', name: 'Riflettente', applies: ['shield'], bonus: 5, note: 'Riflettente: riflette gli incantesimi sul lanciatore' },
];

export const getItemAbility = (id: string): ItemAbility | undefined => ITEM_ABILITIES.find(a => a.id === id);

export const abilitiesFor = (target: AbilityTarget): ItemAbility[] => ITEM_ABILITIES.filter(a => a.applies.includes(target));
