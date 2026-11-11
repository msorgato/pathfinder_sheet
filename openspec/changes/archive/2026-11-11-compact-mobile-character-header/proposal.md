# Proposal

## Why

Nell'header della scheda personaggio in versione mobile la riga di azioni è affollata: il pulsante «↑ Level Up» con testo occupa molto spazio orizzontale pur essendo usato di rado, e il selettore del colore (pallino sempre visibile) e il cestino sono sparsi senza una gerarchia chiara. Il risultato è un header sbilanciato che tronca/stringe gli elementi su schermi stretti.

## What Changes

- Il pulsante Level Up diventa un pulsante **solo icona** (freccia verso l'alto) con `aria-label`/`title` «Level Up», mantenendo lo stile primario; resta nascosto al livello 20.
- Il selettore del colore del personaggio **non è più sempre visibile** nell'header: viene spostato in una nuova sezione/pannello **«Personalizzazione personaggio»**, aperta da un pulsante icona (ingranaggio) nella riga di azioni.
- Il pulsante di eliminazione personaggio viene spostato nello stesso pannello (zona «Pericolo»), così da liberare spazio e ridurre i tap accidentali.
- La riga di azioni viene riorganizzata: a sinistra «← Compagnia» (su mobile solo freccia + testo compatto), a destra un gruppo ordinato di pulsanti icona di uguale dimensione (preferenze utente, Level Up, personalizzazione), con spaziatura e padding ridotti su mobile.
- Il picker colore esistente (10 palette) viene riutilizzato invariato come contenuto del pannello, non più come popover ancorato all'header.

## Capabilities

### New Capabilities
- `character-header-actions`: layout e comportamento della riga di azioni dell'header della scheda personaggio (pulsanti icona, Level Up compatto, accesso alla personalizzazione, adattamento mobile).

### Modified Capabilities
- `character-accent-palette`: il requisito «Inline colour picker in character sheet header» cambia: il selettore non è più inline nell'header ma vive nel pannello di personalizzazione del personaggio.

## Impact

- Codice: `src/pages/CharacterSheet.tsx` (riga azioni, stato `showColorPicker`/ref, nuovo pannello); eventuale nuovo componente `src/components/sheet/CharacterCustomizationPanel.tsx`; stili CSS dell'header per breakpoint mobile.
- Nessuna modifica a dati, store o `accentColor` (formato e persistenza invariati).
- Nessuna nuova dipendenza.
