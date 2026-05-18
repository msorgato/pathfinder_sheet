## Context

La lobby chat esiste già e funziona tramite Firestore real-time (`subscribeToMessages`, `subscribeToMembers`). La scheda personaggio è una pagina standalone (`/characters/:id`) con un sistema di quick-roll (`RollRequest` → `DiceRoller`) già funzionante. Il `DiceRoller` è un pannello locale senza alcuna integrazione con la chat. Nessuno dei due sistemi ha attualmente conoscenza dell'altro.

Il cambio introduce tre livelli di integrazione: (1) il layout della `LobbyDetailPage` viene ridisegnato per ospitare i dati della scheda, (2) un nuovo tipo di messaggio `roll` viene aggiunto al layer dati Firestore, (3) il `DiceRoller` acquisisce una callback opzionale per pubblicare risultati in chat.

## Goals / Non-Goals

**Goals:**
- Permettere a un membro di associare un proprio personaggio alla sessione di lobby
- Mostrare i dati rollabili della scheda all'interno della lobby (non navigare via)
- Pubblicare ogni tiro in chat come messaggio strutturato visibile a tutti i membri
- Funzionare bene su desktop (split panel) e mobile (tab view)
- Non rompere i flussi esistenti (scheda standalone, lobby senza scheda)

**Non-Goals:**
- Sync in tempo reale dello stato HP/risorse tra membri della stessa lobby
- Modifica della scheda personaggio dall'interno della lobby
- Chat a voce/video
- Gestione turni o iniziativa (futura feature separata)
- Supporto a roll personalizzati liberi direttamente dalla chat (solo quick-roll dalla scheda)

## Decisions

### D1 — Layout desktop: split panel fisso, non resizable

**Scelta:** `LobbyDetailPage` usa `display: flex; flex-direction: row` con chat a ~60% e pannello scheda a ~40% su viewport ≥ 1024px. Nessun divisore draggable.

**Alternativa scartata:** pannello laterale collassabile/slideable. Più complesso da implementare, e i dati rollabili sono abbastanza compatti da stare sempre visibili.

**Alternativa scartata:** modal overlay della scheda su click. Blocca la chat, rende impossibile vedere i messaggi mentre si scorre la scheda.

---

### D2 — Layout mobile: bottom tab bar a due voci

**Scelta:** Su viewport < 1024px, `LobbyDetailPage` mostra una sola vista per volta (chat o scheda) con una tab bar fissa in basso: `💬 Chat` | `📜 Scheda`. Quando l'utente esegue un tiro dalla tab Scheda, il risultato appare in chat e la vista torna automaticamente alla tab Chat (1.5s delay per feedback visivo sul tiro prima dello switch).

**Alternativa scartata:** bottom sheet slide-up. Nasconde parte della chat, interazione meno precisa su touch per le stat tile piccole.

**Alternativa scartata:** tabs in cima. La barra di navigazione principale occupa già lo spazio alto; i bottom tabs seguono i pattern mobile moderni (iOS, Android Material).

---

### D3 — Tipo messaggio roll: campo `type` su `LobbyMessage` + `rollData` opzionale

**Scelta:** Estendere `LobbyMessage` con `type: 'text' | 'roll'` (default `'text'` per backward compat) e `rollData?: RollResultData`. I messaggi roll vengono salvati in Firestore nello stesso collection `messages`, con `content` che contiene una stringa human-readable (es. `"FOR: 1d20+3 = 18"`) come fallback per eventuali client che non conoscono il tipo.

```typescript
interface RollResultData {
  characterName: string;
  label: string;      // "FOR", "Percepire", "Magia att. 1"
  formula: string;    // "1d20+3"
  rolls: number[];    // [15]
  modifier: number;   // 3
  total: number;      // 18
  isCrit?: boolean;
  isFumble?: boolean;
}
```

**Alternativa scartata:** collection Firestore separata `rolls/`. Complica le subscription real-time (doppio listener) e rompe l'ordine cronologico naturale dei messaggi.

**Alternativa scartata:** encoding JSON nel campo `content`. Funziona ma rende il dato opaco senza schema esplicito.

---

### D4 — DiceRoller: prop `onRollResult` callback, non accoppiamento diretto al lobby store

**Scelta:** `DiceRoller` riceve una prop opzionale `onRollResult?: (result: RollResultData) => void`. Il chiamante (`CharacterSheet`, ma anche il nuovo `LobbySheetPanel`) decide se e come pubblicare il risultato. Nessun import di `lobbyStore` dentro `DiceRoller`.

**Razionale:** `DiceRoller` rimane un componente puro. Il contesto lobby è gestito dal layer sopra. Evita coupling e permette di usare `DiceRoller` anche fuori dalla lobby senza side effect.

---

### D5 — Selezione personaggio: `characterId` in `LobbyMember` Firestore + `activeCharacterId` in lobbyStore

**Scelta:** Quando un utente entra in una lobby e sceglie un personaggio, viene scritto `characterId` nel suo documento `lobbies/{id}/members/{uid}`. Lato client, `lobbyStore` espone `activeCharacterId: string | null` e l'action `setActiveCharacter(charId)` che aggiorna sia lo store locale che Firestore.

Il personaggio attivo viene caricato da `characterStore` (già in memoria se l'utente ha visitato la home). Se non disponibile, viene fatto un fetch puntuale.

**Alternativa scartata:** localStorage only. Non persistente tra device, non visibile agli altri membri (in futuro potrebbe servire mostrare "Mattia sta usando Aldric il Guerriero").

---

### D6 — LobbySheetPanel: panel dedicato, non embed della CharacterSheet esistente

**Scelta:** Nuovo componente `LobbySheetPanel` che importa direttamente `AbilityPanel`, `CombatStats`, `SkillsPanel`, `AttacksPanel` con una prop `onQuickRoll` che punta alla funzione di pubblicazione chat. Non wrappa la `CharacterSheet` page (troppo grassa: tabs, notes, level-up modal).

**Razionale:** Il pannello lobbhy ha bisogno solo dei dati rollabili. La `CharacterSheet` porta con sé layout, tab bar, FAB, header identità completo — tutto overhead inutile in un pannello secondario da 40% viewport.

---

### D7 — Auto-switch mobile dopo il tiro: 1.5s delay

**Scelta:** Quando l'utente esegue un tiro dalla tab Scheda su mobile, il `DiceRoller` mostra il risultato localmente per 1.5 secondi, poi la vista switcha automaticamente alla tab Chat dove il messaggio è già apparso.

**Alternativa:** nessun auto-switch, l'utente passa manualmente. Peggio UX: dopo il tiro l'utente è ancora sulla tab Scheda e non vede la reazione degli altri.

## Risks / Trade-offs

- **[Risk] Latenza Firestore sul tiro**: il messaggio roll appare in chat con un piccolo ritardo (tipicamente 100-400ms). → *Mitigation*: ottimistic update locale — il messaggio appare subito nella lista locale del mittente prima della conferma Firestore.

- **[Risk] Personaggio non caricato quando si entra in lobby**: se `characterStore` non ha ancora i dati. → *Mitigation*: `LobbySheetPanel` mostra uno skeleton/loading state; effettua fetch dal `characterStore` on-demand.

- **[Risk] Rollback layout**: il nuovo split layout desktop può rompere sessioni di lobby già aperte. → *Mitigation*: il cambio è puramente UI, nessun dato Firestore viene modificato retroattivamente. Nessun piano di rollback dati necessario.

- **[Trade-off] Nessun free-roll dalla chat**: non è possibile lanciare dadi arbitrari dalla input testuale (es. `/roll 2d6`). Si può solo rollare cliccando sulla scheda. Riduce scope e complessità, e mantiene il tiro sempre associato a un personaggio e a una stat specifica.

## Open Questions

- **Quanti personaggi può linkare un membro?** Attualmente uno solo (il `characterId` sul membro). Potrebbe servire supportare più personaggi per campagne con più PG per giocatore — da decidere se estendere in questa iterazione o in una futura.
- **Visibilità del personaggio attivo agli altri membri**: mostrare il nome del personaggio accanto al nome del giocatore nella `MembersList`? Non incluso nel scope attuale ma il dato è già in Firestore dopo D5.
