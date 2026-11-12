# Design

## Context

- **Motore di calcolo.** `deriveStats(char)` in `src/utils/derivedStats.ts` è il calcolo unico. Raccoglie `SourcedModifier` da condizioni, effetti e livelli negativi con `collectModifiers()`, li cumula con `stack()` e produce `Stat { base, total, applied, suppressed }` per ogni valore, più `attackNotes` e `warnings`.
  - CA: oggi è `10 + Des + modificatori ac`.
  - Penalità di armatura e limite di Des: non esistono.
- **Dati built-in.** `spells.json` e `feats.json` stanno in `public/data`, caricati via `fetch` in `useDataStore.loadBuiltinData()`.
- **Inventario e attacchi.**
  - `Character.equipment: EquipmentItem[]`: esiste ma non ha interfaccia.
  - `Character.weaponAttacks: WeaponAttack[]`: definiti a mano, senza critico né impugnatura.
- **Classi.**
  - `ClassDefinition.armorProficiencies: string[]` ('Leggera', 'Scudi (non a torre)'…).
  - `weaponProficiencies: string`, testo libero, sia nelle 11 classi built-in sia nelle classi custom su Firestore.
- **Talenti.** `Character.feats: string[]` contiene solo id e non può memorizzare scelte. Nel dataset le competenze sono `competenza_nelle_armi_da_guerra`, `..._esotiche` e simili.
- **Unità.** Le razze hanno `speed` in piedi (30/20). Il wiki usa metri e kg.

## Goals / Non-Goals

**Goals:**
- Armatura, scudo e competenze entrano nel motore come fonti di `StatEntry` e `SourcedModifier`, così breakdown «±», toni buff/debuff, home e lobby si aggiornano senza codice dedicato.
- Un modello di oggetto in inventario abbastanza generale da ospitare, nella change 2, i bonus di potenziamento, la qualità perfetta, i materiali e i modificatori magici senza rompere i dati.

**Non-Goals:**
- Oggetti magici, +N, perfetta, materiali speciali e conflitti degli slot meravigliosi: change 2.
- Consumabili da incantesimo: change 3.
- Ingombro per peso, gestione del loot da parte del GM, contenitori annidati (zaino dentro zaino).
- Taglia dell'arma diversa da quella del personaggio. Si usano i danni P o M in base alla taglia della razza.
- Talenti meccanici diversi dalla competenza (Arma Focalizzata ecc.), anche se `featChoices` li renderà possibili in futuro.

## Decisions

### D1. Catalogo: JSON statico generato da script Node, senza dipendenze
- `scripts/import-items.ts`, eseguito con `node` 24 e type stripping nativo.
- Legge le pagine del wiki tramite l'API MediaWiki (`api.php?action=parse&prop=wikitext&page=…`), analizza le tabelle wikitext e scrive `public/data/items.json` (`{ version, generatedAt, items: ItemDefinition[] }`).
- Ha un ritardo di circa 1 s tra le richieste e una cache su disco in `node_modules/.cache/item-import/` (fuori dal sorgente, che i plugin di Vite scansionano).
- Pagine lette: `Armi`, `Armature`, `Oggetti_d'Avventura`, `Attrezzi_di_Classe_e_Abilità`, `Vestiario`.
- **Id stabile**: lo slug del nome italiano (`spada-lunga`).
- **Campi curati a mano**: un file di override, `scripts/item-overrides.json`, contiene `metal`, l'impugnatura dove la tabella è ambigua, le correzioni e gli alias degli id. Viene applicato dopo il parsing, così le correzioni sopravvivono a una rigenerazione.
- *Alternative scartate*:
  - scraping HTML con una libreria: aggiunge una dipendenza, e l'HTML cambia più del wikitext;
  - catalogo su Firestore: non serve, il dataset è statico e uguale per tutti;
  - dati scritti a mano in TS: sono centinaia di righe soggette a errori.

### D2. Modello `ItemDefinition` (catalogo) e `EquipmentItem` (istanza)
```ts
type ItemKind = 'weapon' | 'armor' | 'shield' | 'ammo' | 'gear';
interface WeaponStats { group: 'simple'|'martial'|'exotic'; handedness: 'light'|'one-handed'|'two-handed'|'ranged';
  damage: { small: Dice; medium: Dice }; critRange: number /*19 = 19–20*/; critMult: number;
  rangeM?: number; damageTypes: ('C'|'P'|'T')[]; special: string[] }
interface ArmorStats { category: 'light'|'medium'|'heavy'|'shield'|'tower'; bonus: number;
  maxDex: number | null; checkPenalty: number /*≤0*/; arcaneFailure: number /*%*/; metal: boolean }
interface ItemDefinition { id; name; kind; category: string; priceGp: number; weightKg: number;
  url: string; weapon?: WeaponStats; armor?: ArmorStats }

interface EquipmentItem {           // esteso, retrocompatibile
  id; name; quantity; notes; equipped;
  catalogId?: string; kind?: ItemKind; slot?: BodySlot;
  priceGp?: number; weightKg?: number; weapon?: WeaponStats; armor?: ArmorStats;
  // legacy: type, weight, value — letti come fallback
}
```
- **Copia all'aggiunta**: l'istanza contiene un'istantanea delle statistiche, con `catalogId` solo come riferimento. È coerente con i preset degli effetti, e la scheda non cambia se il catalogo viene rigenerato.
- I campi legacy `type`/`weight`/`value` sono normalizzati in lettura da `normalizeItem()`, senza riscrivere Firestore.
- *Alternativa scartata*: riferimento più override, che avrebbe costretto a risolvere il catalogo prima di poter calcolare la scheda.

### D3. Funzioni pure in `src/utils/inventory.ts`
Lo stesso schema di `characterStatus.ts`:
- `addItem`, `purchaseItem(char, item, paidCp)`, `updateItem`, `removeItem`, `setQuantity`, `toggleEquipped` (scambio esclusivo per armatura e scudo);
- ciascuna restituisce una patch parziale del `Character`.

Lo store aggiunge sottili azioni wrapper tramite `patchChar`.

**Acquisto.**
- **Prezzo**:
  - il prezzo pagato è un parametro distinto da `priceGp` dell'oggetto;
  - l'interfaccia lo propone pari a prezzo × quantità, ed è modificabile;
  - `priceGp` resta quello di listino.
- **Calcolo del pagamento**:
  - tutto è convertito in monete di rame, con interi e senza virgola mobile;
  - si verifica che il totale delle monete sia ≥ prezzo pagato ≥ 0;
  - si sottrae dal totale.
- **Resto**:
  - si redistribuisce partendo dalle monete esistenti;
  - si scala prima dai tagli minori;
  - si «rompe» un taglio maggiore solo quando serve, e il resto torna in mr, ma e mo.
- **Garanzie**: nessun taglio può diventare negativo, e la funzione pura lancia un errore se viene chiamata con un prezzo non valido. È un controllo di difesa oltre a quello dell'interfaccia.

### D4. Armatura nel motore
In `deriveStats`, `equippedArmor(char)` restituisce l'armatura e lo scudo indossati, già normalizzati. Poi:
- **Bonus**: armatura e scudo diventano `SourcedModifier` di tipo `armor`/`shield` sul target `ac`, con `source` = nome dell'oggetto. Entrano in `collectModifiers` insieme agli effetti, quindi il cumulo con Armatura magica e Scudo arriva gratis, e la CA di contatto li esclude già perché filtra i tipi armor/shield/natural.
- **Limite di Des**: `dexCap = min(maxDex)`. Nella CA e nella CMD la voce Des diventa `min(mod Des, dexCap)` quando il modificatore è positivo. La parte tagliata compare come `StatEntry` «Limite Des (Cotta di maglia)», così il breakdown la mostra. I TS sui Riflessi, l'iniziativa e gli attacchi non cambiano.
- **Penalità di armatura**: `acp = somma(checkPenalty)` di armatura e scudo. Si applica come `StatEntry` per oggetto alle abilità con `armorCheckPenalty: true`. È un'entrata separata e non un modificatore tipizzato, perché nel motore le penalità si cumulano comunque, ma qui serve il nome dell'oggetto e non va soppressa.
- **Fallimento arcano**: somma delle percentuali. Se il PG ha `spellcasting.school === 'arcane'`, genera una voce in `warnings`.
- **Velocità**:
  - `DerivedStats.speed: Stat` in metri, con la conversione `piedi × 0,3` arrotondata a 0,5. Così una velocità di 30 piedi vale 9 m.
  - Con un'armatura media o pesante il valore diventa 9 → 6 e 6 → 4,5.
  - Il nano fa eccezione tramite il flag `RaceDefinition.armorSpeedUnaffected`.

### D5. Competenze: `src/utils/proficiencies.ts`
```ts
type ArmorProf = 'light'|'medium'|'heavy'|'shield'|'tower';
interface WeaponProficiencies { groups: ('simple'|'martial')[]; weapons: string[]; note?: string; deityWeapon?: boolean }
interface ProficiencySet { armor: Map<ArmorProf, string[]>; groups: Map<'simple'|'martial', string[]>; weapons: Map<string, string[]> } // valore = fonti
```
- `computeProficiencies(char, classes, feats)` unisce cinque fonti:
  - classi;
  - razza (`RaceDefinition.weaponFamiliarity?: string[]`);
  - talenti: mappa statica id talento → effetto, più `char.featChoices` per armi da guerra ed esotiche;
  - divinità: `char.deityWeaponId` quando una classe ha `deityWeapon`;
  - manuali: `char.extraProficiencies`.
- `isProficientWeapon(set, weapon)`: è competente se c'è il gruppo (simple o martial) oppure l'id specifico.
- `isProficientArmor(set, armor)`: categoria `tower` → serve `tower`; categoria `shield` → serve `shield`; armature → la categoria corrispondente.
- **Armi senza `catalogId`** (personalizzate o manuali): sono considerate competenti, salvo un flag `nonProficient` impostabile a mano. Si evitano falsi −4 su colpi senz'armi e armi naturali.
- **Penalità**:
  - arma non competente → `StatEntry` «Non competente» −4 sull'attacco specifico (quindi calcolata per singolo attacco, vedi D6);
  - armatura o scudo non competenti → la loro penalità entra in `attackMods` (tutti gli attacchi) e in tutte le abilità di For/Des, non solo in quelle col flag.
- **Avvisi**: druido con un oggetto `metal`; scudo torre indossato senza `tower`.
- **Prerequisiti dei talenti**: `featChoices: { featId: string; index: number; choice: string }[]`. `index` distingue più istanze dello stesso talento, che è ripetibile. Il valore resta su `Character`: `feats` non cambia, per non rompere wizard, livellamento e Firestore.

### D6. Attacchi collegati alle armi
- `WeaponAttack` riceve i nuovi campi `itemId?`, `critRange?` (default 20), `critMult?` (default 2), `twoHanded?`.
- `resolveAttack(attack, char)`:
  - se `itemId` punta a un oggetto esistente, prende dall'oggetto dadi (`medium` o `small` in base a `race.size`), critico, tipo e impugnatura;
  - altrimenti usa i campi salvati nell'attacco, che vengono aggiornati a ogni modifica dell'arma. In questo modo l'attacco sopravvive alla rimozione dell'oggetto.
- `DerivedStats` espone `weaponAttack(attack)` → `{ toHit: Stat, damageMod: Stat, crit }`, invece dei soli `attack.melee`/`ranged`. Il −4 di competenza e la For ×1,5 sono specifici del singolo attacco.
- **Pannello attacchi**: «+ Arma» offre «dall'inventario» (le armi possedute) oppure «manuale».

### D7. Interfaccia
- **Nuova tab «Equipaggiamento»**: per ora `id: 'equipment'`, tra Combattimento e Abilità. Su mobile l'etichetta è «Equip».
- **Sezioni**:
  - Indossati, raggruppati per slot;
  - Trasportati;
  - Monete (le spostiamo qui da dove sono oggi, se mostrate);
  - Peso totale (la velocità sta nella tab Combattimento, accanto a BAB e Iniziativa);
  - Competenze (con fonti e scelte da completare).
- **Catalogo**: `ItemPicker` in `SheetModal`, con ricerca, filtro per categoria e quantità. Il pulsante «Aggiungi» aggiunge gratis. Il pulsante «Acquista» apre un campo prezzo precompilato e modificabile, che mostra le monete disponibili e quanto manca; la conferma resta disabilitata finché il prezzo non è valido.
- **Lobby**: il pannello del personaggio nella lobby mostra l'equipaggiamento in sola lettura, riusando lo stesso componente con la prop `readOnly`.

### D8. Classi custom
- `CustomClassEditor` sostituisce i due campi di testo con checkbox per le categorie di armature e i gruppi di armi, un selettore di armi dal catalogo e una nota.
- **Migrazione in lettura** (`normalizeClassProficiencies`): `armorProficiencies: string[]` (testo) e `weaponProficiencies: string` vengono convertiti con un riconoscimento euristico delle parole chiave (Leggera/Media/Pesante/Scudi/torre, Semplici/Marziali). Il testo originale finisce in `note`.
- Il documento Firestore viene riscritto nel nuovo formato solo al successivo salvataggio dell'admin.

## Risks / Trade-offs

- **Formato del wiki irregolare** (celle unite, note a piè di pagina, valori «—», «x2/x3» per le armi doppie) → parser tollerante, voci scartate segnalate nel log dello script, file di override per le correzioni e un test che verifica un campione di voci note (spada lunga, armatura completa, scudo torre).
- **Nomi non univoci** (ad esempio «Martello» in più tabelle) → lo slug include un suffisso della categoria in caso di collisione. Lo script fallisce se due voci restano con lo stesso id.
- **Euristica sulle classi custom imprecisa** → il testo originale resta visibile nella nota e l'admin può correggere. Non si perde nulla.
- **Contenuto del wiki senza una licenza dichiarata** → salviamo solo dati di gioco (numeri e nomi, meccaniche OGL) e un link, senza le descrizioni tradotte.
- **Due modi di definire un attacco** (collegato e manuale) → confusione possibile. L'interfaccia mostra un'icona di collegamento e mantiene un solo form.
- **`DerivedStats` cresce** → le competenze sono in un modulo a parte. `deriveStats` riceve le definizioni di talenti e classi già risolte, come fa oggi per le classi.

## Migration Plan

1. Tutti i nuovi campi sono opzionali e i dati legacy vengono normalizzati in lettura, quindi non serve uno script di migrazione Firestore.
2. Le classi built-in vengono aggiornate nel codice. Le classi custom sono convertite in lettura e salvate nel nuovo formato al primo salvataggio.
3. Rollback: ripristinare il codice precedente. I campi in più su Firestore vengono ignorati dalla versione precedente. Le classi custom già salvate nel nuovo formato perderebbero la visualizzazione testuale, per questo il nuovo formato conserva sempre `note` e `armorProficiencies` resta un array di stringhe leggibili.
