# Proposal

## Why

Le scrollbar del portale sono il residuo di uno stile più vecchio: sono sottili (6 px) ma con una pista piena di colore `--bg-deep`, che su pannelli, modali e colonna laterale appare come una striscia scura incollata al bordo, e hanno angoli quasi vivi in un'interfaccia fatta di angoli morbidi. Inoltre lo stile vale solo per Chrome, Edge e Safari: su Firefox compaiono le scrollbar grigie del sistema, fuori tono con i tre temi (Sigillo, Astrale, Sangue). Ora che la scheda desktop ha una colonna laterale con scorrimento proprio, le scrollbar si vedono molto di più.

## What Changes

- Scrollbar sottili e **sobrie**: pista trasparente, cursore (thumb) arrotondato con una piccola distanza dal bordo, nei colori di linea del tema attivo (oro, viola o rosso a seconda del tema).
- **Stati**: il cursore si illumina al passaggio del mouse e mentre lo si trascina, sullo stesso tono del tema.
- **Stesso aspetto su tutti i browser**: oggi solo i browser basati su WebKit/Blink hanno lo stile; Firefox usa le proprietà standard `scrollbar-width`/`scrollbar-color`, con colori equivalenti (senza evidenziazione al passaggio, che Firefox non permette).
- Cambiando tema, le scrollbar seguono i colori del tema senza altro intervento.
- Gli elementi che nascondono già la scrollbar di proposito (chip di stato, tab scorrevoli su mobile) restano senza scrollbar.
- Su dispositivi touch non cambia nulla: lì le scrollbar sono quelle di sistema, che si nascondono da sole.

**Fuori da questa change**
- Larghezze del layout, colori dei temi e qualsiasi altro elemento dell'interfaccia.
- Scrollbar di elementi esterni all'app (selettori nativi del browser, finestre di sistema).

## Capabilities

### New Capabilities
- `themed-scrollbars`: aspetto delle barre di scorrimento in tutto il portale, coerente con il tema attivo e uguale fra i browser supportati.

### Modified Capabilities
_Nessuna._

## Impact

- `src/index.css`: sostituzione del blocco «SCROLLBAR» (4 regole WebKit) con regole per WebKit/Blink e per i browser che supportano solo le proprietà standard.
- `.sheet-sidebar` in `src/index.css` dichiara `scrollbar-width: thin`: la riga va tolta per non entrare in conflitto con lo stile globale.
- Un test che verifica le regole sul foglio di stile (come già fatto per i contrasti) e controllo visivo nei tre temi.
- Nessuna dipendenza nuova.
