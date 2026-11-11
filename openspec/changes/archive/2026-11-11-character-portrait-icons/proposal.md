# Proposal

## Why

Oggi il ritratto del personaggio mostra solo l'iniziale del nome, poco distintiva quando più personaggi hanno nomi simili. In `public/icons/classi/` sono ora disponibili 40 icone SVG tematiche per le classi, che permettono di dare a ogni scheda un'identità visiva più riconoscibile. Nella stessa cartella ci sono anche le favicon e l'icona 512px del sito, ancora non collegate: sono anche la base per rendere l'app installabile come PWA, utile soprattutto per l'uso da smartphone al tavolo di gioco.

## What Changes

- Il personaggio può avere un'**icona ritratto** scelta fra le 40 icone di classe disponibili, salvata con il personaggio.
- La scelta avviene nel pannello «Personalizzazione personaggio», accanto al colore, con la possibilità di tornare all'automatico.
- Il ritratto segue questa precedenza:
  1. icona scelta dal giocatore;
  2. icona della classe principale del personaggio, se esiste un'icona corrispondente (le 11 classi base);
  3. iniziale del nome, come ultimo fallback (ad esempio per le classi personalizzate).
- L'icona è colorata con il colore d'accento del personaggio e resta sopra il sigillo animato, come oggi l'iniziale.
- Lo stesso ritratto è usato sia nell'header della scheda sia nella card del personaggio in homepage.
- `index.html` collega le favicon PNG (16/32/48), l'`apple-touch-icon` e l'icona 512px.
- L'applicazione diventa una **PWA installabile**: web app manifest (nome, colori, icone 192/512 anche *maskable*, avvio in modalità standalone) e service worker che mette in cache la shell dell'app, così l'app si avvia anche con rete assente o instabile e si aggiorna automaticamente alla nuova versione.

## Capabilities

### New Capabilities
- `character-portrait-icon`: scelta, persistenza e visualizzazione dell'icona ritratto del personaggio, con la catena di fallback.
- `site-favicons`: icone del sito mostrate da browser e dispositivi (tab, segnalibri, schermata home).
- `pwa-install`: installabilità dell'app, avvio standalone, cache della shell e aggiornamento delle nuove versioni.

### Modified Capabilities
- `character-portrait-sigil`: il requisito «Character initial remains prominent» diventa valido per il contenuto centrale del ritratto (icona o iniziale), non solo per l'iniziale.

## Impact

- Tipi: nuovo campo opzionale `portraitIcon?: string` in `Character`. I personaggi esistenti non cambiano dati e mostrano l'icona della classe, se disponibile.
- Codice: nuovo catalogo icone e componente ritratto riutilizzabile; `CharacterSheet.tsx`, `HomePage.tsx`, `CharacterCustomizationPanel.tsx`, `index.html`, CSS.
- Asset: `public/icons/` (già presente, da aggiungere al repository).
- Dipendenze: `vite-plugin-pwa` (dev) per manifest e service worker, se compatibile con Vite 8; altrimenti manifest e service worker scritti a mano.
- Build e deploy: `vite.config.ts`, nuovi file generati (`manifest.webmanifest`, `sw.js`), header di cache per il service worker in `vercel.json`, nuova icona 192px in `public/icons/`.
- Nessuna modifica alle regole Firestore (i campi del personaggio non sono vincolati). I dati restano online: nessuna modalità offline per Firestore.
