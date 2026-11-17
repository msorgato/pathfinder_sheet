# Proposal

## Why

Su Android, dopo un rilascio, l'app installata continua a mostrare la versione vecchia. Oggi il service worker si aggiorna da solo, ma solo se il browser ne cerca uno nuovo, e lo fa soltanto all'apertura a freddo. Una PWA installata resta nell'elenco delle app recenti per giorni e viene solo *ripresa*: nessuna navigazione, nessun controllo. In più, anche a freddo il service worker serve prima la cache già installata, quindi il rilascio compare alla seconda apertura.

Non serve cancellare le cache a mano: il service worker sostituisce già la cache in blocco e toglie quella vecchia. Manca solo un modo perché il telefono *scopra* e *applichi* la nuova versione.

## What Changes

**Controllo attivo degli aggiornamenti**
- L'app chiede al browser se esiste una nuova versione quando torna in primo piano, quando torna la rete e ogni circa 30 minuti mentre resta aperta, con un intervallo minimo di 5 minuti fra due controlli.

**Come si applica**
- La nuova versione non sostituisce più quella in uso di nascosto: resta in attesa.
- **Avvio:** se viene trovata nei primi secondi dopo l'avvio, quando non c'è ancora nulla da perdere, si applica da sola.
- **Durante l'uso:** compare un avviso «Nuova versione disponibile» con «Aggiorna» e «Dopo». «Aggiorna» attiva la nuova versione e ricarica; «Dopo» nasconde l'avviso fino al prossimo ritorno in primo piano.
- Chi ignora l'avviso ottiene la nuova versione alla prossima apertura a freddo.

**Recupero di una versione bloccata**
- Ogni build pubblica un file `version.json` con il proprio id, sempre servito senza cache. L'app lo legge all'avvio e al ritorno in primo piano.
- Se la versione pubblicata è diversa da quella in esecuzione e il service worker non produce un aggiornamento entro pochi secondi, l'app si ripulisce da sola: annulla la registrazione, svuota le cache e ricarica. Un controllo impedisce i cicli di ricarica.
- Durante l'uso il recupero non scatta da solo: compare un avviso che lo propone.

**Invariato**
- Funzionamento offline, esclusione del backend dalla cache, manifest e installazione.
- I file dei dati (`items.json`, `spells.json`) restano fuori dalla cache del service worker.

## Capabilities

### New Capabilities
Nessuna.

### Modified Capabilities
- `pwa-install`: il requisito «Automatic updates» passa dall'aggiornamento silenzioso al controllo attivo con avviso, e si aggiungono i requisiti del controllo periodico, dell'avviso e del recupero di una versione bloccata.

## Impact

**Configurazione**
- `vite.config.ts`: `registerType: 'prompt'`, id di build (`VERCEL_GIT_COMMIT_SHA` oppure l'ora del build) condiviso fra l'app e un plugin che scrive `version.json`.
- `vercel.json`: `version.json` senza cache.

**Codice**
- Nuovo `src/lib/pwaUpdate.ts`, con le regole come funzioni pure e la registrazione del service worker.
- Nuovo store `pwaStore` e componente `UpdatePrompt`.
- `main.tsx` registra gli aggiornamenti, e `App` mostra l'avviso.

**Dipendenze**: nessuna.

**Firestore**: nessuna modifica.
