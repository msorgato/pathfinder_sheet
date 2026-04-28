import type { FeatDefinition } from '../types';

export const FEATS: FeatDefinition[] = [
  // ── COMBATTIMENTO ─────────────────────────────────────────────────────────
  { id: 'power_attack', name: 'Attacco Poderoso', type: 'Combat', prerequisites: 'FOR 13, BAB +1', description: 'Puoi scegliere di penalizzare i tiri d\'attacco per ottenere più danno.', benefit: '-1 ai tiri d\'attacco, +2 al danno (o +3 con arma a due mani). Scala ogni 4 punti di BAB.' },
  { id: 'combat_expertise', name: 'Esperto in Combattimento', type: 'Combat', prerequisites: 'INT 13', description: 'Puoi scambiare efficacia offensiva per difesa.', benefit: '-1 ai tiri d\'attacco, +1 alla CA fino al tuo prossimo turno. Scala a -5/+5.' },
  { id: 'cleave', name: 'Fendente', type: 'Combat', prerequisites: 'FOR 13, Attacco Poderoso, BAB +1', description: 'Puoi attaccare un secondo avversario dopo aver abbattuto uno.', benefit: 'Se uccidi o incapaciti un avversario, puoi fare immediatamente un attacco aggiuntivo contro un altro avversario adiacente.' },
  { id: 'great_cleave', name: 'Grande Fendente', type: 'Combat', prerequisites: 'FOR 13, Attacco Poderoso, Fendente, BAB +4', description: 'Non c\'è limite al numero di attacchi aggiuntivi con Fendente.', benefit: 'Come Fendente, ma puoi continuare ad attaccare finché non fallisci un attacco.' },
  { id: 'dodge', name: 'Schivata', type: 'Combat', description: 'Ottieni un bonus alla CA contro un avversario specifico.', benefit: '+1 alla CA. (Questo bonus si applica a tutti gli avversari).' },
  { id: 'mobility', name: 'Mobilità', type: 'Combat', prerequisites: 'Schivata', description: 'Non provochi attacchi di opportunità mentre ti muovi.', benefit: '+4 alla CA contro gli attacchi di opportunità provocati dal movimento.' },
  { id: 'spring_attack', name: 'Attacco in Corsa', type: 'Combat', prerequisites: 'DES 13, Schivata, Mobilità, BAB +4', description: 'Puoi muoverti prima e dopo l\'attacco.', benefit: 'Come azione di attacco standard, puoi muoverti fino alla velocità e attaccare una volta durante il movimento.' },
  { id: 'two_weapon_fighting', name: 'Combattimento con Due Armi', type: 'Combat', prerequisites: 'DES 15', description: 'Riduci le penalità per combattere con due armi.', benefit: 'Penalità ridotte: -2 mano principale / -2 mano secondaria (invece di -6/-10).' },
  { id: 'improved_two_weapon', name: 'Combattimento con Due Armi Migliorato', type: 'Combat', prerequisites: 'DES 17, Combattimento con Due Armi, BAB +6', description: 'Ottieni un attacco aggiuntivo con la mano secondaria.', benefit: 'Ottieni un secondo attacco con la mano secondaria al massimo BAB -5.' },
  { id: 'weapon_focus', name: 'Focalizzazione nell\'Arma', type: 'Combat', prerequisites: 'BAB +1', description: 'Sei particolarmente abile con un\'arma scelta.', benefit: '+1 ai tiri d\'attacco con l\'arma scelta.' },
  { id: 'weapon_specialization', name: 'Specializzazione nell\'Arma', type: 'Combat', prerequisites: 'Guerriero 4, Focalizzazione nell\'Arma', description: 'Sei specializzato nel causare danni con un\'arma.', benefit: '+2 ai tiri del danno con l\'arma scelta.' },
  { id: 'iron_will', name: 'Volontà di Ferro', type: 'General', description: 'Hai una forte forza di volontà.', benefit: '+2 ai tiri salvezza sulla Volontà.' },
  { id: 'lightning_reflexes', name: 'Riflessi Fulminei', type: 'General', description: 'Hai riflessi eccezionali.', benefit: '+2 ai tiri salvezza sui Riflessi.' },
  { id: 'great_fortitude', name: 'Grande Resistenza', type: 'General', description: 'Sei molto resistente fisicamente.', benefit: '+2 ai tiri salvezza sulla Tempra.' },
  { id: 'toughness', name: 'Resistenza', type: 'General', description: 'Hai più punti ferita del normale.', benefit: '+3 PF. Ogni livello successivo al 3° aggiunge +1 PF.' },
  { id: 'improved_initiative', name: 'Iniziativa Migliorata', type: 'Combat', description: 'Agisci più rapidamente in combattimento.', benefit: '+4 alle prove di iniziativa.' },
  { id: 'alertness', name: 'Vigilanza', type: 'General', description: 'Sei molto attento all\'ambiente circostante.', benefit: '+2 alle prove di Percezione e Percepire Intenzioni.' },
  { id: 'blind_fight', name: 'Lotta alla Cieca', type: 'Combat', description: 'Combatti efficacemente senza poter vedere.', benefit: 'Puoi ritirare i tiri mancati del 50% per cecità o oscurità. Penalità per invisibilità ridotta.' },
  { id: 'combat_reflexes', name: 'Riflessi da Combattimento', type: 'Combat', description: 'Puoi effettuare più attacchi di opportunità.', benefit: 'Puoi fare fino a DES mod attacchi di opportunità aggiuntivi per round.' },
  { id: 'step_up', name: 'Passo Avanti', type: 'Combat', prerequisites: 'BAB +1', description: 'Segui un avversario che si ritira.', benefit: 'Quando un avversario adiacente fa un passo di 5 piedi, puoi farne uno anche tu come reazione immediata.' },
  { id: 'vital_strike', name: 'Colpo Vitale', type: 'Combat', prerequisites: 'BAB +6', description: 'Infliggi più danno con un singolo colpo potente.', benefit: 'Come azione standard, attacca due volte con i dadi danno (non i bonus numerici).' },
  { id: 'improved_vital_strike', name: 'Colpo Vitale Migliorato', type: 'Combat', prerequisites: 'Colpo Vitale, BAB +11', description: 'Ancora più danno con un singolo colpo.', benefit: 'Attacca tre volte con i dadi danno.' },
  { id: 'point_blank_shot', name: 'Tiro a Corto Raggio', type: 'Combat', description: 'Eccelli nel tiro a distanza ravvicinata.', benefit: '+1 ai tiri d\'attacco e danno con armi a distanza entro 9 m.' },
  { id: 'precise_shot', name: 'Tiro Preciso', type: 'Combat', prerequisites: 'Tiro a Corto Raggio', description: 'Puoi sparare in mischia senza rischiare di colpire gli alleati.', benefit: 'Nessuna penalità al tiro in mischia.' },
  { id: 'rapid_shot', name: 'Tiro Rapido', type: 'Combat', prerequisites: 'DES 13, Tiro a Corto Raggio', description: 'Spari più rapidamente del normale.', benefit: 'Puoi fare un attacco aggiuntivo con un\'arma a distanza con -2 a tutti gli attacchi del round.' },
  { id: 'manyshot', name: 'Tiro Multiplo', type: 'Combat', prerequisites: 'DES 17, Tiro Rapido, Tiro Preciso, BAB +6', description: 'Lanci due frecce contemporaneamente.', benefit: 'Con il primo attacco di ogni round con arco, puoi scoccare due frecce. Entrambe colpiscono con lo stesso tiro, ma danno separato.' },
  { id: 'spell_focus', name: 'Focalizzazione Negli Incantesimi', type: 'General', description: 'Gli incantesimi di una scuola sono più difficili da resistere.', benefit: '+1 al CD degli incantesimi di una scuola scelta.' },
  { id: 'greater_spell_focus', name: 'Focalizzazione Negli Incantesimi Maggiore', type: 'General', prerequisites: 'Focalizzazione Negli Incantesimi', description: 'I tuoi incantesimi sono ancora più potenti.', benefit: '+2 al CD degli incantesimi della scuola scelta (cumulativo con Focalizzazione).' },
  { id: 'spell_penetration', name: 'Penetrazione degli Incantesimi', type: 'General', description: 'I tuoi incantesimi superano più facilmente la resistenza magica.', benefit: '+2 alle prove di superare la resistenza magica.' },
  { id: 'combat_casting', name: 'Lancio in Combattimento', type: 'General', description: 'Lanci incantesimi in modo più sicuro in combattimento.', benefit: '+4 alle prove di Concentrazione per lanciare incantesimi sulla difensiva o mentre si è afferrati.' },
  { id: 'skill_focus', name: 'Focalizzazione dell\'Abilità', type: 'General', description: 'Hai una particolare affinità con una certa abilità.', benefit: '+3 alle prove di un\'abilità scelta. Se hai 10+ gradi, il bonus è +6.' },
  { id: 'athletic', name: 'Atletico', type: 'General', description: 'Sei fisicamente coordinato.', benefit: '+2 alle prove di Scalare e Nuotare.' },
  { id: 'acrobatic', name: 'Acrobatico', type: 'General', description: 'Sei particolarmente agile.', benefit: '+2 alle prove di Acrobazia e Volare.' },
  { id: 'persuasive', name: 'Persuasivo', type: 'General', description: 'Sei molto convincente.', benefit: '+2 alle prove di Diplomazia e Intimidire.' },
  { id: 'stealthy', name: 'Furtivo', type: 'General', description: 'Sei abile nel muoverti silenziosamente.', benefit: '+2 alle prove di Furtività e Sfuggire.' },
  { id: 'endurance', name: 'Resistenza Fisica', type: 'General', description: 'Riesci a svolgere attività fisiche per lungo tempo.', benefit: '+4 alle prove legate alla resistenza fisica. Puoi dormire in armatura media senza penalità.' },
  { id: 'diehard', name: 'Duro a Morire', type: 'General', prerequisites: 'Resistenza Fisica', description: 'Continui a combattere anche da morente.', benefit: 'Stai automaticamente stabilizzato quando sei a PF negativi. Puoi scegliere di agire normalmente con PF negativi.' },
  { id: 'run', name: 'Correre', type: 'General', description: 'Sei un corridore eccezionale.', benefit: 'La velocità di corsa è ×5 invece di ×4 (×6 in armatura leggera). +4 alle prove di Acrobazia per il salto in corsa.' },
  { id: 'improved_unarmed_strike', name: 'Attacco Senz\'Armi Migliorato', type: 'Combat', description: 'Sei esperto nel combattimento a mani nude.', benefit: 'Non provochi attacchi di opportunità quando attacchi a mani nude. Il danno è 1d3.' },
  { id: 'deflect_arrows', name: 'Deflettere i Proiettili', type: 'Combat', prerequisites: 'DES 13, Attacco Senz\'Armi Migliorato', description: 'Puoi deviare i proiettili in arrivo.', benefit: 'Una volta per round, devia automaticamente un proiettile o un\'arma da lancio che ti ha colpito.' },
  { id: 'improved_grapple', name: 'Presa Migliorata', type: 'Combat', prerequisites: 'DES 13, Attacco Senz\'Armi Migliorato', description: 'Sei esperto nella presa.', benefit: '+2 alle prove di Presa. Non provochi attacchi di opportunità per tentare una presa.' },
];

export const getFeat = (id: string): FeatDefinition | undefined =>
  FEATS.find(f => f.id === id);

export const COMBAT_FEATS = FEATS.filter(f => f.type === 'Combat');
export const GENERAL_FEATS = FEATS.filter(f => f.type === 'General');
export const METAMAGIC_FEATS = FEATS.filter(f => f.type === 'Metamagic');
