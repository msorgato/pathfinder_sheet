# Tasks

## 1. Base del layout desktop

- [x] 1.1 Creare l'hook `useIsDesktop()` (`matchMedia('(min-width: 1024px)')` + `useSyncExternalStore`, valore server `false`) con un test unitario che verifica il valore di default senza `matchMedia`; `vitest` (da PowerShell) passa
- [x] 1.2 Estrarre da `CharacterSheet` il componente `SheetBody` con prop `layout: 'mobile' | 'desktop'`, lasciando invariata la resa mobile; verificare con `renderToString` in un nuovo test che in modalità mobile la tab Combattimento contenga i 6 pannelli nell'ordine attuale
- [x] 1.3 Aggiungere in `src/index.css` le classi `.sheet-desktop`, `.sheet-sidebar`, `.sheet-main`, `.sheet-tabs` (sticky), `.sheet-cols`/`.sheet-col`, `.sheet-grid-auto` e le variabili `--sheet-sidebar-w` (380 px, 420 px da 1440 px), con `container-type` e nomi `sidebar`/`sheet-main`; verificare che `npm run build` e `npm run lint` passino
- [x] 1.4 Rendere il layout desktop in `SheetBody`: sidebar con `AbilityPanel`, `HitPointsPanel`, `CombatStats`; barra delle tab dentro il main; contenitore senza `overflow-y-auto` su desktop; header allineato alla larghezza massima 1600 px. Test `renderToString` in modalità desktop: le caratteristiche compaiono una sola volta e sono nella sidebar
- [x] 1.5 Composizione desktop della tab Combattimento: Attacchi a sinistra, Condizioni ed effetti + Consumabili a destra dentro `.sheet-cols`; coperto dal test di 1.4 (assenza di duplicati, presenza di Attacchi/Condizioni/Consumabili)

## 2. Pannelli in colonna stretta (sidebar)

- [ ] 2.1 Estendere a `@container sidebar (max-width: 440px)` le regole compatte di `CombatStats` (`.ac-group` a righe e affini) e `.ability-full` di `AbilityPanel`, lasciando intatte le media query mobile; verifica visiva a 1024 e 1440 px: nessun testo tagliato o sovrapposto nella sidebar
- [ ] 2.2 Verificare la sidebar sticky e scorrevole: a 1280×700 si raggiunge l'ultima statistica scorrendo solo la sidebar, e scorrendo l'elenco abilità la sidebar resta visibile

## 3. Tab su due colonne

- [x] 3.1 `EquipmentPanel`: raggruppare il contenuto in due `.sheet-col` dentro `.sheet-cols` (sinistra: riepilogo, avvisi, azioni, indossati; destra: trasportati, monete, competenze), modali fuori dalla griglia; lo smoke test esistente di `EquipmentPanel` passa e la resa a 375 px è invariata
- [x] 3.2 `SkillsPanel`: dividere l'elenco filtrato in due metà con intestazione propria, seconda intestazione nascosta sotto i 760 px di contenitore, ricerca e filtri sopra a tutta larghezza; estendere lo smoke test per verificare che tutte le abilità siano presenti una sola volta
- [x] 3.3 `SpellsPanel`: applicare `.sheet-grid-auto` ai contenitori dei blocchi per livello, riepilogo a tutta larghezza; lo smoke test di `SpellsPanel` passa e a 1440 px i blocchi sono su due colonne
- [x] 3.4 Creare `useContainerWide(ref, 760)` (`ResizeObserver` in `useEffect`, iniziale `false`) e usarlo in `FeaturesPanel` per mostrare capacità di classe e talenti affiancati senza sotto-tab quando largo; aggiungere uno smoke test che in render server le sotto-tab siano presenti
- [x] 3.5 Tab Note: note a sinistra, dettagli e background a destra in `.sheet-cols`; verifica visiva a 1440 px e a 375 px (ordine invariato)

## 4. Verifica d'insieme

- [x] 4.1 Con `npm run dev`, controllare ogni tab a 375, 1023, 1024, 1280, 1440 e 2560 px: mobile invariato, sidebar da 1024, due colonne nel main da ~1210, nessuno scroll orizzontale, larghezza massima 1600 px centrata
- [x] 4.2 Ridimensionare la finestra attraverso i 1024 px con la tab Equipaggiamento aperta e verificare che resti attiva; da sidebar avviare un tiro rapido di un TS e verificare che il dado si apra
- [x] 4.3 Eseguire l'intera suite (`npx vitest run` da PowerShell), `npm run lint` e `npm run build`: tutto verde
