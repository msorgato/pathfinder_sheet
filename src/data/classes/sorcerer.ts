import type { ClassDefinition } from '../../types';
import { SORCERER_SLOTS, SORCERER_KNOWN } from '../spellSlots';

const SORCERER_SPELLS = ['id_sorcerer'];

export const SORCERER: ClassDefinition = {
  id: 'sorcerer',
  name: 'Stregone',
  description: 'Un mago spontaneo con potere arcano nel sangue, derivante da un\'eredità magica.',
  hitDie: 6,
  bab: 'half',
  saves: { fort: 'poor', ref: 'poor', will: 'good' },
  skillsPerLevel: 2,
  classSkills: ['appraise','bluff','craft_alchemy','fly','intimidate','knowledge_arcana','perception','profession','spellcraft','use_magic_device'],
  armorProficiencies: ['Nessuna'],
  weaponProficiencies: 'Semplici',
  spellcasting: {
    type: 'spontaneous',
    ability: 'cha',
    school: 'arcane',
    slots: Object.fromEntries(SORCERER_SLOTS.map((s, i) => [i + 1, s])),
    spellsKnown: Object.fromEntries(SORCERER_KNOWN.map((s, i) => [i + 1, s])),
    spellList: SORCERER_SPELLS,
    maxSpellLevel: 9,
    bonusSpellsFromAbility: true,
  },
  features: [
    { level: 1, name: 'Eredità Arcana', description: 'Sceglie un\'eredità arcana che riflette la natura del potere magico nel sangue.', choices: ['Abissale','Angelica','Arcana','Celestiale','Draconico (acido)','Draconico (freddo)','Draconico (fuoco)','Draconico (fulmine)','Draconico (veleno)','Elementale (aria)','Elementale (acqua)','Elementale (fuoco)','Elementale (terra)','Fatata','Infernale','Spaventosa','Stregonesca','Orchesca','Selvaggia','Spettrale','Umana potenziata'], choiceType: 'class_list' },
    { level: 1, name: 'Poteri dell\'Eredità', description: 'Ottiene un potere speciale derivante dall\'eredità scelta ai livelli 1, 3, 9, 15, 20.' },
    { level: 3, name: 'Potere dell\'Eredità (1)', description: 'Secondo potere dell\'eredità arcana.' },
    { level: 9, name: 'Potere dell\'Eredità (2)', description: 'Terzo potere dell\'eredità arcana.' },
    { level: 15, name: 'Potere dell\'Eredità (3)', description: 'Quarto potere dell\'eredità arcana.' },
    { level: 20, name: 'Apoteosi dell\'Eredità', description: 'Forma finale dell\'eredità arcana; trasformazione parziale.', type: 'Su' },
  ],
};
