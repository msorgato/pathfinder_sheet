import type { ClassDefinition } from '../../types';
import { BARD_SLOTS, BARD_KNOWN } from '../spellSlots';

const BARD_SPELLS = ['id_bard'];

export const BARD: ClassDefinition = {
  id: 'bard',
  name: 'Bardo',
  description: 'Un artista versatile che usa la magia attraverso la musica e la performance.',
  hitDie: 8,
  bab: 'three-quarters',
  saves: { fort: 'poor', ref: 'good', will: 'good' },
  skillsPerLevel: 6,
  classSkills: ['acrobatics','appraise','bluff','climb','craft_alchemy','diplomacy','disguise','escape_artist','intimidate','knowledge_arcana','knowledge_dungeoneering','knowledge_engineering','knowledge_geography','knowledge_history','knowledge_local','knowledge_nature','knowledge_nobility','knowledge_planes','knowledge_religion','linguistics','perception','perform_act','perform_dance','perform_oratory','perform_sing','perform_string','profession','sense_motive','sleight_of_hand','spellcraft','stealth','use_magic_device'],
  armorProficiencies: ['Leggera', 'Scudi (non a torre)'],
  weaponProficiencies: 'Semplici + spada corta, spada a striscia, mano, frombola, arco corto',
  spellcasting: {
    type: 'spontaneous',
    ability: 'cha',
    school: 'arcane',
    slots: Object.fromEntries(BARD_SLOTS.map((s, i) => [i + 1, s])),
    spellsKnown: Object.fromEntries(BARD_KNOWN.map((s, i) => [i + 1, s])),
    spellList: BARD_SPELLS,
    maxSpellLevel: 6,
    bonusSpellsFromAbility: true,
  },
  features: [
    { level: 1, name: 'Ispirazione da Bardo (Coraggio)', description: 'Un numero di volte/giorno pari a 3 + mod CHA, fornisce a sé stesso e agli alleati +1 ai TS contro paura e +1 ai tiri d\'attacco. Dura 1 round per livello.', type: 'Su' },
    { level: 1, name: 'Contromagia da Bardo', description: 'Può usare le esibizioni per ostacolare gli incantesimi degli avversari.', type: 'Su' },
    { level: 1, name: 'Fascino da Bardo', description: 'Può tentare di affascinare una creatura con la sola esibizione.', type: 'Su' },
    { level: 2, name: 'Talento Versatile', description: 'Può usare metà del suo livello da bardo come bonus a qualsiasi abilità, anche se non addestrato.', type: 'Ex' },
    { level: 3, name: 'Ispirazione Competente', description: 'Usa l\'ispirazione per aiutare un alleato con un\' abilità, fornendo +2.', type: 'Su' },
    { level: 5, name: 'Canto del Suggerimento', description: 'Può suggerire una linea d\'azione con un\'esibizione musicale (come l\'incantesimo Suggerimento).', type: 'Su' },
    { level: 5, name: 'Ispirazione da Bardo (Grandiosità)', description: 'Fornisce anche +1 al danno con le armi.', type: 'Su' },
    { level: 6, name: 'Talento Aggiuntivo', description: 'Ottiene un talento bonus dalla lista del bardo.', type: 'Ex' },
    { level: 8, name: 'Ispirazione da Bardo (Eroismo)', description: '+2 competenza ai tiri d\'attacco, TS e prove di abilità.', type: 'Su' },
    { level: 9, name: 'Azione Fulminea', description: 'Può eseguire un\'azione veloce mentre usa l\'ispirazione da bardo.', type: 'Ex' },
    { level: 10, name: 'Talento Aggiuntivo', description: 'Ottiene un talento bonus dalla lista del bardo.', type: 'Ex' },
    { level: 11, name: 'Ispirazione da Bardo (Massa)', description: 'L\'ispirazione può influenzare un numero di creature pari a CHA mod.', type: 'Su' },
    { level: 12, name: 'Canzone dei Viaggiatori', description: 'Può usare la musica per aumentare la velocità di marcia degli alleati.', type: 'Su' },
    { level: 14, name: 'Ispirazione da Bardo (Furia)', description: 'Fornisce +3 ai TS contro paura e +3 ai tiri d\'attacco/danno.', type: 'Su' },
    { level: 14, name: 'Talento Aggiuntivo', description: 'Ottiene un talento bonus dalla lista del bardo.', type: 'Ex' },
    { level: 17, name: 'Canto dei Suggerimenti Multipli', description: 'Può usare il Suggerimento di massa come l\'incantesimo omonimo.', type: 'Su' },
    { level: 18, name: 'Talento Aggiuntivo', description: 'Ottiene un talento bonus dalla lista del bardo.', type: 'Ex' },
    { level: 20, name: 'Ispirazione da Bardo (Leggenda)', description: '+4 ai TS contro paura/terrore, +4 ai tiri d\'attacco/danno.', type: 'Su' },
  ],
};
