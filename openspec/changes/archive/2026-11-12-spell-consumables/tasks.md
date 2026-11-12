# Tasks

## 1. Modello e preset al LI

- [x] 1.1 Aggiungere in `src/types/index.ts` `ConsumableForm`, `SpellItem`, `ItemKind` `'consumable'` e `EquipmentItem.spellItem?`. Aggiornare `KIND_LABELS` («Consumabile»). Verificare con `npx tsc -b` senza nuovi errori.
- [x] 1.2 Aggiungere `modifiersAt` a `EffectPreset` per Scudo della fede e Pelle coriacea, e `presetModifiersAt(preset, cl)`. Verificare con test sugli scenari di `character-effects`: Scudo della fede con LI 6 = +3, Pelle coriacea con LI 12 = +5, Forza del toro con LI 9 = +4.
- [x] 1.3 Creare `src/data/spellEffectLinks.ts`, cercando nel database gli id reali degli incantesimi per nome, senza «Ira». Verificare con un test che ogni coppia punti a un incantesimo di `public/data/spells.json` e a un preset esistenti.

## 2. Logica pura dei consumabili

- [x] 2.1 Implementare in `src/utils/spellConsumables.ts` le funzioni `FORM_LIMITS`, `minCasterLevel`, `availableLists`, `spellItemPrice`, `spellItemDc`, `spellItemName` e `createSpellItem`. Verificare con test sugli scenari: pozione 50 mo, pergamena di 3° livello con LI 5 = 375 mo, bacchetta 750 mo, CD 14, LI di default 5, pozione di 4° livello impossibile, bacchetta al massimo 50 cariche.
- [x] 2.2 Implementare `usability(char, item)`, che considera le liste delle classi base e la `sourceList` delle classi custom. Verificare con test: mago con pergamena da mago utilizzabile, guerriero con bacchetta → Utilizzare Congegni Magici CD 20, pergamena di un altro tipo → CD 20 + LI, mago di 1° livello con pergamena LI 5 → prova LI CD 6, pozione sempre utilizzabile.
- [x] 2.3 Implementare `useConsumable(char, itemId)` e `undoConsumable(char, undo)`: scalano una dose o una carica, rimuovono pozioni e pergamene esaurite, lasciano la bacchetta scarica, applicano l'effetto collegato al LI e ripristinano tutto con l'annullamento. Verificare con test su tre pozioni → due, ultima pozione rimossa, ultima carica che lascia la bacchetta a 0, Scudo della fede con LI 6 che dà +3 deviazione alla CA in `deriveStats`, annullamento completo e uso a 0 cariche senza effetto.

## 3. Store

- [x] 3.1 Aggiungere le azioni `useConsumable` (che restituisce l'undo) e `undoConsumable` in `characterStore.ts`. Verificare con un test dello store che il documento sincronizzato non contenga valori `undefined` e che l'annullamento ripristini l'oggetto alla stessa posizione.

## 4. Interfaccia

- [x] 4.1 Estrarre da `ItemPicker` il pannello dell'acquisto in un componente condiviso `PurchaseBox` (prezzo proposto modificabile, monete disponibili, importo mancante, conferma disabilitata), senza cambiare il comportamento attuale. Verificare con lo smoke test del picker e a mano un acquisto dal catalogo.
- [x] 4.2 Creare `SpellItemCreator`: ricerca dell'incantesimo, forma, lista di classe ammessa con etichette leggibili, LI, quantità o cariche, anteprima di nome, prezzo e CD, «Aggiungi» o «Acquista». Collegarlo alla tab Equipaggiamento con il pulsante «+ Pozione / pergamena / bacchetta». Verificare con uno smoke test dell'anteprima e a mano la creazione di una bacchetta su mobile (nessuno scroll orizzontale).
- [x] 4.3 Aggiornare le righe dell'inventario e `ItemEditor` per i consumabili: quantità o cariche, «scarica», usabilità, CD dell'oggetto, «Usa», editor ridotto con LI e cariche. Verificare con lo smoke test (bacchetta 37/50, «scarica», «Utilizzare Congegni Magici CD 20»).
- [x] 4.4 Aggiungere la sezione «Consumabili» nella tab Combattimento, nascosta se il personaggio non ne ha, e l'avviso con «Annulla» dopo l'uso. Verificare con lo smoke test (sezione presente o assente) e a mano uso e annullamento di una pozione di Scudo della fede.
- [x] 4.5 Nella lobby, in sola lettura, mostrare i consumabili senza «Usa». Verificare con lo smoke test `readOnly`.

## 5. Verifica d'insieme

- [x] 5.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.
- [ ] 5.2 Provare sul dev server un chierico che acquista 3 pozioni di Cura Ferite Leggere e una pergamena di Scudo della Fede con LI 6, e un guerriero con una bacchetta. Controllare usi, annullamento, effetto in CA, «scarica», avvisi di Utilizzare Congegni Magici, e la lobby in sola lettura.

## Workflow follow-up

- Archiviare la change con `/openspec-archive-change` dopo la verifica dell'utente.
