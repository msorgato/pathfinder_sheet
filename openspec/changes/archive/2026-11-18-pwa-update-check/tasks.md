# Tasks

## 1. Build

- [x] 1.1 In `vite.config.ts`: `registerType: 'prompt'`, `BUILD_ID` condiviso, `define: { __APP_BUILD__ }` e un plugin che scrive `version.json` in `dist`. Dichiarare `__APP_BUILD__` in `src/vite-env.d.ts` e aggiungere `/version.json` con `no-cache` in `vercel.json`. Verificare con `npm run build`: `dist/version.json` contiene l'id, `dist/sw.js` non lo precarica e l'id è presente nel bundle.

## 2. Regole pure

- [x] 2.1 Creare `src/lib/pwaRules.ts` (le regole pure, separate dal collegamento con il browser) con `shouldCheck`, `isStale`, `inStartupWindow`, `recoveryAllowed` e `markRecovered`. Verificare con test:
  - due controlli entro 5 minuti → il secondo è rifiutato, dopo 5 minuti è accettato;
  - build uguali → non obsoleta; diverse → obsoleta; stringa pubblicata vuota o assente → non obsoleta;
  - finestra di avvio entro 10 s sì, dopo no;
  - il recupero è consentito una volta per versione, e non due; con storage che lancia → non consentito.

## 3. Collegamento con il browser

- [x] 3.1 Creare `pwaStore` e `initPwaUpdates()` in `src/lib/pwaUpdate.ts`:
  - registrazione con `onNeedRefresh`;
  - controllo all'avvio, su `visibilitychange`, su `online` e ogni 30 minuti;
  - lettura di `version.json`;
  - applicazione automatica nella finestra di avvio, avviso fuori dalla finestra;
  - recupero dopo 8 s senza aggiornamento;
  - `hardReset`.
  Chiamare `initPwaUpdates()` da `main.tsx` al posto di `registerSW`. Verificare con `npx tsc -b` e con un test dello store: `dismiss` nasconde l'avviso, un nuovo ritorno in primo piano lo mostra di nuovo.
- [x] 3.2 Creare `UpdatePrompt` e montarlo in `App`. Verificare con uno smoke test: con `needRefresh` vero il riquadro mostra «Nuova versione disponibile», «Aggiorna» e «Dopo»; con `stale` vero mostra l'azione di recupero; senza nessuno dei due non rende nulla.

## 4. Verifica d'insieme

- [x] 4.1 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.
- [ ] 4.2 Provare su un telefono Android, con la build servita su HTTPS (anteprima Vercel o `vite preview` con un tunnel):
  - installare l'app, pubblicare una seconda build e portare l'app in primo piano senza chiuderla: deve comparire l'avviso entro pochi secondi;
  - «Dopo» lo nasconde; «Aggiorna» ricarica sulla nuova build;
  - chiudere l'app con l'avviso ignorato e riaprirla: deve esserci già la nuova build;
  - con la stessa build e nuova apertura a freddo: nessun avviso;
  - simulare un service worker bloccato (annullare la registrazione dagli strumenti di sviluppo e riaprire con la cache vecchia): il recupero all'avvio ricarica una volta sola.

## Workflow follow-up

- Archiviare la change con `/opsx:archive` dopo la verifica dell'utente.
