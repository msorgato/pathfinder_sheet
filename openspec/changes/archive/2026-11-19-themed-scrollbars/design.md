# Design

## Context

- Il blocco attuale in [index.css](../../../src/index.css) usa solo pseudo-elementi `::-webkit-scrollbar*`, globali: 6 px, pista `--bg-deep`, thumb `--line-mid`/`--line-strong` con raggio 3 px.
- Le variabili `--line-mid` e `--line-strong` sono ridefinite per ogni tema (`sigil`, `astral`, `blood`), quindi usarle rende le scrollbar «a tema» senza logica aggiuntiva.
- Due elementi nascondono la scrollbar (`.status-chips`, `.tabs`); la colonna laterale della scheda dichiara `scrollbar-width: thin`.
- Nota di compatibilità: in Chrome/Edge 121+ impostare `scrollbar-width` o `scrollbar-color` su un elemento **disattiva** i suoi `::-webkit-scrollbar`. Non si possono quindi mescolare i due sistemi sullo stesso elemento.

## Goals / Non-Goals

**Goals:**
- Un aspetto unico, a tema, con hover su Chrome/Edge/Safari e un equivalente senza hover su Firefox.

**Non-Goals:**
- Scrollbar a comparsa personalizzate via JavaScript o librerie.
- Stile per i dispositivi touch (usano le scrollbar a scomparsa di sistema).

## Decisions

### 1. Due blocchi separati da `@supports`, mai mescolati
- Blocco WebKit/Blink: `::-webkit-scrollbar` 10 px con pista trasparente; thumb con `border: 3px solid transparent` + `background-clip: padding-box`, così appare largo 4 px con respiro dal bordo, raggio pieno; `:hover` e `:active` usano `--line-strong`.
- Blocco standard: `@supports not selector(::-webkit-scrollbar)` con `* { scrollbar-width: thin; scrollbar-color: var(--line-mid) transparent; }`, così lo vedono solo i browser senza i pseudo-elementi (Firefox) e Chrome non perde l'hover.
- **Alternativa scartata:** solo proprietà standard ovunque. Più corto, ma niente hover né respiro dal bordo, e `scrollbar-color` non accetta valori diversi per stato.

### 2. Colori dal tema, non fissi
Thumb a riposo `--line-mid`, in hover/trascinamento `--line-strong`. Sono già calibrati per gli sfondi `--bg-*` e `--surface-*` e cambiano con il tema. Su Firefox `--line-mid` è semitrasparente: `scrollbar-color` accetta colori con alpha, quindi resta uguale.

### 3. Si toglie `scrollbar-width: thin` dalla colonna laterale
Con il blocco globale la riga è ridondante e su Chrome disattiverebbe lo stile personalizzato proprio su quell'elemento. Il resto del foglio imposta `scrollbar-width` solo dove la scrollbar è nascosta (`none`), e quei casi restano.

### 4. Test sul foglio di stile
Un test legge `src/index.css` e verifica: nessun `scrollbar-width: thin` o `scrollbar-color` fuori dal blocco `@supports`; pista trasparente; colori presi da variabili di tema. L'aspetto resta da controllare a occhio.

## Risks / Trade-offs

- [Thumb largo 4 px troppo sottile da afferrare con il mouse] → l'area cliccabile è di 10 px (il bordo trasparente fa parte del thumb).
- [`@supports not selector(...)` non riconosciuto da browser molto vecchi] → ignorano la regola e mostrano le scrollbar di sistema, come prima su Firefox.
- [Un futuro `scrollbar-width` su un elemento spegnerebbe lo stile personalizzato in Chrome] → il test del punto 4 lo segnala.
