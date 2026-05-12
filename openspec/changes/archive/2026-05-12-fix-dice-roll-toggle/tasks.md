## 1. Rimozione backdrop DiceRoller

- [x] 1.1 Rimuovere il div `<div className="fixed inset-0 z-40" onClick={onClose} />` da `DiceRoller.tsx`

## 2. Fix click-through sul pannello DiceRoller

- [x] 2.1 Aggiungere `pointerEvents: 'none'` al div root del pannello DiceRoller
- [x] 2.2 Aggiungere `pointerEvents: 'auto'` ai div interni (header, controls, history) per mantenere l'interattività
