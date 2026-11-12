# Tasks

## 1. Modello dati e cataloghi

- [x] 1.1 Aggiungere a `src/types/index.ts` `BonusType`, `ModifierTarget`, `Modifier`, `ActiveCondition`, `ActiveEffect` e i campi opzionali `conditions`, `effects`, `abilityDamage`, `abilityDrain`, `negativeLevels` su `Character`
- [x] 1.2 Creare `src/data/conditions.ts` con il catalogo delle condizioni (nome, promemoria, modificatori, `losesDexToAC`, gruppo paura)
- [x] 1.3 Creare `src/data/effectPresets.ts` con i preset elencati nello spec `character-effects`
- [x] 1.4 Etichette italiane per tipi di bonus e bersagli (`src/data/modifierLabels.ts`) per editor e dettaglio

## 2. Motore dei valori derivati

- [x] 2.1 Implementare `stack()` con regole di cumulo e bonus scartati
- [x] 2.2 Implementare la raccolta delle fonti (condizioni attive con deduplica paura, effetti abilitati, livelli negativi)
- [x] 2.3 Implementare punteggi e modificatori effettivi (risucchio, modificatori di caratteristica, danno)
- [x] 2.4 Implementare `deriveStats(char)`: TS, attacchi e danni mischia/distanza, CA/contatto/impreparato, CMB, CMD, iniziativa, abilità, prove di caratteristica, PF massimi, flag e avvisi
- [x] 2.5 Test di non regressione: senza modificatori `deriveStats` coincide con i calcoli attuali
- [x] 2.6 Test di cumulo e bersagli ampi (scenari degli spec `character-modifiers`)
- [x] 2.7 Test di condizioni (Scosso, paura non cumulata, Impreparato/Des alla CA, Prono solo mischia), danno/risucchio e livelli negativi

## 3. Store

- [x] 3.1 Azioni `addCondition`, `removeCondition` (riapplicare aggiorna la nota)
- [x] 3.2 Azioni `addEffect`, `updateEffect`, `toggleEffect`, `removeEffect`
- [x] 3.3 Azioni `setAbilityDamage`, `setAbilityDrain`, `setNegativeLevels` (valori ≥ 0)
- [x] 3.4 Azione `endRound` (poi rimossa, vedi 7.2)
- [x] 3.5 `fullRest`: cura 1 punto di danno per caratteristica, non il risucchio; usare i PF massimi del motore
- [x] 3.6 Test delle azioni (condizioni, effetti, riposo)

## 4. Refactoring delle viste sul motore

- [x] 4.1 `CharacterSheet`: calcolare `deriveStats` una volta e passarlo ai pannelli; barra PF con PF massimi effettivi
- [x] 4.2 `AbilityPanel`: punteggi e modificatori effettivi, indicazione danno/risucchio
- [x] 4.3 `CombatStats`: TS, CA/contatto/impreparato, iniziativa, CMB, CMD dal motore
- [x] 4.4 `AttacksPanel`: bonus d'attacco per tipo e danni dal motore, tiri rapidi con i totali modificati
- [x] 4.5 `SkillsPanel`: totali dal motore (mantenendo il campo `misc` esistente)
- [x] 4.6 `HomePage` e pannello lobby: valori dal motore
- [x] 4.7 Evidenziazione `is-buffed`/`is-debuffed` e popover di dettaglio fonti (applicati e scartati)

## 5. UI condizioni, effetti e stato

- [x] 5.1 Chip di condizioni ed effetti nell'header, popover con promemoria e rimozione
- [x] 5.2 Sezione «Condizioni ed effetti» nel tab Combattimento
- [x] 5.3 Picker condizioni con ricerca e nota
- [x] 5.4 Picker preset con ricerca ed editor effetto (nome, nota, righe modificatore) per preset e personalizzati
- [x] 5.5 Lista effetti con modifica, disattivazione e rimozione
- [x] 5.6 Editor danno/risucchio per caratteristica e livelli negativi temporanei/permanenti
- [x] 5.7 Avvisi critici (danno ≥ punteggio, punteggio a 0, livelli negativi ≥ DV) e promemoria livello dell'incantatore nel tab Incantesimi
- [x] 5.8 Layout mobile (≥360px) di chip, sezione Stato ed editor

## 6. Verifica

- [x] 6.1 `tsc -b`, lint sui file toccati, `npm test`
- [x] 6.2 Prova manuale: personaggio senza effetti mostra gli stessi numeri di prima in scheda, homepage e lobby
- [x] 6.3 Prova manuale degli scenari principali: Scosso + Benedizione, Ingrandire persona, Impreparato, Prono, Accecato (avviso sugli attacchi), danno Cos con riposo, 2 livelli negativi
- [x] 6.4 Persistenza dopo reload e visualizzazione in lobby

## 7. Revisione dopo la prima prova

- [x] 7.1 Effetti non numerici delle condizioni sugli attacchi (`attackNote`/`attackNotes`): riquadro nel pannello Attacchi, ⚠ sui badge, nota nell'etichetta del tiro rapido; test per Accecato
- [x] 7.2 Rimuovere la durata in round: campi `roundsLeft`, azione `endRound`, pulsante «Fine round», campi durata nei form, round nei chip
- [x] 7.3 Sezione «Condizioni ed effetti» a scomparsa, chiusa di default, con conteggio degli elementi attivi e avvisi critici sempre visibili
- [x] 7.4 Riordinare il tab Combattimento: Caratteristiche, Punti Ferita, Condizioni ed effetti (chiusa), CA/TS/manovre, Attacchi; dividere `CombatStats` in `HitPointsPanel` e `CombatStats`; «Preso Sorpresa» diventa «Colto di sorpresa»; box di CA, TS e manovre arrotondati
