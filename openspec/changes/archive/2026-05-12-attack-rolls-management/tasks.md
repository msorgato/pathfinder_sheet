## 1. Domain model

- [x] 1.1 Aggiungere interfaccia `WeaponAttack` in `src/types/index.ts` (id, name, damageDiceCount, damageDieType, abilityKey, attackType, notes)
- [x] 1.2 Aggiungere campo `weaponAttacks: WeaponAttack[]` al tipo `Character`
- [x] 1.3 Aggiungere `weaponAttacks: []` in `emptyCharacter()` nel character store

## 2. Logica di calcolo

- [x] 2.1 Implementare `attackChain(bab: number): number[]` in `src/utils/calculations.ts` seguendo la regola PF1e (attacco aggiuntivo ogni 5 BAB, minimo `[0]` per BAB 0)
- [x] 2.2 Verificare i casi limite: BAB 0 → `[0]`, BAB 6 → `[6, 1]`, BAB 11 → `[11, 6, 1]`, BAB 16 → `[16, 11, 6, 1]`

## 3. Store

- [x] 3.1 Aggiungere azione `addWeaponAttack(charId, weapon)` al character store con `syncChar`
- [x] 3.2 Aggiungere azione `removeWeaponAttack(charId, weaponId)` al character store con `syncChar`
- [x] 3.3 Aggiungere `?? []` guard su `c.weaponAttacks` nelle azioni store per compatibilità con personaggi Firestore pre-esistenti

## 4. Componente AttacksPanel

- [x] 4.1 Creare `src/components/sheet/AttacksPanel.tsx` con Props `{ char, onQuickRoll? }`
- [x] 4.2 Implementare visualizzazione catena attacchi globale (BAB + mod STR/DEX) senza armi specifiche nella sezione superiore del pannello
- [x] 4.3 Implementare lista armi con badge to-hit (per ogni iterazione) e badge danno cliccabili che invocano `onQuickRoll`
- [x] 4.4 Implementare form inline "Aggiungi arma" con campi: nome, dadi danno (es. 1d8), tipo attacco (mischia/distanza), caratteristica (FOR/DES), note
- [x] 4.5 Implementare bottone rimozione arma con confirm
- [x] 4.6 Gestire stato vuoto (`weaponAttacks.length === 0`) con empty-state prompt

## 5. Integrazione nella sheet

- [x] 5.1 Includere `<AttacksPanel>` nella CharacterSheet (o layout equivalente), passando `onQuickRoll`
- [x] 5.2 Verificare che il pannello si mostri correttamente per personaggi senza armi (nuovo PG) e con armi definite
