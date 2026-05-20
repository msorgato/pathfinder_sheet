## MODIFIED Requirements

### Requirement: Tipo messaggio roll in LobbyMessage
`LobbyMessage` SHALL supportare un campo `type: 'text' | 'roll'` con default `'text'` per compatibilità retroattiva. I messaggi di tipo `roll` SHALL includere un campo opzionale `rollData` di tipo `RollResultData`. Il campo `content` SHALL contenere una stringa human-readable come fallback (es. `"FOR: 1d20+3 = 18"`). I messaggi roll SHALL supportare un campo opzionale `hidden: boolean` (default: `false`) che indica se il tiro è visibile solo al GM mittente.

#### Scenario: Struttura messaggio roll corretta
- **WHEN** un messaggio roll viene salvato su Firestore
- **THEN** il documento contiene `type: 'roll'`, `rollData` con tutti i campi (`characterName`, `label`, `formula`, `rolls`, `modifier`, `total`, opzionalmente `isCrit` e `isFumble`), `content` come stringa leggibile, e opzionalmente `hidden: boolean`

#### Scenario: Compatibilità retroattiva messaggi text
- **WHEN** un client legge un messaggio senza campo `type` da Firestore
- **THEN** il client lo tratta come `type: 'text'` e lo renderizza normalmente

#### Scenario: Messaggio roll senza campo hidden trattato come visibile
- **WHEN** un client legge un messaggio roll senza il campo `hidden`
- **THEN** il client lo tratta come `hidden: false` e lo visualizza a tutti i membri

---

### Requirement: Pubblicazione tiro in chat
Quando un tiro viene effettuato all'interno di una lobby attiva, il risultato SHALL essere pubblicato come messaggio di tipo `roll` nella chat della lobby. Se il tiro è nascosto (`hidden: true`), il messaggio SHALL essere salvato su Firestore ma visibile solo al GM nella propria ChatPanel; i non-GM non vedranno il messaggio. Il messaggio roll SHALL contenere nome personaggio, label del tiro, formula, valori singoli dei dadi, modificatore, totale e flag critici/fumble.

#### Scenario: Tiro normale pubblicato con successo
- **WHEN** un membro (GM o player) esegue un tiro senza flag nascosto
- **THEN** il risultato viene salvato su Firestore come `LobbyMessage` con `type: 'roll'`, `hidden: false` (o assente), visibile a tutti i membri in real-time

#### Scenario: GM pubblica tiro nascosto
- **WHEN** il GM esegue un tiro con `hidden: true`
- **THEN** il risultato viene salvato su Firestore con `type: 'roll'` e `hidden: true`; solo il GM lo vede nella propria chat, gli altri membri non ricevono alcun messaggio

#### Scenario: Ottimistic update del messaggio roll
- **WHEN** il membro che ha eseguito il tiro invia il messaggio roll a Firestore
- **THEN** il messaggio appare immediatamente nella lista locale del mittente prima della conferma Firestore, senza attendere il round-trip

#### Scenario: DiceRoller senza lobby attiva non pubblica
- **WHEN** un utente esegue un tiro nella scheda standalone (fuori da una lobby)
- **THEN** il risultato NON viene inviato ad alcuna chat; `onRollResult` non è fornita al `DiceRoller` e il comportamento locale rimane invariato

---

### Requirement: DiceRoller con callback onRollResult
`DiceRoller` SHALL accettare una prop opzionale `onRollResult?: (result: RollResultData) => void`. Quando fornita, SHALL essere invocata dopo ogni lancio con i dati completi del risultato. `DiceRoller` non SHALL avere dipendenze dirette da `lobbyStore` o da alcun sistema di chat. Il parametro `hidden` SHALL essere passato dal contesto genitore (LobbySheetPanel) alla funzione di invio, non dal DiceRoller stesso.

#### Scenario: Callback invocata dopo il lancio
- **WHEN** `DiceRoller` esegue un tiro e `onRollResult` è fornita
- **THEN** la callback viene invocata con un oggetto `RollResultData` completo (label, formula, rolls, modifier, total, isCrit, isFumble)

#### Scenario: Comportamento invariato senza callback
- **WHEN** `DiceRoller` esegue un tiro e `onRollResult` non è fornita
- **THEN** il comportamento locale del componente rimane identico alla versione precedente
