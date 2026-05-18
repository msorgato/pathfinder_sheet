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

### Requirement: Lettura messaggi con paginazione cursor-based
Un membro di una lobby SHALL poter recuperare i messaggi della chat in ordine cronologico. Il client SHALL poter richiedere solo i messaggi più recenti dell'ultimo ricevuto, tramite cursor basato su timestamp.

#### Scenario: Caricamento iniziale messaggi
- **WHEN** un membro apre la chat di una lobby senza fornire un cursor
- **THEN** il sistema restituisce gli ultimi N messaggi (es. 50) in ordine cronologico crescente, con informazioni sul mittente

#### Scenario: Polling nuovi messaggi
- **WHEN** il client invia una richiesta con cursor uguale al `sent_at` dell'ultimo messaggio ricevuto
- **THEN** il sistema restituisce solo i messaggi con `sent_at` strettamente maggiore del cursor, oppure una lista vuota se non ci sono nuovi messaggi

#### Scenario: Accesso da non-membro
- **WHEN** un utente non membro richiede i messaggi di una lobby
- **THEN** il sistema restituisce un errore di autorizzazione

### Requirement: Conteggio messaggi non letti
Il sistema SHALL tracciare per ogni membro il momento dell'ultimo accesso alla chat, e SHALL esporre il numero di messaggi non letti per ogni lobby a cui l'utente appartiene.

#### Scenario: Badge messaggi non letti
- **WHEN** un membro richiede la lista delle proprie lobby
- **THEN** il sistema include per ogni lobby il conteggio dei messaggi con `sent_at` maggiore del `last_seen_at` del membro

#### Scenario: Azzeramento non letti all'apertura chat
- **WHEN** un membro apre la chat di una lobby
- **THEN** il sistema aggiorna il `last_seen_at` del membro al timestamp corrente, azzerando il contatore dei messaggi non letti per quella lobby

### Requirement: Notifica in-app nuovi messaggi
Il sistema SHALL segnalare all'utente la presenza di nuovi messaggi nelle lobby a cui appartiene tramite un indicatore visivo nell'interfaccia (badge o alert), aggiornato tramite polling periodico.

#### Scenario: Indicatore attivo con messaggi non letti
- **WHEN** ci sono messaggi non letti in almeno una lobby dell'utente
- **THEN** l'interfaccia mostra un indicatore visivo (es. badge con conteggio) sulla voce di menu delle lobby

#### Scenario: Indicatore assente senza messaggi non letti
- **WHEN** l'utente ha letto tutti i messaggi in tutte le sue lobby
- **THEN** l'interfaccia non mostra alcun badge o indicatore attivo
