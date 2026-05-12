## Why

I box "Mischia" e "Distanza" nel pannello Attacchi mostrano la catena di bonus (es. "+7/+2") ma non sono cliccabili: l'unico modo per lanciare un d20 per colpire è aggiungere un'arma e cliccare i suoi badge. Rendere cliccabili questi due box consente un flusso rapido per tiri "a mani nude" o improvvisati, senza dover definire un'arma.

## What Changes

- I box "Mischia" e "Distanza" nella sezione catena di attacchi globale di `AttacksPanel` diventano cliccabili.
- Un click su "Mischia" lancia `1d20 + (BAB iterazione + mod FOR)` per il primo attacco; se la catena ha più iterazioni, vengono esposte come badge separati cliccabili (uno per attacco).
- Un click su "Distanza" fa lo stesso con `mod DES`.
- Il cursore e il tooltip indicano che l'elemento è cliccabile (stessa UX dei badge arma esistenti).
- Nessuna nuova entità persistita: è solo UX/interazione su dati già presenti.

## Capabilities

### New Capabilities
- `attack-chain-roll`: Click sui badge della catena di attacchi globale per lanciare d20 + bonus dell'iterazione corrispondente.

### Modified Capabilities
<!-- Nessuna capability esistente cambia requisiti -->

## Impact

- **`src/components/sheet/AttacksPanel.tsx`**: i box "Mischia" / "Distanza" diventano elementi cliccabili con `onQuickRoll`.
- Nessuna modifica a store, types o altri componenti.
