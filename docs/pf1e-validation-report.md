# Rapporto di Validazione Dati PF1e

**Data:** 2026-05-25  
**Progetto:** pathfinder_sheet  
**Validazione:** Hard — confronto con regole ufficiali Pathfinder 1a Edizione (PF1e)

---

## Sintesi

| Scope | Elementi analizzati |
|---|---|
| Classi | 11 file (`src/data/classes/`) |
| Class features | ~120 feature totali |
| Talenti | ~650 entry (`public/data/feats.json`) |

| Livello | Problemi trovati |
|---|---|
| 🔴 Critico | 8 |
| 🟡 Attenzione | 18 |
| 🔵 Suggerimento | 4 |

---

## Problemi Trovati — Classi

### 🔴 CRITICO — `choices` senza `choiceType` (bug silenzioso a runtime)

Il `LevelUpWizard` filtra le feature con `newFeatures.filter(f => !!f.choiceType)`.
Se manca il campo, la schermata di scelta non appare mai durante il level-up.

| Classe | Feature | Fix |
|---|---|---|
| Barbaro | Potere di Furia (ogni livello pari) | aggiungere `choiceType: 'class_list'` |
| Chierico | Domini ×2 | aggiungere `choiceType: 'class_list'` |
| Ranger | Stile di Combattimento | aggiungere `choiceType: 'class_list'` |
| Stregone | Eredità/Stirpe | aggiungere `choiceType: 'class_list'` |
| Mago | Scuola Arcana | aggiungere `choiceType: 'class_list'` |
| Monaco | Stile Pugni | aggiungere `choiceType: 'class_list'` |

**Logica violata:** `src/components/levelup/LevelUpWizard.tsx` — `newFeaturesNeedingChoices = newFeatures.filter(f => !!f.choiceType)`

---

### 🔴 CRITICO — Barbaro (`src/data/classes/barbarian.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Ira** | Descritta come "1/giorno" | In PF1e l'Ira è misurata in **round/giorno**: 4 + mod. COS al livello 1, +2 per ogni livello successivo | Riscrivere la feature con progressione corretta e durata in round |
| **Riduzione del Danno** | Inizia al livello 6 | La DR del Barbaro inizia al **livello 7** (`DR 1/-`) | Spostare la feature al livello 7 |
| **Fiuto (Scent)** | Feature automatica al livello 3 | Non è una feature automatica del Barbaro base; è un **Potere di Furia opzionale** | Rimuovere dalla lista automatica, aggiungere a `choices` dei Poteri di Furia |
| **Attacco Senza Armatura** | Feature al livello 5 | **Non esiste** nel Barbaro PF1e base | Rimuovere |

---

### 🔴 CRITICO — Ladro (`src/data/classes/rogue.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Schivata dell'Evasore** (lv 2) | Descrizione corrisponde a **Uncanny Dodge** ("non viene colto di sorpresa") | In PF1e **Evasion (Elusione)** è al livello 2: se supera il TS su Riflessi subisce 0 danni; **Uncanny Dodge** è al livello 4 | Rinominare in `Elusione`, correggere descrizione |
| **Attacco Furtivo** | Salta da +1d6 (lv1) a +3d6 (lv5) | Il danno aumenta di 1d6 ogni 2 livelli: **+2d6 al livello 3** manca | Aggiungere feature `Attacco Furtivo +2d6` al livello 3 |
| **Elusione Migliorata** | Assente | **Improved Evasion** è una feature automatica al **livello 10** | Aggiungere al livello 10 |

---

### 🔴 CRITICO — Monaco (`src/data/classes/monk.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Raffica di Colpi** | Completamente assente | È la feature **primaria** del Monaco, disponibile dal livello 1 | Aggiungere al livello 1 con la progressione corretta |
| **Resistenza della Mente** (lv 2) | Descritta come immunità ad ammaliamento/illusione | In PF1e **Still Mind** è `+2 ai tiri salvezza contro incantesimi e effetti di Ammaliamento`, non immunità | Correggere la descrizione |

---

### 🔴 CRITICO — Paladino (`src/data/classes/paladin.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Colpire il Male** | Present solo ai livelli 1/5/9/15 | Progressione corretta: **1 uso al livello 1, +1 ogni 3 livelli** (lv 1, 4, 7, 10, 13, 16, 19) | Riscrivere la progressione |
| **Scudo del Bene** (lv 11) | Feature inesistente | **Non esiste** nel Paladino PF1e base | Rimuovere o sostituire con la feature corretta al livello 11 (`Aura di Giustizia`) |

---

### 🟡 ATTENZIONE — Bardo (`src/data/classes/bard.ts`)

| Elemento | Problema | Correzione |
|---|---|---|
| **Inspire Courage** | Assente | Aggiungere `Canzone del Coraggio` al livello 1 |
| **Bardic Knowledge** | Assente | Aggiungere `Conoscenza Bardica` al livello 1 |
| **Countersong** | Assente | Aggiungere `Contromantica` al livello 1 |
| **Distraction** | Assente | Aggiungere `Distrazione` al livello 1 |
| **Fascinate** | Assente | Aggiungere `Fascino` al livello 1 |
| **Azione Fulminea** (lv 9) | Non è una feature standard PF1e del Bardo | Verificare e sostituire con la feature corretta (`Dirge of Doom` o altra) |
| **Canzone dei Viaggiatori** (lv 12) | Non è una feature standard PF1e del Bardo | Verificare e sostituire |

---

### 🟡 ATTENZIONE — Chierico (`src/data/classes/cleric.ts`)

| Elemento | Problema | Correzione |
|---|---|---|
| **Progressione 3-20** | Solo livelli 1-2 definiti | Aggiungere tutta la progressione: Channel Energy scaling, Bonus Feats (se previsti dall'archetipo), ecc. |

---

### 🟡 ATTENZIONE — Druido (`src/data/classes/druid.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Timeless Body** | Al livello 13 | In PF1e è al **livello 15** | Spostare al livello 15 |
| **Wild Shape (forme elementali)** | Mancano le forme livelli 16-19 | Il Druido ottiene accesso a `Elemental Form` e forme maggiori a questi livelli | Aggiungere le feature mancanti |

---

### 🟡 ATTENZIONE — Guerriero (`src/data/classes/fighter.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Armatura della Mente** (lv 19) | Non è una feature del Guerriero PF1e standard | — | Rimuovere o sostituire |
| **Campione d'Armi** (lv 20) | Descrizione generica | Dovrebbe essere **Weapon Mastery**: conferma automatica dei critici, non può essere disarmato, 2× peso danno su critico | Aggiornare descrizione con meccaniche corrette |

---

### 🟡 ATTENZIONE — Mago (`src/data/classes/wizard.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Talento Bonus** | Solo ai livelli 10 e 20 | In PF1e il Mago ottiene Talenti Bonus ai livelli **5, 10, 15, 20** | Aggiungere feature ai livelli 5 e 15 |
| **Familiare** | Scritto "Familare" | — | Correggere in "Familiare" |

---

### 🟡 ATTENZIONE — Ranger (`src/data/classes/ranger.ts`)

| Elemento | Problema | Regola PF1e | Correzione |
|---|---|---|---|
| **Nemico Prediletto** — categorie | Include "Veleni" e "Vermi" | Queste categorie **non esistono** in PF1e; le categorie valide sono tipi di creature (Aberrazioni, Umanoidi, Non Morti, ecc.) | Sostituire con le categorie corrette |
| **Naso da Predatore** (lv 9) | Non è una feature standard PF1e del Ranger | — | Rimuovere o sostituire con la feature corretta |

---

## Problemi Trovati — Talenti (`public/data/feats.json`)

### 🔴 CRITICO — Tipo errato

| ID | Nome | Tipo attuale | Tipo corretto | Note |
|---|---|---|---|---|
| `critico_dissolvente` | Critico Dissolvente | `General` | `Combat` | In PF1e è un Critical feat, sottocategoria di Combat |

---

### 🟡 ATTENZIONE — Formato BAB inconsistente nei prerequisiti

Due formati coesistono nello stesso file:
- `"Bonus di Attacco Base 9"` (senza `+`)
- `"Bonus di Attacco Base +9"` (corretto)

Non causa errori runtime (i prerequisiti sono stringhe display-only) ma è incoerente. Standardizzare al formato con `+`.

---

### 🟡 ATTENZIONE — Typo ricorrenti nel testo

| ID / Area | Testo errato | Testo corretto |
|---|---|---|
| `eidolon_vigile` | `"Percezionequando"` | `"Percezione quando"` |
| `mastro_artigiano` | `"una qualsiasiabilità"` | `"una qualsiasi abilità"` |
| `influenza_leggendaria_migliorata` | `"Si ottiengono"` | `"Si ottengono"` |
| Multipli (5-8 entry) | `"previlegio"` | `"privilegio"` |
| `percepire_supposizoni` | `"Supposizoni"` | `"Supposizioni"` |

---

### 🔵 SUGGERIMENTO — `description` ridondante con `benefit`

In quasi tutti i talenti `description` e `benefit` sono identici. In PF1e il `description` dovrebbe essere una sintesi narrativa, `benefit` la regola meccanica. Valutare se differenziare editorialmente o rimuovere uno dei due campi dall'interfaccia `FeatDefinition`.

---

### 🔵 SUGGERIMENTO — Verifica copertura Item Creation

La sezione Item Creation è presente ma verificare che tutti i talenti standard PF1e siano inclusi: `Scrivere Pergamene`, `Fabbricare Bacchette`, `Costruire Oggetti Meravigliosi`, `Fabbricare Bastoni`, `Fabbricare Anelli`, `Forgiare Armi Magiche`, `Scrivere Libri di Magia`.

---

## Domande Aperte

1. **Ira round/giorno vs usi/giorno:** La scelta di modellare l'Ira come "1/giorno" è una semplificazione intenzionale o un errore? Se intenzionale, documentarla. Se no, serve un sistema di tracking dei round (campo `uses` / `roundsPerDay` sulla feature o sul personaggio).

2. **Domini del Chierico:** In PF1e la scelta del dominio sblocca incantesimi di dominio e una power specifica con effetti meccanici. La gestione attuale via `class_list` registra solo la stringa — è sufficiente per lo scope attuale, o ci si aspetta impatto sul calcolo degli incantesimi?

3. **Archetypes:** Il tipo `CharacterClassEntry` ha `archetypes?: string[]` ma nessun file di classe definisce archetipi. Feature pianificata o out of scope permanente?

4. **Attacco Poderoso (Power Attack):** È prerequisito di decine di talenti in feats.json ma non è stato trovato come entry nella sezione Combat. Verificare se esiste con id `attacco_poderoso` o se manca dall'elenco.

---

## Pattern Ricorrenti

| Pattern | Livello | Classi / File coinvolti | Note |
|---|---|---|---|
| `choices` presenti ma `choiceType` assente | 🔴 | Barbaro, Chierico, Ranger, Stregone, Mago, Monaco | Bug runtime: il wizard non mostra la scelta. Fix sistematico: aggiungere `choiceType: 'class_list'` |
| Feature inventate non presenti in PF1e | 🔴 | Tutte le classi (1-3 feature per classe) | Probabile generazione automatica senza validazione contro il SRD |
| Progressione sparsa o assente oltre il livello 10 | 🟡 | Chierico, Bardo, Druido, Stregone | Le classi hanno densità di feature ai livelli 1-10 e quasi nulla oltre |
| Typo `"previlegio"` → `"privilegio"` | 🟡 | feats.json (5-8 entry) | Correzione sistematica con find-and-replace |
| `description == benefit` nei talenti | 🔵 | feats.json (universale) | Ridondanza strutturale — valutare se eliminare uno dei due campi |

---

*Report generato il 2026-05-25. Da aggiornare dopo le correzioni.*
