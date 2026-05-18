## 1. Tipi e interfacce

- [x] 1.1 Aggiungere `RollResultData` interface a `src/types/index.ts` (characterName, label, formula, rolls, modifier, total, isCrit?, isFumble?)
- [x] 1.2 Estendere `LobbyMessage` con `type: 'text' | 'roll'` (default 'text') e `rollData?: RollResultData`
- [x] 1.3 Estendere `LobbyMember` con `characterId?: string`

## 2. Store e sincronizzazione Firestore

- [x] 2.1 Aggiungere `activeCharacterId: string | null` allo stato di `lobbyStore` e l'action `setActiveCharacter(charId: string | null)` che aggiorna sia lo store che `lobbies/{id}/members/{uid}.characterId` su Firestore
- [x] 2.2 Inizializzare `activeCharacterId` leggendo `characterId` dal documento `LobbyMember` al join/ingresso in lobby
- [x] 2.3 Generalizzare `sendMessage` in `src/lib/lobbySync.ts` per accettare sia messaggi `text` che `roll` (parametro opzionale `rollData`)

## 3. DiceRoller — callback onRollResult

- [x] 3.1 Aggiungere prop opzionale `onRollResult?: (result: RollResultData) => void` a `DiceRoller`
- [x] 3.2 Invocare `onRollResult` con i dati completi del lancio subito dopo ogni tiro; nessuna modifica al comportamento locale quando la prop è assente

## 4. Componenti nuovi

- [x] 4.1 Creare `src/components/lobby/RollMessage.tsx`: card compatta che mostra nome personaggio, label, formula, valori singoli, totale; indicatori visivi per isCrit e isFumble
- [x] 4.2 Creare `src/components/lobby/CharacterSelectBar.tsx`: dropdown/lista dei personaggi dell'utente corrente; al click chiama `lobbyStore.setActiveCharacter`; mostra il nome del personaggio attivo se già selezionato
- [x] 4.3 Creare `src/components/lobby/LobbySheetPanel.tsx`: contenitore che importa `AbilityPanel`, `CombatStats`, `SkillsPanel`, `AttacksPanel`; accetta prop `character` e `onQuickRoll`; mostra skeleton loader durante il fetch del personaggio

## 5. ChatPanel — rendering messaggi roll

- [x] 5.1 Aggiornare `src/components/lobby/ChatPanel.tsx` per renderizzare `RollMessage` quando `message.type === 'roll'`, altrimenti il rendering testuale esistente

## 6. LobbyDetailPage — layout e integrazione

- [x] 6.1 Implementare layout desktop split panel in `LobbyDetailPage`: flex row, chat ~60%, `LobbySheetPanel` ~40% su viewport ≥ 1024px; `CharacterSelectBar` visibile sopra il pannello scheda
- [x] 6.2 Implementare layout mobile tab bar in `LobbyDetailPage`: tab bar fissa in basso con "Chat" e "Scheda", una sola vista visibile per volta
- [x] 6.3 Implementare auto-switch mobile: dopo un tiro dal pannello Scheda, attendere 1.5s poi tornare alla tab Chat
- [x] 6.4 Collegare `LobbySheetPanel.onQuickRoll` alla funzione che costruisce `RollResultData` e chiama `sendMessage` con `type: 'roll'` — incluso l'ottimistic update locale
- [x] 6.5 Caricare on-demand il personaggio dal `characterStore` se `activeCharacterId` è impostato ma il personaggio non è in memoria
