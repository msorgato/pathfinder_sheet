# Proposal

## Why

Al tavolo i PG vengono continuamente colpiti da condizioni (scosso, nauseato, intralciato, afferrato…) e ricevono bonus e malus da incantesimi alleati e nemici (Benedizione, Velocità, Ingrandire persona, Anatema…). Oggi la scheda non ne tiene traccia: il giocatore deve ricordarsi ogni modificatore e ricalcolare a mano tiri salvezza, attacchi, CA e abilità, con errori frequenti sulle regole di cumulo. Mancano anche danno e risucchio di caratteristica e i livelli negativi, che cambiano molti valori derivati contemporaneamente.

Inoltre ogni pannello calcola i propri totali per conto suo: senza un punto unico di calcolo non è possibile applicare in modo coerente questi effetti.

## What Changes

- **Motore dei modificatori**: un unico calcolo dei valori derivati (caratteristiche, TS, attacchi e danni, CA/contatto/impreparato, CMB/CMD, iniziativa, abilità, PF massimi) che somma i modificatori attivi applicando le regole di cumulo di Pathfinder 1E per tipo di bonus. Ogni valore espone il dettaglio delle fonti.
- **Condizioni**: catalogo delle condizioni PF1 in italiano, con descrizione e, dove numerici, i loro effetti automatici (es. Scosso −2 a attacchi, TS, abilità e prove; Intralciato −2 attacchi e −4 Des; Impreparato perde la Des alla CA). Le condizioni puramente narrative (Nauseato, Barcollante, Confuso…) mostrano il promemoria delle regole. Gli effetti non numerici sugli attacchi (es. Accecato: 50% di probabilità di mancare) sono segnalati sui tiri per colpire e nei tiri rapidi.
- **Effetti (incantesimi e simili)**: libreria di preset comuni (Benedizione, Velocità, Ingrandire/Ridurre persona, potenziamenti di caratteristica, Scudo della fede, Armatura magica, Ispirazione bardica, Preghiera, Anatema, Eroismo, Ira…) e creazione di effetti personalizzati con nome e lista di modificatori (bersaglio, tipo di bonus, valore). Un preset aggiunto diventa una copia modificabile.
- **Nessuna durata**: condizioni ed effetti restano attivi finché il giocatore non li rimuove (o disattiva, per gli effetti). Il conteggio dei round è escluso perché aggiunge lavoro al tavolo senza dare valore.
- **Danno e risucchio di caratteristica**: il danno riduce il modificatore (−1 ogni 2 punti) senza toccare il punteggio e guarisce di 1 punto per caratteristica con il Riposo completo; il risucchio riduce il punteggio e non guarisce col riposo. Avvisi quando il danno raggiunge il punteggio.
- **Livelli negativi** (temporanei e permanenti): −1 per livello a attacchi, CMB, CMD, TS, abilità e prove; −5 PF massimi per livello; avviso di morte quando raggiungono i Dadi Vita.
- **UI discreta**: le condizioni e gli effetti attivi sono visibili come chip nell'header della scheda solo quando presenti; la gestione avviene in una sezione a scomparsa «Condizioni ed effetti» nel tab Combattimento, chiusa di default. I valori modificati sono evidenziati e mostrano il dettaglio delle fonti.
- Gestione **solo da parte del proprietario** del PG. L'applicazione da parte del GM in lobby è fuori scope.

## Capabilities

### New Capabilities
- `character-modifiers`: modificatori tipizzati, regole di cumulo, calcolo unico dei valori derivati e dettaglio delle fonti.
- `character-conditions`: catalogo delle condizioni PF1, applicazione/rimozione e loro effetti sulla scheda.
- `character-effects`: effetti temporanei da preset o personalizzati, modifica, disattivazione e rimozione.
- `ability-damage-drain`: danno e risucchio di caratteristica, effetti sui valori derivati e recupero.
- `negative-levels`: livelli negativi temporanei e permanenti e loro penalità.

### Modified Capabilities
- `attack-rolls`: il bonus di attacco mostrato e tirato include i modificatori attivi (condizioni, effetti, danno di caratteristica, livelli negativi), non più solo `iterazione + mod caratteristica`.

## Impact

- **Dati**: nuovi campi opzionali su `Character` (`conditions`, `effects`, `abilityDamage`, `abilityDrain`, `negativeLevels`), salvati con il personaggio su Firestore. Personaggi esistenti invariati (campi assenti = nessun effetto). Nessuna modifica alle regole Firestore.
- **Codice**: nuovo motore in `src/utils/` e cataloghi in `src/data/`; refactoring di `CombatStats`, `AttacksPanel`, `SkillsPanel`, `AbilityPanel`, homepage e pannello lobby per leggere i valori dal motore; `fullRest` nello store; nuova sezione UI e chip nell'header.
- **Lobby**: il pannello scheda in lobby mostra automaticamente i valori modificati (stesso motore), in sola lettura per gli altri.
- **Test**: unit test per motore, cumulo, condizioni, danno/risucchio e livelli negativi.
- Nessuna nuova dipendenza.
