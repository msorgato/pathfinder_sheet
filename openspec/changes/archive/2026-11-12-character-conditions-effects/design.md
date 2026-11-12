# Design

## Context

- I valori derivati sono calcolati in modo sparso: `src/utils/calculations.ts` offre funzioni pure (`effectiveAbilityScores`, `totalSave`, `attackChain`, `skillTotal`, `maxHP`, `armorClass`…), ma i totali finali vengono composti dentro i componenti (`CombatStats`, `AttacksPanel`, `SkillsPanel`, `AbilityPanel`, `HomePage`, pannello lobby). La CA attuale è solo `10 + Des`.
- Il personaggio è un documento Firestore unico, sincronizzato da `characterStore` (`updateCharacter` → `syncChar`, che rimuove i campi `undefined`). Le regole Firestore non vincolano i campi del personaggio.
- `fullRest` ripristina PF, PF temporanei, danno non letale e incantesimi preparati.
- Abilità: `src/data/skills.ts` (42 abilità con `ability` e `armorCheckPenalty`).

## Goals / Non-Goals

**Goals:**
- Un solo calcolo dei valori derivati, con modificatori tipizzati e cumulo PF1, usato da tutte le viste.
- Catalogo condizioni ed effetti preset come dati, facili da estendere.
- Danno/risucchio di caratteristica e livelli negativi integrati nello stesso calcolo.
- Gestione discreta: sezione a scomparsa, nessuna durata da tracciare.

**Non-Goals:**
- Applicazione di condizioni/effetti da parte del GM o su altri PG; tracker d'iniziativa condiviso.
- Bonus condizionali automatici (es. "+2 contro il male", "+4 CA contro attacchi a distanza" del Prono): restano note.
- Armature, scudi ed equipaggiamento che danno bonus automatici (oggi non modellati): restano fuori, ma il motore li potrà accogliere come altre fonti.
- Riduzione automatica di slot incantesimo, capacità di classe o livello dell'incantatore per i livelli negativi.
- TS automatici per rimuovere i livelli negativi temporanei dopo 24 ore.
- Durata in round e avanzamento del round: scartati dopo la prima prova, perché aggiungevano lavoro al tavolo senza dare valore.

## Decisions

1. **Modello dati sul `Character`** (tutti opzionali, assenti = nessun effetto):
   ```ts
   type BonusType = 'alchemical'|'armor'|'circumstance'|'competence'|'deflection'|'dodge'|'enhancement'|'inherent'|'insight'|'luck'|'morale'|'natural'|'profane'|'racial'|'resistance'|'sacred'|'shield'|'size'|'trait'|'untyped';
   type ModifierTarget =
     | { kind: 'ability'; ability: AbilityKey }
     | { kind: 'attack' | 'damage'; scope: 'all'|'melee'|'ranged' }
     | { kind: 'save'; save: 'all'|'fort'|'ref'|'will' }
     | { kind: 'skill'; skillId: 'all' | string }
     | { kind: 'ac' | 'abilityCheck' | 'initiative' | 'cmb' | 'cmd' };
   interface Modifier { target: ModifierTarget; type: BonusType; value: number }
   interface ActiveCondition { id: string; conditionId: string; note?: string }
   interface ActiveEffect { id: string; name: string; presetId?: string; modifiers: Modifier[]; note?: string; disabled?: boolean }
   // Character
   conditions?: ActiveCondition[]; effects?: ActiveEffect[];
   abilityDamage?: Partial<AbilityScores>; abilityDrain?: Partial<AbilityScores>;
   negativeLevels?: { temporary: number; permanent: number };
   ```
   Target come oggetto discriminato (non stringhe tipo `"save.will"`) per avere controllo dei tipi su abilità e caratteristiche.

2. **Motore puro `deriveStats(char)`** in `src/utils/derivedStats.ts`, senza React né store:
   - raccoglie le **fonti** (`{ sourceId, label, kind: 'condition'|'effect'|'negativeLevels'|'abilityDamage', modifiers }`) da condizioni attive (dal catalogo), effetti abilitati, livelli negativi;
   - calcola i punteggi effettivi: base (oggi `effectiveAbilityScores`) − risucchio + modificatori di caratteristica cumulati; poi il modificatore effettivo = `abilityMod(score) − floor(danno/2)`;
   - per ogni valore derivato combina base + modificatori applicabili con `stack(modifiers)` e restituisce `{ total, base, applied: SourceEntry[], suppressed: SourceEntry[] }`;
   - output: `abilities`, `saves`, `attack.melee/ranged`, `damage.melee/ranged`, `ac`/`touch`/`flatFooted`, `cmb`, `cmd`, `initiative`, `skills[skillId]`, `abilityChecks[ability]`, `maxHp`, `flags` (es. `losesDexToAC`), `warnings` (soglie danno, risucchio a 0, livelli negativi ≥ DV).
   Le funzioni esistenti in `calculations.ts` restano come mattoni (BAB, TS di classe, catena di attacchi) e vengono richiamate dal motore.

3. **Regola di cumulo** (`stack`): separa positivi e negativi; per i positivi raggruppa per tipo e prende il massimo, tranne `dodge`, `circumstance`, `untyped` che si sommano; i negativi si sommano tutti. I bonus scartati vanno in `suppressed` per il dettaglio. Le penalità di condizioni sono `untyped`.

4. **Bersagli ampi**: per un valore finale si raccolgono i modificatori applicabili (es. per il TS Volontà: `save:all` + `save:will`; per un attacco in mischia: `attack:all` + `attack:melee`) e solo dopo si applica il cumulo, così "+1 resistenza a tutti i TS" e "+2 resistenza a Volontà" danno +2 su Volontà.

5. **Regole PF1 di propagazione** (codificate nel motore):
   - CMB riceve i modificatori d'attacco (`attack:all`) oltre a `cmb`; CMD riceve le penalità alla CA oltre a `cmd`.
   - Perdita della Des alla CA (`flags.losesDexToAC` da condizioni come Impreparato, Accecato, Stordito, Immobilizzato, Accovacciato): CA e CMD escludono il mod Des positivo e i bonus schivare. CA impreparato li esclude sempre; CA contatto esclude armatura, scudo e armatura naturale.
   - L'iniziativa è una prova di Destrezza: riceve i modificatori `abilityCheck` oltre a `initiative`. Le penalità «alle abilità» (`skill:all`) si applicano a tutte le abilità.
   - PF massimi: base dei dadi + mod Cos effettivo × livello − 5 × livelli negativi.
   - Danno di caratteristica: ridurre il modificatore di `floor(danno/2)` propaga a tutto ciò che usa quel modificatore.

6. **Cataloghi come dati**: `src/data/conditions.ts` (`{ id, name, summary, modifiers, losesDexToAC?, group? }`, con `group: 'fear'` per Scosso/Impaurito/In preda al panico, deduplicato prima del cumulo) e `src/data/effectPresets.ts` (`{ id, name, summary, modifiers }`). Le condizioni non sono copiate sul personaggio: si salva solo `conditionId`, così una correzione al catalogo vale per tutti.

7. **Azioni nello store**: `addCondition`, `removeCondition`, `addEffect`, `updateEffect`, `removeEffect`, `toggleEffect`, `setAbilityDamage`, `setAbilityDrain`, `setNegativeLevels`. `fullRest` cura 1 punto di danno per caratteristica. Gli `id` sono UUID (`crypto.randomUUID`).

8. **Refactoring dei componenti** per leggere dal motore tramite l'hook `useDerivedStats(char)` (`useMemo` su `deriveStats`) dentro ogni pannello. Il pannello lobby riusa gli stessi componenti, quindi resta coerente senza modifiche. Pannelli coinvolti: `CombatStats`, `AttacksPanel`, `SkillsPanel`, `AbilityPanel`, `HomePage` (CA nel riepilogo), pannello lobby. `onQuickRoll` usa i totali modificati. I valori modificati usano una classe CSS `is-buffed`/`is-debuffed` (verde/rosso tenue) e aprono un popover di dettaglio con fonti e bonus scartati.

9. **UI**:
   - **Header**: riga di chip sotto la barra PF, solo se ci sono condizioni o effetti attivi; tap → popover con promemoria, rimozione. Su mobile la riga scorre in orizzontale.
   - **Tab Combattimento**: sezione a scomparsa «Condizioni ed effetti», chiusa di default, posizionata dopo i Punti Ferita. Ordine del tab: Caratteristiche, Punti Ferita, Condizioni ed effetti, CA/TS/manovre, Attacchi. Per questo `CombatStats` è diviso in `HitPointsPanel` e `CombatStats` (stato ricordato per dispositivo in `localStorage`), con il numero di elementi attivi. Aperta contiene: «+ Condizione» (picker con ricerca), «+ Effetto» (preset con ricerca + «Personalizzato»), lista effetti (modifica/disattiva/rimuovi), contatori per danno/risucchio per caratteristica e per i livelli negativi. Gli avvisi critici restano visibili anche da chiusa.
   - **Editor effetto**: nome, nota, righe modificatore (bersaglio, tipo, valore) con aggiunta/rimozione.
   - **Effetti non numerici sugli attacchi**: le condizioni hanno un campo `attackNote` (es. Accecato: «50% di probabilità di mancare»). Il motore le espone come `attackNotes`; il pannello Attacchi le mostra in un riquadro, segna i badge con ⚠ e le aggiunge all'etichetta del tiro rapido. In PF1 Accecato non dà penalità numeriche al tiro per colpire, quindi non si inventa un malus.
   - **Box caratteristiche**: mostrano danno (es. «−3 dan.») e risucchio quando presenti.
   - **Incantesimi**: promemoria del livello dell'incantatore effettivo ridotto quando ci sono livelli negativi.

## Risks / Trade-offs

- **Refactoring ampio dei pannelli**: rischio di regressioni nei numeri esistenti. Mitigazione: test che confrontano `deriveStats` senza modificatori con i calcoli attuali per un personaggio di riferimento, prima di toccare i componenti.
- **Fedeltà alle regole**: alcune interazioni PF1 sono semplificate (bonus condizionali, armature non modellate, penalità di armatura alle abilità). Sono dichiarate come promemoria e non come calcolo, per non dare numeri sbagliati.
- **Errata sul danno di caratteristica**: si adotta la regola aggiornata (danno = −1 al modificatore ogni 2 punti, punteggio invariato). Chi gioca con la regola originale vedrà numeri diversi; da segnalare nel promemoria.
- **Dimensione del documento Firestore**: effetti e condizioni sono pochi elementi; impatto trascurabile.
- **Preset in italiano**: i nomi seguono la traduzione italiana ufficiale per quanto possibile; eventuali discrepanze si correggono nel catalogo senza migrazioni (gli effetti sono copie).
- **Rate di scrittura**: gli stepper scrivono a ogni click, come il resto della scheda; accettabile.
