## Context

Il modulo dati delle classi è composto da tre file:

- `classes_part1.ts` – barbarian, bard, cleric, druid, fighter
- `classes_part2.ts` – monk, paladin, ranger, rogue, sorcerer, wizard
- `classes.ts` – aggrega i due array e ri-esporta `CLASSES` e `getClass`

La suddivisione `_part1`/`_part2` non ha semantica: è nata per tenere i file sotto una certa dimensione. Non esiste un criterio per sapere in quale dei due file inserire una nuova classe, e ogni aggiunta richiede di modificare un file già popolato.

L'API pubblica (array `CLASSES`, funzione `getClass`) è consumata dal resto dell'app tramite import da `src/data/classes.ts`.

## Goals / Non-Goals

**Goals:**
- Una classe = un file sotto `src/data/classes/`
- Un barrel `src/data/classes/index.ts` che aggrega e ri-esporta
- `src/data/classes.ts` diventa un thin re-export trasparente per retrocompatibilità
- Aggiungere una nuova classe = creare un file + aggiungere un'import in `index.ts`

**Non-Goals:**
- Modificare i dati di gioco delle classi (features, slot, etc.)
- Cambiare i tipi TypeScript (`ClassDefinition`, etc.)
- Aggiungere nuove classi nel corso di questo refactor
- Modificare nessun consumer dell'API pubblica

## Decisions

### 1. Un file per classe, non un file per gruppo

**Scelto**: `src/data/classes/barbarian.ts`, `bard.ts`, …  
**Alternativa scartata**: raggruppare per tipo (casters, martials, …)

Ragione: la granularità per classe è la più prevedibile. Un team member che cerca il Mago sa esattamente dove guardare. Raggruppamenti per tipo richiederebbero decisioni arbitrarie (es. il Bardo è un caster o un half-caster?).

### 2. Barrel `index.ts` esplicito (import manuali, non glob)

**Scelto**: ogni file di classe esporta una costante named (es. `export const BARBARIAN`), e `index.ts` le importa tutte esplicitamente e costruisce `CLASSES`.  
**Alternativa scartata**: import dinamico / barrel automatico via `import.meta.glob`

Ragione: il progetto è un'app Vite/TS standard. L'import esplicito è type-safe, prevedibile e non richiede plugin o configurazioni particolari. Il numero di classi (11) è fisso e basso.

### 3. `classes.ts` rimane come thin re-export

**Scelto**: `classes.ts` ri-esporta tutto da `classes/index.ts`, senza cambiare l'API.  
**Alternativa scartata**: aggiornare tutti i consumer per importare da `classes/index.ts`

Ragione: evita modifiche a cascata su tutti i file che importano `CLASSES`. Il file `classes.ts` diventa un indirection layer a costo zero.

### 4. Naming della costante per file

Ogni file esporta una costante named in ALL_CAPS che corrisponde alla classe:
```ts
// barbarian.ts
export const BARBARIAN: ClassDefinition = { id: 'barbarian', … }
```
`index.ts` aggrega: `export const CLASSES = [BARBARIAN, BARD, …]`

## Risks / Trade-offs

- **Merge conflict risk durante migrazione**: i file `_part1` e `_part2` vengono eliminati in un unico PR. Se ci sono branch attivi che modificano quei file, dovranno essere ribasati. → Comunicare il refactor al team prima di fare il merge.
- **Import circolari**: nessun rischio; i file di classe non importano tra loro, solo `spellSlots.ts` e i tipi.
- **Tree-shaking**: con il barrel esplicito, tutti i file classe vengono inclusi nel bundle anche se una singola classe non è usata. Questo era già il comportamento attuale, quindi non è una regressione.

## Migration Plan

1. Creare `src/data/classes/` con tutti i file di classe
2. Creare `src/data/classes/index.ts` che aggrega in `CLASSES`
3. Aggiornare `src/data/classes.ts` per re-esportare da `./classes/index`
4. Rimuovere `src/data/classes_part1.ts` e `src/data/classes_part2.ts`
5. Verificare che la build TypeScript non produca errori (`tsc --noEmit`)
6. Verificare che i test esistenti passino

**Rollback**: ripristinare i file `_part1`/`_part2` dal git history e revertire `classes.ts`.
