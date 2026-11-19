# Design

## Context

- [CharacterSheet.tsx](../../../src/pages/CharacterSheet.tsx) rende header, barra delle tab e un contenitore `flex-1 overflow-y-auto p-4 max-w-2xl mx-auto`. La tab Combattimento impila `AbilityPanel`, `HitPointsPanel`, `StatusPanel`, `CombatStats`, `AttacksPanel`, `ConsumablesSection`.
- La pagina scorre sul `body`: il contenitore ha `overflow-y-auto` ma nessuna altezza vincolata, quindi di fatto non è un'area di scorrimento propria. Questo conta per `position: sticky`.
- Le regole responsive dei pannelli sono media query sulla finestra (`max-width: 680px`, `max-width: 1024px` in `src/index.css`). Su desktop i pannelli finiranno in contenitori stretti (colonna laterale ~380 px, colonne di ~400 px) pur con la finestra larga, quindi le media query sulla finestra non bastano.
- Tailwind 4 è già in uso: supporta nativamente le container query (`@container`, `@lg:` ecc.), e i browser target le supportano.
- La lobby usa già `lg` (1024 px) come soglia desktop: la scheda si allinea a quella.
- I test di rendering usano `renderToString` (nessun DOM, nessun `matchMedia`).

## Goals / Non-Goals

**Goals:**
- Una sola fonte di verità per la soglia desktop (1024 px) e per la soglia «due colonne» dell'area principale (760 px di contenitore).
- Pannelli che si adattano alla larghezza del contenitore in cui stanno, non a quella della finestra.
- Resa mobile identica, pixel per pixel, a quella attuale.

**Non-Goals:**
- Riscrivere i pannelli o il loro stile visivo.
- Layout a tre colonne nell'area principale (si può valutare dopo, sulla stessa base).
- Cambiare `LobbySheetPanel`, che resta con le sue tab.

## Decisions

### 1. Un hook `useIsDesktop()` sceglie il layout, non il CSS da solo
`CharacterSheet` decide in JavaScript quale struttura rendere, con un hook basato su `matchMedia('(min-width: 1024px)')` e `useSyncExternalStore` (valore lato server/test: `false`, cioè mobile).

- **Perché:** con il solo CSS bisognerebbe rendere due volte i pannelli della colonna laterale (una copia per la tab Combattimento mobile, una per la colonna desktop, nascondendone una). Quei pannelli hanno stato locale (input danno/cura dei PF, aperture dei dettagli ±) e gestori dei tiri rapidi: due istanze vive significano stato divergente e lavoro doppio.
- **Alternativa scartata:** `hidden lg:block` / `lg:hidden` come nella lobby. Va bene per la lobby, dove le due versioni non condividono componenti con stato; qui no.
- **Costo:** attraversando la soglia i pannelli si rimontano e perdono lo stato locale (es. un valore di danno non ancora applicato). Lo stato della tab attiva vive in `CharacterSheet` e si conserva, come richiesto dalla spec.

### 2. Struttura desktop: griglia a due colonne, sidebar sticky
Sotto l'header (che resta a tutta larghezza, con il contenuto interno allineato alla stessa larghezza massima):

```
.sheet-desktop         grid; columns: var(--sheet-sidebar-w) minmax(0,1fr); gap 24px;
                       max-width 1600px; margin-inline auto; padding 24px
  aside.sheet-sidebar  position sticky; top 16px; max-height calc(100dvh - 32px);
                       overflow-y auto; container-type inline-size
  main.sheet-main      container-type inline-size
    nav.sheet-tabs     position sticky; top 0; z-index sopra i pannelli; sfondo opaco
    .sheet-tab-body
```

- `--sheet-sidebar-w`: 380 px, 420 px da 1440 px di finestra. Con 380 px la griglia 3×2 delle caratteristiche sta comoda (tile ≈ 110 px).
- Il contenitore della tab perde `overflow-y-auto` su desktop: un antenato con overflow romperebbe `sticky` sia della sidebar sia della barra delle tab. Lo scorrimento resta quello della pagina.
- **Alternativa scartata:** sidebar e main come due aree a scorrimento indipendente ad altezza `100dvh`. Più «da app», ma l'header della scheda non scorrerebbe via e su schermi bassi lo spazio utile si riduce troppo.

### 3. Container query per i pannelli, non media query
- Sidebar e main dichiarano `container-type: inline-size` (nomi `sidebar` e `sheet-main`).
- Le regole «compatte» oggi legate a `@media (max-width: 680px)` che servono anche in colonna stretta vengono estese a `@container sidebar (max-width: 440px)` — in particolare la lista CA/TS di `CombatStats` (`.ac-group` a righe) e `.ability-full` nascosta in `AbilityPanel`. Le media query esistenti restano, così mobile non cambia.
- Le due colonne dell'area principale scattano con `@container sheet-main (min-width: 760px)`. Con sidebar da 380 px e padding, il main supera 760 px da circa 1210 px di finestra: fra 1024 e ~1210 resta una colonna, come da spec.
- **Alternativa scartata:** media query sulla finestra a 1280 px. Accoppierebbe i pannelli alla larghezza della sidebar e si romperebbe se in futuro la si allarga o la si nasconde.

### 4. Due colonne per tab: classi di layout, ordine del DOM invariato
Una classe condivisa `.sheet-cols` (grid, 1 colonna; 2 colonne con la container query) con figli `.sheet-col` (flex column, gap 16 px). Ogni tab mette i suoi blocchi nella colonna sinistra o destra **nell'ordine mobile**, così su mobile la lettura è identica e non serve `order` CSS.

| Tab | Colonna sinistra | Colonna destra |
|---|---|---|
| Combattimento (desktop) | Attacchi | Condizioni ed effetti, Consumabili |
| Equipaggiamento | riepilogo, avvisi, azioni, indossati | trasportati, monete, competenze |
| Abilità | prima metà elenco | seconda metà elenco |
| Incantesimi | blocchi livello (riempimento a griglia) | |
| Capacità | Capacità di classe | Talenti |
| Note | Note | Dettagli, Background |

- **Combattimento:** la composizione dipende dal layout (decisione 1): mobile rende la sequenza completa di oggi; desktop rende solo `AttacksPanel` + `StatusPanel` + `ConsumablesSection` in `.sheet-cols`. Su mobile `StatusPanel` sta fra PF e CombatStats, ordine che resta invariato.
- **Equipaggiamento:** `EquipmentPanel` è un unico `pf-panel`. Si avvolgono i due gruppi di contenuto in due `div.sheet-col` dentro un `div.sheet-cols`; i modali restano fuori dalla griglia. Il pannello unico diventa, su desktop largo, un pannello con due colonne interne: niente split in due card, per non cambiare l'aspetto su mobile.
- **Abilità:** l'elenco filtrato viene diviso in due metà (`Math.ceil(n/2)`), riempiendo per colonna (lettura alfabetica dall'alto in basso a sinistra, poi a destra). Ogni metà ha la propria riga d'intestazione. Su colonna singola le due metà sono una sotto l'altra e la seconda intestazione viene nascosta con la container query, così il risultato coincide con l'elenco di oggi. Ricerca e filtri restano sopra, a tutta larghezza.
- **Incantesimi:** i contenitori `space-y-3` dei blocchi per livello diventano una griglia `.sheet-grid-auto` (1 colonna; 2 con la container query, `align-items: start`). Il riepilogo dell'incantatore resta sopra a tutta larghezza. `SpellsPanel` è grande (≈600 righe): si tocca solo il contenitore dei blocchi, non i blocchi.
- **Capacità:** `FeaturesPanel` riceve la larghezza disponibile tramite container query lato CSS; serve però sapere in JS se nascondere le sotto-tab. Si usa un piccolo hook `useContainerWide(ref, 760)` basato su `ResizeObserver` (valore iniziale `false`, quindi sotto-tab nel render server/test). Se largo: due colonne con titoli «Capacità di Classe» e «Talenti (n)», senza bottoni.

### 5. Barra delle tab
Stesso componente/markup di oggi, spostato dentro `main.sheet-main` su desktop e reso sticky con sfondo `var(--bg-elev)`. Su mobile resta dov'è e non diventa sticky (non è richiesto e cambierebbe la resa).

### 6. Testabilità
`CharacterSheet` estrae il corpo in un componente `SheetBody` con prop `layout: 'mobile' | 'desktop'`. I test di rendering (`renderToString`) chiamano `SheetBody` in entrambe le modalità senza dover simulare `matchMedia`. Il comportamento delle container query è solo CSS e si verifica a mano nel browser.

## Risks / Trade-offs

- [Pannelli che si rimontano attraversando 1024 px] → Accettato: è un evento raro (ridimensionamento finestra); la tab attiva si conserva.
- [La sidebar sticky con `max-height` crea una seconda barra di scorrimento su schermi bassi] → Accettato e richiesto dalla spec; scrollbar sottile con lo stile già usato nell'app.
- [`CombatStats` in 380 px potrebbe stringere le griglie 3 colonne (TS, manovre)] → Le regole compatte vengono estese alla container query della sidebar (decisione 3); verifica visiva a 1024 e 1440 px.
- [Overlap delle regole `max-width: 1024px` esistenti con `min-width: 1024px` a esattamente 1024 px] → Le regole tablet esistenti riguardano classi che la scheda non usa (`.sheet-grid`, `.identity`, `.combat-grid`); controllare che nessuna nuova classe ne collida, e non riusare quei nomi.
- [Disallineamento in altezza fra le colonne (es. Attacchi molto lungo, Consumabili corto)] → `align-items: start`; nessun tentativo di bilanciamento tipo masonry.
- [`ResizeObserver` assente nell'ambiente di test] → L'hook lo usa solo in `useEffect`, che `renderToString` non esegue.

## Migration Plan

Solo frontend, nessun dato coinvolto. Il rilascio passa dalla normale build PWA; rollback = revert del commit.
