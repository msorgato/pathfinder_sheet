# Design

## Context

- **La rivelazione** (`RollReveal`) segue una sequenza di passi calcolata da `buildTimeline`: `spin` (700 ms), `land` (350 ms), un passo per bonus, `total`.
  - Lo stato `spinning` passa a `DiceStage`, che disegna le sagome SVG e i numeri che scorrono.
  - Un tocco salta all'ultimo passo.
  - Con «riduci movimento» si parte dall'ultimo passo.
- **Il risultato** (`dice`, `dieType`) è già noto quando la rivelazione si monta.
- **Ambiente**:
  - nessuna libreria 3D o audio fra le dipendenze;
  - i test girano in `node` senza DOM né WebGL;
  - la precache della PWA include tutti i `.js`.
- **L'overlay** è montato da `DiceRoller` in `CharacterSheet` e in `LobbySheetPanel`, con la prop `animate`, che corrisponde alla spunta del personaggio.

## Goals / Non-Goals

**Goals:**
- **Dadi convincenti.** Un lancio scenografico alla BG3, fluido anche su un telefono Android di fascia media.
- **Peso iniziale invariato.** La libreria 3D non pesa sul caricamento iniziale dell'app.
- **Codice condiviso.** Sequenza, bonus, totale e salto restano quelli di oggi; cambia solo lo «stage» dei dadi.
- **Test.** Geometria, numerazione delle facce e orientamento sul risultato sono verificati nei test.

**Non-Goals:**
- Fisica, tavolo, collisioni fra dadi.
- Mostrare la CD o il successo come in BG3.
- Dadi in 3D oltre i 5.
- Personalizzare materiale o texture dei dadi oltre al colore del personaggio.
- File audio, musica, controllo del volume oltre alla spunta.

## Decisions

### D1. `three` puro, caricato a richiesta
- **Versione**: `three@0.186.1`, con `@types/three@0.186.0` come dipendenza di sviluppo, entrambe con versione esatta.
- **Caricamento**: la scena sta in `src/components/dice3d/scene.ts` ed è importata solo con `import()`, così Vite la mette in un chunk separato.
- **Precaricamento**: avviene da `DiceRoller` quando `animate` è vero e il dispositivo supporta WebGL, nel primo momento di inattività (`requestIdleCallback`, con `setTimeout` come ripiego).
- *Alternative scartate*:
  - `@react-three/fiber` con `drei`: più codice e un modello a componenti che non serve per una scena di pochi oggetti;
  - `@3d-dice/dice-box`: BabylonJS con fisica in WASM, pesante, e controlla lui il risultato.

### D2. Geometrie e facce logiche
- **Solidi**: d4, d6, d8, d12 e d20 usano i solidi di `three` (tetraedro, cubo, ottaedro, dodecaedro, icosaedro). Il d10 è un **trapezoedro pentagonale** costruito a mano: 10 facce a forma di aquilone, ciascuna fatta di 2 triangoli.
- **Facce logiche**: `logicalFaces(geometry)` raggruppa i triangoli per normale (stessa direzione entro una tolleranza) e restituisce per ogni faccia il centro, la normale e una direzione «su» nel piano della faccia. In questo modo il dodecaedro (36 triangoli) ha 12 facce, e il d10 ne ha 10.
- **Etichette**:
  - d4–d20 da 1 a N;
  - d10 da 1 a 10;
  - d100: un d10 «decine» (00, 10 … 90) e un d10 «unità» (0 … 9).
  - 6 e 9 sono sottolineati.
  - Il d4 mostra il numero al centro della faccia, non sui vertici come i d4 da tavolo, per leggibilità.

### D3. Numeri sulle facce
- **Texture**: un'immagine per tipo di dado, generata con un canvas 2D. È una griglia di riquadri, uno per faccia, con il numero in serif grassetto.
- **Coordinate**: le coordinate texture di ogni faccia si ottengono proiettando i vertici sul piano della faccia, con la base (destra, su) di D2, così il numero sta dritto rispetto a «su».
- **Cache**: le texture sono conservate per `(dieType, colore)`.

### D4. Orientamento sul risultato
- **`restingQuaternion(face)`**: la rotazione che porta la normale della faccia verso la telecamera (+Z) e il suo «su» verso +Y. È costruita dalle due basi ortonormali, è una funzione pura e si può testare in node.
- **d100**: `splitPercentile(v)` restituisce `{ tens, units }`.
  - 100 → 00 e 0;
  - 47 → 40 e 7;
  - 5 → 00 e 5.

### D5. Animazione del lancio
Durata `SPIN_3D_MS = 1300` ms. Per ogni dado:
- **Posizione**: un arco da sotto lo schermo al centro, con la scala che passa da 0,6 a 1.
- **Rotazione**: `slerp` fra una rotazione libera (asse casuale, velocità che cala) e `restingQuaternion`, con peso `easeOutCubic(t)`. Alla fine c'è un piccolo assestamento smorzato di circa 120 ms.
- **Più dadi**: sono disposti in fila e partono a 70 ms l'uno dall'altro.
- **Dopo l'arresto**:
  - critico: emissivo dorato pulsante più una luce puntiforme;
  - fumble: tinta rossa e un breve tremolio.

`buildTimeline(data, { spinMs })` accetta la durata del lancio: `SPIN_MS` per il 2D, `SPIN_3D_MS` per il 3D. La scelta fra 2D e 3D si fa **una volta**, al montaggio della rivelazione.

### D6. Componenti e ripiego
- **Scena**: `createDiceScene(canvas, { onError })` restituisce `{ play(dice, dieType, color, outcome, spinMs), finish(), dispose() }`.
- **`Dice3DStage`** è un componente React con le stesse prop di `DiceStage`:
  - monta un canvas trasparente (larghezza della scheda, 220 px di altezza);
  - chiama `play` al montaggio e `finish` quando `spinning` diventa falso per un salto;
  - chiama `dispose` allo smontaggio.
- **Scelta in `RollReveal`**: si usa il 3D se `dice3DReady()` (modulo caricato e WebGL disponibile), se il movimento non è ridotto e se ci sono al massimo 5 dadi. Altrimenti si usa `DiceStage`.
- **Errori**: se `onError` scatta (per esempio per la perdita del contesto WebGL), lo stage passa a `DiceStage` per quel tiro e il 3D viene disattivato per la sessione.

### D7. Prestazioni e risorse
- **Rendering**: rapporto pixel limitato a 2, nessuna ombra, materiali `MeshStandardMaterial` con una luce ambientale e due direzionali. Il ciclo `requestAnimationFrame` è attivo solo durante il lancio e il bagliore.
- **Rilascio**: un solo renderer per overlay. Allo smontaggio si liberano geometrie, materiali e renderer, e si chiama `forceContextLoss()`, perché i telefoni hanno pochi contesti WebGL.
- **Riutilizzo**: le texture in cache (D3) sono riutilizzate fra un overlay e l'altro.

### D8. Suoni in `src/lib/diceSounds.ts`
- **Sintesi**: Web Audio, senza file. Un `AudioContext` condiviso viene creato al primo suono, che parte sempre dal gesto del tiro.
  - **Rotolamento**: brevi colpi di rumore filtrato con frequenza decrescente per la durata del lancio.
  - **Arresto**: un tonfo (sinusoide bassa più un colpo di rumore).
  - **Critico**: un arpeggio luminoso.
  - **Fumble**: un tono discendente.
- **Volume**: 0,25.
- **API**: `playRoll(ms)` restituisce `stop()`; poi `playLand()` e `playOutcome(kind)`.
- **Chi suona**: `RollReveal` riceve la prop `sound` e suona nei passaggi di stato: `spin` avvia il rotolamento, `land` l'arresto, `total` l'esito. Un salto chiama `stop()` e suona subito l'arresto.
- **Impostazione**: `Character.diceSounds` vale come attiva quando è `!== false`. La spunta «Suoni dei dadi» in `CharacterCustomizationPanel` è disattivata quando le animazioni sono spente. `DiceRoller` riceve `sound`, che vale `animate && diceSounds !== false`.

## Risks / Trade-offs

- **[Peso di `three`]** Circa 150 kB compressi in più nella precache della PWA. → È un chunk separato, scaricato una volta, e mantiene lo stesso nome finché la libreria non cambia, quindi non si riscarica a ogni rilascio.
- **[Telefoni lenti]** → Pochi poligoni, niente ombre, rapporto pixel limitato e lancio di 1,3 s. Se il primo tiro non riesce a mostrare i fotogrammi, il ripiego 2D resta disponibile in caso di errore. La prova a mano è sul telefono reale.
- **[Numeri poco leggibili su d20 e d4 piccoli]** → Riquadri della texture da 128 px, dado più grande quando è da solo, e il valore resta comunque scritto nel totale.
- **[Suoni non voluti]** Il browser non conosce l'interruttore del silenzioso. → Spunta per personaggio; i suoni partono solo dopo il gesto del tiro, mai da soli.
- **[Perdita del contesto WebGL]** → Ripiego 2D per il tiro e 3D disattivato per la sessione.
- **[Non verificabile nei test]** Mancano WebGL e Web Audio. → Le funzioni matematiche pure sono testate con `three` in node; la scena e i suoni si provano a mano.

## Migration Plan

- Il campo nuovo è opzionale e assente vale attivo.
- Nessun dato da migrare.
- Per tornare indietro basta rimuovere la scelta del 3D in `RollReveal`: il 2D è intatto.
