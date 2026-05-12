## 1. Creare i file per ogni classe

- [x] 1.1 Creare `src/data/classes/barbarian.ts` con export `BARBARIAN`
- [x] 1.2 Creare `src/data/classes/bard.ts` con export `BARD`
- [x] 1.3 Creare `src/data/classes/cleric.ts` con export `CLERIC`
- [x] 1.4 Creare `src/data/classes/druid.ts` con export `DRUID`
- [x] 1.5 Creare `src/data/classes/fighter.ts` con export `FIGHTER`
- [x] 1.6 Creare `src/data/classes/monk.ts` con export `MONK`
- [x] 1.7 Creare `src/data/classes/paladin.ts` con export `PALADIN`
- [x] 1.8 Creare `src/data/classes/ranger.ts` con export `RANGER`
- [x] 1.9 Creare `src/data/classes/rogue.ts` con export `ROGUE`
- [x] 1.10 Creare `src/data/classes/sorcerer.ts` con export `SORCERER`
- [x] 1.11 Creare `src/data/classes/wizard.ts` con export `WIZARD`

## 2. Creare il barrel index

- [x] 2.1 Creare `src/data/classes/index.ts` che importa tutte le costanti e le aggrega nell'array `CLASSES`
- [x] 2.2 Aggiungere `getClass` in `src/data/classes/index.ts`

## 3. Aggiornare il punto di ingresso pubblico

- [x] 3.1 Aggiornare `src/data/classes.ts` per re-esportare `CLASSES` e `getClass` da `./classes/index`

## 4. Rimuovere i file legacy

- [x] 4.1 Eliminare `src/data/classes_part1.ts`
- [x] 4.2 Eliminare `src/data/classes_part2.ts`

## 5. Verifica

- [x] 5.1 Eseguire `tsc --noEmit` e risolvere eventuali errori TypeScript
- [x] 5.2 Verificare che la build (`npm run build` o `vite build`) completi senza errori
