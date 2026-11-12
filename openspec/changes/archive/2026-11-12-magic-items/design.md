# Design

## Context

- **Motore.** `deriveStats` raccoglie i `SourcedModifier` da condizioni, effetti, livelli negativi e armatura e scudo indossati (`wornArmor` + `armorModifiers`).
  - Applica il limite di Des e le penalità.
  - Risolve ogni attacco con `weaponAttack()`, che legge l'oggetto collegato tramite `attackFieldsFromItem`.
- **Inventario.** `EquipmentItem` è un'istantanea modificabile della voce di catalogo. `inventoryOf()` normalizza i dati legacy.
- **Slot.** `EquipmentSlots` segnala già gli oggetti in eccesso. `SLOT_CAPACITY` vale `{ ring: 2 }`.
- **Catalogo.** `scripts/import-items.ts` legge le tabelle via API MediaWiki con una cache in `node_modules/.cache/item-import`.
  - Nel wiki, il database degli oggetti magici è una pagina che include circa 90 tabelle tramite template (`{{:Tabella …}}`). Le righe hanno 7 colonne: d%, Nome (link), Tipo, Slot, Prezzo, Peso, Fonte.
- **Editor degli effetti.** `EffectEditor` gestisce già righe di modificatori (valore, tipo, bersaglio).

## Goals / Non-Goals

**Goals:**
- Un unico percorso nel motore per tutti gli oggetti che danno modificatori, che passa per `collectModifiers`. Così cumulo, «±», home e lobby restano coerenti senza codice dedicato.
- Le proprietà magiche di armi e armature restano campi dell'istanza, e le statistiche effettive si ricavano al volo da quei campi più le statistiche base.

**Non-Goals:**
- Consumabili (pozioni, pergamene, bacchette): sono la change 3.
- Bastoni e verghe con cariche: compaiono nel catalogo solo come metadati.
- Effetti situazionali in automatico: Anatema contro un tipo di creatura, Sacra contro i malvagi e simili restano note, così come la RD e la durezza.
- Oggetti intelligenti, maledetti e artefatti.
- Il tempo di 24 ore perché le cinture e le fasce di caratteristica abbiano effetto su PF e gradi di abilità.
- Ricostruire le statistiche delle armature e armi magiche specifiche del catalogo. Ad esempio «Giaco di Maglia in Mithral» viene importato come oggetto magico con prezzo e slot; il giocatore ottiene lo stesso oggetto partendo dal giaco comune e impostando il mithral.

## Decisions

### D1. Import: un'unica espansione dei template
- Lo script legge il wikitext del database e lo passa a `action=expandtemplates`, una sola richiesta con risposta di circa 300 kB.
- Il parser di tabelle esistente lo analizza: righe da 7 celle, nome preso dal testo del link, pagina presa dal target del link.
- Mappature:
  - lo slot italiano diventa `BodySlot` (Armatura → armor, Anello → ring, Nessuno → none…);
  - il «Tipo» diventa `tier`, ad esempio «Anello minore inferiore».
- Ogni voce ha `kind: 'magic'` e `category` derivata dal tipo, ad esempio «Anelli» o «Oggetti meravigliosi (collo)».
- **Id**: lo slug del nome, con prefisso `m-` solo in caso di collisione con un oggetto comune (succede ad esempio con gli scudi magici specifici).
- La cache resta in `node_modules/.cache/item-import`.
- *Alternativa scartata*: leggere le ~90 pagine-tabella una per una. Sarebbero 90 richieste per lo stesso risultato.

### D2. Modello delle proprietà magiche
```ts
interface EquipmentItem {           // nuovi campi, tutti opzionali
  masterwork?: boolean;
  enhancement?: number;             // 0..5
  material?: MaterialId;            // 'mithral' | 'adamantine' | 'cold-iron' | 'alchemical-silver' | 'darkwood'
  abilities?: string[];             // id da ITEM_ABILITIES
  modifiers?: Modifier[];           // effetti dell'oggetto quando indossato e attivo
}
type ItemKind = … | 'magic';
interface ItemDefinition { …; slot?: BodySlot; tier?: string; source?: string }
```
- **`effectiveArmor(item)`**: armatura e scudo effettivi, calcolati da una funzione pura e mai salvati.
  - Bonus: base + potenziamento.
  - Penalità: −1 se perfetta. Mithral e legnoscuro riducono rispettivamente di 3 e di 2, e la riduzione della perfetta è già compresa.
  - Des massima: +2 con il mithral.
  - Fallimento arcano: −10% con il mithral.
  - Categoria per la velocità: una in meno con il mithral.
- **`effectiveWeapon(item)`**: intervallo di minaccia ricalcolato da Affilata (`21 − (21 − range) × 2`) e dadi extra.
- Il peso dimezzato da mithral e legnoscuro viene scritto nel `weightKg` dell'istanza quando il materiale viene scelto.
- *Alternativa scartata*: scrivere le statistiche già modificate nell'istanza. Togliere o cambiare il materiale richiederebbe di ricordare i valori originali.

### D3. Dati curati
- **`src/data/materials.ts`**: per ogni materiale nome, tipi di oggetto ammessi, se rende l'oggetto perfetto, effetti meccanici, nota e costo (verificati sulla pagina «Materiali Speciali» del wiki). Costi:
  - mithral (perfetto): armature leggere 1.000, medie 4.000, pesanti 9.000, scudi 1.000 mo, armi 500 mo ogni 0,5 kg del peso originale;
  - adamantio (perfetto): armi 3.000, armature 5.000/10.000/15.000 mo;
  - ferro freddo (non perfetto): prezzo base ×2 e +2.000 mo al primo potenziamento;
  - argento alchemico (non perfetto): armi leggere +20, a una mano +90, a due mani +180 mo;
  - legnoscuro (perfetto): +10 mo ogni 0,5 kg del peso originale, solo armi e scudi;
  - la riduzione della penalità di armatura del materiale (mithral 3, legnoscuro 2 sugli scudi) sostituisce quella della perfetta, non si somma.
- **`src/data/itemAbilities.ts`**: per ogni capacità id, nome italiano, a cosa si applica (arma da mischia, arma a distanza, armatura, scudo), bonus equivalente oppure costo fisso, ed effetti. Gli effetti possono essere:
  - `extraDice` (es. 1d6 fuoco);
  - `keen`;
  - `modifiers` (es. Ombra: +5 competenza a Furtività);
  - `note`.

  Prima lista:
  - armi: Infuocata, Gelida, Folgorante, Corrosiva, Tonante, Affilata, Misericordiosa, Tocco Fantasma, Difensiva, Distanza, Ritornante, Sacra, Sacrilega, Assiomatica, Anarchica, Anatema, Ferimento, Velocità;
  - armature: Fortificazione leggera/moderata/pesante, Ombra (normale, migliorata, superiore), Scivolosa (normale, migliorata, superiore), Resistenza all'energia, Tocco Fantasma, Resistenza agli incantesimi.

  I nomi esatti vanno verificati sulle tabelle del wiki in fase di implementazione.
- **`src/data/magicItemEffects.ts`**: preset per gli oggetti del catalogo, come lista di `{ match: RegExp sull'id, modifiers(n) }`. `n` è il numero letto dal nome dell'oggetto (`+2`, `+4`…). Copertura:
  - Mantello della Resistenza +N;
  - Anello di Protezione +N;
  - Amuleto dell'Armatura Naturale +N;
  - Bracciali dell'Armatura +N;
  - le Cinture (Forza del Gigante, Destrezza Incredibile, Costituzione Possente, Perfezione Fisica e quelle doppie);
  - le Fasce (Intelletto Vasto, Saggezza Ispirata, Fascino Alieno, Superiorità Mentale e quelle doppie);
  - pochi oggetti con bonus fisso alle abilità (es. Mantello e Stivali elfici).

  I preset vengono copiati nell'istanza quando l'oggetto viene aggiunto, in `itemFromCatalog`.

### D4. Oggetti nel motore
- **Oggetti attivi**: si scorrono gli oggetti indossati in ordine di inventario e si conta l'occupazione di ogni slot; oltre la capienza, l'oggetto è inattivo. La funzione `activeItems(char)` è condivisa con la panoramica degli slot, così l'interfaccia e i numeri non possono divergere.
- **Modificatori in `collectModifiers`**, con `source` = nome dell'oggetto:
  - i `modifiers` degli oggetti attivi;
  - quelli delle capacità di armature e scudi indossati (es. Ombra).
- **L'Amuleto dell'armatura naturale** usa il tipo `natural`: è un potenziamento all'armatura naturale e non si cumula con Pelle coriacea, che usa lo stesso tipo. È una semplificazione, documentata.
- **Armatura e scudo**:
  - `armorModifiers` usa `effectiveArmor`;
  - l'armatura con il potenziamento resta un'unica voce `armor` con valore base + potenziamento, così Armatura magica e Bracciali si confrontano con il totale.
- **Velocità**: usa la categoria «per la velocità».
- **Competenza**: usa ancora la categoria originale.

### D5. Attacchi
`weaponAttack()` aggiunge, per l'arma collegata:
- sul tiro per colpire, una voce `enhancement` pari a `max(potenziamento, perfetta ? 1 : 0)`. Passa da `makeStat`, che applica già il «vale il più alto»;
- sui danni, il potenziamento come `enhancement` e −1 con l'argento alchemico;
- nel `ResolvedAttack`:
  - `extraDice[]` (es. `{ count: 1, die: 6, label: 'fuoco' }`);
  - `notes[]` (capacità senza automatismi, effetti del materiale);
  - l'intervallo di minaccia aggiornato da Affilata.

In `AttacksPanel` ogni dado extra diventa un badge che si tira a parte: `RollRequest` supporta un solo tipo di dado. Le note compaiono sotto l'arma.

### D6. Prezzo di listino
`computedPrice(item, catalog?)` somma:
- il prezzo base, preso dalla voce di catalogo se `catalogId` esiste, altrimenti da quello dell'istanza «senza magia», salvato in `basePriceGp` la prima volta che si aggiungono proprietà magiche;
- la perfetta, se il materiale non la include già;
- il materiale;
- il potenziamento più le capacità: (somma dei bonus equivalenti)² × 2.000 o × 1.000;
- le capacità a costo fisso.

L'editor aggiorna `priceGp` a ogni modifica. Il giocatore può comunque correggerlo a mano, perché il prezzo resta modificabile.

### D7. Interfaccia
- **`ItemEditor`**: per armi, armature e scudi c'è una sezione «Magia»:
  - interruttore «perfetta»;
  - potenziamento (0–5);
  - materiale, filtrato per tipo di oggetto;
  - capacità, filtrate per tipo; quelle oltre il tetto di +10 sono disabilitate e nessuna è disponibile senza potenziamento;
  - anteprima del prezzo calcolato.
- **Modificatori per tutti gli oggetti**: la sezione «Effetti quando indossato» riusa le righe dell'`EffectEditor`. Per farlo, `ModifierRows` viene estratto in un componente condiviso.
- **`ItemPicker`**: filtro rapido «Comuni / Magici», più il filtro per categoria che già esiste. Il nome mostrato include le proprietà, ad esempio «Spada Lunga +1 infuocata».
- **`EquipmentSlots`**: lo stato «⚠ in eccesso per lo slot» diventa «non attivo».
- **Righe dell'inventario**: mostrano un riepilogo dei modificatori con `modifierLabel`.

## Risks / Trade-offs

- **Nomi del database del wiki con varianti** («Anello di Protezione +1» … «+5» sono voci separate) → i preset usano una regex con il numero catturato. Un test verifica che ogni preset trovi almeno una voce del catalogo.
- **Collisioni di id tra oggetti comuni e magici** → prefisso `m-` per i magici. Lo script fallisce se resta qualche collisione.
- **Regole dei materiali semplificate** (es. legnoscuro solo per gli scudi, adamantio sulle armature solo come nota RD) → le note compaiono sull'oggetto, e il giocatore può aggiungere modificatori manuali.
- **Personaggi esistenti con armi già «magiche» simulate da effetti** → nessuna migrazione: il giocatore rimuove l'effetto quando imposta il potenziamento sull'arma.
- **L'editor degli oggetti diventa lungo** → le sezioni «Magia» ed «Effetti» sono richiudibili (`<details>`), chiuse di default per gli oggetti comuni.

## Migration Plan

Solo campi opzionali nuovi: i personaggi esistenti si caricano senza modifiche, e gli oggetti senza proprietà magiche si comportano come prima. Il catalogo viene rigenerato senza cambiare gli id degli oggetti comuni (verificato da un test). Per tornare indietro basta ripristinare il codice: la versione precedente ignora i campi in più.
