# Design

## Context

- **Oggi**: `vite-plugin-pwa` con `registerType: 'autoUpdate'` e `injectRegister: false`. `main.tsx` chiama `registerSW({ immediate: true })`. In questa modalità il nuovo service worker si attiva subito e la pagina si ricarica da sola. Non c'è nessun controllo periodico.
- **Quando il browser cerca un nuovo `sw.js`**: all'apertura a freddo, cioè a ogni navigazione. Non quando l'app viene ripresa dal background.
- **Cache**: la precache contiene `js, css, html, woff2, png, svg`. I file JSON dei dati non ci sono. `vercel.json` serve già `sw.js`, `manifest.webmanifest` e `registerSW.js` con `no-cache`.
- **Stato**: lo stato dell'app è in Zustand. La pagina può avere un modale aperto o una modifica non salvata.
- **Test**: l'ambiente è `node`, senza DOM. I service worker e gli eventi della pagina non si possono provare nei test.

## Goals / Non-Goals

**Goals:**
- Il telefono trova la nuova versione senza che l'utente chiuda l'app.
- La versione in uso non viene sostituita mentre l'utente sta lavorando.
- Un'app rimasta bloccata si recupera da sola.
- Le regole di decisione sono funzioni pure testabili. Il collegamento con il browser resta sottile.

**Non-Goals:**
- Mettere i file dei dati nella precache o renderli disponibili offline.
- Notifiche push degli aggiornamenti, o una pagina «Novità».
- Raggiungere i telefoni già bloccati sulla versione attuale: il codice di recupero sarà presente solo da questo rilascio in poi.
- Cambiare il comportamento offline o l'esclusione del backend dalla cache.

## Decisions

### D1. `registerType: 'prompt'`
- Il nuovo service worker resta in attesa (`waiting`) finché non gli viene chiesto di attivarsi con `updateServiceWorker(true)`, che lo attiva e ricarica la pagina.
- Se l'utente ignora l'avviso e chiude l'app, il service worker in attesa si attiva appena non restano pagine aperte, e la prossima apertura usa già la versione nuova.
- *Alternativa scartata*: restare in `autoUpdate`. La ricarica automatica può arrivare con un modale aperto o una modifica a metà.

### D2. Identificativo della build
- `vite.config.ts` calcola una sola volta `BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA ?? String(Date.now())`.
- Lo espone all'app con `define: { __APP_BUILD__: JSON.stringify(BUILD_ID) }` e lo scrive in `dist/version.json` (`{ "build": "<id>" }`) con un piccolo plugin che usa `generateBundle`.
- Il tipo `declare const __APP_BUILD__: string` va in `src/vite-env.d.ts`.
- `version.json` non fa parte della precache (il filtro non include i JSON) e `vercel.json` lo serve con `no-cache`.

### D3. Regole pure in `src/lib/pwaUpdate.ts`
```ts
shouldCheck(now, lastCheck, minGapMs = 5 min)       // true se è passato abbastanza tempo
isStale(running, published)                         // published è una stringa non vuota diversa da running
inStartupWindow(now, pageStart, windowMs = 10 s)    // true se la pagina è appena partita
recoveryAllowed(storage, published)                 // false se il recupero è già stato fatto per questa versione
markRecovered(storage, published)
```
- Il blocco anti-ciclo usa `sessionStorage` per la sessione, con la chiave `pwa-recovered-for` contenente la versione pubblicata. Se `sessionStorage` non è disponibile, il recupero non parte (meglio una versione vecchia che un ciclo).

### D4. Controllo attivo e flusso
`initPwaUpdates()` in `src/lib/pwaUpdate.ts`, chiamata da `main.tsx` al posto di `registerSW`:
1. **Registrazione**: `registerSW({ immediate: true, onNeedRefresh, onRegisteredSW })` salva la registrazione.
2. **Quando controllare**: `checkNow()` viene eseguita:
   - all'avvio;
   - su `visibilitychange` quando la pagina torna visibile;
   - su `online`;
   - ogni 30 minuti con `setInterval`, solo con la pagina visibile.
   Rispetta `shouldCheck`.
3. **`checkNow()`**:
   1. `registration.update()`;
   2. legge `/version.json` con `cache: 'no-store'`; se la lettura fallisce, ignora.
4. **Quando arriva `onNeedRefresh`** (nuova versione in attesa):
   - dentro la finestra di avvio, chiama subito `updateServiceWorker(true)`: nessun avviso, non c'è nulla da perdere;
   - altrimenti, imposta `needRefresh` nello store, e compare l'avviso.
5. **Versione bloccata**: se `isStale(...)` e dopo 8 secondi non è arrivato `onNeedRefresh`:
   - dentro la finestra di avvio e se `recoveryAllowed`, esegue il recupero (D5);
   - altrimenti imposta nello store `stale: true`, e compare l'avviso, che al tocco esegue il recupero.

### D5. Recupero
`hardReset()`: `markRecovered`, `registration.unregister()` per tutte le registrazioni, `caches.keys()` → `caches.delete` per ognuna, poi `location.reload()`. Se qualunque passo fallisce, ricarica comunque.

### D6. Store e avviso
- `src/store/pwaStore.ts` (Zustand): `{ needRefresh, stale, dismissed, apply, dismiss }`. `apply` esegue `updateServiceWorker(true)` o `hardReset()` a seconda del caso; `dismiss` nasconde l'avviso fino al prossimo `visibilitychange` verso visibile.
- `UpdatePrompt` è montato in `App` e mostra un riquadro fisso in basso: «Nuova versione disponibile» con «Aggiorna» e «Dopo». Usa `role="status"` e i token del design system. Se il personaggio ha l'overlay dei dadi aperto, l'avviso resta sotto (z-index inferiore).

## Risks / Trade-offs

- **[Cicli di ricarica]** Se `version.json` non coincide mai con la build in esecuzione, per esempio perché la CDN serve due versioni diverse, l'app potrebbe ricaricarsi di continuo. → Il recupero parte una sola volta per versione pubblicata, ed è registrato in `sessionStorage`.
- **[Falso positivo durante il rilascio]** Durante un deploy `version.json` e `sw.js` possono essere pubblicati in momenti diversi, e l'app può vedere una versione nuova senza nuovo service worker. → La finestra di 8 secondi e il fatto che durante l'uso serva un tocco rendono il danno limitato a un avviso; all'avvio il recupero ripulisce e ricarica, il che è comunque innocuo.
- **[`sessionStorage` o `caches` non disponibili]** In navigazione privata o su browser molto vecchi. → Il recupero non parte, o ricarica senza svuotare, e l'avviso resta.
- **[Avviso fastidioso]** Un rilascio frequente produce un avviso a ogni ritorno in primo piano. → «Dopo» lo nasconde fino al ritorno successivo, e il controllo ha un intervallo minimo di 5 minuti.
- **[Non verificabile nei test]** I test non hanno un DOM né un service worker, quindi il collegamento con il browser è provato solo a mano. → Le regole di decisione stanno in funzioni pure testate, e il collegamento resta sottile.

## Migration Plan

- Nessun dato da migrare.
- I telefoni già bloccati si aggiornano con il meccanismo attuale (apertura a freddo, o *Cancella dati* da Android) e da quel momento hanno il nuovo controllo.
- Per tornare indietro basta ripristinare `registerType: 'autoUpdate'` e `registerSW({ immediate: true })`: `version.json` resta inutilizzato.
