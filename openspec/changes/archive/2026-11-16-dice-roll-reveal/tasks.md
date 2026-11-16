# Tasks

## 1. Modello e logica pura

- [x] 1.1 Aggiungere `Character.diceAnimations?: boolean` in `src/types/index.ts`, e `RollPart`, `parts?` e `critRange?` a `RollRequest`. Verificare con `npx tsc -b` senza nuovi errori.
- [x] 1.2 Creare `src/utils/rollReveal.ts` con `rollParts(stat, baseLabel)`, `partsMatch(parts, modifier)`, `rollOutcome(dice, dieType, critRange)` e `showDice(n)`. Verificare con test:
  - le parti di uno `Stat` con effetti sommano a `total`, senza voci a 0;
  - con parti incoerenti `partsMatch` è falso;
  - 20 → crit, 1 → fumble, 19 con minaccia 19 → threat, 19 senza minaccia → nessun esito, 2d20 → nessun esito;
  - `showDice(5)` è vero e `showDice(6)` è falso.

## 2. Scomposizione dai punti di tiro

- [x] 2.1 Passare `parts` da `AbilityPanel` (prove di caratteristica), `CombatStats` (tiri salvezza, iniziativa, BMC, BAB) e `SkillsPanel` (abilità). Verificare con un test che, per un personaggio con effetti e un oggetto magico, la somma di `parts` sia uguale al `modifier` di ogni richiesta.
- [x] 2.2 Passare `parts` e `critRange` da `AttacksPanel` per la catena globale e per gli attacchi delle armi, con la voce «Attacco iterativo» per gli attacchi successivi. Verificare con un test:
  - Spada lunga affilata +1 → `critRange` 17 e una voce di potenziamento;
  - secondo attacco → voce −5;
  - somma delle parti uguale al bonus.

## 3. Rivelazione

- [x] 3.1 Creare `DiceStage` (sagome SVG per d4, d6, d8, d10/d100, d12 e d20; valori che scorrono durante `spinning`; rimbalzo all'atterraggio; lista dei soli valori oltre 5 dadi) e gli stili e keyframe in `src/index.css`. Verificare con uno smoke test: la sagoma del d20 c'è per 1d20, nessuna sagoma per 10d6.
- [x] 3.2 Creare `RollReveal` con la sequenza `spinning → landed → bonus → total`, il salto e la chiusura al tocco, Esc, la chiusura automatica dopo circa 1,5 s, `prefers-reduced-motion`, gli effetti critico, minaccia e fumble e `role="status"`. Verificare con test con timer finti:
  - la sequenza arriva al totale e si chiude;
  - un tocco salta alla fine;
  - con movimento ridotto si parte dal totale;
  - parti incoerenti mostrano il solo modificatore;
  - «CRITICO!», «Minaccia» e «FUMBLE!» compaiono quando previsto.
- [x] 3.3 Integrare `RollReveal` in `DiceRoller` con la prop `animate`, renderizzandolo anche a pannello chiuso e generando un `key` nuovo a ogni tiro, senza cambiare cronologia e `onRollResult`. Verificare con uno smoke test che `animate=false` non mostri l'overlay e che il messaggio per la chat resti identico.

## 4. Impostazione per personaggio

- [x] 4.1 Aggiungere la spunta «Animazioni dei dadi» a `CharacterCustomizationPanel` e collegarla in `CharacterSheet` con `updateCharacter`. Passare `animate={char.diceAnimations !== false}` a `DiceRoller` in `CharacterSheet` e `LobbySheetPanel`. Verificare con uno smoke test che la spunta sia selezionata per un personaggio senza campo e deselezionata con `diceAnimations: false`.

## 5. Verifica d'insieme

- [x] 5.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo nei file toccati) e `npm run build`.
- [x] 5.2 Provare sul dev server, su desktop e a larghezza mobile:
  - un tiro salvezza con un effetto attivo;
  - un attacco con arma affilata, fino a vedere «Minaccia» o «CRITICO!»;
  - 10d6;
  - un tiro manuale dal pannello;
  - il salto e la chiusura al tocco;
  - la spunta disattivata;
  - un tiro in lobby che arriva in chat senza animazione per gli altri.

## Workflow follow-up

- Archiviare la change con `/opsx:archive` dopo la verifica dell'utente.
- Change successiva: dadi 3D sostituendo `DiceStage`.
