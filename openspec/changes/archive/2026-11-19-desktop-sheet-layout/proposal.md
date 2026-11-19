# Proposal

## Why

L'app nasce mobile-first e deve restarlo, ma su PC la scheda personaggio spreca gran parte dello schermo. Il contenuto è chiuso in una colonna di circa 670 px (`max-w-2xl`) e i pannelli sono impilati uno sotto l'altro: su un monitor da 1920 px restano più di 1200 px vuoti, e per vedere insieme caratteristiche, CA e attacchi bisogna scorrere. Inoltre, cambiando tab, i numeri usati di continuo (caratteristiche, PF, CA, TS) spariscono dalla vista.

## What Changes

**Layout desktop della scheda personaggio (da 1024 px in su)**
- La scheda si divide in due zone: una **colonna laterale fissa** a sinistra e un'**area principale** a destra, su una larghezza massima di circa 1600 px centrata.
- La colonna laterale contiene sempre **Caratteristiche**, **Punti Ferita** e **statistiche di combattimento** (CA, TS, BAB, BMC/DMC, iniziativa, velocità). Resta visibile qualunque tab sia aperta e mentre si scorre la pagina; i tiri rapidi funzionano come oggi.
- La barra delle tab si sposta sopra l'area principale e resta raggiungibile durante lo scorrimento.
- La tab **Combattimento**, su desktop, mostra solo ciò che non è già nella colonna laterale: Attacchi, Condizioni ed effetti, Consumabili.

**Contenuto delle tab su più colonne, quando c'è spazio**
- L'area principale dispone i suoi blocchi su due colonne quando è abbastanza larga (indicativamente da 1280 px di finestra in su), invece di impilarli:
  - **Combattimento**: Attacchi a sinistra; Condizioni ed effetti e Consumabili a destra.
  - **Equipaggiamento**: riepilogo, azioni e oggetti indossati a sinistra; oggetti trasportati, monete e competenze a destra.
  - **Abilità**: elenco diviso in due colonne, ognuna con la propria intestazione.
  - **Incantesimi**: i blocchi per livello affiancati.
  - **Capacità**: capacità di classe e talenti affiancati, senza le sotto-tab.
  - **Note**: note a sinistra; dettagli del personaggio e background a destra.
- Fra 1024 e circa 1280 px l'area principale resta a colonna singola, accanto alla colonna laterale.

**Mobile e tablet**
- Sotto i 1024 px la scheda resta identica a oggi: header, tab, pannelli in colonna.

**Fuori da questa change**
- Home, lobby, wizard di creazione e level-up: hanno già un layout desktop accettabile o verranno valutati a parte.
- Nessun cambio a colori, font, contenuti o comportamento dei pannelli: cambia solo la disposizione.

## Capabilities

### New Capabilities
- `character-sheet-layout`: disposizione della scheda personaggio in base alla larghezza dello schermo (colonna singola su mobile, colonna laterale + area principale a più colonne su desktop).

### Modified Capabilities
_Nessuna._

## Impact

- `src/pages/CharacterSheet.tsx`: struttura della pagina, posizione della barra delle tab, composizione della tab Combattimento.
- Pannelli della scheda in `src/components/sheet/` (`EquipmentPanel`, `SkillsPanel`, `SpellsPanel`, `FeaturesPanel`, `CombatStats`, `AbilityPanel`): raggruppamenti e stili per adattarsi alla larghezza del proprio contenitore; su mobile la resa non cambia.
- `src/index.css`: nuove regole per il layout desktop e per i pannelli in colonna stretta.
- Nuovo piccolo hook per sapere se la finestra è in modalità desktop.
- Test di rendering della scheda in entrambe le modalità.
- Nessuna dipendenza nuova, nessun impatto su dati, Firestore o PWA.
