# Proposal

## Why

La rivelazione del tiro (`dice-roll-reveal`) ha già una buona sequenza: dadi, poi bonus con il nome, poi totale. I dadi però sono sagome SVG piatte. L'obiettivo dichiarato dall'inizio era un effetto «alla Baldur's Gate 3»: un dado vero, tridimensionale, che vola, gira e si ferma sul risultato. La change precedente aveva già isolato la parte che disegna i dadi proprio per poterla sostituire con il 3D.

## What Changes

**Dadi in 3D nella rivelazione**
- Al posto delle sagome SVG compare una scena 3D con i dadi veri: d4, d6, d8, d10, d12 e d20. Il d100 è rappresentato da due d10, uno per le decine e uno per le unità.
- **Lancio scenografico, come in BG3**, senza tavolo né fisica: i dadi entrano in volo, ruotano e rallentano fino a fermarsi con la faccia del risultato rivolta verso chi guarda.
- Il risultato è sempre deciso prima, come oggi: l'animazione lo mette solo in scena.
- **Fino a 5 dadi** sono in 3D. Oltre i 5 restano solo i valori, come oggi.
- **Aspetto:** il colore dei dadi è quello del personaggio. Il critico ha un bagliore dorato, il fumble un'ombra rossa.
- Bonus con il nome, totale, critico, minaccia, fumble, salto e chiusura restano quelli attuali.

**Il 2D come riserva**
- L'animazione SVG attuale si usa solo:
  - mentre la scena 3D si carica, la prima volta;
  - quando il dispositivo non supporta la grafica 3D (WebGL);
  - con «riduci movimento» attivo.
- La spunta «Animazioni dei dadi» del personaggio continua a decidere se l'animazione c'è o no.

**Suono del dado**
- Un breve suono di dadi che rotolano e si fermano, più un suono per il critico e uno per il fumble.
- Nuova spunta «Suoni dei dadi» nelle impostazioni del personaggio, attiva di default.
- I suoni sono generati dal browser, senza file audio da scaricare.

**Prestazioni**
- La libreria 3D si scarica separatamente, al primo tiro animato, e resta disponibile offline dopo il primo download.
- La scena esiste solo mentre l'overlay è aperto.

## Capabilities

### New Capabilities
Nessuna.

### Modified Capabilities
- `dice-roll-reveal`: si aggiungono la presentazione 3D dei dadi, l'uso del 2D come riserva e i suoni del dado con la loro impostazione.

## Impact

**Dipendenze**: `three` (versione fissata), caricata solo quando serve.

**Tipi**: `Character` riceve `diceSounds?: boolean`, dove un valore assente vale attivo.

**Codice**
- Nuova cartella `src/components/dice3d/` con scena, geometrie, facce numerate e orientamento sul risultato.
- Nuovo `src/lib/diceSounds.ts`.
- `RollReveal` sceglie fra scena 3D e `DiceStage` 2D.
- `buildTimeline` accetta una durata del lancio diversa per il 3D.
- `CharacterCustomizationPanel` riceve la nuova spunta, e `CharacterSheet` e `LobbySheetPanel` passano il valore.

**PWA**: un file JavaScript in più nella precache.

**Firestore**: un campo opzionale nuovo, senza modifiche alle regole.
