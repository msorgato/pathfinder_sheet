## Why

I bottoni dei tiri per colpire nel pannello Attacchi non comunicano visivamente il tipo di attacco (mischia vs distanza) né è evidente che siano elementi interattivi cliccabili. Questo crea incoerenza con il resto della UI e rende l'esperienza meno intuitiva.

## What Changes

- Aggiunta di un'icona ⚔ ai bottoni dei tiri in mischia (pannello globale + per arma)
- Aggiunta di un'icona 🏹 ai bottoni dei tiri a distanza (pannello globale + per arma)
- Stile visivo dei bottoni potenziato per comunicare interattività: hover effect, cursor pointer esplicito, aspetto più "bottone"

## Capabilities

### New Capabilities

<!-- nessuna nuova capability funzionale -->

### Modified Capabilities

- `attack-rolls`: i requisiti visivi dei bottoni attacco cambiano — ogni bottone deve mostrare l'icona del tipo di attacco e avere hover state evidente

## Impact

- `src/components/sheet/AttacksPanel.tsx` — bottoni nella sezione chain globale e in WeaponRow
