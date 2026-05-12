## Why

Il pannello di combattimento è assente: non esiste modo di consultare il bonus attacco totale del PG né di registrare un tiro per colpire o i danni. Con l'aggiunta del calcolo del BAB per classe (già presente in `calculations.ts`) il passo naturale è esporre un'interfaccia che mostri la catena di attacchi multipli e permetta di dichiarare armi semplici con cui tirare i dadi.

## What Changes

- Nuovo pannello **Combattimento** nella scheda personaggio.
- Calcolo e visualizzazione del bonus attacco totale per ogni iterazione della catena (es. +7/+2 a BAB 7).
- Possibilità di aggiungere **attacchi/armi** al personaggio, con nome, dado danno, tipo (mischia/distanza) e modificatore di caratteristica.
- Tiro rapido d20 + bonus attacco e dado danno direttamente dall'interfaccia (integrazione con il DiceRoller esistente).
- Salvataggio degli attacchi definiti nel character store (e Firestore).

## Capabilities

### New Capabilities
- `attack-rolls`: Gestione del pannello combattimento: catena di attacchi da BAB, definizione di armi/attacchi del PG, tiro d20 per colpire e tiro danno con un click.

### Modified Capabilities
<!-- Nessuna capability esistente cambia requisiti -->

## Impact

- **`src/utils/calculations.ts`**: aggiunta funzione `attackChain` che calcola le iterazioni di attacco da BAB totale.
- **`src/types/index.ts`**: nuovo tipo `WeaponAttack` (id, name, damageDice, damageBonus, type, abilityKey, notes).
- **`src/store/characterStore.ts`**: azioni `addWeaponAttack`, `removeWeaponAttack`.
- **`src/components/sheet/CombatPanel.tsx`**: nuovo pannello.
- **`src/components/sheet/CharacterSheet.tsx`** (o layout equivalente): inclusione del nuovo pannello.
- Nessuna dipendenza esterna nuova.
