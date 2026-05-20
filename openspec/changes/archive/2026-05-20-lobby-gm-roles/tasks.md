## 1. Modello dati e Firestore

- [x] 1.1 Aggiungere campo `gmUid: string` al tipo `Lobby` in `src/types/index.ts`
- [x] 1.2 Aggiungere campo opzionale `hidden?: boolean` al tipo `LobbyMessage` in `src/types/index.ts`
- [x] 1.3 Aggiornare `lobbySync.ts`: impostare `gmUid = uid` alla creazione della lobby
- [x] 1.4 Aggiornare le Firestore security rules: consentire scrittura di `gmUid` solo se `request.auth.uid == resource.data.gmUid` (o se `gmUid` è assente e `request.auth.uid == resource.data.ownerId` per il fallback legacy)
- [x] 1.5 Aggiornare le Firestore security rules: consentire scrittura di messaggi con `hidden: true` solo se `request.auth.uid == get(/databases/$(database)/documents/lobbies/$(lobbyId)).data.gmUid`

## 2. Store (lobbyStore)

- [x] 2.1 Aggiungere computed `isGM`: `activeLobby?.gmUid === currentUserUid` (con fallback `ownerId` se `gmUid` assente)
- [x] 2.2 Aggiungere campo locale `isHiddenRollEnabled: boolean` (default `false`) allo store
- [x] 2.3 Aggiungere action `toggleHiddenRoll()` per invertire `isHiddenRollEnabled`
- [x] 2.4 Aggiungere action `transferGMRole(targetUid: string)`: valida che target sia membro, scrive `gmUid = targetUid` su Firestore
- [x] 2.5 Aggiornare il listener messaggi: filtrare `hidden === true && senderId !== currentUserUid` prima di aggiungere messaggi allo state
- [x] 2.6 Aggiornare `sendRollMessage`: accettare parametro `hidden?: boolean` e includerlo nel payload Firestore
- [x] 2.7 Aggiornare la logica di abbandono lobby: bloccare se `isGM === true` con messaggio "Trasferisci il ruolo GM prima di abbandonare"

## 3. Componente ChatPanel

- [x] 3.1 Aggiornare `RollMessage`: aggiungere badge/icona "Nascosto" quando `message.hidden === true` (visibile solo al GM)
- [x] 3.2 Verificare che il filtro messaggi nello store prevenga la renderizzazione di messaggi nascosti per i non-GM (nessuna modifica al componente dovrebbe essere necessaria)

## 4. Componente LobbySheetPanel / area dadi GM

- [x] 4.1 Aggiungere toggle "Tiro nascosto" nell'area dadi: visibile solo se `lobbyStore.isGM === true`
- [x] 4.2 Collegare il toggle a `lobbyStore.isHiddenRollEnabled` (bind bidirezionale)
- [x] 4.3 Aggiornare il callback `onRollResult` passato a `DiceRoller`: includere `hidden: lobbyStore.isHiddenRollEnabled` nella chiamata a `sendRollMessage`

## 5. Componente lista partecipanti (LobbyMembersPanel o equivalente)

- [x] 5.1 Mostrare badge/etichetta "GM" accanto al membro il cui `userId === activeLobby.gmUid`
- [x] 5.2 Aggiungere voce "Trasferisci ruolo GM" nel menu/azioni del singolo membro, visibile solo se `lobbyStore.isGM === true` e il target non è già il GM
- [x] 5.3 Collegare l'azione al `transferGMRole(targetUid)` dello store con dialog di conferma

## 6. Test e verifica

- [x] 6.1 Aggiornare i test unitari di `lobbySync.ts` per coprire: creazione lobby con `gmUid`, `sendMessage` con `hidden: true`
- [x] 6.2 Aggiornare i test di `lobbyStore` per coprire: `isGM` computed, `toggleHiddenRoll`, `transferGMRole`, filtro messaggi nascosti
- [x] 6.3 Testare manualmente il flusso completo: creazione lobby → GM vede toggle → tiro nascosto → player non vede il messaggio → trasferimento GM → vecchio GM perde il toggle
