import type { ClassDefinition } from '../../types';
import { WIZARD_SLOTS } from '../spellSlots';

const WIZARD_SPELLS = ['id_wizard'];

const WIZARD_BONUS_FEATS = [
  'Magia Amplificata', 'Magia Approfondita', 'Magia Cauta', 'Magia Controllata',
  'Magia Distante', 'Magia Estesa', 'Magia Intensificata', 'Magia Persistente',
  'Magia Potenziata', 'Magia Prolungata', 'Magia Rapida', 'Magia Silenziosa',
  'Magia Statica', 'Maestria degli Incantesimi',
  'Scrivere Pergamene', 'Fabbricare Bacchette', 'Costruire Oggetti Meravigliosi',
  'Fabbricare Bastoni', 'Fabbricare Anelli', 'Forgiare Armi Magiche',
];

export const WIZARD: ClassDefinition = {
  id: 'wizard',
  name: 'Mago',
  description: 'Uno studioso dell\'arte arcana che apprende incantesimi da un libro di magie.',
  hitDie: 6,
  bab: 'half',
  saves: { fort: 'poor', ref: 'poor', will: 'good' },
  skillsPerLevel: 2,
  classSkills: ['appraise','craft_alchemy','fly','knowledge_arcana','knowledge_dungeoneering','knowledge_engineering','knowledge_geography','knowledge_history','knowledge_local','knowledge_nature','knowledge_nobility','knowledge_planes','knowledge_religion','linguistics','perception','profession','spellcraft'],
  armorProficiencies: ['Nessuna'],
  weaponProficiencies: 'Bastone ferrato, balestra leggera, balestra pesante, coltello, dardo, fionda',
  spellcasting: {
    type: 'prepared',
    ability: 'int',
    school: 'arcane',
    slots: Object.fromEntries(WIZARD_SLOTS.map((s, i) => [i + 1, s])),
    spellList: WIZARD_SPELLS,
    maxSpellLevel: 9,
    bonusSpellsFromAbility: true,
    usesSpellbook: true,
  },
  features: [
    { level: 1, name: 'Scuola Arcana', description: 'Sceglie una scuola di specializzazione oppure nessuna (mago universalista). La scuola opposta non può essere preparata.', choices: ['Abiurazione','Ammaliamento','Divinazione','Evocazione','Illusione','Invocazione','Necromanzia','Trasmutazione','Universalista'], choiceType: 'class_list' },
    { level: 1, name: 'Poteri della Scuola', description: 'Ottiene 2 poteri speciali dalla scuola scelta (potenziato dall\'INT mod).' },
    { level: 1, name: 'Incantesimi del Libro', description: 'Inizia con 3+INT mod incantesimi nel libro. Aggiunge 2 nuovi incantesimi per livello. Può copiare dagli incantesimi trovati.' },
    { level: 1, name: 'Familiare (opzionale)', description: 'Può legarsi a un familiare: gatto, gufo, rospo, corvo, ratto, serpente, donnola, pipistrello ecc.', type: 'Su' },
    { level: 5, name: 'Talento Bonus', description: 'Ottiene un talento bonus a scelta tra talenti metamagici e di creazione oggetti.', choices: WIZARD_BONUS_FEATS, choiceType: 'class_list' },
    { level: 5, name: 'Magia del Legame', description: 'Accede ai nuovi poteri della scuola arcana.', type: 'Su' },
    { level: 10, name: 'Talento Bonus', description: 'Ottiene un ulteriore talento bonus a scelta tra talenti metamagici e di creazione oggetti.', choices: WIZARD_BONUS_FEATS, choiceType: 'class_list' },
    { level: 10, name: 'Potere della Scuola (Avanzato)', description: 'Ottiene un potere avanzato della propria scuola.', type: 'Su' },
    { level: 15, name: 'Talento Bonus', description: 'Ottiene un ulteriore talento bonus a scelta tra talenti metamagici e di creazione oggetti.', choices: WIZARD_BONUS_FEATS, choiceType: 'class_list' },
    { level: 15, name: 'Potere della Scuola (Maggiore)', description: 'Ottiene il potere maggiore della propria scuola.', type: 'Su' },
    { level: 20, name: 'Talento Bonus', description: 'Ottiene un ulteriore talento bonus a scelta tra talenti metamagici e di creazione oggetti.', choices: WIZARD_BONUS_FEATS, choiceType: 'class_list' },
    { level: 20, name: 'Maestro degli Incantesimi', description: 'Una volta al giorno può lanciare qualsiasi incantesimo dalla lista del mago senza preparazione.', type: 'Sp' },
  ],
};
