### Requirement: Selezione personaggio attivo in lobby
Un membro di una lobby SHALL poter associare uno dei propri personaggi alla sessione. L'associazione SHALL essere persistita nel documento `LobbyMember` su Firestore e visibile agli altri membri. Un membro SHALL poter cambiare il personaggio attivo durante la sessione.

#### Scenario: Selezione personaggio al primo accesso
- **WHEN** un membro entra in una lobby senza `characterId` nel proprio `LobbyMember`
- **THEN** il sistema mostra una `CharacterSelectBar` con i personaggi disponibili dell'utente, e il pannello scheda rimane vuoto finché non viene selezionato un personaggio

#### Scenario: Personaggio selezionato e persistito
- **WHEN** un membro seleziona un personaggio dalla `CharacterSelectBar`
- **THEN** il sistema scrive `characterId` nel documento `LobbyMember` su Firestore e `lobbyStore.activeCharacterId` viene aggiornato

#### Scenario: Personaggio già associato al rientro in lobby
- **WHEN** un membro rientra in una lobby in cui aveva già selezionato un personaggio
- **THEN** il sistema carica automaticamente il personaggio dal `characterStore` e il pannello scheda è disponibile senza richiesta di selezione

#### Scenario: Cambio personaggio durante la sessione
- **WHEN** un membro seleziona un personaggio diverso tramite la `CharacterSelectBar`
- **THEN** il sistema aggiorna `characterId` su Firestore e il pannello scheda mostra i dati del nuovo personaggio

#### Scenario: Personaggio non ancora in memoria
- **WHEN** il `characterStore` non ha ancora i dati del personaggio associato
- **THEN** il sistema effettua un fetch puntuale e `LobbySheetPanel` mostra uno skeleton loader durante il caricamento

---

### Requirement: Layout desktop split panel
Su viewport ≥ 1024px la `LobbyDetailPage` SHALL mostrare chat e pannello scheda affiancati in modo fisso (non resizable). La chat occupa ~60% della larghezza, il pannello scheda ~40%.

#### Scenario: Rendering split panel su desktop
- **WHEN** un membro apre una lobby su un viewport ≥ 1024px con un personaggio attivo
- **THEN** la pagina mostra la chat a sinistra (~60%) e `LobbySheetPanel` a destra (~40%) in un layout `display: flex; flex-direction: row`

#### Scenario: Pannello scheda assente senza personaggio attivo su desktop
- **WHEN** un membro apre una lobby su viewport ≥ 1024px senza personaggio attivo
- **THEN** la chat occupa tutta la larghezza e `LobbySheetPanel` non è renderizzato; la `CharacterSelectBar` è visibile per invitare alla selezione

---

### Requirement: Layout mobile tab bar
Su viewport < 1024px la `LobbyDetailPage` SHALL mostrare una sola vista per volta (chat o scheda) con una tab bar fissa in basso con due voci: "Chat" e "Scheda".

#### Scenario: Vista chat attiva di default su mobile
- **WHEN** un membro apre una lobby su viewport < 1024px
- **THEN** la vista iniziale mostra la chat; la tab bar inferiore ha "Chat" selezionata

#### Scenario: Navigazione alla tab Scheda su mobile
- **WHEN** un membro tocca la tab "Scheda" nella tab bar
- **THEN** la vista passa al `LobbySheetPanel` e la tab "Scheda" appare selezionata

#### Scenario: Auto-switch a Chat dopo un tiro su mobile
- **WHEN** un membro esegue un tiro dal `LobbySheetPanel` su mobile
- **THEN** il `DiceRoller` mostra il risultato localmente per 1.5 secondi, poi la vista torna automaticamente alla tab Chat

---

### Requirement: LobbySheetPanel — dati rollabili
`LobbySheetPanel` SHALL mostrare esclusivamente i dati rollabili del personaggio attivo: caratteristiche (con modificatori), tiri salvezza, abilità e attacchi. Non SHALL includere tab, note, level-up modal o altri elementi non rollabili della `CharacterSheet` completa.

#### Scenario: Visualizzazione pannello con personaggio attivo
- **WHEN** `LobbySheetPanel` riceve un `character` valido e una `onQuickRoll` callback
- **THEN** vengono renderizzati `AbilityPanel`, `CombatStats`, `SkillsPanel`, `AttacksPanel` con prop `onQuickRoll` collegata alla pubblicazione chat

#### Scenario: Tiro abilità dal pannello lobby
- **WHEN** un membro clicca su un'abilità o un tiro salvezza nel pannello lobby
- **THEN** il `DiceRoller` si apre con la `RollRequest` corrispondente pre-compilata, pronto per il lancio
