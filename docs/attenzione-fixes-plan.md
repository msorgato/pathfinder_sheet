# Piano di Fix — Problemi 🟡 ATTENZIONE

**Riferimento:** `docs/pf1e-validation-report.md`  
**Data piano:** 2026-05-25  
**Stato:** Da applicare

---

## Riepilogo

| # | File | Problemi | Stato |
|---|---|---|---|
| 1 | `src/data/classes/bard.ts` | 4 fix (2 feature mancanti, 2 sostituzioni) | ✅ Applicato |
| 2 | `src/data/classes/cleric.ts` | Progressione 3-20 mancante (Channel Energy scaling) | ✅ Applicato |
| 3 | `src/data/classes/druid.ts` | Timeless Body livello errato + feature Wild Shape mancanti | ✅ Applicato |
| 4 | `src/data/classes/fighter.ts` | Feature lv 19 non-standard + descrizione lv 20 errata | ✅ Applicato |
| 5 | `public/data/feats.json` | Formato BAB inconsistente (11 entry) | ✅ Applicato |

**Già corretti nella sessione precedente (🔴 Critico e parte degli 🟡 Attenzione):**
- Wizard: Talento Bonus ai livelli 5 e 15 ✅ — "Familiare" typo ✅
- Ranger: categorie Nemico Prediletto ✅ — Elusione al livello 9 ✅
- feats.json: typo `previlegio`, `Percezionequando`, `ottiengono`, `Supposizoni` ✅

---

## 1. Bardo (`src/data/classes/bard.ts`)

### Stato attuale
Il Bardo ha al livello 1: `Ispirazione da Bardo (Coraggio)`, `Contromagia da Bardo`, `Fascino da Bardo`.  
I nomi differiscono dai nomi ufficiali PF1e ma le feature *esistono già* sotto forma diversa.  
Mancano completamente **Conoscenza Bardica** e **Distrazione**.

### Fix pianificate

#### A) Aggiungere `Conoscenza Bardica` al livello 1 (MANCANTE)
```typescript
{
  level: 1,
  name: 'Conoscenza Bardica',
  description: 'Aggiunge la metà del livello da bardo (minimo 1) a tutte le prove di Conoscenze, anche quando non è addestrato.',
  type: 'Ex'
}
```

#### B) Aggiungere `Distrazione` al livello 1 (MANCANTE)
```typescript
{
  level: 1,
  name: 'Distrazione',
  description: 'Usa una prova di Esibizione al posto di una prova di Illusione visiva per distrarre un avversario dalla concentrazione sugli incantesimi.',
  type: 'Su'
}
```

#### C) Sostituire `Azione Fulminea` (lv 9) con `Canto del Timore`
`Azione Fulminea` non esiste nel Bardo PF1e base. La feature più vicina al livello 8 è **Dirge of Doom** (Canto del Timore).

```typescript
// Rimuovere:
{ level: 9, name: 'Azione Fulminea', ... }

// Aggiungere al livello 8 (prima di "Ispirazione da Bardo (Eroismo)"):
{
  level: 8,
  name: 'Canto del Timore',
  description: 'Con l\'esibizione può rendere Scosso ogni nemico entro 9 m che lo può vedere e sentire, finché l\'esibizione dura.',
  type: 'Su'
}
```

> **Nota:** Se si preferisce mantenere qualcosa al livello 9, una scelta valida è `Lore Master` (il bardo può ritirare una prova di Conoscenze 1/giorno), che in PF1e è al livello 5. In alternativa il livello 9 può restare vuoto di feature speciali.

#### D) Sostituire `Canzone dei Viaggiatori` (lv 12) con `Esibizione Lenitiva`
`Canzone dei Viaggiatori` non esiste nel Bardo PF1e base. Al livello 12 la feature corretta è **Soothing Performance** (Esibizione Lenitiva).

```typescript
// Rimuovere:
{ level: 12, name: 'Canzone dei Viaggiatori', ... }

// Aggiungere:
{
  level: 12,
  name: 'Esibizione Lenitiva',
  description: 'Con un\'esibizione di 4 round, rimuove il Panico, la Paura e la Rabbia da tutti gli alleati entro 9 m che lo possono vedere e sentire.',
  type: 'Su'
}
```

---

## 2. Chierico (`src/data/classes/cleric.ts`)

### Stato attuale
Presenti solo feature di livello 1. Nessuna entry per livelli 2–20.

### Fix pianificate

Il Chierico PF1e base non acquisisce molte feature discrete oltre al livello 1 — la progressione principale è quella degli incantesimi (già gestita da `spellSlots`). La feature distintiva che scala è **Canalizzare Energia**.

Aggiungere le entry di scaling per Channel Energy e le feature passive di alto livello:

```typescript
// Livello 5
{ level: 5, name: 'Canalizzare Energia (3d6)', description: 'Il dado del Canalizzare Energia aumenta a 3d6.', type: 'Su' },

// Livello 7
{ level: 7, name: 'Canalizzare Energia (4d6)', description: 'Il dado del Canalizzare Energia aumenta a 4d6.', type: 'Su' },

// Livello 9
{ level: 9, name: 'Canalizzare Energia (5d6)', description: 'Il dado del Canalizzare Energia aumenta a 5d6.', type: 'Su' },

// Livello 11
{ level: 11, name: 'Canalizzare Energia (6d6)', description: 'Il dado del Canalizzare Energia aumenta a 6d6.', type: 'Su' },

// Livello 13
{ level: 13, name: 'Canalizzare Energia (7d6)', description: 'Il dado del Canalizzare Energia aumenta a 7d6.', type: 'Su' },

// Livello 15
{ level: 15, name: 'Canalizzare Energia (8d6)', description: 'Il dado del Canalizzare Energia aumenta a 8d6.', type: 'Su' },

// Livello 17
{ level: 17, name: 'Canalizzare Energia (9d6)', description: 'Il dado del Canalizzare Energia aumenta a 9d6.', type: 'Su' },

// Livello 19
{ level: 19, name: 'Canalizzare Energia (10d6)', description: 'Il dado del Canalizzare Energia aumenta a 10d6.', type: 'Su' },
```

> **Formula PF1e:** Channel Energy inizia a 1d6 al livello 1 e aumenta di 1d6 ogni 2 livelli (`livello / 2` arrotondato su, a partire da livello 1 = 1d6). Livelli pari: 2→1d6, 4→2d6, 6→3d6... L'entry al livello 1 nella descrizione attuale dice "Cura... Usa (3+CHA mod) volte/giorno" ma non esplicita il dado — meglio aggiornare anche quella descrizione.

**Aggiornare anche la descrizione al livello 1:**
```typescript
// Prima:
description: 'Libera un\'esplosione di energia divina. Guarisce o danneggia i non-morti in base all\'allineamento. Usa (3+CHA mod) volte/giorno.'
// Dopo:
description: 'Libera un\'esplosione di energia divina da 1d6. Guarisce creature vive o danneggia i non-morti in base all\'allineamento. Il dado aumenta di 1d6 ogni 2 livelli. Usa (3+CHA mod) volte/giorno.'
```

---

## 3. Druido (`src/data/classes/druid.ts`)

### Stato attuale
- `Pelle Millenaria` è al livello 13 — dovrebbe essere al **livello 15**
- Al livello 13 è presente anche `Forma Selvatica (6/giorno)` che rimarrà invariata
- Mancano feature di Wild Shape per i livelli **16, 17, 18, 19**
- Il livello 20 (`Signore dell'Arcano Selvaggio`) è già presente ✅

### Fix pianificate

#### A) Spostare `Pelle Millenaria` da livello 13 a livello 15
```typescript
// Rimuovere dal livello 13:
{ level: 13, name: 'Pelle Millenaria', ... }

// Aggiungere al livello 15 (insieme a Forma Selvatica 7/giorno già presente):
{ level: 15, name: 'Pelle Millenaria', description: 'Immune a ogni effetto di invecchiamento e non invecchia più.', type: 'Ex' }
```

#### B) Aggiungere feature Wild Shape mancanti livelli 16–19

In PF1e il Druido a questi livelli ottiene accesso a forme più potenti:

```typescript
{ level: 16, name: 'Forma Selvatica (Bestia Magica)', description: 'Può assumere la forma di una bestia magica piccola o media (Beast Shape III equivalente). Ancora 6/giorno in questa fase.', type: 'Su' },

{ level: 18, name: 'Forma Selvatica (Bestia Magica Grande)', description: 'Può assumere la forma di una bestia magica grande (Beast Shape IV equivalente). 8/giorno totali.', type: 'Su' },
```

> **Nota:** In PF1e il Druido al livello 16 ottiene Beast Shape III (bestia magica piccola/media) e al livello 18 Beast Shape IV (bestia magica grande). I conteggi esatti di usi/giorno sono: lv 16 → 6/day, lv 18 → 7/day, lv 20 → illimitato (ma questo è già nella descrizione finale). Aggiungere entries solo per lv 16 e 18 è sufficiente per coprire la progressione mancante; lv 17 e 19 non aggiungono nuovi tipi di forma.

---

## 4. Guerriero (`src/data/classes/fighter.ts`)

### Stato attuale
- Level 19: `Armatura della Mente` — non è una feature PF1e del Guerriero base
- Level 20: `Campione d'Armi` — descrizione generica e meccanicamente errata

### Fix pianificate

#### A) Rimuovere `Armatura della Mente` (lv 19)
In PF1e il Guerriero al livello 19 non ha feature speciali oltre al Talento Bonus (già presente).

```typescript
// Rimuovere:
{ level: 19, name: 'Armatura della Mente', description: 'Aggiunge metà del bonus competenza al TS Volontà contro paura.', type: 'Ex' },
```

> **Alternativa:** Se si vuole tenere una feature al lv 19, si può usare `Addestramento alle Armature (Movimento Veloce)` — che sarebbe l'upgrade di Armor Mastery. Ma non è canonico PF1e; meglio rimuovere.

#### B) Aggiornare `Campione d'Armi` (lv 20) con meccaniche Weapon Mastery
```typescript
// Prima:
{
  level: 20,
  name: 'Campione d\'Armi',
  description: 'Ottiene la padronanza assoluta con le armi: +1 aggiuntivo a tutti i tiri d\'attacco e danni.',
  type: 'Ex'
}

// Dopo:
{
  level: 20,
  name: 'Maestria delle Armi',
  description: 'Con l\'arma del Greater Weapon Focus: i critici sono automaticamente confermati, l\'arma non può essere disarmata né distrutta, e il moltiplicatore di critico aumenta di 1.',
  type: 'Ex'
}
```

---

## 5. Talenti (`public/data/feats.json`) — Formato BAB

### Stato attuale
Due formati coesistono nel campo `prerequisites`:
- Senza `+`: `"Bonus di Attacco Base 6"`, `"Bonus di Attacco Base 9"`, ecc.
- Corretto con `+`: `"Bonus di Attacco Base +6"`, `"Bonus di Attacco Base +9"`, ecc.

Questo è rilevante anche per il `prerequisiteChecker.ts` che usa la regex:
```typescript
/bonus di attacco base \+(\d+)|bab \+(\d+)/
```
→ Le entry **senza** `+` non vengono riconosciute, il prerequisito BAB non viene mai validato per quei talenti.

### Fix pianificata
Replace globale in `public/data/feats.json`:
```
"Bonus di Attacco Base 1"  →  "Bonus di Attacco Base +1"
"Bonus di Attacco Base 2"  →  "Bonus di Attacco Base +2"
...fino a...
"Bonus di Attacco Base 16" →  "Bonus di Attacco Base +16"
```

> **Impatto:** Dopo questa fix, il prerequisiteChecker inizierà a bloccare talenti ad alto BAB per personaggi con BAB insufficiente (effetto desiderato). Verificare che non ci siano falsi negativi sui talenti più comuni.

---

## Ordine di priorità consigliato

| Priorità | Fix | Motivo |
|---|---|---|
| 1 | **feats.json BAB** | Bug funzionale nel prerequisiteChecker — talenti con BAB richiesto sono sbloccati erroneamente |
| 2 | **Bardo feature mancanti** | Conoscenza Bardica e Distrazione sono le due feature PF1e più visibili del bardo |
| 3 | **Druido Timeless Body** | Livello errato, facile da correggere |
| 4 | **Guerriero lv 19-20** | Meccaniche errate — rimozione e fix descrizione |
| 5 | **Bardo sostituzioni lv 8-12** | Renaming / sostituzione feature non standard |
| 6 | **Chierico Channel Energy scaling** | Aggiunte puramente descrittive, basso impatto funzionale |
| 7 | **Druido Wild Shape lv 16-19** | Rilevante solo per campagne ad alto livello |

---

*Piano redatto il 2026-05-25. Approvare e confermare prima dell'implementazione.*
