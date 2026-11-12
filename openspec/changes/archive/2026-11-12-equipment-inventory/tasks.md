# Tasks

## 1. Tipi e modello dati

- [x] 1.1 Aggiungere in `src/types/index.ts` `ItemKind`, `BodySlot`, `WeaponStats`, `ArmorStats`, `ItemDefinition`, `ArmorProficiency`, `WeaponProficiencies`. Estendere `EquipmentItem` (campi opzionali, legacy mantenuti), `WeaponAttack` (`itemId?`, `critRange?`, `critMult?`, `twoHanded?`), `Character` (`featChoices?`, `extraProficiencies?`, `deityWeaponId?`) e `RaceDefinition` (`weaponFamiliarity?`, `armorSpeedUnaffected?`). Verificare con `npx tsc -b` senza nuovi errori.
- [x] 1.2 Implementare `normalizeItem()` per gli oggetti legacy (`type`/`weight`/`value` → nuovo formato) e verificarla con un test in `src/__tests__/inventory.test.ts`.

## 2. Catalogo (script di import)

- [x] 2.1 Creare `scripts/import-items.ts`: client dell'API MediaWiki con rate limit di 1 s e cache in `node_modules/.cache/item-import/`, più un parser delle tabelle wikitext. Verificare che `node scripts/import-items.ts` scarichi le pagine e stampi un riepilogo per categoria.
- [x] 2.2 Implementare la mappatura delle armi (gruppo, impugnatura, danni P/M, critico, gittata in m, tipi di danno, speciale) e di armature e scudi (categoria, bonus, Des max, penalità, fallimento arcano). Implementare anche attrezzi, munizioni e vestiario (prezzo e peso). Verificare che lo script segnali le righe scartate.
- [x] 2.3 Creare `scripts/item-overrides.json` (`metal`, correzioni, alias) e generare id slug univoci, con un errore in caso di collisione. Scrivere `public/data/items.json` e verificare che la seconda esecuzione produca gli stessi id.
- [x] 2.4 Aggiungere `src/__tests__/itemsCatalog.test.ts`, che legge `public/data/items.json` e controlla le voci campione: spada lunga, spadone, arco lungo, armatura completa, giaco di maglia, scudo torre, corda di canapa. Verificare con `npm test`.
- [x] 2.5 Caricare il catalogo in `useDataStore.loadBuiltinData()` (`builtinItems`, con un selettore per id) e verificare con un test dello store che, dopo il caricamento, gli oggetti siano disponibili.

## 3. Inventario (logica pura e store)

- [x] 3.1 Implementare in `src/utils/inventory.ts` le funzioni `addItem`, `purchaseItem` (prezzo pagato distinto da quello di listino, calcolo in rame, resto senza tagli negativi, errore se il prezzo è negativo o supera le monete), `updateItem`, `removeItem`, `setQuantity`, `toggleEquipped` (scambio esclusivo per armatura e scudo) e `totalWeight` (con le monete). Verificare con test sugli scenari dello spec `character-inventory`.
- [x] 3.2 Aggiungere le azioni dello store in `characterStore.ts` tramite `patchChar`. Verificare che la sincronizzazione Firestore non salvi campi `undefined`, con un test sulla patch prodotta.

## 4. Competenze

- [x] 4.1 Popolare le competenze strutturate delle 11 classi base in `src/data/classes/*.ts`, aggiungendo `deityWeapon` per il chierico, e la familiarità con le armi nelle razze di `src/data/races.ts`, con `armorSpeedUnaffected` per il nano. Gli id delle armi devono esistere nel catalogo: verificarlo con un test che controlla ogni id.
- [x] 4.2 Implementare in `src/utils/proficiencies.ts` le funzioni `computeProficiencies` (classi, razza, talenti con `featChoices`, divinità, manuali, ciascuna con le proprie fonti), `isProficientWeapon` e `isProficientArmor`. Verificare con test su multiclasse, familiarità elfica, armi esotiche con scelta, talento senza scelta e scudo torre.
- [x] 4.3 Implementare `normalizeClassProficiencies` per le classi custom (euristica e testo originale in `note`). Verificare con test su testi reali ('Semplici e Marziali', 'Leggera, Scudi (non a torre)', un elenco di armi).

## 5. Motore di calcolo

- [x] 5.1 Applicare in `deriveStats` armatura e scudo indossati: modificatori `armor`/`shield` sulla CA, limite di Des su CA e CMD con la voce nel breakdown, penalità di armatura sulle abilità con il flag. Verificare con test sugli scenari di `armor-and-shields` e `character-modifiers`, compresi i casi di cumulo con Armatura magica e Riflessi invariati.
- [x] 5.2 Aggiungere le penalità per l'armatura non competente (attacchi e abilità For/Des) e gli avvisi per il fallimento arcano, il druido con armatura di metallo e lo scudo torre. Verificare con test su mago in cotta di maglia e druido.
- [x] 5.3 Aggiungere `DerivedStats.speed` (metri, riduzione per armatura media o pesante, eccezione del nano) e verificarla con test su umano e nano.
- [x] 5.4 Implementare `resolveAttack` e `weaponAttack(attack)`, che restituiscono toHit, damageMod e crit, con il −4 per la mancata competenza e For ×1,5 a due mani solo sui bonus. Verificare con test sugli scenari di `attack-rolls` (spadone 2d6+4 con For +3, mago con spada lunga, attacco collegato aggiornato e arma rimossa).

## 6. Interfaccia

- [x] 6.1 Creare la tab «Equipaggiamento» («Equip» su mobile) in `CharacterSheet.tsx` con `EquipmentPanel`: indossati per slot, trasportati, monete e peso totale; la velocità va nella tab Combattimento. Verificare con lo smoke test SSR che la tab si renda con un personaggio senza inventario e con uno legacy.
- [x] 6.2 Creare `ItemPicker` in `SheetModal` (ricerca, filtro per categoria, quantità, «Aggiungi»; «Acquista» con prezzo proposto e modificabile, monete disponibili, importo mancante e conferma disabilitata se il prezzo non è valido) e l'editor dell'oggetto, che crea quelli personalizzati e modifica tutti gli altri. Verificare a mano sul dev server su desktop e su mobile (≤680px, nessuno scroll orizzontale).
- [x] 6.3 Aggiungere la sezione Competenze nella tab: elenco con fonti, scelta dell'arma per i talenti di competenza, arma della divinità, aggiunta e rimozione manuale. Verificare a mano che una scelta aggiorni subito i tiri per colpire.
- [x] 6.4 Aggiornare `AttacksPanel`: «+ Arma» dall'inventario o manuale, icona di collegamento, critico visibile, uso di `weaponAttack()` per tiri e danni, breakdown «±» per singolo attacco. Estendere lo smoke test per un attacco collegato.
- [x] 6.5 Mostrare l'avviso di fallimento arcano anche in `SpellsPanel`, e le competenze strutturate in `Step2_Class`. Verificarlo a mano su un mago con armatura.
- [x] 6.6 Mostrare l'equipaggiamento in sola lettura nel pannello del personaggio della lobby (`readOnly`). Verificare a mano che un non proprietario non veda controlli di modifica.
- [x] 6.7 Aggiungere la panoramica fissa degli slot (`EquipmentSlots`, stile scheda cartacea): tutti gli slot sempre visibili (anelli ×2), liberi o occupati, oggetti in eccesso segnalati, scelta di un oggetto trasportato toccando uno slot libero, sezione «Impugnati e senza slot». Verificare con lo smoke test (slot liberi, «Anello 2», oggetto in eccesso).

## 7. Classi custom

- [x] 7.1 Aggiornare `CustomClassEditor`: checkbox per armature e gruppi di armi, selettore di armi dal catalogo, nota precompilata dalla migrazione. Verificare a mano che una classe custom esistente mostri il vecchio testo nella nota e salvi nel nuovo formato.

## 8. Verifica d'insieme

- [x] 8.1 Eseguire `npm test`, `npx tsc -b` e `npm run lint`: nessun nuovo errore rispetto a quelli preesistenti.
- [x] 8.2 Provare sul dev server il percorso completo: guerriero che acquista una cotta di maglia e uno spadone, crea l'attacco collegato e controlla CA, penalità alle abilità, velocità e danni. Verificare che home e lobby mostrino la stessa CA.

## Workflow follow-up

- Archiviare la change con `/openspec-archive-change` dopo la verifica dell'utente.
- Change successive: oggetti magici (2), consumabili da incantesimo (3).
