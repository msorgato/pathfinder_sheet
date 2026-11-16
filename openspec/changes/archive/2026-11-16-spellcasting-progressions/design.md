# Design

## Context

- **Classi base**: `ClassDefinition.spellcasting` ha `type`, `ability`, `school`, `slots`, `spellsKnown?`, `spellList`, `maxSpellLevel`, `bonusSpellsFromAbility` e `usesSpellbook?`. Le tabelle stanno in `src/data/spellSlots.ts`:
  - `WIZARD_SLOTS`, condivisa da chierico e druido;
  - `SORCERER_SLOTS` e `SORCERER_KNOWN`;
  - `BARD_SLOTS` e `BARD_KNOWN`;
  - `PALADIN_SLOTS`, condivisa dal ranger.
- **Classi custom**: `CustomClassSpellcasting` ha solo `enabled`, `sourceList?` e `customSpells?: string[]`. L'editor propone come lista sorgente le 7 liste base.
- **Livello di un incantesimo**: è letto ovunque con `spell.levels[classId]`. Ci sono circa 12 punti, fra `SpellsPanel`, `LevelUpWizard` e `Step6_Spells`. Per una classe custom `classId` non è una chiave di `levels`, e per questo oggi sono tutte escluse (`isBuiltinClass`).
- **Incantesimi del personaggio**: `KnownSpell` e `PreparedSpell` salvano già `classId` e `spellLevel`, quindi funzionano senza modifiche anche con l'id di una classe custom.
- **Livello dell'incantatore**: `calculations.casterLevel()` restituisce il livello di classe e non la usa nessuno. `spellConsumables.characterLists()` rifà la stessa approssimazione.
- **Prerequisiti**: `effectiveAbilityScores()` somma base, razza, incrementi ed età. È già quanto richiesto, cambia solo il nome. La usano anche `LevelUpWizard` (punti abilità, PF, slot) e `prerequisiteChecker`.
- **Firestore**: le regole non validano i campi delle classi della libreria, quindi i campi nuovi non richiedono modifiche.

## Goals / Non-Goals

**Goals:**
- Un unico punto risponde a «come lancia questa classe» e a «di che livello è questo incantesimo per questa classe», per le classi base e per quelle custom.
- Nessun cambiamento visibile per le classi base, salvo il LI di paladino e ranger.

**Non-Goals:**
- Progressioni inventate o tabelle di slot modificabili dall'admin.
- Domini, scuole di specializzazione, stirpi e misteri per le classi custom.
- Riconsiderare se una pergamena «arcana» sia usabile da qualsiasi incantatore arcano con l'incantesimo in lista: resta il confronto per lista (vedi `spell-consumables`).
- Altre liste sorgente oltre alle 7 attuali, come arcanista o fattucchiere.

## Decisions

### D1. Progressioni come dati
`src/data/spellProgressions.ts`:
```ts
type SpellProgression = 'full' | 'medium' | 'reduced';
interface ProgressionTable { slots: number[][]; known?: number[][]; maxSpellLevel: number }
PROGRESSION_TABLES: {
  full:    { prepared: WIZARD_SLOTS,  spontaneous: SORCERER_SLOTS + SORCERER_KNOWN },  // max 9
  medium:  { prepared: BARD_SLOTS,    spontaneous: BARD_SLOTS + BARD_KNOWN },          // max 6
  reduced: { prepared: PALADIN_SLOTS },                                                // max 4
}
casterLevelFor(progression, classLevel) = progression === 'reduced' ? max(0, classLevel - 3) : classLevel
```
- Le classi base dichiarano `progression` e **mantengono** le loro tabelle.
- Un test verifica che le tabelle di ogni classe base coincidano con quelle della sua progressione, così le due fonti non possono divergere.
- *Alternativa scartata*: togliere le tabelle dalle classi base e ricavarle dalla progressione. È più pulito, ma tocca tutte le classi per un beneficio solo teorico; il test garantisce già la coerenza.

### D2. Modello risolto in `src/utils/spellcasting.ts`
```ts
interface ResolvedSpellcasting {
  classId; ability; type; school; usesSpellbook; progression;
  slots: SpellSlotTable; spellsKnown?: SpellsKnownTable; maxSpellLevel; bonusSpellsFromAbility: true;
  sourceList?: string; customSpellLevels: Record<string, number>;
}
resolveSpellcasting(cls: AnyClassDefinition): ResolvedSpellcasting | null
```
- **Classe base**: `spellcasting` così com'è, più `classId` come «lista».
- **Classe custom**, in ordine:
  1. campi propri;
  2. campi mancanti presi dalla classe base indicata in `sourceList` (eredità per i dati salvati prima);
  3. se manca ancora `ability`, `type` o `progression`, la classe non è incantatrice e la funzione restituisce `null`.
- **Combinazione non valida** (`reduced` + `spontaneous`): la funzione restituisce `null`.

### D3. Livello di un incantesimo per una classe
```ts
spellLevelFor(sc: ResolvedSpellcasting, spell: SpellDefinition): number | undefined
```
- **Ordine di ricerca**:
  1. `customSpellLevels[spell.id]`;
  2. altrimenti, se l'incantesimo è in `customSpells`, il livello proposto;
  3. altrimenti `spell.levels[sourceList ?? classId]`.
- **Livello massimo**: oltre `maxSpellLevel` → `undefined`.
- **`classSpellList(sc, spells)`**: restituisce `{ spell, level }[]` ed è il sostituto di tutti i `spell.levels[classId]`.
- **Livello proposto**: `defaultCustomSpellLevel(spell) = min(Object.values(spell.levels))`, oppure 1 se l'incantesimo non compare in nessuna lista. È usato dall'editor e per leggere i `customSpells` salvati senza livello.
- **Dati**: `customSpells` resta `string[]`, e si aggiunge `customSpellLevels?: Record<string, number>`. In questo modo i dati vecchi restano validi senza migrazione.
  - *Alternativa scartata*: trasformarlo in `{ spellId, level }[]`, che richiederebbe una migrazione dei documenti pubblicati.

### D4. Slot e incantesimi conosciuti
- **`computeSpellSlots`**: prende il modello risolto invece del `classId` e usa `slots`, `bonusSpellsFromAbility` e la caratteristica. La firma passa da `(classId, level, score)` a `(sc, level, score)`.
- **`spellsKnownAtLevel`**: stessa modifica.

### D5. Livello dell'incantatore unico
- **Funzione**: `casterLevel(char, classId)` è calcolato con `casterLevelFor(resolve(classId).progression, livello di classe)`, e vale 0 per le classi non incantatrici.
- **Pergamene e bacchette**: `spellConsumables.usability` usa questa funzione. Una classe custom vale per la propria lista sorgente con il proprio LI.
- **Pulizia**: si rimuovono `calculations.casterLevel` e `armorClass`.

### D6. Prerequisiti
- **Rinomina**: `effectiveAbilityScores` diventa `permanentAbilityScores`. Il JSDoc indica che è il valore usato per i prerequisiti, e che non include oggetti, effetti, danni e risucchi.
- **Comportamento**: invariato per prerequisiti e level-up.

### D7. Interfaccia
- **`CustomClassEditor`**, sezione magia. Quando si sceglie una lista sorgente, caratteristica, tipo, tradizione, progressione e libro vengono compilati con i valori della classe base, ma restano modificabili. Contiene:
  - caratteristica (select);
  - tipo e libro (radio);
  - tradizione (select);
  - progressione (select; «ridotta» disabilita «spontanei»);
  - lista sorgente;
  - incantesimi aggiuntivi, con un campo «livello» accanto a ogni selezionato.
  Un avviso elenca i campi mancanti.
- **`SpellsPanel`, `LevelUpWizard` e `Step6_Spells`**: filtrano con `resolveSpellcasting(cls) !== null` invece di `isBuiltinClass`, e leggono livelli e slot da D2–D4. L'avviso di fallimento degli incantesimi arcani usa `school` dal modello risolto.

## Risks / Trade-offs

- **[Circa 12 punti da migrare]** Dimenticarne uno lascia una classe custom con liste vuote in quel punto. → Un test di ricerca nel codice impedisce che restino `levels[` fuori da `spellcasting.ts`, e uno smoke test per ciascun componente usa una classe custom.
- **[Le classi base cambiano solo nel LI]** Paladini e ranger di livello 1–3 hanno LI 0: le pergamene di paladino mostreranno la prova di livello dell'incantatore. → È la regola corretta, e lo spec lo dichiara.
- **[Configurazioni custom incoerenti]** Per esempio progressione ridotta con una lista che arriva al 9° livello. → `maxSpellLevel` taglia la lista, e l'editor mostra quanti incantesimi restano esclusi.
- **[Classi custom pubblicate con solo `customSpells`, senza lista sorgente]** Senza caratteristica restano non incantatrici. → L'editor le segnala; l'admin deve completarle e ripubblicarle.

## Migration Plan

Tutti i campi nuovi sono opzionali, e le classi custom esistenti con una lista sorgente ereditano subito il resto della configurazione. Non serve un'operazione sui dati. Per tornare indietro basta ripristinare il codice: i campi aggiunti vengono ignorati.
