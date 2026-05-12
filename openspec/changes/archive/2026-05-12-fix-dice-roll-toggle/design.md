## Context

`DiceRoller` (`src/components/sheet/DiceRoller.tsx`) renderizza un `<div className="fixed inset-0 z-40" onClick={onClose} />` prima del pannello. Questo div invisibile copre l'intera viewport a z-40. Il contenuto principale della pagina (pannelli, bottoni d'attacco, abilità) non ha z-index esplicito, quindi è a z-auto (< z-40). Di conseguenza, ogni click sulla pagina mentre il pannello è aperto viene intercettato dal backdrop e chiama `onClose()` invece di raggiungere il bottone sottostante.

## Goals / Non-Goals

**Goals:**
- I bottoni di tiro (attacco, abilità, tiri salvezza, ecc.) devono funzionare sempre, anche con il pannello aperto
- Il pannello rimane aperto finché l'utente non lo chiude esplicitamente

**Non-Goals:**
- Non si introduce "click outside to close" alternativo (es. via `useEffect` + `document` event listener)
- Non si modifica la logica di roll o la struttura del DiceRoller

## Decisions

**Rimozione del backdrop**: eliminare il `<div className="fixed inset-0 z-40" onClick={onClose} />`. Il pannello si chiude via:
- Pulsante ✕ nell'header del pannello (già presente)
- Bottone floating 🎲 che fa toggle (già implementato in `CharacterSheet`)

Alternativa considerata: sostituire il backdrop con un listener su `document` che ignora i click sui bottoni roll. Scartata perché richiede un meccanismo di "whitelist" dei target e accoppia DiceRoller alla struttura del DOM circostante.

Alternativa considerata: alzare il z-index dei bottoni roll a > 40. Scartata perché creerebbe conflitti di stacking context con altri overlay (modal, tooltip).

## Risks / Trade-offs

- [Nessun click-outside-to-close] → l'utente deve usare ✕ o il bottone 🎲 per chiudere. Per un'app da tavolo (character sheet) questo è accettabile e meno fonte di chiusure accidentali
- [Pannello rimane aperto a lungo] → nessun impatto funzionale; lo storico dei tiri rimane accessibile
