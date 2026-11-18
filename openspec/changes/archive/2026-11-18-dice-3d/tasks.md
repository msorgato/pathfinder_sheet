# Tasks

## 1. Base

- [x] 1.1 Installare `three@0.186.1` e `@types/three@0.186.0` (dev) con versione esatta. Aggiungere `Character.diceSounds?: boolean`. Aggiungere `spinMs` a `buildTimeline` (predefinito `SPIN_MS`) e `SPIN_3D_MS`. Verificare con `npx tsc -b` e un test: con `spinMs: 1300` il passo `spin` dura 1300 ms, senza opzioni 700 ms.

## 2. Geometria e orientamento (pure, testate con `three` in node)

- [x] 2.1 Creare `src/components/dice3d/geometry.ts` con:
  - il trapezoedro pentagonale del d10;
  - `dieGeometry(dieType)`;
  - `logicalFaces(geometry)` (centro, normale, «su»);
  - `faceLabels(dieType, role)` (normale, decine, unità del d100);
  - `splitPercentile(v)`.
  Verificare con test:
  - le facce logiche sono 4, 6, 8, 10, 12 e 20;
  - le normali sono di lunghezza 1, e il «su» è ortogonale alla normale;
  - le etichette del d100 sono decine 00–90 e unità 0–9;
  - `splitPercentile`: 47 → 40 e 7, 100 → 00 e 0, 5 → 00 e 5, 40 → 40 e 0.
- [x] 2.2 Creare `restingQuaternion(face)` in `src/components/dice3d/orientation.ts`. Verificare con un test: per ogni faccia di ogni dado, la normale ruotata coincide con +Z e il «su» ruotato con +Y, entro 1e-6.

## 3. Scena e integrazione

- [x] 3.1 Creare `src/components/dice3d/scene.ts` (`createDiceScene`):
  - renderer trasparente, luci, materiali con il colore del personaggio;
  - texture numerate in cache;
  - lancio ad arco con `slerp` verso `restingQuaternion` e assestamento;
  - effetti di critico e fumble;
  - `finish`, `dispose` con `forceContextLoss` e `onError` su perdita del contesto.
  Verificare con `npx tsc -b` e `npm run build`: `three` sta in un chunk separato e non nel bundle principale.
- [x] 3.2 Creare `Dice3DStage` e collegarlo a `RollReveal`:
  - `dice3DReady()` e `preloadDice3D()`, con il precaricamento in `DiceRoller`;
  - scelta 3D o 2D al montaggio della rivelazione, con il timeline `spinMs`;
  - ripiego su errore, con il 3D disattivato per la sessione;
  - movimento ridotto → 2D.
  Verificare con smoke test: senza WebGL (rendering lato server) la rivelazione usa le sagome 2D con gli stessi valori, bonus e totale; con «riduci movimento» non si monta nessun canvas.

## 4. Suoni e impostazione

- [x] 4.1 Creare `src/lib/diceSounds.ts` con `playRoll`/`stop`, `playLand` e `playOutcome`, e collegarlo ai passaggi di stato di `RollReveal` tramite la prop `sound`, con lo stop al salto. Aggiungere la spunta «Suoni dei dadi» (disattivata se le animazioni sono spente) in `CharacterCustomizationPanel`, collegata in `CharacterSheet`. Passare `sound` da `CharacterSheet` e `LobbySheetPanel`. Verificare con smoke test: la spunta è selezionata di default e deselezionata con `diceSounds: false`, ed è disabilitata con `diceAnimations: false`.

## 5. Verifica d'insieme

- [x] 5.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`. Annotare la dimensione del chunk di `three`.
- [x] 5.2 Provare sul dev server, su desktop e su un telefono Android:
  - d4, d6, d8, d10, d12 e d20 si fermano sulla faccia giusta e leggibile;
  - 1d100 (per esempio 47) mostra 40 e 7;
  - 3d6 in fila;
  - 10d6 solo con i valori;
  - critico e fumble;
  - salto con un tocco;
  - fluidità sul telefono;
  - suoni attivi e disattivati;
  - ripiego 2D con WebGL disabilitato e con «riduci movimento»;
  - primo tiro mentre il 3D si carica;
  - tiro offline dopo il primo caricamento.

## Workflow follow-up

- Archiviare la change con `/opsx:archive` dopo la verifica dell'utente.
