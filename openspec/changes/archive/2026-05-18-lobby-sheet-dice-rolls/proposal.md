## Why

I giocatori che usano la lobby chat durante una sessione di gioco devono oggi tenere aperte due tab separate — la scheda personaggio e la chat — e non hanno modo di condividere i risultati dei tiri con gli altri membri. Questa feature unifica i due contesti: la scheda rimane accessibile dalla lobby e ogni tiro viene pubblicato in chat come messaggio, rendendo la sessione di gioco più fluida e condivisa.

## What Changes

- **Nuovo**: pannello laterale scheda personaggio nella `LobbyDetailPage` (desktop) e vista tab dedicata (mobile)
- **Nuovo**: selezione del personaggio attivo all'ingresso in una lobby (memorizzato nel documento `LobbyMember`)
- **Nuovo**: tipo di messaggio `roll` nei messaggi della lobby — contiene formula, valori singoli, totale, critici/fumble e il nome del personaggio
- **Nuovo**: quando un tiro viene effettuato in una lobby attiva, `DiceRoller` pubblica il risultato come messaggio in chat oltre a mostrarlo nel pannello locale
- **Nuovo**: rendering visivo distinto per i messaggi di tipo `roll` nella `ChatPanel` (card compatta con formula, dado, totale)
- **Modificato**: `LobbyMember` esteso con `characterId?: string`
- **Modificato**: `LobbyMessage` esteso con `type: 'text' | 'roll'` e campo opzionale `rollData`
- **Modificato**: `LobbyDetailPage` ridisegnata per ospitare il pannello scheda (layout split desktop, tab bar mobile)

## Capabilities

### New Capabilities

- `lobby-sheet-panel`: Pannello scheda personaggio integrato nella lobby — selezione personaggio, layout desktop split e mobile tab, visualizzazione dei soli dati rollabili (caratteristiche, tiri salvezza, abilità, attacchi)
- `lobby-dice-to-chat`: Pubblicazione dei tiri dado come messaggi strutturati in chat — estensione del tipo messaggio, rendering dedicato nella chat, integrazione col `DiceRoller` esistente

### Modified Capabilities

- `async-chat`: Aggiunta del requirement per i messaggi di tipo `roll` (contenuto strutturato con `rollData`) e il loro rendering differenziato in chat
- `lobby-management`: Aggiunta del requirement per l'associazione personaggio-membro (`characterId` su `LobbyMember`) e la selezione del personaggio attivo

## Impact

- **`src/types/index.ts`**: estensione di `LobbyMessage` e `LobbyMember`
- **`src/lib/lobbySync.ts`**: `sendMessage` generalizzato per accettare sia messaggi testo che roll
- **`src/store/lobbyStore.ts`**: aggiunta di `activeCharacterId` nello stato, azione `setActiveCharacter`
- **`src/pages/LobbyDetailPage.tsx`**: layout split desktop, tab bar mobile, rendering panel scheda
- **`src/components/lobby/ChatPanel.tsx`**: rendering messaggi roll
- **`src/components/lobby/RollMessage.tsx`**: nuovo componente per la card del tiro in chat
- **`src/components/lobby/CharacterSelectBar.tsx`**: nuovo componente per selezionare il personaggio attivo
- **`src/components/lobby/LobbySheetPanel.tsx`**: nuovo componente — contenitore pannello scheda con i sotto-panel rollabili
- **`src/components/sheet/DiceRoller.tsx`**: aggiunta prop `onRollResult` callback per pubblicare il risultato in chat quando una lobby è attiva
- Nessuna dipendenza esterna nuova
