## ADDED Requirements

### Requirement: Flag hidden sui messaggi roll del GM
I messaggi di tipo `roll` SHALL supportare un campo opzionale `hidden: boolean` (default: `false`). Solo il GM della lobby SHALL poter inviare messaggi con `hidden: true`.

#### Scenario: GM invia tiro nascosto
- **WHEN** il GM esegue un tiro con il toggle "nascosto" attivato
- **THEN** il messaggio viene salvato su Firestore con `type: 'roll'`, `hidden: true` e `senderId` uguale al GM

#### Scenario: Non-GM non può inviare tiri nascosti
- **WHEN** un membro con ruolo player tenta di inviare un messaggio con `hidden: true`
- **THEN** la Firestore security rule nega la scrittura; il client riceve un errore di autorizzazione

#### Scenario: Messaggi senza campo hidden trattati come visibili
- **WHEN** un client legge un messaggio roll senza il campo `hidden`
- **THEN** il client lo tratta come `hidden: false` e lo visualizza normalmente

---

### Requirement: Filtro messaggi nascosti per i non-GM
Il `lobbyStore` SHALL filtrare i messaggi con `hidden === true` per gli utenti che non sono GM. I messaggi nascosti non SHALL mai apparire nella lista messaggi locale dei non-GM.

#### Scenario: Non-GM non vede i tiri nascosti
- **WHEN** il listener Firestore riceve un messaggio con `hidden: true` e `senderId !== currentUserUid`
- **THEN** il messaggio non viene aggiunto allo state `messages` del non-GM e non appare nella chat

#### Scenario: GM vede i propri tiri nascosti
- **WHEN** il listener Firestore riceve un messaggio con `hidden: true` e `senderId === currentUserUid` (cioè il GM è il mittente)
- **THEN** il messaggio viene aggiunto normalmente allo state `messages` del GM e appare nella ChatPanel con un indicatore visivo di "nascosto"

#### Scenario: Tiro nascosto non mostra placeholder ai giocatori
- **WHEN** il GM esegue un tiro nascosto in una lobby con altri tre giocatori
- **THEN** i tre giocatori non vedono alcun messaggio né placeholder nella chat; solo il GM vede il risultato

---

### Requirement: Toggle UI per tiri nascosti (solo GM)
Il GM SHALL disporre di un toggle visibile nell'area di lancio dadi che consente di impostare il prossimo tiro come nascosto o visibile prima di eseguirlo. Il toggle SHALL essere visibile esclusivamente ai GM.

#### Scenario: Toggle visibile solo al GM
- **WHEN** un utente con `isGM: true` apre la sezione dadi nella lobby
- **THEN** il toggle "Tiro nascosto" è visibile e interagibile

#### Scenario: Toggle non visibile ai player
- **WHEN** un utente con `isGM: false` apre la sezione dadi nella lobby
- **THEN** il toggle "Tiro nascosto" non è presente nel DOM

#### Scenario: Toggle attivo condiziona il lancio
- **WHEN** il GM ha il toggle "Tiro nascosto" attivato ed esegue un tiro
- **THEN** il messaggio roll viene inviato con `hidden: true`

#### Scenario: Toggle disattivo produce tiro normale
- **WHEN** il GM ha il toggle "Tiro nascosto" disattivato ed esegue un tiro
- **THEN** il messaggio roll viene inviato con `hidden: false` (o senza il campo), visibile a tutti

---

### Requirement: Indicatore visivo tiro nascosto per il GM
I messaggi roll con `hidden: true` visualizzati nella ChatPanel del GM SHALL mostrare un indicatore visivo che li distingue dai tiri normali.

#### Scenario: Badge "nascosto" sulla card roll del GM
- **WHEN** il GM visualizza un proprio tiro con `hidden: true` nella ChatPanel
- **THEN** la card mostra un indicatore (es. icona occhio barrato o etichetta "Nascosto") accanto al risultato

#### Scenario: Tiri normali del GM non mostrano l'indicatore
- **WHEN** il GM visualizza un proprio tiro con `hidden: false`
- **THEN** la card non mostra l'indicatore "nascosto"
