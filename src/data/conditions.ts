import type { Modifier } from '../types';
import { SKILLS } from './skills';

export interface ConditionDefinition {
  id: string;
  name: string;
  /** Short rules reminder, shown in pickers and chips. */
  summary: string;
  /** Numeric effects applied automatically (penalties are untyped and always stack). */
  modifiers: Modifier[];
  /** The character loses its Dexterity bonus (and dodge bonuses) to AC and CMD. */
  losesDexToAC?: boolean;
  /** Conditions in the same group apply their modifiers only once (e.g. fear). */
  group?: 'fear';
  /** Non-numeric effect on attacks, shown on the attack badges and in quick rolls. */
  attackNote?: string;
}

const pen = (target: Modifier['target'], value: number): Modifier => ({ target, type: 'untyped', value });

/** −N to attack, saves, skills and ability checks (Scosso, Impaurito, Infermo...). */
const generalPenalty = (value: number): Modifier[] => [
  pen({ kind: 'attack', scope: 'all' }, value),
  pen({ kind: 'save', save: 'all' }, value),
  pen({ kind: 'skill', skillId: 'all' }, value),
  pen({ kind: 'abilityCheck' }, value),
];

const strDexSkillPenalty = (value: number): Modifier[] =>
  SKILLS.filter(s => s.ability === 'str' || s.ability === 'dex')
    .map(s => pen({ kind: 'skill', skillId: s.id }, value));

export const CONDITIONS: ConditionDefinition[] = [
  { id: 'abbagliato', name: 'Abbagliato', summary: '−1 ai tiri per colpire e alle prove di Percezione basate sulla vista.',
    modifiers: [pen({ kind: 'attack', scope: 'all' }, -1)] },
  { id: 'accecato', name: 'Accecato', summary: '−2 alla CA, perde il bonus di Des alla CA, −4 alla maggior parte delle prove di abilità basate su For e Des e a Percezione contrapposta. Tutti gli avversari hanno occultamento totale; si muove a metà velocità.',
    modifiers: [pen({ kind: 'ac' }, -2), ...strDexSkillPenalty(-4)], losesDexToAC: true, attackNote: '50% di probabilità di mancare' },
  { id: 'accovacciato', name: 'Accovacciato', summary: 'Paralizzato dalla paura: non può agire. −2 alla CA e perde il bonus di Des alla CA.',
    modifiers: [pen({ kind: 'ac' }, -2)], losesDexToAC: true, attackNote: 'non può agire' },
  { id: 'affascinato', name: 'Affascinato', summary: "Resta fermo a osservare l'effetto. −4 alle prove di abilità fatte come reazione (es. Percezione). Una minaccia evidente interrompe l'effetto.",
    modifiers: [] },
  { id: 'affaticato', name: 'Affaticato', summary: "−2 a For e Des; non può correre né caricare. 8 ore di riposo lo rimuovono; un'altra fonte di affaticamento lo rende Esausto.",
    modifiers: [pen({ kind: 'ability', ability: 'str' }, -2), pen({ kind: 'ability', ability: 'dex' }, -2)] },
  { id: 'afferrato', name: 'Afferrato', summary: '−4 alla Des, −2 ai tiri per colpire e alle prove di manovra (tranne lottare o liberarsi). Non può muoversi; lanciare incantesimi richiede concentrazione.',
    modifiers: [pen({ kind: 'ability', ability: 'dex' }, -4), pen({ kind: 'attack', scope: 'all' }, -2)], attackNote: 'solo armi leggere o a una mano' },
  { id: 'assordato', name: 'Assordato', summary: "−4 all'iniziativa, fallisce le prove di Percezione basate sull'udito, 20% di fallimento per incantesimi con componenti verbali.",
    modifiers: [pen({ kind: 'initiative' }, -4)] },
  { id: 'barcollante', name: 'Barcollante', summary: 'Può compiere una sola azione di movimento o standard per round (più azioni veloci, immediate e gratuite).',
    modifiers: [], attackNote: 'un solo attacco per round' },
  { id: 'confuso', name: 'Confuso', summary: "Ogni round tira d%: 01–25 agisce normalmente, 26–50 non fa nulla, 51–75 si infligge danni, 76–100 attacca la creatura più vicina.",
    modifiers: [], attackNote: 'tira d% per sapere se attacca' },
  { id: 'esausto', name: 'Esausto', summary: "−6 a For e Des; si muove a metà velocità. Un'ora di riposo lo rende Affaticato.",
    modifiers: [pen({ kind: 'ability', ability: 'str' }, -6), pen({ kind: 'ability', ability: 'dex' }, -6)] },
  { id: 'frastornato', name: 'Frastornato', summary: 'Non può compiere azioni, ma non subisce penalità alla CA.',
    modifiers: [], attackNote: 'non può agire' },
  { id: 'immobilizzato', name: 'Immobilizzato', summary: 'Trattenuto in lotta: non può muoversi, perde il bonus di Des alla CA e ha −4 alla CA. Può solo provare a liberarsi o compiere azioni verbali e mentali.',
    modifiers: [pen({ kind: 'ac' }, -4)], losesDexToAC: true },
  { id: 'impaurito', name: 'Impaurito', summary: 'Fugge dalla fonte della paura. −2 a tiri per colpire, TS, prove di abilità e di caratteristica. Non si cumula con altre condizioni di paura.',
    modifiers: generalPenalty(-2), group: 'fear' },
  { id: 'impreparato', name: 'Impreparato', summary: 'Colto alla sprovvista: perde il bonus di Des alla CA e non può effettuare attacchi di opportunità.',
    modifiers: [], losesDexToAC: true },
  { id: 'in-preda-al-panico', name: 'In preda al panico', summary: 'Lascia cadere ciò che tiene e fugge; se bloccato si accovaccia. −2 a tiri per colpire, TS, prove di abilità e di caratteristica.',
    modifiers: generalPenalty(-2), group: 'fear' },
  { id: 'inabile', name: 'Inabile', summary: "A 0 PF: una sola azione di movimento o standard per round; un'azione standard faticosa infligge 1 danno.",
    modifiers: [], attackNote: 'un solo attacco per round' },
  { id: 'indifeso', name: 'Indifeso', summary: 'Des considerata 0 (−5 alla CA); gli attacchi in mischia contro di lui hanno +4. Può subire un colpo di grazia.',
    modifiers: [], losesDexToAC: true },
  { id: 'infermo', name: 'Infermo', summary: '−2 a tiri per colpire, danni delle armi, TS, prove di abilità e di caratteristica.',
    modifiers: [...generalPenalty(-2), pen({ kind: 'damage', scope: 'all' }, -2)] },
  { id: 'intralciato', name: 'Intralciato', summary: '−2 ai tiri per colpire, −4 alla Des, metà velocità, non può correre né caricare. Lanciare incantesimi richiede concentrazione.',
    modifiers: [pen({ kind: 'attack', scope: 'all' }, -2), pen({ kind: 'ability', ability: 'dex' }, -4)] },
  { id: 'invisibile', name: 'Invisibile', summary: '+2 ai tiri per colpire contro chi non lo vede, e i bersagli perdono il bonus di Des alla CA. Situazionale: non applicato automaticamente.',
    modifiers: [], attackNote: '+2 contro chi non lo vede' },
  { id: 'morente', name: 'Morente', summary: 'PF negativi: privo di sensi; ogni round prova di Cos (CD 10 + PF negativi) per stabilizzarsi, altrimenti perde 1 PF.',
    modifiers: [], losesDexToAC: true, attackNote: 'non può agire' },
  { id: 'nauseato', name: 'Nauseato', summary: 'Può compiere solo una singola azione di movimento per turno. Non può attaccare, lanciare incantesimi né concentrarsi.',
    modifiers: [], attackNote: 'non può attaccare' },
  { id: 'paralizzato', name: 'Paralizzato', summary: 'For e Des effettive 0: indifeso, non può muoversi né agire fisicamente. Può compiere azioni puramente mentali.',
    modifiers: [], losesDexToAC: true, attackNote: 'non può agire' },
  { id: 'pietrificato', name: 'Pietrificato', summary: 'Trasformato in pietra: privo di sensi. Le parti rotte restano danneggiate se torna normale.',
    modifiers: [], losesDexToAC: true, attackNote: 'non può agire' },
  { id: 'privo-di-sensi', name: 'Privo di sensi', summary: 'Svenuto e indifeso.',
    modifiers: [], losesDexToAC: true, attackNote: 'non può agire' },
  { id: 'prono', name: 'Prono', summary: 'A terra: −4 ai tiri per colpire in mischia. +4 alla CA contro attacchi a distanza e −4 contro attacchi in mischia (non applicati automaticamente). Non può usare armi a distanza tranne le balestre.',
    modifiers: [pen({ kind: 'attack', scope: 'melee' }, -4)], attackNote: 'armi a distanza solo balestre' },
  { id: 'scosso', name: 'Scosso', summary: '−2 a tiri per colpire, TS, prove di abilità e di caratteristica. Non si cumula con altre condizioni di paura.',
    modifiers: generalPenalty(-2), group: 'fear' },
  { id: 'stabile', name: 'Stabile', summary: 'Non sta più morendo, ma resta privo di sensi con PF negativi.',
    modifiers: [] },
  { id: 'stordito', name: 'Stordito', summary: 'Lascia cadere ciò che tiene, non può agire, −2 alla CA e perde il bonus di Des alla CA.',
    modifiers: [pen({ kind: 'ac' }, -2)], losesDexToAC: true, attackNote: 'non può agire' },
];

export const getCondition = (id: string) => CONDITIONS.find(c => c.id === id);
