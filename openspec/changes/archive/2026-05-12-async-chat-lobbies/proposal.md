## Why

La scheda di Pathfinder è usata in sessioni di gioco di gruppo, ma attualmente non offre alcun canale di comunicazione tra giocatori o tra giocatori e master. Introdurre lobby e chat asincrona consente ai gruppi di coordinarsi direttamente dall'applicazione, senza dipendere da strumenti esterni.

## What Changes

- Introduzione di **lobby**: spazi condivisi che un utente può creare e a cui altri possono unirsi tramite codice o link.
- Introduzione di una **chat asincrona** per ogni lobby, dove i partecipanti possono inviare messaggi che persistono nel tempo.
- Visualizzazione dei partecipanti attivi in una lobby e del loro stato.
- Notifiche in-app per nuovi messaggi ricevuti in lobby a cui si è iscritti.

## Capabilities

### New Capabilities

- `lobby-management`: Creazione, partecipazione, abbandono e gestione delle lobby di gioco (incluse lista partecipanti e owner della lobby).
- `async-chat`: Sistema di messaggistica asincrona per lobby, con persistenza dei messaggi e indicatore di messaggi non letti.

### Modified Capabilities

<!-- nessuna capability esistente ha cambiamenti a livello di spec -->

## Impact

- **Backend**: Nuovi endpoint REST (o WebSocket) per lobby e messaggi; storage persistente per messaggi e stato lobby.
- **Frontend**: Nuove pagine/componenti per lista lobby, dettaglio lobby e pannello chat.
- **Auth**: Le lobby richiedono utenti autenticati; il owner della lobby ha privilegi di gestione.
- **Dipendenze**: Valutare l'uso di WebSocket o polling per aggiornamenti in tempo reale dei messaggi.
