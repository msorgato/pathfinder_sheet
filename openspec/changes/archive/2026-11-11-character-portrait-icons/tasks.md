# Tasks

## 1. Dati e catalogo icone

- [x] 1.1 Aggiungere `portraitIcon?: string` al tipo `Character`
- [x] 1.2 Creare `src/data/portraitIcons.ts` con i 40 id (nome file senza estensione) e nomi leggibili, la mappa classe base → icona e `resolvePortraitIcon(char)` (scelta valida → classe principale → `undefined`)
- [x] 1.3 Aggiungere test unitari per `resolvePortraitIcon` (icona scelta, id sconosciuto, classe base, classe personalizzata, nessuna classe)

## 2. Componente ritratto

- [x] 2.1 Creare `CharacterPortraitGlyph` (icona via `mask-image`/`-webkit-mask-image` tinta con `var(--char-accent, var(--gold))`, altrimenti iniziale o «?»)
- [x] 2.2 Usarlo nell'header di `CharacterSheet.tsx` al posto di `.char-portrait-initial`, mantenendo il sigillo dietro e dimensioni corrette su mobile e desktop
- [x] 2.3 Usarlo nella card di `HomePage.tsx`, in oro (il colore d'accento resta confinato alla scheda, come da spec `character-accent-palette`) e con opacità bassa coerente con l'attuale

## 3. Selezione nel pannello di personalizzazione

- [x] 3.1 Aggiungere a `CharacterCustomizationPanel` la sezione «Icona ritratto»: opzione «Automatico» + griglia delle 40 icone (pulsanti ≥44px, tooltip col nome, selezione evidenziata, area scorrevole su mobile)
- [x] 3.2 Collegare la selezione a `updateCharacter(char.id, { portraitIcon })` in `CharacterSheet.tsx` («Automatico» → `undefined`)

## 4. Favicon

- [x] 4.1 Verificare se `public/favicon.svg` è la nuova icona; altrimenti rimuoverne il link (e il file, se non usato altrove)
- [x] 4.2 Aggiungere in `index.html` i link a `favicon-16/32/48.png`, `apple-touch-icon.png` e `icon-512.png`; impostare `lang="it"` e titolo «Pathfinder Sheet»

## 5. PWA

- [x] 5.1 Verificare la compatibilità di `vite-plugin-pwa` con Vite 8; se compatibile installarlo come dev dependency, altrimenti fermarsi e passare al piano B (manifest + `sw.js` manuali) descritto in design
- [x] 5.2 Generare `public/icons/icon-192.png` da `icon-512.png` e verificare la safe zone per l'uso *maskable* (generata `icon-maskable-512.png` a tutto campo, perché `icon-512.png` ha angoli trasparenti)
- [x] 5.3 Configurare il plugin in `vite.config.ts`: manifest (nome, short name, `lang: it`, `standalone`, colori, icone 192/512/maskable), `registerType: 'autoUpdate'`, precache della shell, `navigateFallback` con esclusione di `/__/`, nessuna cache per Firestore/Auth/Functions, cache runtime per Google Fonts, SW disattivato in dev
- [x] 5.4 Registrare il service worker in `src/main.tsx` (`virtual:pwa-register`) e aggiungere i tipi del modulo virtuale
- [x] 5.5 Aggiungere in `index.html` `theme-color` e i meta Apple per la modalità standalone
- [x] 5.6 Aggiungere in `vercel.json` header `Cache-Control: no-cache` per `/sw.js` e `/manifest.webmanifest`

## 6. Verifica

- [x] 6.1 `tsc -b`, lint sui file toccati e `npm test`
- [x] 6.2 `npm run build` + `npm run preview`: manifest valido, service worker registrato, sezione Installabilità di Lighthouse/DevTools senza errori
- [x] 6.3 Avvio offline dopo una prima visita (DevTools → Offline) e login funzionante con il service worker attivo
- [x] 6.4 Ritratto: icona scelta, icona di classe automatica, iniziale per classe personalizzata, colore d'accento applicato, coerenza fra scheda e homepage, persistenza dopo reload
