## Why

Il pannello DiceRoller mostra un backdrop `fixed inset-0 z-40` che copre l'intera schermata. Quando il pannello è visibile, qualsiasi click fuori da esso (inclusi i bottoni di attacco, abilità, tiri salvezza) viene intercettato dal backdrop invece di raggiungere il bottone sottostante, chiudendo il pannello senza eseguire il tiro. Il comportamento atteso è che i bottoni di tiro funzionino sempre, indipendentemente dallo stato del pannello.

## What Changes

- Rimosso il backdrop invisibile `fixed inset-0` da `DiceRoller`
- Il pannello si chiude esclusivamente tramite il pulsante ✕ o il bottone floating 🎲 (che già esegue toggle)
- Nessuna modifica alla logica di `handleQuickRoll` in `CharacterSheet` (già corretto: `setDiceOpen(true)`)

## Capabilities

### New Capabilities

<!-- nessuna nuova capability -->

### Modified Capabilities

- `dice-roller`: il requisito di chiusura tramite click esterno cambia — il pannello non si chiude più cliccando fuori, ma solo tramite controllo esplicito (✕ o bottone floating)

## Impact

- `src/components/sheet/DiceRoller.tsx` — rimozione del div backdrop
