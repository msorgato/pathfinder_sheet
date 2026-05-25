import type { ClassDefinition } from '../../types';
import { RANGER_SLOTS } from '../spellSlots';

const RANGER_SPELLS = ['id_ranger'];

const FAVORED_ENEMIES = [
  'Aberrazioni', 'Animali', 'Animali Magici', 'Costrutti', 'Draghi',
  'Elementali', 'Fate', 'Giganti', 'Goblinoidi', 'Melme',
  'Mostruosi Umanoidi', 'Non Morti', 'Outsider (buono)', 'Outsider (malvagio)',
  'Outsider (neutrale)', 'Piante', 'Umanoidi (elfi)', 'Umanoidi (gnomi)',
  'Umanoidi (halfling)', 'Umanoidi (nani)', 'Umanoidi (orcheschi)',
  'Umanoidi (rettiliani)', 'Umanoidi (umani)', 'Vermine',
];

const FAVORED_TERRAINS = [
  'Acqua', 'Città', 'Deserto', 'Foresta', 'Ghiaccio', 'Montagna',
  'Palude', 'Piano Astrale', 'Piano del Fuoco', 'Pianura', 'Sotterraneo',
];

const COMBAT_STYLES = ['Arciere', 'Combattimento a due armi', 'Cavalleria'];

export const RANGER: ClassDefinition = {
  id: 'ranger',
  name: 'Ranger',
  description: 'Un esploratore e cacciatore che combatte i suoi nemici preferiti nella natura selvaggia.',
  hitDie: 10,
  bab: 'full',
  saves: { fort: 'good', ref: 'good', will: 'poor' },
  skillsPerLevel: 6,
  classSkills: ['climb','craft_alchemy','handle_animal','heal','intimidate','knowledge_dungeoneering','knowledge_geography','knowledge_nature','perception','profession','ride','spellcraft','stealth','survival','swim'],
  armorProficiencies: ['Leggera', 'Media', 'Scudi'],
  weaponProficiencies: 'Semplici e Marziali',
  spellcasting: {
    type: 'prepared',
    ability: 'wis',
    school: 'divine',
    slots: Object.fromEntries(RANGER_SLOTS.map((s, i) => [i + 1, s])),
    spellList: RANGER_SPELLS,
    maxSpellLevel: 4,
    bonusSpellsFromAbility: true,
  },
  features: [
    { level: 1, name: 'Nemico Prediletto (1)', description: '+2 ai TS, ai tiri d\'attacco, al danno, alle prove di Bluff, Conoscenze, Percezione, Percepire Intenzioni, Sopravvivenza contro un tipo di creatura scelto.', choices: FAVORED_ENEMIES, choiceType: 'class_list' },
    { level: 1, name: 'Terreno Prediletto (1)', description: '+2 alle prove di Conoscenze, Percezione, Sopravvivenza e Furtività in un tipo di ambiente scelto.', choices: FAVORED_TERRAINS, choiceType: 'class_list' },
    { level: 2, name: 'Stile di Combattimento', description: 'Sceglie uno stile di combattimento e ottiene un talento bonus legato allo stile.', choices: COMBAT_STYLES, choiceType: 'class_list' },
    { level: 3, name: 'Tracciare', description: 'Aggiunge ½ livello a tutte le prove di Sopravvivenza per tracciare le piste.', type: 'Ex' },
    { level: 3, name: 'Destrezza Selvatica', description: 'Non subisce la penalità ai tiri d\'attacco in terreno difficile.', type: 'Ex' },
    { level: 4, name: 'Legame con la Natura', description: 'Sceglie un animale compagno oppure i legami con la terra (+2 bonus su un tipo di terreno per livello diviso 5).', choices: ['Animale compagno', 'Legami con la terra'], choiceType: 'class_list' },
    { level: 5, name: 'Nemico Prediletto (2)', description: 'Sceglie un secondo nemico prediletto (+4 al primo, +2 al secondo).', choices: FAVORED_ENEMIES, choiceType: 'class_list' },
    { level: 6, name: 'Terreno Prediletto (2)', description: 'Sceglie un secondo ambiente (+4 al primo, +2 al secondo).', choices: FAVORED_TERRAINS, choiceType: 'class_list' },
    { level: 6, name: 'Stile di Combattimento (avanzo)', description: 'Ottiene un altro talento bonus dello stile di combattimento scelto.' },
    { level: 7, name: 'Passo nel Bosco', description: 'Muove attraverso terreno difficile naturale senza penalità.', type: 'Ex' },
    { level: 8, name: 'Velocità della Natura', description: '+10 piedi alla velocità di movimento in nessuna armatura o armatura leggera.', type: 'Ex' },
    { level: 9, name: 'Elusione', description: 'Se supera un tiro salvezza su Riflessi contro un effetto che normalmente causa metà danno, non subisce alcun danno (solo in armatura leggera o nessuna).', type: 'Ex' },
    { level: 10, name: 'Terreno Prediletto (3)', description: 'Sceglie un terzo ambiente (+6 al primo, +4 al secondo, +2 al terzo).', choices: FAVORED_TERRAINS, choiceType: 'class_list' },
    { level: 10, name: 'Nemico Prediletto (3)', description: 'Sceglie un terzo nemico prediletto (+6, +4, +2).', choices: FAVORED_ENEMIES, choiceType: 'class_list' },
    { level: 11, name: 'Stile di Combattimento (avanzo)', description: 'Ottiene un altro talento bonus dello stile di combattimento.' },
    { level: 12, name: 'Passo Senza Traccia', description: 'Lascia tracce solo se lo desidera.', type: 'Ex' },
    { level: 14, name: 'Senso del Pericolo', description: '+2 alle prove di Percezione passiva.', type: 'Ex' },
    { level: 15, name: 'Nemico Prediletto (4)', description: 'Sceglie un quarto nemico prediletto (+8, +6, +4, +2).', choices: FAVORED_ENEMIES, choiceType: 'class_list' },
    { level: 15, name: 'Terreno Prediletto (4)', description: 'Sceglie un quarto ambiente (+8, +6, +4, +2).', choices: FAVORED_TERRAINS, choiceType: 'class_list' },
    { level: 16, name: 'Stile di Combattimento (avanzo)', description: 'Ottiene un altro talento bonus dello stile di combattimento.' },
    { level: 17, name: 'Caccia Solitaria', description: 'Ottiene un TS bonus contro le capacità del nemico prediletto quando combatte da solo.', type: 'Ex' },
    { level: 18, name: 'Terreno Prediletto (5)', description: 'Sceglie un quinto ambiente (+10, +8, +6, +4, +2).', choices: FAVORED_TERRAINS, choiceType: 'class_list' },
    { level: 19, name: 'Maestro Cacciatore', description: 'Può usare Colpire il Male come il paladino contro i nemici prediletti 1/giorno.', type: 'Su' },
    { level: 20, name: 'Nemico Prediletto (5)', description: 'Sceglie un quinto nemico prediletto (+10, +8, +6, +4, +2).', choices: FAVORED_ENEMIES, choiceType: 'class_list' },
    { level: 20, name: 'Terreno Prediletto (primario)', description: 'Il primo terreno prediletto conta come terreno normale ovunque.' },
  ],
};
