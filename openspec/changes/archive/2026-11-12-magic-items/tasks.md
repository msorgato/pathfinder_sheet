# Tasks

## 1. Tipi e dati curati

- [x] 1.1 Estendere i tipi in `src/types/index.ts`:
  - `EquipmentItem`: `masterwork?`, `enhancement?`, `material?`, `abilities?`, `modifiers?`, `basePriceGp?`;
  - `ItemKind`: `'magic'`;
  - `ItemDefinition`: `slot?`, `tier?`, `source?`;
  - nuovo tipo `MaterialId`.

  Verificare con `npx tsc -b` senza nuovi errori.
- [x] 1.2 Creare `src/data/materials.ts` (mithral, adamantio, ferro freddo, argento alchemico, legnoscuro: applicabilità, effetti, costi, note). Verificare con un test che i costi corrispondano agli scenari dello spec, ad esempio giaco di maglia in mithral = 1.100 mo.
- [x] 1.3 Creare `src/data/itemAbilities.ts` con le capacità di armi, armature e scudi elencate nel design (bonus equivalente o costo fisso, dadi extra, affilata, modificatori, note). I nomi vanno verificati sulle tabelle di `Armi_Magiche` e `Armature_Magiche`. Verificare con un test che non ci siano id duplicati e che ogni capacità abbia esattamente uno fra bonus equivalente e costo fisso.

## 2. Catalogo degli oggetti magici

- [x] 2.1 Estendere `scripts/import-items.ts`:
  - legge il database degli oggetti magici con un'unica chiamata `expandtemplates`;
  - converte slot, grado e fonte;
  - assegna `kind: 'magic'` e il prefisso `m-` agli id in caso di collisione;
  - non salva descrizioni.

  Verificare con `node scripts/import-items.ts` che gli oggetti magici siano 700 o più e che gli id degli oggetti comuni non cambino rispetto al catalogo attuale.
- [x] 2.2 Estendere `itemsCatalog.test.ts` con voci campione (Anello di Protezione +1: slot ring, 2.000 mo; un oggetto del collo; un oggetto senza slot), con l'unicità degli id e con l'assenza di campi descrittivi. Verificare con `npm test`.

## 3. Preset e logica degli oggetti

- [x] 3.1 Creare `src/data/magicItemEffects.ts` con i preset dei big six, di cinture e fasce (anche quelle doppie e triple) e degli oggetti con bonus fisso alle abilità. Applicarli in `itemFromCatalog`. Verificare con un test che ogni preset trovi almeno una voce del catalogo e che «Mantello della Resistenza +3» produca +3 di resistenza ai TS.
- [x] 3.2 Implementare in `src/utils/itemEnhancements.ts`:
  - `effectiveArmor`, `effectiveWeapon` e `abilityBonusTotal` (con il tetto di +10);
  - `computedPrice`, compreso `basePriceGp` per gli oggetti senza catalogo;
  - l'aggiornamento del peso dovuto al materiale.

  Verificare con test sugli scenari di `item-enhancements`: cotta +1, giaco in mithral, corazza in mithral, scudo in legnoscuro, affilata 17–20, prezzi 2.315 / 8.315 / 1.100 mo.
- [x] 3.3 Implementare `activeItems(char)`: oggetti indossati in ordine di inventario, con la capienza degli slot e lo stato «inattivo» per quelli in eccesso. Verificare con test su due anelli attivi, terzo anello inattivo e oggetti senza slot sempre attivi quando indossati.

## 4. Motore

- [x] 4.1 Aggiungere in `collectModifiers` i modificatori degli oggetti attivi e quelli delle capacità di armature e scudi. Far usare `effectiveArmor` ad armatura e scudo, per bonus, Des massima, penalità, fallimento arcano e categoria per la velocità. Verificare con test sugli scenari di `magic-item-effects` (mantello e Resistenza, cintura e Forza del toro, bracciali e giaco, oggetto trasportato) e di `armor-and-shields` (scudo +2).
- [x] 4.2 Estendere `weaponAttack`:
  - potenziamento e perfetta sul tiro per colpire, come `enhancement`;
  - potenziamento sui danni;
  - argento alchemico −1;
  - `extraDice`, `notes` e affilata.

  Verificare con test sugli scenari di `attack-rolls` (spada lunga +1: 1d8+4 con For +3, spada lunga perfetta, spada lunga +2 solo su quell'attacco, infuocata, ferro freddo nella nota).

## 5. Interfaccia

- [x] 5.1 Estrarre `ModifierRows` da `EffectEditor` in un componente condiviso, senza cambiare il comportamento degli effetti. Verificare con lo smoke test di `StatusPanel` e con l'editor degli effetti provato a mano.
- [x] 5.2 Aggiungere a `ItemEditor` le sezioni richiudibili «Magia» (perfetta, potenziamento, materiale, capacità con i vincoli, anteprima del prezzo) ed «Effetti quando indossato» (modificatori). Verificare a mano: una spada lunga +1 infuocata aggiorna prezzo e attacchi; su mobile non compare lo scroll orizzontale.
- [x] 5.3 Aggiungere a `ItemPicker` il filtro «Comuni / Magici» e la visualizzazione di slot e grado per gli oggetti magici. Verificare a mano la ricerca di «Anello di Protezione».
- [x] 5.4 Aggiornare `EquipmentSlots`, che usa `activeItems` e mostra «non attivo», e le righe dell'inventario, con il riepilogo dei modificatori e il nome che include le proprietà magiche. Verificare con lo smoke test (anello inattivo, «Spada Lunga +1»).
- [x] 5.5 Aggiornare `AttacksPanel` con i badge dei dadi extra (tirabili a parte) e le note delle capacità e dei materiali. Verificare con lo smoke test (badge «+1d6 fuoco») e a mano il tiro del badge.

## 6. Verifica d'insieme

- [x] 6.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.
- [x] 6.2 Provare sul dev server un guerriero con spada lunga +1 infuocata, giaco di maglia in mithral, Mantello della Resistenza +1 e due anelli di protezione più un terzo. Controllare attacchi, danni, CA, TS, velocità e stato «non attivo», e che home e lobby mostrino gli stessi valori.

## Workflow follow-up

- Archiviare la change con `/openspec-archive-change` dopo la verifica dell'utente.
- Change successiva: consumabili da incantesimo (3).
