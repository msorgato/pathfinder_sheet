### Requirement: Assegnazione automatica ruolo GM al creatore
Quando una lobby viene creata, il sistema SHALL assegnare automaticamente il ruolo GM all'utente creatore impostando `gmUid = creatorUid` nel documento lobby.

#### Scenario: Creazione lobby assegna gmUid
- **WHEN** un utente crea una nuova lobby
- **THEN** il documento `lobbies/{id}` contiene `gmUid` uguale all'`uid` del creatore

#### Scenario: Fallback gmUid su lobby esistenti senza il campo
- **WHEN** il client carica una lobby che non ha il campo `gmUid` (creata prima di questo deploy)
- **THEN** il client tratta `ownerId` come GM effettivo e, al primo accesso del creatore, persiste `gmUid = ownerId` sul documento lobby

---

### Requirement: Unicità del ruolo GM per lobby
In ogni lobby SHALL esistere al massimo un GM in qualsiasi momento.

#### Scenario: Un solo GM contemporaneamente
- **WHEN** il GM trasferisce il proprio ruolo a un altro membro
- **THEN** il documento lobby aggiorna `gmUid` al nuovo uid e il precedente GM perde il privilegio nello stesso aggiornamento atomico

#### Scenario: Tentativo di assegnare GM a se stessi se già GM
- **WHEN** il GM corrente tenta di trasferire il ruolo a se stesso
- **THEN** il sistema non esegue alcuna modifica e restituisce un feedback appropriato

---

### Requirement: Trasferimento ruolo GM a un altro membro
Il GM corrente SHALL poter trasferire il proprio ruolo a qualsiasi altro membro attivo della lobby. Il GM perde immediatamente il privilegio dopo il trasferimento.

#### Scenario: Trasferimento avvenuto con successo
- **WHEN** il GM seleziona un altro membro dalla lista e conferma il trasferimento
- **THEN** il documento lobby aggiorna `gmUid` con l'uid del membro target; il GM precedente diventa player; il nuovo GM acquisisce tutti i privilegi GM

#### Scenario: Trasferimento a utente non membro
- **WHEN** il GM tenta di trasferire il ruolo a un uid che non è membro della lobby
- **THEN** il sistema rifiuta l'operazione e restituisce un errore di validazione

#### Scenario: Trasferimento da non-GM
- **WHEN** un membro con ruolo player tenta di modificare `gmUid`
- **THEN** la Firestore security rule nega la scrittura e il client riceve un errore di autorizzazione

---

### Requirement: Esposizione del ruolo GM nella lista partecipanti
Il `lobbyStore` SHALL esporre per ogni membro il proprio ruolo calcolato (`'gm'` o `'player'`), derivato confrontando `member.userId` con `lobby.gmUid`.

#### Scenario: Membro con ruolo GM visualizzato correttamente
- **WHEN** un membro carica la lista partecipanti di una lobby
- **THEN** il membro il cui `userId` corrisponde a `gmUid` ha `role: 'gm'`; tutti gli altri hanno `role: 'player'`

#### Scenario: computed isGM disponibile nello store
- **WHEN** il `lobbyStore` è attivo con una lobby selezionata
- **THEN** `lobbyStore.isGM` restituisce `true` se `currentUserUid === activeLobby.gmUid`, `false` altrimenti

---

### Requirement: Blocco abbandono lobby per il GM
Il GM non SHALL poter abbandonare la lobby senza prima trasferire il ruolo GM a un altro membro.

#### Scenario: GM tenta di abbandonare senza trasferire il ruolo
- **WHEN** il GM corrente invia una richiesta di abbandono lobby
- **THEN** il sistema blocca l'operazione e indica che il GM deve prima trasferire il ruolo

#### Scenario: GM abbandona dopo il trasferimento
- **WHEN** il precedente GM (ora player) invia una richiesta di abbandono
- **THEN** il sistema rimuove l'utente dalla lobby normalmente
