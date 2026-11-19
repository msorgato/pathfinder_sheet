# Tasks

## 1. Stile globale

- [x] 1.1 Sostituire il blocco «SCROLLBAR» di `src/index.css` con il blocco WebKit/Blink (10 px, pista trasparente, thumb arrotondato con bordo trasparente, hover/active su `--line-strong`) e il blocco `@supports not selector(::-webkit-scrollbar)` per le proprietà standard; verificare che `npm run build` passi
- [ ] 1.2 Rimuovere `scrollbar-width: thin` da `.sheet-sidebar`; verificare con una ricerca che non resti nessun `scrollbar-width: thin` o `scrollbar-color` fuori dal blocco `@supports`
- [x] 1.3 Aggiungere un test sul foglio di stile (pista trasparente, colori da variabili di tema, nessuna proprietà standard fuori dal blocco `@supports`); `npx vitest run src/__tests__` passa

## 2. Verifica

- [ ] 2.1 Con `npm run dev`, controllare in Chrome/Edge la colonna laterale della scheda, un modale con lista lunga e la tab Abilità nei tre temi: scrollbar slim, pista trasparente, colore del tema, hover più marcato
- [ ] 2.2 Controllare in Firefox che la scrollbar sia thin con thumb del colore del tema, e che chip di stato e tab scorrevoli su mobile non mostrino scrollbar
