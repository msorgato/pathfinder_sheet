import type { ClassDefinition } from '../../types';
import { PALADIN_SLOTS } from '../spellSlots';

const PALADIN_SPELLS = ['id_paladin'];

const MERCY_CONDITIONS = [
  'Affaticamento', 'Paura', 'Nausea', 'Shock', 'Intorpidimento',
  'Malattia', 'Stanchezza', 'Veleno', 'Accecamento', 'Sordità',
  'Paralisi', 'Pietrificazione', 'Maledizione', 'Esaurimento',
];

export const PALADIN: ClassDefinition = {
  id: 'paladin',
  name: 'Paladino',
  description: 'Un guerriero sacro che combatte il male con il potere divino della sua divinità.',
  hitDie: 10,
  bab: 'full',
  saves: { fort: 'good', ref: 'poor', will: 'good' },
  skillsPerLevel: 2,
  classSkills: ['craft_alchemy','diplomacy','handle_animal','heal','knowledge_nobility','knowledge_religion','profession','ride','sense_motive','spellcraft'],
  armorProficiencies: ['Leggera', 'Media', 'Pesante', 'Scudi'],
  weaponProficiencies: 'Semplici e Marziali',
  spellcasting: {
    type: 'prepared',
    ability: 'cha',
    school: 'divine',
    slots: Object.fromEntries(PALADIN_SLOTS.map((s, i) => [i + 1, s])),
    spellList: PALADIN_SPELLS,
    maxSpellLevel: 4,
    bonusSpellsFromAbility: true,
  },
  features: [
    { level: 1, name: 'Aura del Bene', description: 'Emana un\'aura di bene di potere pari al livello da paladino.', type: 'Ex' },
    { level: 1, name: 'Individuare il Male', description: 'Può lanciare Individuazione del Male a volontà come incantesimo della 1a cerchia.', type: 'Sp' },
    { level: 1, name: 'Colpire il Male (1/giorno)', description: '+CAR ai tiri d\'attacco contro creature malvagie. Al primo attacco andato a segno: +livello da paladino al danno; contro esterni malvagi, draghi malvagi e non morti +2× livello.', type: 'Su' },
    { level: 2, name: 'Grazia Divina', description: 'Aggiunge il modificatore CAR ai tiri salvezza.', type: 'Su' },
    { level: 2, name: 'Imposizione delle Mani', description: 'Guarisce (½ livello + mod CAR) d6 PF, usabile (½ livello + mod CAR) volte/giorno. Può anche danneggiare i non-morti (TS COS per metà).', type: 'Su' },
    { level: 3, name: 'Aura del Coraggio', description: 'Immune alla paura; gli alleati entro 3 m ottengono +4 ai TS contro paura.', type: 'Su' },
    { level: 3, name: 'Salute Divina', description: 'Immune a tutte le malattie, incluse quelle soprannaturali e magiche.', type: 'Ex' },
    { level: 3, name: 'Misericordia (1a)', description: 'L\'Imposizione delle Mani può anche rimuovere una condizione scelta.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 4, name: 'Colpire il Male (2/giorno)', description: 'Usa Colpire il Male due volte al giorno.' },
    { level: 4, name: 'Destriero Sacro', description: 'Può invocare un destriero sacro o formare un legame con un\'arma sacra (+1 ogni 3 livelli).', type: 'Sp' },
    { level: 6, name: 'Misericordia (2a)', description: 'Sceglie una seconda condizione da rimuovere con l\'Imposizione delle Mani.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 7, name: 'Colpire il Male (3/giorno)', description: 'Usa Colpire il Male tre volte al giorno.' },
    { level: 8, name: 'Aura Risolutrice', description: 'Immune agli incantesimi di ammaliamento; gli alleati entro 3 m ottengono +4 ai TS contro ammaliamento.', type: 'Su' },
    { level: 9, name: 'Misericordia (3a)', description: 'Sceglie una terza condizione da rimuovere con l\'Imposizione delle Mani.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 10, name: 'Colpire il Male (4/giorno)', description: 'Usa Colpire il Male quattro volte al giorno.' },
    { level: 11, name: 'Aura di Giustizia', description: 'Può spendere 2 usi di Colpire il Male per concedere la capacità a tutti gli alleati entro 3 m. Gli alleati devono agire entro il turno successivo del paladino e usano i suoi bonus.', type: 'Su' },
    { level: 12, name: 'Misericordia (4a)', description: 'Sceglie una quarta condizione da rimuovere con l\'Imposizione delle Mani.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 13, name: 'Colpire il Male (5/giorno)', description: 'Usa Colpire il Male cinque volte al giorno.' },
    { level: 14, name: 'Aura della Fede', description: 'Le sue armi sono sempre trattate come buone per superare la RD.', type: 'Su' },
    { level: 15, name: 'Misericordia (5a)', description: 'Sceglie una quinta condizione da rimuovere con l\'Imposizione delle Mani.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 16, name: 'Colpire il Male (6/giorno)', description: 'Usa Colpire il Male sei volte al giorno.' },
    { level: 17, name: 'Aura della Rettitudine', description: 'Immune ai danni da incantesimi malvagi; gli alleati entro 3 m ottengono +4 ai TS contro effetti malvagi.', type: 'Su' },
    { level: 18, name: 'Misericordia (6a)', description: 'Sceglie una sesta condizione da rimuovere con l\'Imposizione delle Mani.', choices: MERCY_CONDITIONS, choiceType: 'class_list' },
    { level: 19, name: 'Colpire il Male (7/giorno)', description: 'Usa Colpire il Male sette volte al giorno.' },
    { level: 20, name: 'Campione del Bene', description: 'Può spendere 4 usi Colpire il Male per agire come un ser divino. Emana un\'aura sacra che fornisce +4 a tutti i tiri d\'attacco e danni degli alleati entro 3 m.', type: 'Su' },
  ],
};
