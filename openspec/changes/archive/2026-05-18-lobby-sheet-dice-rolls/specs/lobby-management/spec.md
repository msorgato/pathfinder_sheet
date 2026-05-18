## MODIFIED Requirements

### Requirement: Visualizzazione partecipanti
Un membro di una lobby SHALL poter visualizzare la lista dei partecipanti attuali, il loro stato (owner / membro) e il personaggio attivo associato (se presente).

#### Scenario: Lista partecipanti restituita
- **WHEN** un membro della lobby richiede la lista dei partecipanti
- **THEN** il sistema restituisce la lista degli utenti con il loro ruolo (owner o membro) e, se disponibile, il `characterId` del personaggio attivo

#### Scenario: Accesso da non-membro
- **WHEN** un utente non membro richiede la lista dei partecipanti di una lobby
- **THEN** il sistema restituisce un errore di autorizzazione

## ADDED Requirements

### Requirement: Associazione personaggio attivo al membro
Un membro SHALL poter associare un proprio personaggio alla sessione di lobby scrivendo `characterId` nel proprio documento `LobbyMember` su Firestore. Il campo è opzionale; i flussi senza personaggio attivo SHALL continuare a funzionare normalmente.

#### Scenario: Scrittura characterId su Firestore
- **WHEN** un membro seleziona un personaggio tramite `setActiveCharacter(charId)` su `lobbyStore`
- **THEN** il sistema aggiorna il campo `characterId` nel documento `lobbies/{id}/members/{uid}` e aggiorna `lobbyStore.activeCharacterId`

#### Scenario: Rimozione associazione personaggio
- **WHEN** un membro deseleziona il personaggio attivo (es. passando `null`)
- **THEN** il sistema rimuove o azzera `characterId` nel documento `LobbyMember` e `lobbyStore.activeCharacterId` diventa `null`

#### Scenario: Lobby senza personaggio associato
- **WHEN** un membro partecipa a una lobby senza selezionare alcun personaggio
- **THEN** `characterId` non è presente nel documento `LobbyMember` e tutte le funzionalità di chat testuale funzionano normalmente senza degradi
