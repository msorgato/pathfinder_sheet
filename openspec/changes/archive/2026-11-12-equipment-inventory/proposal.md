# Proposal

## Why

La scheda oggi non gestisce l'equipaggiamento.
- **CA**: è calcolata senza armatura né scudo.
- **Armi**: gli attacchi sono definiti a mano, senza critico né competenza.
- **Dati esistenti ma inutilizzati**: il tipo `EquipmentItem` non ha interfaccia, e le competenze di classe sono testo libero.

Questa è la prima di tre change sequenziali:
1. `equipment-inventory`, questa change;
2. oggetti magici;
3. consumabili da incantesimo.

Pone le fondamenta: catalogo degli oggetti comuni, inventario, armatura e scudo nel motore di calcolo, competenze.

## What Changes

**Catalogo degli oggetti comuni**
- Contenuto: armi, armature, scudi, attrezzi d'avventura e altre categorie del wiki golarion.altervista.org.
- Generazione: lo produce uno script di import rieseguibile in `scripts/`.
- Pubblicazione: viene servito come `public/data/items.json` e caricato lazy come incantesimi e talenti.
- Campi: solo i dati strutturati più il link alla pagina del wiki, senza le descrizioni.

**Inventario del personaggio**
- Gestisce oggetti dal catalogo e personalizzati, quantità, note e stato «indossato».
- Introduce gli slot corporei (armatura, scudo, testa, fronte, occhi, collo, spalle, torace, corpo, cintura, polsi, mani, anelli ×2, piedi) e gli oggetti senza slot.
- Monete: un oggetto si può aggiungere gratis o acquistare scalandone il prezzo dalle monete.
- Mostra il peso totale solo a titolo informativo: niente regole d'ingombro.
- Aggiunge una nuova scheda «Equipaggiamento» nella pagina del personaggio.

**Armatura e scudo nel motore** (`deriveStats`)
- Bonus di armatura e di scudo alla CA, limite di Des a CA e CMD.
- Penalità di armatura alle abilità che la prevedono.
- Avviso di fallimento degli incantesimi arcani.
- Velocità ridotta da armatura media o pesante.

**Armi collegate agli attacchi**
- Un attacco può riferirsi a un'arma dell'inventario e ne eredita dadi, critico, tipo di danno, gittata e impugnatura.
- Le armi a due mani applicano 1,5 × For ai danni.
- Gli attacchi manuali restano supportati (colpo senz'armi, armi naturali, casi particolari).

**Competenze**
- Fonti:
  - competenze strutturate per le classi base;
  - familiarità razziale con le armi;
  - talenti di competenza, con la scelta dell'arma per armi da guerra ed esotiche;
  - arma preferita della divinità;
  - competenze aggiunte manualmente.
- Effetti del calcolo: −4 ai tiri per colpire con armi non competenti, penalità di armatura ai tiri per colpire e alle prove basate su For/Des se l'armatura non è competente, avvisi per le restrizioni del bardo (scudi torre) e del druido (armature di metallo).
- **BREAKING**: `ClassDefinition.armorProficiencies` e `weaponProficiencies` diventano strutturati. I testi liberi delle classi custom vengono migrati in un campo nota, senza perdere dati.

## Capabilities

### New Capabilities
- `equipment-catalog`: dataset degli oggetti comuni (armi, armature, scudi, attrezzi), script di import, caricamento lazy.
- `character-inventory`: inventario del personaggio, slot corporei, stato indossato, oggetti personalizzati, acquisto con le monete, peso informativo.
- `armor-and-shields`: effetti di armatura e scudo indossati su CA, Des massima, penalità di armatura, fallimento arcano e velocità.
- `character-proficiencies`: calcolo delle competenze in armi e armature dalle varie fonti e penalità per la mancata competenza.

### Modified Capabilities
- `attack-rolls`:
  - la definizione dell'arma include il collegamento opzionale all'inventario, il critico e l'impugnatura;
  - la visualizzazione e il tiro includono la penalità per la mancata competenza e 1,5 × For per le armi a due mani.
- `character-modifiers`: le varianti della CA includono armatura e scudo indossati e il limite di Des.
- `custom-class-admin`: le competenze in armature e armi diventano campi strutturati, con una nota libera.

## Impact

**Tipi** (`src/types/index.ts`)
- `EquipmentItem` è esteso in modo retrocompatibile.
- Nuovi `ItemDefinition`, `ArmorProficiency`, `WeaponProficiencies`.
- Nuovi campi del personaggio: `featChoices?`, `extraProficiencies?`, `deity weapon`.
- `WeaponAttack.itemId?`.

**Dati**
- Nuovo `public/data/items.json` e `scripts/import-items.*`.
- Competenze strutturate in `src/data/classes/*.ts`.
- Familiarità con le armi in `src/data/races.ts`.

**Motore e store**
- `src/utils/derivedStats.ts`: CA, CMD, abilità, attacchi, velocità e avvisi.
- `src/store/characterStore.ts`: azioni di inventario.
- `src/store/dataStore.ts`: caricamento del catalogo.

**Interfaccia**
- Nuovo pannello Equipaggiamento.
- `AttacksPanel` e `CustomClassEditor` aggiornati.
- `Step2_Class` mostra le competenze strutturate.

**Firestore**: nuovi campi opzionali sul documento del personaggio e sulle classi custom. Nessuna modifica alle regole.
