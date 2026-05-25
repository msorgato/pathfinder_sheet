import type { Character, FeatDefinition, AbilityKey } from '../types';
import { RACES } from '../data/races';
import { effectiveAbilityScores, totalBAB } from './calculations';

const ABILITY_MAP: Record<string, AbilityKey> = {
  forza: 'str', destrezza: 'dex', costituzione: 'con',
  intelligenza: 'int', saggezza: 'wis', carisma: 'cha',
};

const CLASS_ID_MAP: Record<string, string> = {
  guerriero: 'fighter', ladro: 'rogue', mago: 'wizard', monaco: 'monk',
  barbaro: 'barbarian', bardo: 'bard', chierico: 'cleric', druido: 'druid',
  paladino: 'paladin', ranger: 'ranger', stregone: 'sorcerer',
};

// Pairs of [Italian lowercase key, skillId] — longer names first to avoid partial matches
const SKILL_MAP: [string, string][] = [
  ['percepire intenzioni', 'sense_motive'],
  ['senso del pericolo', 'sense_motive'],
  ['disattivare congegni', 'disable_device'],
  ['addestrare animali', 'handle_animal'],
  ['usare oggetti magici', 'use_magic_device'],
  ['conoscenze (arcane)', 'knowledge_arcana'],
  ['conoscenze (religioni)', 'knowledge_religion'],
  ['conoscenze (natura)', 'knowledge_nature'],
  ['conoscenze (dungeon)', 'knowledge_dungeoneering'],
  ['conoscenze (sotterranee)', 'knowledge_dungeoneering'],
  ['conoscenze (storia)', 'knowledge_history'],
  ['conoscenze (piani)', 'knowledge_planes'],
  ['conoscenze (nobiltà)', 'knowledge_nobility'],
  ['conoscenze (locali)', 'knowledge_local'],
  ['conoscenze (ingegneria)', 'knowledge_engineering'],
  ['conoscenze (geografia)', 'knowledge_geography'],
  ['fuga artistica', 'escape_artist'],
  ['sapienza magica', 'spellcraft'],
  ['artigianato (alchimia)', 'craft_alchemy'],
  ['acrobazia', 'acrobatics'],
  ['percezione', 'perception'],
  ['furtività', 'stealth'],
  ['intimidire', 'intimidate'],
  ['raggirare', 'bluff'],
  ['diplomazia', 'diplomacy'],
  ['travestimento', 'disguise'],
  ['scalare', 'climb'],
  ['nuotare', 'swim'],
  ['cavalcare', 'ride'],
  ['sopravvivenza', 'survival'],
  ['intuizione', 'sense_motive'],
  ['linguistica', 'linguistics'],
  ['valutare', 'appraise'],
  ['borseggiare', 'sleight_of_hand'],
  ['liberarsi', 'escape_artist'],
  ['guarire', 'heal'],
  ['volare', 'fly'],
  ['artigianato', 'craft_alchemy'],
];

// Build lowercase race-name → raceId lookup, including common abbreviations in prereqs
function buildRaceTokenMap(): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of RACES) m.set(r.name.toLowerCase(), r.id);
  m.set('mezzorco', 'half-orc');
  m.set('mezzelfo', 'half-elf');
  return m;
}
const RACE_TOKENS = buildRaceTokenMap();

// Prefixes that indicate a prerequisite we cannot reliably check → skip (don't block)
const UNCHECKABLE = [
  'privilegio di classe', 'capacità di lanciare', 'tratto razziale',
  'allineamento', 'incantatore di', 'competenza', 'dominio',
  'l\'allineamento', 'personaggio di',
];

function isUncheckable(t: string): boolean {
  return UNCHECKABLE.some(p => t.startsWith(p));
}

function evalTerm(
  raw: string,
  char: Character,
  allFeats: FeatDefinition[],
  scores: Record<AbilityKey, number>,
  bab: number,
): boolean | null {
  // Strip trailing punctuation and collapse whitespace
  const t = raw.trim().replace(/[.,;]+$/, '').replace(/\s+/g, ' ').toLowerCase();
  if (!t) return null;
  if (isUncheckable(t)) return null;

  // BAB: "Bonus di Attacco Base +X" or "BAB +X"
  const babM = t.match(/bonus di attacco base \+(\d+)|bab \+(\d+)/);
  if (babM) return bab >= parseInt(babM[1] ?? babM[2]);

  // Ability score: "forza 13"
  for (const [name, key] of Object.entries(ABILITY_MAP)) {
    const m = t.match(new RegExp(`^${name}\\s+(\\d+)`));
    if (m) return scores[key] >= parseInt(m[1]);
  }

  // Class level: "guerriero di 4° livello" or "guerriero 4° livello"
  for (const [name, classId] of Object.entries(CLASS_ID_MAP)) {
    const m = t.match(new RegExp(`${name}\\s+(?:di\\s+)?(\\d+)[°º]?\\s*livello`));
    if (m) {
      const entry = char.classes.find(e => e.classId === classId);
      return (entry?.level ?? 0) >= parseInt(m[1]);
    }
  }

  // Skill ranks: "[name] N gradi" or "[name] N grado"
  const skillM = t.match(/^(.+?)\s+(\d+)\s+grad[io]/);
  if (skillM) {
    const skillRaw = skillM[1].trim();
    const req = parseInt(skillM[2]);
    const entry = SKILL_MAP.find(([name]) => skillRaw.includes(name));
    if (entry) {
      const ranks = char.skills.find(s => s.skillId === entry[1])?.ranks ?? 0;
      return ranks >= req;
    }
    return null; // Unknown skill — give benefit of doubt
  }

  // Race: exact match against known race name tokens
  const raceId = RACE_TOKENS.get(t);
  if (raceId !== undefined) return char.race === raceId;

  // Feat prerequisite: match by name
  const featMatch = allFeats.find(f => f.name.toLowerCase() === t);
  if (featMatch) return char.feats.includes(featMatch.id);

  return null; // Cannot determine
}

export interface PrerequisiteResult {
  met: boolean;
  unmetTerms: string[];
}

export function checkPrerequisites(
  feat: FeatDefinition,
  char: Character,
  allFeats: FeatDefinition[],
): PrerequisiteResult {
  if (!feat.prerequisites?.trim()) return { met: true, unmetTerms: [] };

  const scores = effectiveAbilityScores(char);
  const bab = totalBAB(char.classes);

  // Each comma-separated clause must be satisfied (AND)
  const clauses = feat.prerequisites.split(',').map(s => s.trim()).filter(Boolean);
  const unmetTerms: string[] = [];

  for (const clause of clauses) {
    // Within a clause, " o " introduces OR alternatives
    const alts = clause.split(/\s+o\s+/).map(a => a.trim()).filter(Boolean);
    const results = alts.map(a => evalTerm(a, char, allFeats, scores, bab));

    const anyTrue = results.some(r => r === true);
    const allFalse = results.every(r => r === false);

    // Block only if every alternative is definitively false (no nulls, no trues)
    if (!anyTrue && allFalse) {
      unmetTerms.push(clause);
    }
  }

  return { met: unmetTerms.length === 0, unmetTerms };
}
