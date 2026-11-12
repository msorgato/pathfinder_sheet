# Proposal

## Why

Pozioni, pergamene e bacchette sono gli oggetti magici che un personaggio usa più spesso, ma non sono voci di catalogo: sono **un incantesimo con dei parametri**. Contano la lista di classe, che fissa il livello dell'incantesimo, il livello dell'incantatore (LI) di chi le ha create, e poi quantità o cariche. Oggi la scheda non sa rappresentarle, né tenere il conto delle cariche, né applicarne l'effetto quando vengono usate.

È la terza e ultima change dell'equipaggiamento, dopo `equipment-inventory` e `magic-items`.

## What Changes

**Creazione dall'incantesimo**
- Dal database degli incantesimi il giocatore crea una pozione, una pergamena o una bacchetta.
- Sceglie la lista di classe, che fissa il livello dell'incantesimo, e il LI; come LI viene proposto il minimo per quel livello, ma è modificabile.
- Indica la quantità (pozioni e pergamene) oppure le cariche (bacchette, massimo 50).
- Vincoli PF1: pozioni fino al 3° livello, bacchette fino al 4°, pergamene fino al 9°.

**Valori calcolati**
- Prezzo: 50 / 25 / 750 mo × livello dell'incantesimo × LI, con ½ per i trucchetti.
- CD dell'oggetto: 10 + livello + ⌊livello/2⌋.
- Il nome si compone da solo (es. «Pozione di Cura Ferite Leggere (LI 1)»).
- L'acquisto passa dal flusso già esistente: prezzo proposto e modificabile, monete mai sotto zero.

**Usabilità**
- Le pozioni le usa chiunque.
- Pergamene e bacchette richiedono che l'incantesimo sia nella lista di una classe del personaggio. Altrimenti viene mostrata la prova di Utilizzare Congegni Magici necessaria: CD 20 per le bacchette, CD 20 + LI per le pergamene.
- Se il LI dell'oggetto supera quello del personaggio, per le pergamene viene segnalata la prova di livello dell'incantatore.

**Uso**
- «Usa» scala una dose (pozioni, pergamene) o una carica (bacchette).
- Se l'incantesimo ha un preset di effetto, l'effetto viene aggiunto al personaggio calcolato sul LI dell'oggetto, e un «Annulla» lo toglie.
- Pozioni e pergamene esaurite vengono rimosse. Le bacchette scariche restano, segnate «scarica».

**Dove si usano**
- Si creano e gestiscono nella tab Equipaggiamento.
- Nella tab Combattimento c'è una sezione compatta «Consumabili» con il pulsante Usa.

**Preset legati al LI**
- I preset che crescono con il LI ne tengono conto: Scudo della fede e Pelle coriacea.
- Una tabella curata collega gli incantesimi del database ai preset di effetto.

## Capabilities

### New Capabilities
- `spell-consumables`: creazione di pozioni, pergamene e bacchette dagli incantesimi, valori calcolati (livello, prezzo, CD), usabilità, uso con consumo di quantità o cariche, applicazione dell'effetto ed esaurimento.

### Modified Capabilities
- `character-effects`: i preset di effetto possono essere applicati a un LI dato; quelli che crescono con il LI ne tengono conto.

## Impact

**Tipi**: `ItemKind` riceve `'consumable'`; `EquipmentItem` riceve il campo `spellItem?` (forma, incantesimo, classe, livello, LI, cariche).

**Dati**
- `src/data/effectPresets.ts`: modificatori in funzione del LI per i preset che scalano.
- Nuovo `src/data/spellEffectLinks.ts`: collegamento incantesimo → preset, curato a mano.

**Logica**
- Nuovo `src/utils/spellConsumables.ts`: creazione, valori calcolati, usabilità, uso.
- Nuova azione `useConsumable` nello store.

**Interfaccia**
- Nuovo `SpellItemCreator` nella tab Equipaggiamento.
- Righe dell'inventario con «Usa».
- Nuova sezione «Consumabili» nella tab Combattimento.
- Toast di conferma con «Annulla».

**Firestore**: solo nuovi campi opzionali; nessuna modifica alle regole.
