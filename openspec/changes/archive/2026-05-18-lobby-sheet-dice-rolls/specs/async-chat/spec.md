## MODIFIED Requirements

### Requirement: Invio messaggio in lobby
Un membro di una lobby attiva SHALL poter inviare un messaggio alla chat della lobby. Il messaggio SHALL essere di tipo `text` o `roll`. I messaggi di tipo `text` contengono contenuto testuale non vuoto; i messaggi di tipo `roll` contengono i dati strutturati del tiro (`rollData`) e una stringa human-readable nel campo `content`. Ogni messaggio SHALL essere associato al mittente e registrato con il timestamp server-side.

#### Scenario: Invio messaggio testuale avvenuto con successo
- **WHEN** un membro di una lobby attiva invia un messaggio con contenuto testuale non vuoto
- **THEN** il sistema persiste il messaggio con `type: 'text'`, `sender_id`, `lobby_id` e `sent_at`, e lo rende disponibile agli altri membri in real-time

#### Scenario: Invio messaggio roll avvenuto con successo
- **WHEN** un membro di una lobby attiva pubblica un risultato di tiro dado
- **THEN** il sistema persiste il messaggio con `type: 'roll'`, `rollData` popolato, `content` come stringa human-readable (es. `"FOR: 1d20+3 = 18"`), e lo rende disponibile agli altri membri in real-time

#### Scenario: Messaggio vuoto
- **WHEN** un membro tenta di inviare un messaggio testuale con contenuto vuoto o solo spazi
- **THEN** il sistema restituisce un errore di validazione e non persiste il messaggio

#### Scenario: Invio in lobby inattiva
- **WHEN** un utente tenta di inviare un messaggio in una lobby chiusa
- **THEN** il sistema restituisce un errore "lobby non attiva"

#### Scenario: Invio da non-membro
- **WHEN** un utente non membro della lobby tenta di inviare un messaggio
- **THEN** il sistema restituisce un errore di autorizzazione
