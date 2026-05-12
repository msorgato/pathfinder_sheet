## 1. Refactor catena attacchi globale in AttacksPanel

- [x] 1.1 Sostituire i due `div` statici "Mischia" e "Distanza" con due sezioni che iterano su `chain`, rendendo ogni iterazione un `<button>` cliccabile
- [x] 1.2 Ogni badge Mischia invoca `onQuickRoll({ label: 'Mischia att. N', numDice: 1, dieType: 20, modifier: chain[i] + strMod })`
- [x] 1.3 Ogni badge Distanza invoca `onQuickRoll({ label: 'Distanza att. N', numDice: 1, dieType: 20, modifier: chain[i] + dexMod })`
- [x] 1.4 Quando `onQuickRoll` non è fornito, i badge rimangono visibili ma senza `cursor: pointer` e senza `onClick`
- [x] 1.5 Mantenere la label di sezione ("Mischia" / "Distanza") e il dettaglio "BAB + FOR/DES" come caption sotto i badge
