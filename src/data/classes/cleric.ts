import type { ClassDefinition } from '../../types';
import { CLERIC_SLOTS } from '../spellSlots';

const CLERIC_SPELLS = ['id_cleric'];

export const CLERIC: ClassDefinition = {
  id: 'cleric',
  name: 'Chierico',
  description: 'Un devoto di una divinità che canalizza il potere divino per guarire, proteggere e combattere.',
  hitDie: 8,
  bab: 'three-quarters',
  saves: { fort: 'good', ref: 'poor', will: 'good' },
  skillsPerLevel: 2,
  classSkills: ['appraise','craft_alchemy','diplomacy','heal','knowledge_arcana','knowledge_history','knowledge_nobility','knowledge_planes','knowledge_religion','linguistics','perception','profession','sense_motive','spellcraft'],
  armorProficiencies: ['Leggera', 'Media', 'Pesante', 'Scudi'],
  weaponProficiencies: 'Semplici + arma preferita della divinità',
  spellcasting: {
    type: 'prepared',
    ability: 'wis',
    school: 'divine',
    slots: Object.fromEntries(CLERIC_SLOTS.map((s, i) => [i + 1, s])),
    spellList: CLERIC_SPELLS,
    maxSpellLevel: 9,
    bonusSpellsFromAbility: true,
  },
  features: [
    { level: 1, name: 'Aura', description: 'Emana un\'aura potente legata all\'allineamento della divinità.', type: 'Ex' },
    { level: 1, name: 'Incantesimi', description: 'Lancia incantesimi divini della lista del chierico. Bonus di dominio: +1 slot per livello incantesimo per ogni dominio scelto.' },
    { level: 1, name: 'Dominio (1°)', description: 'Sceglie il primo dominio dalla lista della divinità. Ottiene i poteri e gli slot bonus del dominio.', choices: ['Acqua','Aria','Animali','Bugie','Caos','Conoscenza','Creazione','Distruzione','Forza','Fuoco','Gloria','Guerra','Guarigione','Legge','Libertà','Luce','Luna','Magia','Maledizione','Morte','Nebbia','Nobile','Oscurità','Pericolo','Protezione','Rune','Sole','Terra','Viaggio'], choiceType: 'class_list' },
    { level: 1, name: 'Dominio (2°)', description: 'Sceglie il secondo dominio dalla lista della divinità. Ottiene i poteri e gli slot bonus del dominio.', choices: ['Acqua','Aria','Animali','Bugie','Caos','Conoscenza','Creazione','Distruzione','Forza','Fuoco','Gloria','Guerra','Guarigione','Legge','Libertà','Luce','Luna','Magia','Maledizione','Morte','Nebbia','Nobile','Oscurità','Pericolo','Protezione','Rune','Sole','Terra','Viaggio'], choiceType: 'class_list' },
    { level: 1, name: 'Canalizzare Energia', description: 'Libera un\'esplosione di energia divina. Guarisce o danneggia i non-morti in base all\'allineamento. Usa (3+CHA mod) volte/giorno.', type: 'Su' },
    { level: 1, name: 'Spontaneous Casting', description: 'Un chierico Buono/Neutro può convertire qualsiasi incantesimo in Cura; uno Malvagio in Infliggi Danni.' },
  ],
};
