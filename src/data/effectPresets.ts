import type { AbilityKey, BonusType, Modifier, ModifierTarget } from '../types';

export interface EffectPreset {
  id: string;
  name: string;
  /** Short description, including situational parts that are not automated. */
  summary: string;
  modifiers: Modifier[];
}

const m = (target: ModifierTarget, type: BonusType, value: number): Modifier => ({ target, type, value });
const attack: ModifierTarget = { kind: 'attack', scope: 'all' };
const damage: ModifierTarget = { kind: 'damage', scope: 'all' };
const saves: ModifierTarget = { kind: 'save', save: 'all' };
const skills: ModifierTarget = { kind: 'skill', skillId: 'all' };
const ac: ModifierTarget = { kind: 'ac' };
const ability = (a: AbilityKey): ModifierTarget => ({ kind: 'ability', ability: a });

const ABILITY_IT: Record<AbilityKey, string> = {
  str: 'Forza', dex: 'Destrezza', con: 'Costituzione', int: 'Intelligenza', wis: 'Saggezza', cha: 'Carisma',
};

const abilityBuff = (id: string, name: string, a: AbilityKey): EffectPreset => ({
  id, name, summary: `+4 di potenziamento a ${ABILITY_IT[a]}.`,
  modifiers: [m(ability(a), 'enhancement', 4)],
});

export const EFFECT_PRESETS: EffectPreset[] = [
  { id: 'benedizione', name: 'Benedizione', summary: '+1 morale ai tiri per colpire (e ai TS contro paura, non automatico).',
    modifiers: [m(attack, 'morale', 1)] },
  { id: 'anatema', name: 'Anatema', summary: '−1 morale ai tiri per colpire (e ai TS contro paura, non automatico).',
    modifiers: [m(attack, 'morale', -1)] },
  { id: 'velocita', name: 'Velocità', summary: '+1 ai tiri per colpire, +1 schivare alla CA e ai Riflessi, un attacco extra con attacco completo, +9 m di velocità.',
    modifiers: [m(attack, 'untyped', 1), m(ac, 'dodge', 1), m({ kind: 'save', save: 'ref' }, 'dodge', 1)] },
  { id: 'lentezza', name: 'Lentezza', summary: 'Una sola azione standard o di movimento per turno, −1 ai tiri per colpire, alla CA e ai Riflessi, velocità dimezzata.',
    modifiers: [m(attack, 'untyped', -1), m(ac, 'untyped', -1), m({ kind: 'save', save: 'ref' }, 'untyped', -1)] },
  { id: 'ingrandire-persona', name: 'Ingrandire persona', summary: 'Taglia aumenta di una categoria: +2 taglia alla For, −2 taglia alla Des, −1 ai tiri per colpire e alla CA. Portata e danni delle armi aumentano (non automatici).',
    modifiers: [m(ability('str'), 'size', 2), m(ability('dex'), 'size', -2), m(attack, 'size', -1), m(ac, 'size', -1)] },
  { id: 'ridurre-persona', name: 'Ridurre persona', summary: 'Taglia diminuisce di una categoria: −2 taglia alla For, +2 taglia alla Des, +1 ai tiri per colpire e alla CA. Danni delle armi ridotti (non automatici).',
    modifiers: [m(ability('str'), 'size', -2), m(ability('dex'), 'size', 2), m(attack, 'size', 1), m(ac, 'size', 1)] },
  abilityBuff('forza-del-toro', 'Forza del toro', 'str'),
  abilityBuff('grazia-del-gatto', 'Grazia del gatto', 'dex'),
  abilityBuff('resistenza-dell-orso', "Resistenza dell'orso", 'con'),
  abilityBuff('astuzia-della-volpe', 'Astuzia della volpe', 'int'),
  abilityBuff('saggezza-del-gufo', 'Saggezza del gufo', 'wis'),
  abilityBuff('splendore-dell-aquila', "Splendore dell'aquila", 'cha'),
  { id: 'armatura-magica', name: 'Armatura magica', summary: '+4 di armatura alla CA (non si cumula con un\'armatura indossata).',
    modifiers: [m(ac, 'armor', 4)] },
  { id: 'scudo', name: 'Scudo', summary: '+4 di scudo alla CA; immunità a dardo incantato.',
    modifiers: [m(ac, 'shield', 4)] },
  { id: 'scudo-della-fede', name: 'Scudo della fede', summary: '+2 di deviazione alla CA (+1 ogni 6 livelli dell\'incantatore, max +5).',
    modifiers: [m(ac, 'deflection', 2)] },
  { id: 'pelle-coriacea', name: 'Pelle coriacea', summary: "+2 di armatura naturale alla CA (+1 ogni 3 livelli dell'incantatore oltre il 3°, max +5).",
    modifiers: [m(ac, 'natural', 2)] },
  { id: 'resistenza', name: 'Resistenza', summary: '+1 di resistenza ai tiri salvezza.',
    modifiers: [m(saves, 'resistance', 1)] },
  { id: 'eroismo', name: 'Eroismo', summary: '+2 morale ai tiri per colpire, ai TS e alle prove di abilità.',
    modifiers: [m(attack, 'morale', 2), m(saves, 'morale', 2), m(skills, 'morale', 2)] },
  { id: 'preghiera-alleati', name: 'Preghiera (alleati)', summary: '+1 fortuna a tiri per colpire, danni delle armi, TS e prove di abilità.',
    modifiers: [m(attack, 'luck', 1), m(damage, 'luck', 1), m(saves, 'luck', 1), m(skills, 'luck', 1)] },
  { id: 'preghiera-nemici', name: 'Preghiera (nemici)', summary: '−1 fortuna a tiri per colpire, danni delle armi, TS e prove di abilità.',
    modifiers: [m(attack, 'luck', -1), m(damage, 'luck', -1), m(saves, 'luck', -1), m(skills, 'luck', -1)] },
  { id: 'ispirare-coraggio', name: 'Ispirare coraggio', summary: '+1 competenza ai tiri per colpire e ai danni delle armi (+1 morale ai TS contro charme e paura, non automatico). Aumenta a +2 al 5° livello da bardo, +3 all\'11°, +4 al 17°.',
    modifiers: [m(attack, 'competence', 1), m(damage, 'competence', 1)] },
  { id: 'ira', name: 'Ira', summary: '+4 morale a For e Cos, +2 morale alla Volontà, −2 alla CA. Non può usare abilità che richiedono pazienza o concentrazione.',
    modifiers: [m(ability('str'), 'morale', 4), m(ability('con'), 'morale', 4), m({ kind: 'save', save: 'will' }, 'morale', 2), m(ac, 'untyped', -2)] },
];

export const getEffectPreset = (id: string) => EFFECT_PRESETS.find(p => p.id === id);
