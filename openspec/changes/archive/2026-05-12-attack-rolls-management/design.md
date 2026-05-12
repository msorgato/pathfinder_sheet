## Context

Il progetto è una character sheet Pathfinder 1e in React + TypeScript + Vite, con state management Zustand e persistenza su Firestore. Esiste già `CombatStats.tsx` che mostra HP, CA, BAB, CMB/CMD e tiri salvezza. La funzione `totalBAB(classes)` è disponibile in `calculations.ts`. Il DiceRoller (`DiceRoller.tsx`) supporta già roll veloci tramite callback `onQuickRoll`. Non esiste ancora un modo per definire armi/attacchi del PG né per visualizzare la catena di attacchi multipli.

## Goals / Non-Goals

**Goals:**
- Aggiungere la funzione `attackChain(bab)` → array di bonus iterativi (es. BAB 8 → `[8, 3]`).
- Nuovo tipo `WeaponAttack` nel domain model con i campi necessari a descrivere un attacco.
- Campo `weaponAttacks: WeaponAttack[]` nel tipo `Character`.
- Azioni store `addWeaponAttack` / `removeWeaponAttack`.
- Nuovo pannello `AttacksPanel.tsx` che mostra la catena di attacchi e le armi configurate con bottoni di tiro rapido.
- Integrazione `emptyCharacter` con `weaponAttacks: []` per compatibilità Firestore.

**Non-Goals:**
- Gestione inventario/equipaggiamento (armi come oggetti con peso, valore, quantità).
- Modificatori da armatura, talenti o incantesimi sugli attacchi.
- Armi a distanza con gestione gittata e munizioni.
- Attacchi naturali o speciali da razza/classe.

## Decisions

### 1. Nuovo pannello `AttacksPanel.tsx` invece di estendere `CombatStats.tsx`

`CombatStats.tsx` gestisce HP live, CA e tiri salvezza — stato derivato da statistiche base. La gestione delle armi è un dominio distinto (lista di entità persistibili + interazione CRUD). Tenere i due separati evita un componente monolitico e rende più semplice la futura integrazione con l'inventario.

*Alternativa scartata*: sezione collassabile in `CombatStats.tsx` — mescola responsabilità e complica la lettura del codice.

### 2. `WeaponAttack` come tipo standalone, non estensione di `EquipmentItem`

`EquipmentItem` modella oggetti fisici (peso, valore, quantità). Un `WeaponAttack` modella la meccanica di attacco (dado danno, caratteristica, tipo). Tenerli separati ora semplifica la fusione futura: quando arriverà l'inventario, un'arma equipaggiata potrà opzionalmente linkare un `WeaponAttack`.

### 3. `attackChain` restituisce solo i bonus iterativi senza modificatori arma

La catena dipende solo dal BAB totale (PF1e: ogni attacco aggiuntivo a -5). I modificatori da STR/DEX vengono aggiunti dal componente al momento del render e del roll, restando separati dalla logica pura.

### 4. Caratteristica da attacco selezionabile per arma (`abilityKey: 'str' | 'dex'`)

Nella build iniziale: mischia usa STR, distanza usa DEX, con possibilità di override manuale per future build finesse. Nessun talento Weapon Finesse automatico per ora.

## Risks / Trade-offs

- **[Risk] `weaponAttacks` undefined su personaggi Firestore precedenti** → Mitigato: `emptyCharacter` include `weaponAttacks: []`; `loadFromFirestore` fa merge shallow con `emptyCharacter`, quindi il campo sarà sempre presente.
- **[Trade-off] Armi definite "a mano" senza collegamento all'inventario** → Accettabile per questo scope; la proposta esplicita che l'inventario è lavoro futuro. Le armi create ora potranno essere migrate quando arriverà l'inventario.
- **[Risk] BAB 0 produce `attackChain` vuota** → Gestito con fallback `[0]` (un attacco al +0) per classi senza progressione di attacco.
