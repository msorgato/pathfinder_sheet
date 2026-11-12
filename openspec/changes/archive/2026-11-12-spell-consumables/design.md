# Design

## Context

- **Incantesimi**: `SpellDefinition.levels` è un `Record<classId, livello>` e copre anche classi che l'app non ha tra quelle base (arcanist, witch, oracle, magus…). Gli id sono slug con underscore (`cura_ferite_leggere`). Gli incantesimi sono disponibili tramite `useMergedSpells()`, che combina base, patch e incantesimi custom.
- **Inventario**: `EquipmentItem` è un'istantanea modificabile.
  - Esistono già `purchaseItem` (acquisto con prezzo proposto e modificabile), `setQuantity` e `removeItem`.
  - Gli oggetti senza slot (`slot: 'none'`) non occupano slot.
- **Effetti**:
  - `EFFECT_PRESETS` (in `effectPresets.ts`) ha modificatori fissi;
  - `addEffect`/`removeEffect` in `characterStatus.ts` sono transizioni pure;
  - gli effetti attivi passano già da `collectModifiers`.
- **Corrispondenza preset ↔ incantesimi**: non si può dedurre dall'id.
  - Alcuni preset non hanno un incantesimo con lo stesso id (Benedizione, Lentezza, Ingrandire persona, Scudo…).
  - «Ira» incantesimo (+2 morale) è diverso dall'Ira del barbaro modellata nel preset.

## Goals / Non-Goals

**Goals:**
- I consumabili sono oggetti dell'inventario come gli altri: acquisto, peso, monete e panoramica funzionano senza codice speciale.
- Tutti i valori derivati (livello, prezzo, CD, nome, usabilità) sono funzioni pure, testabili.

**Non-Goals:**
- Bastoni (più incantesimi, cariche condivise, ricarica).
- Pergamene con più incantesimi.
- Componenti materiali costose nel prezzo: il giocatore corregge il prezzo a mano.
- Tirare la prova di Utilizzare Congegni Magici o di livello dell'incantatore: viene solo mostrata la CD.
- Usare un consumabile su un altro personaggio: l'effetto si applica sempre a chi lo usa, e «Annulla» copre il caso dell'alleato.
- Durata degli effetti: come per gli altri effetti, resta attivo finché non viene rimosso.

## Decisions

### D1. Modello: `kind: 'consumable'` e `spellItem`
```ts
type ConsumableForm = 'potion' | 'scroll' | 'wand';
interface SpellItem {
  form: ConsumableForm;
  spellId: string;
  spellName: string;      // istantanea, per mostrarla anche se l'incantesimo viene rimosso o rinominato
  classId: string;        // lista scelta
  spellLevel: number;
  casterLevel: number;
  charges?: number;       // solo bacchette
  maxCharges?: number;    // 50
}
EquipmentItem.spellItem?: SpellItem;   ItemKind += 'consumable'
```
- Sono oggetti senza slot (`slot: 'none'`) e non devono essere «indossati» per funzionare.
- Le pozioni e le pergamene usano `quantity`; la bacchetta ha `quantity: 1` e usa le `charges`.
- *Alternativa scartata*: un elenco separato `Character.consumables`. Avrebbe duplicato acquisto, peso, rimozione e lettura legacy.

### D2. Valori derivati in `src/utils/spellConsumables.ts`
- `FORM_LIMITS = { potion: 3, wand: 4, scroll: 9 }` e `FORM_BASE_PRICE = { potion: 50, scroll: 25, wand: 750 }`.
- `minCasterLevel(level) = level <= 1 ? 1 : 2 * level - 1`. È la regola delle classi a progressione piena (mago, chierico); il giocatore può alzarlo.
- `spellItemPrice` e `spellItemDc(level) = 10 + level + floor(level / 2)`.
- `spellItemName`: «Pozione di X (LI n)», «Pergamena di X (LI n)», «Bacchetta di X (LI n)».
- `availableLists(spell, form)`: le liste della spell con livello ≤ al limite della forma, ordinate per livello crescente. La prima è proposta come default.
- `createSpellItem(spell, form, classId, casterLevel, amount)`: costruisce un `ItemInput` con prezzo, peso e nome. Pesi: pozione 0, pergamena 0, bacchetta 0,1 kg (valori trascurabili, informativi).

### D3. Usabilità
- **Liste del personaggio**: gli id delle sue classi (`char.classes[].classId`).
- **Classi custom**: la loro `spellcasting.sourceList`, se presente, vale come lista.
- **Livello dell'incantatore del personaggio**: livello della classe più alto fra quelle che hanno l'incantesimo in lista. È un'approssimazione: per le classi a progressione ridotta (paladino, ranger) il LI reale è inferiore. Ci si limita a mostrare l'avviso.
- **`usability(char, item)`** restituisce `{ ok: true } | { ok: false, check: 'umd', dc } | { ok: true, check: 'casterLevel', dc }`. Le pozioni sono sempre `ok`.

### D4. Collegamento incantesimo → preset
- **Tabella `SPELL_EFFECT_LINKS: Record<spellId, presetId>`** in `src/data/spellEffectLinks.ts`, curata a mano. Gli id degli incantesimi corrispondenti a Benedizione, Lentezza, Ingrandire/Ridurre persona e Scudo vanno cercati per nome nel database.
- **Esclusioni**: «Ira» (incantesimo) **non** è collegata al preset Ira del barbaro, che ha valori diversi. Lo stesso vale per i preset che non sono incantesimi (Ispirare coraggio).
- **Test**: ogni coppia della tabella deve puntare a un incantesimo e a un preset esistenti.

### D5. Preset al LI
- `EffectPreset` riceve `modifiersAt?: (casterLevel: number) => Modifier[]`.
- `presetModifiersAt(preset, cl)` usa `modifiersAt` se presente, altrimenti `modifiers`.
- Solo Scudo della fede e Pelle coriacea scalano. Per ora non si toccano gli altri riassunti né i dati: gli altri preset del libro hanno valori fissi o scalano con dati che l'app non usa (es. durata).

### D6. Uso e annullamento
`useConsumable(char, itemId)` in `spellConsumables.ts`:
1. Verifica che la quantità o le cariche siano maggiori di 0. Se non lo sono, non cambia nulla.
2. Scala una dose o una carica. Pozioni e pergamene arrivate a 0 vengono rimosse.
3. Se l'incantesimo ha un preset collegato, aggiunge un effetto con nome «X (LI n)», modificatori `presetModifiersAt` e `presetId`.
4. Restituisce la patch e un `undo` con l'item originale e l'id dell'effetto aggiunto.

Lo store espone `useConsumable(id, itemId)`, che restituisce l'`undo`, e `undoConsumable(id, undo)`.
- L'annullamento ripristina l'oggetto originale con lo stesso id e nella stessa posizione, se era stato rimosso, e toglie l'effetto.
- L'interfaccia mostra un piccolo avviso con «Annulla» per circa 6 secondi.
- *Alternativa scartata*: un dialogo di conferma prima dell'uso. Rallenta il combattimento, e l'utente ha scelto «consuma e applica».

### D7. Interfaccia
- **`SpellItemCreator`** (in `SheetModal`), aperto dal pulsante «+ Pozione / pergamena / bacchetta» della tab Equipaggiamento:
  1. ricerca dell'incantesimo con `useMergedSpells()`;
  2. scelta della forma;
  3. lista di classe, mostrando solo quelle ammesse;
  4. LI, con il minimo come default;
  5. quantità o cariche;
  6. anteprima di nome, prezzo e CD;
  7. «Aggiungi» oppure «Acquista». Per l'acquisto si riusa il pannello del prezzo esistente, estratto da `ItemPicker` in un componente condiviso `PurchaseBox`.
- **Righe dell'inventario e sezione «Consumabili»** della tab Combattimento: quantità («×3») o cariche («37/50»), etichetta dell'usabilità («Utilizzare Congegni Magici CD 20», «prova LI CD 6»), CD dell'oggetto e pulsante «Usa», disabilitato se l'oggetto è esaurito.
- **`ItemEditor`**: per i consumabili mostra solo nome, quantità o cariche, LI e note. I valori derivati si ricalcolano quando cambia il LI, e la lista di classe è modificabile.
- **Lobby** (`readOnly`): nessun «Usa».

## Risks / Trade-offs

- **Il LI del personaggio per le classi a progressione ridotta è sovrastimato** → l'avviso sulla prova di livello dell'incantatore può mancare per paladini e ranger. È documentato, e la prova resta del giocatore.
- **Liste di classi che l'app non ha** (es. arcanist) compaiono fra le scelte come id grezzi → si mostrano con un'etichetta leggibile tramite una piccola mappa id → nome italiano; quelle sconosciute restano con l'id.
- **L'incantesimo viene rimosso o rinominato nel database** → l'oggetto conserva `spellName` e funziona lo stesso; si perde solo il collegamento al preset se l'id cambia.
- **Più usi molto rapidi in successione** → ogni uso ha il suo `undo`; l'avviso mostra solo l'ultimo.

## Migration Plan

Nuovi campi tutti opzionali, nessun dato esistente da migrare. Per tornare indietro basta ripristinare il codice: la versione precedente mostrerebbe i consumabili come oggetti di un tipo che non conosce, senza «Usa», ma con nome, quantità, prezzo e peso intatti. Il campo `spellItem` verrebbe ignorato senza errori.
