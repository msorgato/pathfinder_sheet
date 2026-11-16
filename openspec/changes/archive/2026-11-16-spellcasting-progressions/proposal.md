# Proposal

## Why

La gestione della magia è cresciuta per strati, e oggi produce risultati sbagliati.
- **Classi personalizzate.** Possono abilitare gli incantesimi nell'editor, ma la scheda le scarta: il loro modello non dice con quale caratteristica lanciano, quanti slot hanno né se preparano. Questo va contro lo spec `custom-class-admin`.
- **Livello dell'incantatore (LI).** È calcolato in più punti, ed è sempre uguale al livello di classe: per paladino e ranger è sbagliato (LI = livello − 3).
- **Prerequisiti dei talenti.** Usano i punteggi base, che è corretto, ma tramite una funzione chiamata `effectiveAbilityScores`, che suggerisce il contrario.

## What Changes

**Progressioni di incantesimi come dati**
- Ci sono tre progressioni, ricavate dalle tabelle esistenti:
  - **piena** (fino al 9° livello);
  - **media** (fino al 6°);
  - **ridotta** (fino al 4°).
- Combinate con il tipo, preparati o spontanei, determinano gli slot, gli incantesimi conosciuti e il livello massimo:
  - piena + preparati = mago;
  - piena + spontanei = stregone;
  - media + spontanei = bardo;
  - ridotta + preparati = paladino.
- La combinazione «ridotta + spontanei» non è disponibile, perché non esiste una tabella di incantesimi conosciuti.
- Le classi base dichiarano la propria progressione.

**Livello dell'incantatore unico**
- Il LI è calcolato in un solo punto, sulla base della progressione: pari al livello di classe per piena e media, e livello − 3 (minimo 0) per ridotta.
- Lo usano la scheda e la verifica d'uso di pergamene e bacchette.

**Classi personalizzate che lanciano incantesimi** (facoltativo per ogni classe)
- L'editor admin chiede:
  - caratteristica;
  - tipo (preparati o spontanei, con o senza libro degli incantesimi);
  - tradizione (arcana o divina);
  - progressione;
  - lista sorgente;
  - incantesimi aggiuntivi, **ognuno con il proprio livello**, proposto con il più basso fra le liste e modificabile.
- La lista della classe è **l'unione** della lista sorgente e degli incantesimi aggiuntivi.
- Le classi abilitate prima di questa change, che hanno solo la lista sorgente, ereditano caratteristica, tipo, tradizione e progressione dalla classe base corrispondente.
- Una classe custom incantatrice compare nella sezione Incantesimi della scheda, nel level-up e nella creazione del personaggio, come le classi base.

**Prerequisiti**
- I prerequisiti dei talenti usano **solo i punteggi base**: punteggio iniziale, razza, incrementi di livello ed età. Oggetti, effetti, danni e risucchi non contano.
- La funzione cambia nome per dirlo in modo esplicito.

**Pulizia**
- Rimossi da `calculations.ts` `armorClass` (inutilizzata) e il vecchio `casterLevel`.

## Capabilities

### New Capabilities
- `spellcasting`: progressioni di incantesimi, livello dell'incantatore, livello di un incantesimo per una classe (base o personalizzata) e lista degli incantesimi di una classe.
- `feat-prerequisites`: quali punteggi valgono per i prerequisiti dei talenti.

### Modified Capabilities
- `custom-class-admin`: la configurazione della magia di una classe aggiunge caratteristica, tipo, tradizione, progressione e livello degli incantesimi aggiuntivi.
- `custom-class-character-integration`: le classi personalizzate incantatrici sono usabili nella scheda, nel level-up e nella creazione.
- `spell-consumables`: la prova di livello dell'incantatore per le pergamene usa il LI della progressione.

## Impact

**Tipi**
- `CustomClassSpellcasting` riceve i campi opzionali `ability`, `type`, `school`, `progression`, `usesSpellbook` e `customSpellLevels`.
- `ClassDefinition.spellcasting` riceve `progression`.

**Logica**
- Nuovo `src/utils/spellcasting.ts`, che sostituisce le letture dirette di `spell.levels[classId]` in circa 12 punti: `SpellsPanel`, `LevelUpWizard`, `Step6_Spells`.
- Si aggiorna `spellConsumables.ts`.
- `calculations.ts` perde le funzioni morte.
- `effectiveAbilityScores` è rinominata.

**Interfaccia**
- Sezione magia di `CustomClassEditor`.
- `SpellsPanel`, `LevelUpWizard` e `Step6_Spells` accettano le classi custom.

**Firestore**: solo campi opzionali nuovi sulle classi custom, senza modifiche alle regole.
