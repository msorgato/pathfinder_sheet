# Tasks

## 1. Componenti e stili base

- [x] 1.1 Aggiungere classe `.btn-icon` (40×40px, centrata, bordo coerente con `btn-ghost`) e variante primaria in `src/index.css`
- [x] 1.2 Aggiungere regole responsive per la riga azioni dell'header (padding ridotto ≤680px, «← Compagnia» compatto ≤380px)

## 2. Pannello di personalizzazione

- [x] 2.1 Creare `src/components/sheet/CharacterCustomizationPanel.tsx` (overlay, bottom-sheet su mobile, chiusura con ✕/tap fuori/Esc, focus iniziale)
- [x] 2.2 Spostare nel pannello il picker colore (10 palette, ring sullo swatch attivo, tooltip con nome, «Ripristina oro»), senza chiusura automatica alla selezione
- [x] 2.3 Aggiungere nel pannello la sezione «Pericolo» con azione di eliminazione che apre il `ConfirmModal` esistente

## 3. Header della scheda

- [x] 3.1 In `CharacterSheet.tsx` sostituire il pulsante «↑ Level Up» con un pulsante icona (freccia su, `aria-label`/`title` «Level Up»), nascosto a livello ≥ 20
- [x] 3.2 Rimuovere dal header il pallino/popover colore e il cestino, con relativi `showColorPicker`, `colorPickerRef` e `useEffect`
- [x] 3.3 Aggiungere il pulsante ingranaggio che apre il pannello e riordinare il gruppo a destra: preferenze · Level Up · ingranaggio
- [x] 3.4 Collegare lo stato del pannello e il flusso di eliminazione (`ConfirmModal` → `deleteCharacter` → navigazione a `/`)

## 4. Verifica

- [ ] 4.1 Verificare a 360px e 390px che la riga azioni sia su una sola riga, senza overflow o sovrapposizioni
- [ ] 4.2 Verificare cambio colore, ripristino oro e persistenza dopo reload
- [ ] 4.3 Verificare che Level Up apra il wizard e sia assente a livello 20; eliminazione richieda conferma
- [x] 4.4 Eseguire build/lint/typecheck e correggere eventuali errori
