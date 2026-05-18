## ADDED Requirements

### Requirement: Pubblicazione tiro in chat
Quando un tiro viene effettuato all'interno di una lobby attiva, il risultato SHALL essere pubblicato come messaggio di tipo `roll` nella chat della lobby, visibile a tutti i membri in tempo reale. Il messaggio roll SHALL contenere nome personaggio, label del tiro, formula, valori singoli dei dadi, modificatore, totale e flag critici/fumble.

#### Scenario: Tiro pubblicato con successo
- **WHEN** un membro esegue un tiro dal `LobbySheetPanel` mentre è in una lobby attiva
- **THEN** il risultato viene salvato su Firestore come `LobbyMessage` con `type: 'roll'` e `rollData` popolato, visibile a tutti i membri in real-time

#### Scenario: Ottimistic update del messaggio roll
- **WHEN** il membro che ha eseguito il tiro invia il messaggio roll a Firestore
- **THEN** il messaggio appare immediatamente nella lista locale del mittente prima della conferma Firestore, senza attendere il round-trip

#### Scenario: DiceRoller senza lobby attiva non pubblica
- **WHEN** un utente esegue un tiro nella scheda standalone (fuori da una lobby)
- **THEN** il risultato NON viene inviato ad alcuna chat; `onRollResult` non è fornita al `DiceRoller` e il comportamento locale rimane invariato

---

### Requirement: Tipo messaggio roll in LobbyMessage
`LobbyMessage` SHALL supportare un campo `type: 'text' | 'roll'` con default `'text'` per compatibilità retroattiva. I messaggi di tipo `roll` SHALL includere un campo opzionale `rollData` di tipo `RollResultData`. Il campo `content` SHALL contenere una stringa human-readable come fallback (es. `"FOR: 1d20+3 = 18"`).

#### Scenario: Struttura messaggio roll corretta
- **WHEN** un messaggio roll viene salvato su Firestore
- **THEN** il documento contiene `type: 'roll'`, `rollData` con tutti i campi (`characterName`, `label`, `formula`, `rolls`, `modifier`, `total`, opzionalmente `isCrit` e `isFumble`), e `content` come stringa leggibile

#### Scenario: Compatibilità retroattiva messaggi text
- **WHEN** un client legge un messaggio senza campo `type` da Firestore
- **THEN** il client lo tratta come `type: 'text'` e lo renderizza normalmente

---

### Requirement: Rendering visivo distinto messaggi roll
I messaggi di tipo `roll` nella `ChatPanel` SHALL essere renderizzati tramite un componente `RollMessage` dedicato, con una card compatta che mostra formula, dado, totale e indica visivamente critici/fumble.

#### Scenario: Card roll renderizzata in chat
- **WHEN** la `ChatPanel` riceve un `LobbyMessage` con `type: 'roll'`
- **THEN** viene renderizzato `RollMessage` con: nome personaggio, label del tiro, formula, lista dei valori singoli, totale in evidenza

#### Scenario: Indicatore visivo critico
- **WHEN** `rollData.isCrit` è `true`
- **THEN** la card mostra un indicatore visivo di critico (es. bordo o testo colorato diverso dal normale)

#### Scenario: Indicatore visivo fumble
- **WHEN** `rollData.isFumble` è `true`
- **THEN** la card mostra un indicatore visivo di fumble (es. bordo o testo in rosso/colorazione negativa)

#### Scenario: Messaggi text non influenzati
- **WHEN** la `ChatPanel` riceve un `LobbyMessage` con `type: 'text'` o `type` assente
- **THEN** il messaggio viene renderizzato con il componente testo esistente, senza modifiche

---

### Requirement: DiceRoller con callback onRollResult
`DiceRoller` SHALL accettare una prop opzionale `onRollResult?: (result: RollResultData) => void`. Quando fornita, SHALL essere invocata dopo ogni lancio con i dati completi del risultato. `DiceRoller` non SHALL avere dipendenze dirette da `lobbyStore` o da alcun sistema di chat.

#### Scenario: Callback invocata dopo il lancio
- **WHEN** `DiceRoller` esegue un tiro e `onRollResult` è fornita
- **THEN** la callback viene invocata con un oggetto `RollResultData` completo (label, formula, rolls, modifier, total, isCrit, isFumble)

#### Scenario: Comportamento invariato senza callback
- **WHEN** `DiceRoller` esegue un tiro e `onRollResult` non è fornita
- **THEN** il comportamento locale del componente rimane identico alla versione precedente
