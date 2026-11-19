# Design

## Context

- **Font**:
  - `index.html` carica da Google Fonts Cinzel, Cormorant Garamond ed EB Garamond;
  - `vite.config.ts` ha due regole di cache del service worker per `fonts.googleapis.com` e `fonts.gstatic.com`.
- **Variabili** in `src/index.css`:
  - `--font-display` (Cormorant), `--font-body` (EB Garamond), `--font-rune` (Cinzel), `--font-mono` (JetBrains Mono, non caricato) e `--font-uncial` (non usato);
  - il `body` usa `--font-body` a 16 px con peso 600, aggiunto in passato per irrobustire EB Garamond.
- **Classi**:
  - `.display-*` in Cormorant corsivo;
  - `.label-rune` e `.label-rune-soft` in Cinzel a 13 e 12 px con spaziatura 0,28–0,32 em;
  - `.numeral` in Cormorant.
- **Dimensioni**:
  - Tailwind v4 (`@import "tailwindcss"`) con 233 usi di `text-xs` e 152 di `text-sm`;
  - nel CSS ci sono 11 regole a 10–11 px;
  - nei componenti ci sono 7 `fontSize` a 10–11 px e diversi `fontFamily: 'Georgia'`.
- **Dadi**: le texture dei dadi 3D sono disegnate su canvas con `Georgia`, e così anche `.die-value` e `.roll-reveal-total`.
- **Lo spec `design-system-2-0`** impone i font e le dimensioni attuali.

## Goals / Non-Goals

**Goals:**
- Testo solido e leggibile su schermo scuro, anche su telefono, con un carattere «da manuale».
- Un cambio concentrato in poche variabili e classi, non sparso nei componenti.
- Nessuna dipendenza da server di terzi per i font, e font disponibili offline.

**Non-Goals:**
- Spaziature, card, colori, layout: da valutare in una change successiva.
- Rifare il layout dei componenti che si allargheranno con i testi più grandi, salvo i casi che si rompono, per esempio testi che vanno a capo dentro i badge.
- Cambiare il font monospaziato.

## Decisions

### D1. Font e pacchetti
- **Pacchetti**: `@fontsource-variable/literata@5.3.0` e `@fontsource-variable/cinzel@5.3.0`, con versione esatta e font variabili (un solo file per tutti i pesi).
- **Import**: da `src/main.tsx`, con il solo sottoinsieme di caratteri latino (`latin` e `latin-ext` se il pacchetto li separa). Se il pacchetto espone solo il CSS completo, si escludono gli altri sottoinsiemi dalla precache con `globIgnores`.
- **Dimensioni ottiche di Literata**: si usa l'asse `opsz` con `font-optical-sizing: auto`, se il pacchetto lo include; altrimenti va bene il solo `wght`.
- **Pulizia**: via i link a Google Fonts da `index.html` e le due regole di cache da `vite.config.ts`. I file `woff2` sono già compresi nel filtro della precache.
- *Alternative scartate*:
  - continuare con Google Fonts: offline non funziona al primo avvio, e serve una richiesta a terzi;
  - copiare a mano i file `woff2`: senza pacchetto si perde la possibilità di aggiornarli.

### D2. Variabili e classi
```css
--font-body:    "Literata Variable", Literata, Georgia, serif;
--font-display: "Literata Variable", Literata, Georgia, serif;   /* numeri e titoli in linea */
--font-rune:    "Cinzel Variable", Cinzel, serif;                /* titoli ed etichette maiuscole */
```
- **Corpo**: `body` usa 16 px, peso 450, `font-optical-sizing: auto` e `font-variant-numeric: lining-nums`.
- **Titoli**: `.display-xl`, `.display-l` e `.display-m` usano `--font-rune`, non in corsivo (Cinzel non ha il corsivo), con peso 600–700 e spaziatura 0,02–0,04 em.
- **Etichette**: `.label-rune` è a 13 px con spaziatura 0,14 em; `.label-rune-soft` a 12 px con 0,12 em.
- **Numeri**: `.numeral` usa `--font-display` con `font-variant-numeric: lining-nums tabular-nums`.
- Si elimina `--font-uncial`, che non è usato.
- *Alternativa scartata*: introdurre una variabile `--font-title` nuova. Ridefinire `--font-display` come Literata, e usare `--font-rune` per i titoli, sposta tutto senza toccare i componenti che già usano le variabili.

### D3. Scala delle dimensioni
Ridefinizione in `@theme` di Tailwind:
- `--text-xs` = 13 px (prima 12), interlinea 1.35;
- `--text-sm` = 15 px (prima 14), interlinea 1.45.

Le altre classi restano come sono. Poi:
- le regole CSS a 10–11 px salgono a 12 px per le etichette in maiuscolo e a 13 px per il testo;
- i `fontSize` scritti a mano a 10–11 px nei componenti seguono la stessa regola.

### D4. Verifica automatica della scala
Un test cerca nel codice:
- `font-size: Npx` e `fontSize: N` con N < 12;
- `text-[Npx]` con N < 12;
- `fontFamily` o `font-family` con `Georgia` fuori dalle variabili dei font.

Lo stesso test verifica che `index.html` e `vite.config.ts` non contengano `fonts.googleapis` o `fonts.gstatic`.

### D5. Dadi
- **CSS**: `.die-value` e `.roll-reveal-total` usano `--font-display`.
- **Texture 3D**: in `scene.ts` sono disegnate con `"Literata Variable"`. Prima di disegnare la prima texture si attende `document.fonts.load('700 48px "Literata Variable"')`, con un limite di 1,5 s: se scade si disegna con il font di riserva, e quella texture non va in cache, così il tiro successivo la ridisegna con il font giusto.
- *Alternativa scartata*: precaricare il font all'avvio dell'app. Servirebbe solo ai dadi; l'attesa nella scena è più semplice e circoscritta.

### D6. Verifica visiva
- Il risultato si controlla a occhio con un banco di prova temporaneo, nello stesso modo usato per i dadi 3D: una pagina Vite che monta pannelli reali (caratteristiche, combattimento, abilità, attacchi, inventario, rivelazione del tiro) con un personaggio di prova.
- Le immagini si catturano con Chrome headless, a 390 px (telefono) e a 1024 px. Si confrontano con le stesse catture fatte prima della modifica.
- Il banco di prova si cancella alla fine.

### D7. Contrasto
- **Misure di partenza** (rapporto con lo sfondo di una card): `--ink-faint` 2,0–2,6 : 1, `--ink-mute` 4,6–5,7 : 1, `--blood` 3,3–4,1 : 1.
- **Colori del testo**: per ciascun tema `--ink-faint` prende il valore che aveva `--ink-mute` (adattato per arrivare ad almeno 4,6 : 1 su tutte le superfici) e `--ink-mute` sale a circa 7 : 1. `--ink` e `--ink-soft` restano. La gerarchia resta di quattro livelli distinti. La tinta di ogni tema non cambia: si alza solo la luminosità.
- **Rosso**: nasce un token `--blood-text` (circa `#e65f5f`), usato dove il rosso è testo; `--blood` resta com'è per i riempimenti e i bordi (bottoni, barre).
- **Colori delle scuole**: nei tre file che li definiscono, `#3b82f6`, `#6366f1` e `#a855f7` passano a `#60a5fa`, `#818cf8` e `#c084fc`.
- **Sicurezza del cambio**: `--ink-faint` e `--ink-mute` non sono mai usati come bordo o sfondo, solo come colore del testo, quindi schiarirli non altera bordi e riempimenti.
- **Test**: calcola il rapporto WCAG fra i token del testo e quelli degli sfondi, leggendoli da `index.css`, per i tre temi.
- *Alternativa scartata*: schiarire i soli testi più piccoli. Il problema è nel token, e lo stesso testo appare in molti punti.

## Risks / Trade-offs

- **[Testi più larghi]** Literata e le dimensioni più grandi allargano i testi: badge, tile delle statistiche e righe della catena di attacchi possono andare a capo o traboccare. → Lo si controlla con le catture di D6; si correggono solo i casi rotti, il resto è per la change sul layout.
- **[Peso dei font]** Due font variabili, solo latini, pesano circa 150–250 kB in `woff2` nella precache. In compenso spariscono le richieste a Google, e i font restano in cache fra un rilascio e l'altro.
- **[Testo durante il caricamento]** Senza `font-display: block` il testo appare prima con il font di riserva e poi cambia, al primo avvio. → `swap` (il default di Fontsource) con Georgia come riserva, che ha proporzioni simili; dal secondo avvio i font sono in cache.
- **[Cinzel nei titoli lunghi]** Cinzel è tutto maiuscolo e largo: i nomi lunghi dei personaggi possono andare a capo. → Peso e spaziatura moderati, verificati nelle catture.
- **[Spec divergenti]** I valori scritti nello spec `design-system-2-0` (Cormorant, 11/10 px) saranno sostituiti al momento dell'archiviazione.

## Migration Plan

Nessun dato da migrare. Il cambio è solo nel codice. Per tornare indietro basta ripristinare variabili e classi e ricaricare i font da Google.
