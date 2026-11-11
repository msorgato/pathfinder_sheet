# Design

## Context

- Il ritratto è disegnato inline in due punti: `CharacterSheet.tsx` (`.char-portrait` con sigillo animato e `.char-portrait-initial`) e `HomePage.tsx` (card, iniziale 52px a bassa opacità).
- Le icone in `public/icons/classi/*.svg` sono 64×64, `stroke="currentColor"` con riempimenti `fill="currentColor" fill-opacity=".18"`. Il nome file è il nome italiano in kebab-case (es. `sacerdote-guerriero.svg`). Ogni file pesa ~8–9KB, quasi tutti di metadati C2PA.
- Le classi base hanno id inglesi (`fighter`, `rogue`, …); le classi personalizzate hanno id arbitrari.
- Il colore d'accento è già esposto come `--char-accent` sulla radice della scheda; in homepage non è definito.
- Il pannello `CharacterCustomizationPanel` esiste già e contiene colore ed eliminazione.

## Goals / Non-Goals

**Goals:**
- Icona ritratto selezionabile, persistita, tinta con il colore d'accento.
- Catena di fallback icona scelta → icona della classe principale → iniziale.
- Un solo componente ritratto riusato in scheda e homepage.
- Favicon collegate in `index.html`.
- App installabile come PWA, con shell disponibile offline e aggiornamento automatico.

**Non-Goals:**
- Caricamento di immagini personalizzate dall'utente.
- Icone per le classi personalizzate o campo icona nell'editor delle classi.
- Ottimizzazione/ripulitura dei file SVG (rimozione metadati C2PA).
- Uso offline dei dati: Firestore resta online (niente `persistentLocalCache` né sincronizzazione offline).
- Notifiche push, sincronizzazione in background, prompt di installazione personalizzato.

## Decisions

1. **Rendering con CSS mask, non `<img>`.** Un `<img>` non eredita `currentColor`, quindi l'icona resterebbe nera. Si usa un `<span>` con `mask-image: url(/icons/classi/<id>.svg)` (più `-webkit-mask-image`) e `background-color: var(--char-accent, var(--gold))`. Le opacità del file (`fill-opacity .18`) diventano opacità della maschera, quindi l'aspetto a due toni si conserva. *Alternative scartate:* SVG inline via fetch (asincrono, più codice), import `?react` con plugin (nuova dipendenza), filtri CSS per colorare `<img>` (imprecisi).
2. **Catalogo statico in `src/data/portraitIcons.ts`**: array `{ id, name }` con i 40 id (= nome file senza estensione) e nome leggibile; più una mappa `CLASS_ICON_BY_CLASS_ID` per le 11 classi base (`barbarian→barbaro`, `bard→bardo`, `cleric→chierico`, `druid→druido`, `fighter→guerriero`, `monk→monaco`, `paladin→paladino`, `ranger→ranger`, `rogue→ladro`, `sorcerer→stregone`, `wizard→mago`). Una funzione `resolvePortraitIcon(char)` applica la catena di fallback e ignora id sconosciuti.
3. **Campo `portraitIcon?: string` su `Character`**, aggiornato con `updateCharacter` come `accentColor`. `undefined` = automatico. Nessuna migrazione.
4. **Componente `CharacterPortraitGlyph`** che rende l'icona risolta o l'iniziale; il contenitore (sigillo, dimensioni) resta nel chiamante. In scheda sostituisce `.char-portrait-initial`; in homepage sostituisce l'iniziale della card. In homepage l'icona resta in oro: lo spec `character-accent-palette` confina il colore d'accento alla scheda, e la card mantiene la sua opacità ridotta.
5. **Selettore nel pannello di personalizzazione**: sezione «Icona ritratto» sopra il colore, griglia di pulsanti 44×44px (ogni pulsante mostra la maschera dell'icona), scorrevole in altezza su mobile; primo elemento «Automatico» che mostra l'icona che verrebbe usata in automatico. Selezione evidenziata come lo swatch del colore.
6. **Favicon**: `<link>` per `favicon-16/32/48.png`, `apple-touch-icon` e `icon-512.png` in `index.html`, mantenendo `favicon.svg` come prima scelta per i browser che supportano SVG solo se è effettivamente la nuova favicon; altrimenti va rimosso a favore dei PNG.

7. **PWA con `vite-plugin-pwa`** (`registerType: 'autoUpdate'`, strategia `generateSW` di Workbox):
   - Manifest: `name` «Pathfinder Sheet», `short_name`, `lang: it`, `display: standalone`, `start_url`/`scope: /`, `theme_color` e `background_color` presi da `--bg-deep`; icone `icon-192.png`, `icon-512.png` e `icon-512.png` con `purpose: maskable`.
   - Precache della shell (JS, CSS, HTML, font locali, icone). `navigateFallback: /index.html` per le rotte SPA, escludendo `/__/` (auth Firebase).
   - Nessuna regola di cache runtime per Firestore, Firebase Auth e Cloud Functions: le loro richieste vanno sempre in rete. Google Fonts in cache runtime `StaleWhileRevalidate`/`CacheFirst`.
   - `<meta name="theme-color">` e meta Apple (`apple-mobile-web-app-capable`, titolo, status bar) in `index.html`; `<html lang="it">` e titolo «Pathfinder Sheet».
   - *Alternativa:* manifest statico + `sw.js` scritto a mano. Da usare solo se il plugin non supporta Vite 8: meno funzioni (niente precache con hash), più manutenzione.
8. **Icona 192px**: Chrome richiede 192 e 512 per l'installazione; si genera `icon-192.png` da `icon-512.png` con un comando una tantum (es. `sharp` via `npx`) e si committa. Per *maskable* si verifica che il soggetto stia nella safe zone (80%); se no, si usa la 512 solo come `any` e si segnala.
9. **Deploy su Vercel**: header `Cache-Control: no-cache` per `/sw.js` e `/manifest.webmanifest` in `vercel.json`, così gli aggiornamenti arrivano subito. I file statici sono serviti prima del rewrite verso `index.html`.

## Risks / Trade-offs

- **Supporto `mask-image`**: ampio nei browser moderni; serve il prefisso `-webkit-` per Safari/Chrome meno recenti.
- **Peso**: 40 SVG da ~9KB caricati nella griglia del pannello (~370KB), ma solo all'apertura e poi in cache. Accettabile; ripulire i metadati è fuori scope.
- **`favicon.svg` esistente**: non è chiaro se sia la vecchia icona Vite; da verificare in implementazione prima di decidere se tenerlo.
- **Classi multiple**: si usa solo la prima classe; un multiclasse vede l'icona della classe iniziale finché non sceglie a mano.
- **Compatibilità `vite-plugin-pwa` con Vite 8**: da verificare sui peer requirements prima di installare; c'è il piano B manuale.
- **Service worker e versioni vecchie**: con `autoUpdate` la nuova versione si attiva al ricaricamento successivo; una sessione aperta a lungo può restare sulla versione precedente fino al reload.
- **Auth Firebase**: il fallback di navigazione non deve intercettare `/__/auth/*`, altrimenti il login con redirect si rompe.
- **Dev**: il service worker è disattivato in sviluppo, per non avere cache inattese durante `vite dev`.
