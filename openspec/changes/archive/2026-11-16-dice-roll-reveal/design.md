# Design

## Context

- **`DiceRoller`** (`src/components/sheet/DiceRoller.tsx`):
  - riceve una `RollRequest { label, numDice, dieType, modifier }` tramite `pendingRoll`;
  - tira con `Math.random`, aggiorna la cronologia e chiama `onRollResult`, che la lobby usa per la chat;
  - quando il pannello è chiuso restituisce `null`, ma il tiro rapido lo apre comunque;
  - la classe `dice-result` usata sul risultato non ha regole CSS: oggi non c'è nessuna animazione.
- **Montaggio**: `DiceRoller` è montato in `CharacterSheet` e in `LobbySheetPanel`, entrambi con il personaggio a disposizione.
- **Bonus**: ogni `Stat` di `deriveStats` ha `base`, `applied` e `total`, con `total = base + Σ applied`. Le chiamate a `onQuickRoll` sono 10 e passano solo il totale.
- **Attacchi**: `ResolvedAttack` ha `toHit: Stat` e `critRange`. Gli attacchi iterativi sottraggono 5 per volta al primo `toHit`.
- **Impostazioni del PG**: si modificano in `CharacterCustomizationPanel` (colore, icona) e si salvano con `updateCharacter`.

## Goals / Non-Goals

**Goals:**
- Tutta la logica che non riguarda la grafica sta in funzioni pure testabili: scomposizione, esito (critico, minaccia, fumble), soglia dei dadi visibili.
- La parte che disegna i dadi è sostituibile, per poter inserire i dadi 3D nella change successiva senza toccare sequenza, cronologia e chat.

**Non-Goals:**
- Dadi 3D, fisica, librerie di animazione.
- Mostrare la CD o la CA del bersaglio e dire se il tiro ha successo.
- Scomporre il danno delle armi, che resta un modificatore senza nome.
- Animare i tiri degli altri membri della lobby.
- Cambiare `isCrit` e `isFumble` nel messaggio di chat.

## Decisions

### D1. `RollRequest` con `parts` e `critRange`
```ts
interface RollPart { label: string; value: number }
interface RollRequest { label; numDice; dieType; modifier; parts?: RollPart[]; critRange?: number }
```
- **`rollParts(stat, baseLabel = 'Base')`** in `src/utils/rollReveal.ts` restituisce `[{ label: baseLabel, value: stat.base }, ...stat.applied.map(e => ({ label: e.source, value: e.value }))]` e scarta le voci a 0. La somma è uguale a `stat.total` per costruzione.
- **Attacchi iterativi**: aggiungono `{ label: 'Attacco iterativo', value: −5·i }`.
- **Coerenza**: se `Σ parts ≠ modifier` (dato incoerente), la rivelazione ignora le `parts` e mostra il modificatore senza nome. Così la scomposizione non può mai mostrare un totale diverso.
- *Alternativa scartata*: passare l'intero `Stat`. Legherebbe `RollRequest` al motore delle statistiche, e i tiri manuali non lo hanno.

### D2. La rivelazione è separata dal pannello
- `DiceRoller` continua a decidere il risultato. Per ogni tiro produce un `RevealData { label, dice, dieType, parts, modifier, total, outcome }` e lo passa a un nuovo componente `RollReveal`.
- `RollReveal` viene renderizzato **prima** del `if (!open) return null`, così la rivelazione funziona anche a pannello chiuso.
- Ogni tiro ha un `key` nuovo: un tiro successivo smonta la rivelazione precedente e ne monta un'altra, senza stato residuo.
- Lo strato visivo dei dadi è un componente `DiceStage({ dice, dieType, phase })`: la change C sostituirà solo questo.

### D3. Sequenza come piccola macchina a stati
```
spinning ──700ms──▶ landed ──▶ bonus[0] … bonus[n-1] (150ms l'una) ──▶ total ──1500ms──▶ chiusura
    └──────────────── tocco: salta a total ────────────────┘          tocco: chiude
```
- Un solo `useEffect` programma il passo successivo con `setTimeout` e lo pulisce allo smontaggio. Il CSS anima soltanto le transizioni fra uno stato e l'altro.
- **Numeri che scorrono**: durante `spinning` le facce mostrano valori casuali **solo visivi**, aggiornati circa ogni 60 ms. Non toccano mai il risultato.
- **Movimento ridotto**: con `matchMedia('(prefers-reduced-motion: reduce)')` si parte direttamente da `total`, senza keyframe.
- *Alternativa scartata*: una libreria di animazione (es. framer-motion). Aggiungerebbe circa 40 kB per poche transizioni.

### D4. Dadi SVG
- Una sagoma per tipo di dado: triangolo (d4), quadrato (d6), rombo (d8), aquilone (d10 e d100), pentagono (d12), esagono con triangolo interno (d20).
- Il colore è quello del personaggio (`--char-accent`) e il valore è al centro.
- Animazioni: rotazione con leggero tremolio durante `spinning`, rimbalzo (scale 1.2 → 1) all'atterraggio.
- `showDice(n) = n ≤ 5`. Oltre i 5 dadi, `DiceStage` mostra solo la lista dei valori, senza sagome.

### D5. Esito
- `rollOutcome(dice, dieType, critRange?)` restituisce un valore fra `'crit' | 'threat' | 'fumble' | null`, ed è definito solo per un singolo d20:
  - 20 → `crit`;
  - 1 → `fumble`;
  - valore ≥ `critRange` e < 20 → `threat`.
- **Effetti**: il critico ha un alone dorato pulsante e scintille fatte da 8 elementi CSS; la minaccia ha un alone più tenue con la scritta «Minaccia»; il fumble fa tremare il dado e scurisce il totale, con una «crepa» fatta da una linea SVG.
- La chat continua a ricevere gli `isCrit` e `isFumble` di oggi.

### D6. Impostazione
- **Dato**: `Character.diceAnimations?: boolean`, attiva quando vale `!== false`. Non serve migrazione, e i PG esistenti risultano attivi.
- **Pannello**: `CharacterCustomizationPanel` riceve `diceAnimations` e `onChangeDiceAnimations`, e mostra una checkbox «Animazioni dei dadi».
- **Uso**: `CharacterSheet` e `LobbySheetPanel` passano `animate={char.diceAnimations !== false}` a `DiceRoller`.

### D7. Overlay
- Sta sopra il pannello dadi (`z-index` più alto), copre lo schermo con uno sfondo semitrasparente e ha `role="status"` con `aria-live="polite"`. Lo screen reader legge «etichetta: totale».
- Un clic o tocco sull'overlay fa avanzare la sequenza (salta alla fine) o lo chiude. Anche Esc lo chiude.
- Mentre è aperto blocca i clic sottostanti; dura comunque al massimo circa 3 s.

## Risks / Trade-offs

- **[Rallenta il ritmo]**: catene di attacchi cliccate in rapida successione. → Ogni tiro sostituisce l'overlay precedente, il tocco salta o chiude, e l'impostazione per PG la disattiva.
- **[Scomposizione sbagliata]**: un totale incoerente fra i bonus mostrati e il risultato. → Controllo `Σ parts = modifier` con ricaduta sul modificatore senza nome, più un test su ogni punto che invia `parts`.
- **[Etichette lunghe]**: alcune fonti hanno nomi lunghi (es. «Mantello della Resistenza +3»). → L'etichetta va a capo e l'overlay è largo al massimo `min(92vw, 420px)`.
- **[Timer dopo lo smontaggio]**: un timer potrebbe scattare a componente già smontato. → Tutti i timer sono puliti nel cleanup dell'effect.

## Migration Plan

Il campo `diceAnimations` è opzionale e il suo valore assente vale «attivo»: non c'è migrazione. Per tornare indietro basta ripristinare il codice; il campo rimasto sui documenti viene ignorato.
