# Tasks

## 1. Progressioni e modello

- [x] 1.1 Aggiungere in `src/types/index.ts` il tipo `SpellProgression`, il campo `progression` in `ClassDefinition.spellcasting` e i campi opzionali `ability`, `type`, `school`, `progression`, `usesSpellbook` e `customSpellLevels` in `CustomClassSpellcasting`. Dichiarare la progressione delle 7 classi base. Verificare con `npx tsc -b` senza nuovi errori.
- [x] 1.2 Creare `src/data/spellProgressions.ts` con `PROGRESSION_TABLES` e `casterLevelFor`. Verificare con test:
  - le tabelle di mago, chierico, druido, stregone, bardo, paladino e ranger coincidono con quelle della loro progressione;
  - con progressione ridotta, livello 7 → LI 4 e livello 2 → LI 0;
  - con progressione piena, livello 7 → LI 7.
- [x] 1.3 Creare `src/utils/spellcasting.ts` con `resolveSpellcasting`, `spellLevelFor`, `classSpellList`, `defaultCustomSpellLevel` e `casterLevel(char, classId)`. Verificare con test:
  - una classe base restituisce il proprio modello;
  - una custom completa restituisce il proprio;
  - una custom vecchia con sola lista sorgente stregone eredita Carisma, spontanea, arcana, piena;
  - una custom senza sorgente e incompleta restituisce `null`;
  - ridotta + spontanea restituisce `null`;
  - unione chierico + Palla di Fuoco al 3°;
  - il livello degli aggiuntivi prevale;
  - con progressione ridotta e lista mago non ci sono incantesimi sopra il 4°;
  - il livello proposto è il minimo fra le liste.

## 2. Calcoli e prerequisiti

- [x] 2.1 Cambiare `computeSpellSlots` e `spellsKnownAtLevel` perché accettino il modello risolto, e rimuovere `armorClass` e il vecchio `casterLevel` da `calculations.ts`. Verificare con un test che gli slot di un mago, uno stregone, un bardo e un paladino di 5° livello siano invariati, e che una custom piena/preparata/Int di 3° livello abbia gli slot del mago.
- [x] 2.2 Rinominare `effectiveAbilityScores` in `permanentAbilityScores`, con JSDoc, in tutti gli usi. Verificare con test sugli scenari di `feat-prerequisites`:
  - la Cintura +2 non soddisfa Forza 13;
  - un incremento di livello la soddisfa;
  - il danno a Destrezza non impedisce Destrezza 15.
- [x] 2.3 Far usare a `spellConsumables.usability` la funzione `casterLevel(char, classId)`, con le classi custom valide per la loro lista sorgente. Verificare con un test: un paladino di 5° livello con una pergamena da paladino a LI 4 deve dare la prova LI CD 5; gli scenari esistenti restano verdi.

## 3. Interfaccia

- [x] 3.1 Migrare `SpellsPanel` a `resolveSpellcasting` e `classSpellList`, compresi slot, CD, avviso arcano, preparati e conosciuti, senza `spell.levels[` e senza `isBuiltinClass` per la magia. Verificare con uno smoke test: un personaggio con una classe custom incantatrice mostra la sua sezione con gli slot del mago; un mago base non cambia.
- [x] 3.2 Migrare `LevelUpWizard` e `Step6_Spells` allo stesso modo. Verificare con uno smoke test di `Step6_Spells` con una classe custom incantatrice, e con un test di ricerca nel codice: in `src/components` non restano `.levels[`.
- [x] 3.3 Aggiornare la sezione magia di `CustomClassEditor`:
  - campi caratteristica, tipo e libro, tradizione e progressione;
  - valori proposti dalla lista sorgente;
  - «ridotta» che disabilita «spontanei»;
  - livello per ogni incantesimo aggiuntivo, proposto con il minimo;
  - avviso sui campi mancanti.
  Verificare con uno smoke test dell'editor con la sorgente Mago (Intelligenza, preparati, libro, arcana, piena), e con un incantesimo aggiuntivo che mostra il livello proposto.

## 4. Verifica d'insieme

- [x] 4.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.
- [x] 4.2 Provare sul dev server:
  - creare come admin una classe custom incantatrice (sorgente Chierico, Saggezza, preparati, divina, media, con Palla di Fuoco al 3°) e pubblicarla;
  - creare un personaggio con quella classe e controllare gli incantesimi alla creazione, gli slot e la CD nella scheda, e il level-up;
  - controllare il LI di un paladino con una pergamena;
  - controllare che un mago esistente sia invariato.

## Workflow follow-up

- Archiviare la change con `/opsx:archive` dopo la verifica dell'utente.
