# Proposal

## Why

I testi dell'app risultano sottili, piccoli e poco leggibili, e i numeri delle statistiche hanno un aspetto «economico». Le cause sono tre:
- **I font scelti.** EB Garamond (testo) e Cormorant Garamond (titoli e numeri) hanno tratti sottilissimi e lettere minuscole basse, pensati per la stampa e i titoli grandi. Su uno schermo scuro, a 12–13 px, sembrano striminziti.
- **Le cifre.** Cormorant usa cifre «vecchio stile», con altezze irregolari: il 1 e il 4 sono più bassi del 6 e dell'8.
- **Le dimensioni.** `text-xs` (12 px) compare 233 volte, e circa 40 testi sono a 10–11 px.

L'obiettivo è uno stile riconoscibile «da manuale di gioco», più solido e leggibile.

## What Changes

**Nuovi font**
- **Literata** per tutto il testo e per i numeri. È un serif robusto, con lettere minuscole alte e dimensioni ottiche, cioè un disegno adatto ai corpi piccoli e uno ai titoli. Le cifre sono allineate e tabulari.
- **Cinzel** solo per titoli ed etichette brevi in maiuscolo, con spaziatura fra le lettere ridotta (da 0,28–0,32 em a circa 0,12–0,14 em).
- Via EB Garamond, Cormorant Garamond e i residui di Georgia.

**Font serviti dall'app**
- Literata e Cinzel sono inclusi nella build (pacchetti `@fontsource`) invece di essere scaricati da Google Fonts.
- Funzionano offline fin dal primo avvio, grazie alla cache della PWA.
- Nessuna richiesta a server di terzi, quindi nessun indirizzo IP inviato a Google.

**Scala delle dimensioni**
- Testo a 16 px, testo secondario mai sotto 13 px, etichette mai sotto 12 px.
- Le dimensioni piccole di Tailwind (`text-xs`, `text-sm`) vengono ridefinite in un punto solo, così crescono ovunque.
- Le dimensioni scritte a mano sotto i 12 px vengono riportate nella scala.

**Contrasto dei testi**
- Il colore dei testi secondari (`--ink-faint`) ha un contrasto di 2,0–2,6 : 1 sullo sfondo, contro il 4,5 : 1 richiesto dalle linee guida di accessibilità (WCAG AA). Anche il rosso dei valori negativi sta fra 3,3 e 4,1.
- I colori dei testi (primario, secondario, attenuato, tenue e rosso) vengono ricalcolati, per ciascuno dei tre temi, in modo da arrivare ad almeno 4,5 : 1 su tutti gli sfondi e le superfici, mantenendo la tinta di ogni tema.
- Le etichette colorate delle scuole di magia ricevono tinte più chiare per lo stesso motivo.
- Un test calcola i contrasti a partire dai colori del foglio di stile, così non possono tornare sotto soglia.

**Numeri dei dadi**
- I numeri dei dadi 3D, quelli dei dadi 2D e il totale della rivelazione usano Literata.

**Fuori da questa change**
- Spaziature, card, palette e altri ritocchi «più moderni» (qui cambia solo la leggibilità dei testi, non l'aspetto dei temi), da valutare dopo il cambio dei font.

## Capabilities

### New Capabilities
Nessuna.

### Modified Capabilities
- `design-system-2-0`:
  - le classi tipografiche cambiano font e dimensioni;
  - i colori dei testi rispettano un contrasto minimo;
  - il requisito sul caricamento da Google Fonts è sostituito dai font serviti dall'app;
  - si aggiungono la scala minima delle dimensioni e le cifre allineate.

## Impact

**Dipendenze**: `@fontsource-variable/literata` e `@fontsource-variable/cinzel`, entrambe con versione esatta.

**File**
- `index.html`: via i link a Google Fonts.
- `vite.config.ts`: via le regole di cache di Google Fonts.
- `src/index.css`:
  - variabili dei font;
  - classi `display-*`, `label-rune*` e `numeral`;
  - `@theme` di Tailwind per la scala;
  - stili dei dadi.
- Componenti con `fontSize` inferiori a 12 px o con `Georgia` scritto a mano.
- `src/components/dice3d/scene.ts`: font delle texture e attesa del caricamento del font.

**PWA**: i file dei font entrano nella precache, al posto delle richieste a Google.

**Firestore**: nessuna modifica.
