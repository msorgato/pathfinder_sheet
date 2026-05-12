## Context

`AttacksPanel.tsx` mostra già la catena di attacchi globale come due `div` statici (box "Mischia" e "Distanza"). Il pattern cliccabile è già stabilito nel progetto: `CombatStats.tsx` usa `RollableStat` con `onClick → onQuickRoll`, e i badge arma in `AttacksPanel` usano lo stesso pattern con `onQuickRoll?.({ label, numDice, dieType, modifier })`. Il `DiceRoller` riceve `RollRequest` via callback.

La catena ha potenzialmente più iterazioni (es. BAB 11 → `[11, 6, 1]`). I due box attuali mostrano il risultato come stringa unica ("+11/+6/+1"). Per rendere ogni iterazione cliccabile separatamente, è necessario scomporre la visualizzazione.

## Goals / Non-Goals

**Goals:**
- Ogni iterazione della catena di attacco (Mischia e Distanza) diventa un badge cliccabile che lancia `1d20 + bonus iterazione`.
- L'UX è coerente con i badge to-hit delle armi già presenti nel pannello.
- Nessuna nuova dipendenza, nessun dato persistito.

**Non-Goals:**
- Modifiche ad altri pannelli (CombatStats, BAB box rimane invariato).
- Gestione di modificatori aggiuntivi (es. talenti, incantesimi) sui tiri.
- Separazione dei badge in colonne per mischia vs distanza su schermi larghi.

## Decisions

### 1. Sostituire i due `div` statici con una riga di badge per iterazione

I box attuali mostrano la catena come stringa. La nuova struttura espande ogni iterazione in un badge `<button>` cliccabile, mantenendo la label "Mischia" / "Distanza" come intestazione sopra i badge.

*Alternativa scartata*: rendere l'intero box cliccabile (lancia solo il primo attacco). Meno precisa: il giocatore potrebbe voler tirare il secondo o terzo attacco della catena.

### 2. Stessa palette visiva dei badge arma esistenti

I badge arma to-hit usano `rgba(200,164,67,0.12)` con bordo `rgba(200,164,67,0.3)`. I nuovi badge catena globale usano la stessa palette per coerenza, con label "Att. 1", "Att. 2" ecc. come tooltip.

## Risks / Trade-offs

- **[Trade-off] Layout più verboso per catene lunghe (4 attacchi)**: Accettabile — su mobile scorrono in wrap. Il layout box 2-colonne attuale non scalava comunque bene per 4 valori in una stringa.
