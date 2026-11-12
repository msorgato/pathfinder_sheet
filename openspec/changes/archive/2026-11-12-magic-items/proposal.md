# Proposal

## Why

Con `equipment-inventory` la scheda gestisce l'equipaggiamento comune, ma non gli oggetti magici. Oggi un'arma +1, un'armatura di mithral o un Mantello della resistenza non cambiano le statistiche, a meno che il giocatore non simuli il loro effetto con un «effetto» manuale. Eppure sono gli oggetti che spostano di più i numeri al tavolo.

Questa è la seconda delle tre change dell'equipaggiamento. La terza riguarderà i consumabili legati agli incantesimi.

## What Changes

**Catalogo degli oggetti magici**
- Lo script di import legge anche il database degli oggetti magici e meravigliosi del wiki (700+ voci).
- Per ogni oggetto salva nome, tipo e grado (minore/medio/maggiore), slot, prezzo, peso, fonte e link alla pagina del wiki.
- Le descrizioni non vengono copiate.
- Gli oggetti sono cercabili e acquistabili come quelli comuni.

**Potenziamenti delle armi e delle armature, come proprietà dell'oggetto**
- Ogni arma, armatura o scudo dell'inventario può avere:
  - qualità perfetta;
  - bonus di potenziamento da +1 a +5;
  - un materiale speciale (mithral, adamantio, ferro freddo, argento alchemico, legnoscuro);
  - capacità speciali.
- Il motore calcola gli effetti: tiro per colpire, danni, CA, penalità di armatura, Des massima, fallimento arcano e velocità.
- Il prezzo di listino si ricalcola con le regole PF1 (bonus equivalente al quadrato × 2.000 mo per le armi e × 1.000 mo per le armature).

**Capacità speciali**
- Si sceglie da un elenco curato delle più comuni.
- Armi: Infuocata, Gelida, Folgorante, Corrosiva, Affilata, Sacra, Anatema e altre.
- Armature e scudi: Fortificazione, Ombra, Scivolosa e altre.
- Come diventano effetti nella scheda:
  - i dadi extra compaiono come tiri dei danni aggiuntivi;
  - Affilata raddoppia l'intervallo di minaccia;
  - i bonus alle abilità diventano modificatori;
  - tutto il resto resta una nota sull'attacco o sull'oggetto.

**Effetti degli oggetti indossati**
- Ogni oggetto può avere modificatori tipizzati, modificabili con l'editor già usato per gli effetti, che si applicano solo quando l'oggetto è indossato.
- Per alcuni oggetti i modificatori sono già preimpostati, così da coprire i bonus più comuni:
  - i «big six»: Mantello della resistenza, Anello di protezione, Amuleto dell'armatura naturale, Bracciali dell'armatura, Cinture e Fasce di caratteristica, ciascuno nelle sue varianti +N;
  - pochi altri oggetti con bonus fissi alle abilità.

**Regole degli slot**
- Ogni slot conta al massimo quanti oggetti contiene (uno, due per gli anelli).
- Gli oggetti in eccesso restano indossati ma non hanno effetto, e la panoramica degli slot li indica come «non attivi».

## Capabilities

### New Capabilities
- `item-enhancements`: qualità perfetta, bonus di potenziamento, materiali speciali e capacità speciali di armi, armature e scudi, con i loro effetti sulle statistiche e sul prezzo.
- `magic-item-effects`: modificatori degli oggetti indossati (preimpostati o personalizzati) e regole di capienza degli slot.

### Modified Capabilities
- `equipment-catalog`: il catalogo include gli oggetti magici e meravigliosi, con slot, grado e fonte.
- `character-inventory`: nella panoramica degli slot, l'oggetto in eccesso diventa «non attivo» e non ha effetto.
- `attack-rolls`:
  - la visualizzazione include perfetta, potenziamento e Affilata;
  - il tiro dei danni include il bonus di potenziamento e i dadi extra delle capacità speciali.
- `armor-and-shields`: il bonus alla CA include il potenziamento dell'armatura e dello scudo.

## Impact

**Tipi** (`src/types/index.ts`)
- `EquipmentItem`: nuovi campi `masterwork?`, `enhancement?`, `material?`, `abilities?`, `modifiers?`.
- `ItemDefinition`: nuovi campi `slot?`, `tier?`, `source?`.
- `ItemKind`: nuovo valore `'magic'`.

**Dati e script**
- `scripts/import-items.ts`: aggiunta la lettura del database degli oggetti magici.
- Nuovi file curati: `src/data/materials.ts`, `src/data/itemAbilities.ts`, `src/data/magicItemEffects.ts`.
- `public/data/items.json` viene rigenerato.

**Motore** (`src/utils/derivedStats.ts`, `src/utils/inventory.ts`): oggetti indossati come fonti di modificatori, potenziamenti per singolo attacco, materiali applicati ad armature e scudi, prezzo calcolato, capienza degli slot.

**Interfaccia**
- `ItemEditor`: sezione «Magia» con perfetta, potenziamento, materiale, capacità e modificatori.
- `ItemPicker`: filtri per gli oggetti magici.
- `EquipmentSlots`: stato «non attivo».
- `AttacksPanel`: dadi extra e note delle capacità.

**Firestore**: solo nuovi campi opzionali sul personaggio. Nessuna modifica alle regole.
