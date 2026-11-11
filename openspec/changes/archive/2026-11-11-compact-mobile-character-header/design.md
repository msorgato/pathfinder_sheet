# Design

## Context

L'header in [CharacterSheet.tsx](src/pages/CharacterSheet.tsx) ha una riga di azioni con: «← Compagnia», `UserPreferencesPanel`, un pallino colore con popover (stato `showColorPicker` + ref + listener `mousedown`), il bottone `btn-primary` «↑ Level Up» e un cestino 🗑 `btn-ghost`. I padding sono fissi (24px) e i bottoni hanno dimensioni diverse. Esistono già `ConfirmModal` per la conferma di eliminazione e breakpoint CSS in `index.css` (≤680px, ≤380px). `accentColor` è già persistito tramite `updateCharacter`.

## Goals / Non-Goals

**Goals:**
- Riga di azioni compatta e ordinata su mobile (≥360px) senza overflow.
- Level Up icon-only, con accessibilità preservata.
- Colore personaggio ed eliminazione raggruppati in un pannello «Personalizzazione personaggio».

**Non-Goals:**
- Nessuna modifica al modello dati, alla palette o al flusso del LevelUpWizard.
- Nessun redesign del blocco identità (ritratto, nome, barra PF).
- Nessun cambio a `UserPreferencesPanel`.

## Decisions

1. **Pannello come modal/bottom-sheet, non popover.** Il popover ancorato in alto a destra è fragile su schermi stretti. Si crea `CharacterCustomizationPanel` (overlay centrato, su mobile ancorato in basso), chiuso da pulsante ✕, tap fuori o Esc. Questo elimina `colorPickerRef` e il listener `mousedown` in `CharacterSheet`. *Alternativa scartata:* tenere il popover → stesso problema di posizionamento.
2. **Il pannello riusa il picker esistente** (`CHARACTER_PALETTES`, ring sullo swatch attivo, «Ripristina oro»), ma non si chiude più a ogni selezione, per permettere di provare più colori con anteprima immediata dietro l'overlay.
3. **Eliminazione nel pannello**, in una sezione «Pericolo» che apre l'esistente `ConfirmModal`. Il cestino esce dall'header (meno tap accidentali, più spazio). *Alternativa:* lasciarlo nell'header come icona → contraddice l'obiettivo di riga ordinata; scelta reversibile se non gradita.
4. **Bottoni icona uniformi**: classe comune (es. `.btn-icon`) 40×40px, icone SVG inline (freccia su, ingranaggio) con `currentColor`. Level Up mantiene lo stile primario per distinguersi. `aria-label` e `title` «Level Up» / «Personalizzazione personaggio».
5. **Responsive via CSS**: padding laterale della riga azioni ridotto (≈12–16px) sotto 680px; «← Compagnia» mostra solo «←» + testo accorciato o solo freccia sotto 380px, con `aria-label` completo. Ordine a destra: preferenze · Level Up · ingranaggio.

## Risks / Trade-offs

- **Scopribilità del colore ridotta** (voluta): una volta nel pannello è meno immediato; mitigato dall'icona ingranaggio con tooltip.
- **Level Up meno evidente**: accettato, evento raro; l'icona con stile primario e `aria-label` basta.
- **Focus/accessibilità del modal**: serve gestire focus iniziale e Esc; riusare lo schema di `ConfirmModal` per coerenza.
- **Spec esistente** `character-accent-palette` indica il picker inline: aggiornata tramite delta in questo change.
