# Tasks

## 1. Stato di partenza

- [x] 1.1 Creare il banco di prova temporaneo (`harness/`, servito dal dev server di Vite): una pagina che monta con un personaggio di prova `AbilityPanel`, `CombatStats`, `SkillsPanel`, `AttacksPanel`, `EquipmentPanel` e una `RollReveal` ferma sul totale. Catturare con Chrome headless le immagini «prima» a 390 px e a 1024 px nella scratchpad. Verificare che le catture mostrino i pannelli completi.

## 2. Font serviti dall'app

- [x] 2.1 Installare `@fontsource-variable/literata@5.3.0` e `@fontsource-variable/cinzel@5.3.0` con versione esatta. Importarli in `src/main.tsx`, con il solo sottoinsieme latino e l'asse `opsz` di Literata se disponibile. Togliere i link a Google Fonts da `index.html` e le regole di cache da `vite.config.ts`. Verificare con `npm run build`: in `dist` ci sono i `woff2` dei due font, nessun riferimento a `fonts.googleapis` o `fonts.gstatic`; annotare il peso aggiunto alla precache.

## 3. Variabili, classi e scala

- [x] 3.1 In `src/index.css`:
  - variabili `--font-body`, `--font-display` e `--font-rune` come da D2, e via `--font-uncial`;
  - `body` con peso 450, `font-optical-sizing: auto` e cifre allineate;
  - classi `.display-*` in Cinzel non corsivo, `.label-rune` (13 px, 0,14 em), `.label-rune-soft` (12 px, 0,12 em) e `.numeral` con cifre allineate e tabulari;
  - `@theme` con `--text-xs` a 13 px e `--text-sm` a 15 px.
  Verificare con `npm run build` e le catture del banco di prova.
- [x] 3.2 Riportare alla scala le regole CSS e i `fontSize` dei componenti sotto i 12 px (12 px per le etichette in maiuscolo, 13 px per il testo), e sostituire i `Georgia` scritti a mano con le variabili. Aggiungere il test di D4: nessuna dimensione sotto i 12 px, nessun `Georgia` fuori dalle variabili, nessun riferimento a Google Fonts.

## 4. Dadi

- [x] 4.1 Far usare `--font-display` a `.die-value` e `.roll-reveal-total`, e `"Literata Variable"` alle texture dei dadi 3D in `scene.ts`, con l'attesa di `document.fonts.load` (limite 1,5 s) e senza mettere in cache le texture disegnate con il font di riserva. Verificare con le catture del banco di prova di un d20 e di 3d6 e con i test esistenti dei dadi.

## 5. Verifica d'insieme

- [x] 5.1 Catturare le immagini «dopo» a 390 px e a 1024 px e confrontarle con quelle «prima». Correggere i soli casi rotti (testi che traboccano o vanno a capo nei badge o nelle tile), poi cancellare il banco di prova. Verificare che `harness/` non esista più.
- [x] 5.2 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.
- [ ] 5.3 Provare sul dev server e sul telefono:
  - scheda, lobby, wizard di creazione, level-up e pannello admin leggibili;
  - nessun testo tagliato;
  - font corretti offline al primo avvio dopo l'installazione;
  - nessuna richiesta a Google negli strumenti di rete.

## 6. Contrasto dei testi

- [x] 6.1 In `src/index.css`, per i tre temi, ricalcolare `--ink-faint` e `--ink-mute` come da D7 e aggiungere `--blood-text` (in `:root`); usarlo dove il rosso è testo (`.is-debuffed`, tabella del dettaglio, bonus negativo e fumble della rivelazione, etichetta «Danno», valori negativi in `CombatStats` e `AbilityPanel`). Schiarire i tre colori delle scuole nei tre file che li definiscono. Verificare con un test che calcola il contrasto dai token: `--ink`, `--ink-soft`, `--ink-mute` e `--ink-faint` ≥ 4,5 : 1 su tutte le cinque superfici di ogni tema, `--blood-text` ≥ 4,5 : 1, e la gerarchia (`ink` > `soft` > `mute` > `faint` per contrasto).
- [x] 6.2 Eseguire `npx vitest run` da PowerShell, `npx tsc -b`, `npm run lint` (nessun errore nuovo) e `npm run build`.

## Workflow follow-up

- Archiviare la change con `/opsx:archive` dopo la verifica dell'utente.
- Change successiva: spaziature, card e colori «più moderni», valutati a font cambiati.
