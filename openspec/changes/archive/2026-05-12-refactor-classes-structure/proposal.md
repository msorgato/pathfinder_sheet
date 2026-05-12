## Why

Le classi Pathfinder sono attualmente suddivise arbitrariamente in `classes_part1.ts` e `classes_part2.ts` e riunite in `classes.ts`, una struttura che non scala: aggiungere nuove classi richiede di modificare file esistenti condivisi, e non esiste una separazione chiara per classe. Il refactor introduce un file per classe, un indice centrale generato per aggregazione, e una struttura `src/data/classes/` che rende banale l'aggiunta futura.

## What Changes

- Creazione della directory `src/data/classes/` con un file TypeScript dedicato per ogni classe (es. `barbarian.ts`, `bard.ts`, …)
- Rimozione dei file `classes_part1.ts` e `classes_part2.ts`
- `classes.ts` diventa un indice puro che re-esporta da `classes/index.ts`
- `classes/index.ts` aggrega tutte le classi in un unico array `CLASSES` e ri-esporta `getClass`
- Nessun cambio alle interfacce `ClassDefinition` o ai tipi esistenti
- Nessun cambio ai dati delle classi (features, spellcasting, etc.)

## Capabilities

### New Capabilities

- `class-file-structure`: Ogni classe Pathfinder risiede in un file autonomo sotto `src/data/classes/`, con un barrel `index.ts` che le aggrega.

### Modified Capabilities

<!-- Nessuna modifica ai requisiti di spec esistenti: il comportamento runtime rimane identico. -->

## Impact

- **File rimossi**: `src/data/classes_part1.ts`, `src/data/classes_part2.ts`
- **File modificati**: `src/data/classes.ts` (diventa thin re-export)
- **File aggiunti**: `src/data/classes/index.ts` + uno per ogni classe (barbarian, bard, cleric, druid, fighter, monk, paladin, ranger, rogue, sorcerer, wizard)
- Nessun impatto su consumer esterni: l'API pubblica (`CLASSES`, `getClass`) rimane invariata
- Nessuna dipendenza esterna aggiunta
