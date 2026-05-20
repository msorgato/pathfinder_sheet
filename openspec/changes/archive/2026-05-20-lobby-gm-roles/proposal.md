## Why

Le lobby di gioco mancano di una distinzione di ruolo tra Game Master e giocatori. Questa distinzione è fondamentale per il gioco di ruolo da tavolo: il GM gestisce la narrativa e necessita di strumenti esclusivi (come i tiri segreti) che i giocatori non devono poter vedere o replicare.

## What Changes

- Il creatore di una lobby diventa automaticamente GM della lobby al momento della creazione.
- Esiste al massimo un GM per lobby in qualsiasi momento.
- Il GM può trasferire il proprio ruolo a qualsiasi altro membro della lobby, perdendo immediatamente il privilegio.
- Il GM può eseguire tiri di dado "nascosti": i risultati non vengono mostrati agli altri giocatori nella chat.
- Un toggle nell'interfaccia del GM consente di scegliere se il prossimo tiro sarà visibile o nascosto prima di lanciare.
- I messaggi roll nascosti sono visibili solo al GM; gli altri membri non li vedono affatto (non placeholder).
- Il GM accede alla propria lista di personaggi esattamente come un giocatore normale (nessuna restrizione aggiuntiva).

## Capabilities

### New Capabilities
- `lobby-gm-role`: Gestione del ruolo GM in lobby — assegnazione automatica al creatore, trasferimento a un altro membro, vincolo di unicità (un solo GM per lobby).
- `gm-hidden-rolls`: Tiri di dado nascosti del GM — flag `hidden` sui messaggi roll, toggle UI pre-lancio, filtro lato client che esclude i messaggi nascosti per i non-GM.

### Modified Capabilities
- `lobby-management`: Il modello dati della lobby aggiunge `gmUid` per tracciare il GM corrente. La lista partecipanti espone `role: 'gm' | 'player'` per ogni membro.
- `lobby-dice-to-chat`: I messaggi roll acquisiscono un campo opzionale `hidden: boolean`. La pubblicazione in chat rispetta il flag di visibilità impostato dal GM.

## Impact

- **Firestore**: documento `lobbies/{id}` aggiunge campo `gmUid: string`. Documenti `lobbies/{id}/messages/{msgId}` di tipo `roll` aggiungono campo opzionale `hidden: boolean`.
- **Backend (Cloud Functions)**: nuova funzione per il trasferimento del ruolo GM con validazione unicità. La funzione di invio messaggi accetta il flag `hidden` solo se il mittente è il GM corrente.
- **Frontend**: `lobbyStore` espone `isGM` (computed). `ChatPanel` filtra i messaggi nascosti per i non-GM. `LobbySheetPanel`/`DiceRoller` area GM aggiunge toggle hidden prima del lancio.
- **Nessuna breaking change** verso i client esistenti: `hidden` è opzionale con default `false`; `gmUid` non altera le regole di accesso esistenti.
