## ADDED Requirements

### Requirement: Le classi custom pubblicate sono selezionabili nel character sheet
Il character sheet SHALL mostrare le classi custom pubblicate accanto alle classi built-in nel selettore di classe. Le due sorgenti vengono unite in un unico array ordinato alfabeticamente.

#### Scenario: Classe custom visibile nel selettore
- **WHEN** un utente apre il selettore di classe nel character sheet
- **THEN** tutte le classi pubblicate in `library/classes/entries` appaiono nella lista insieme alle classi built-in

#### Scenario: Nessuna classe custom pubblicata
- **WHEN** la collezione `library/classes/entries` è vuota
- **THEN** il selettore mostra solo le classi built-in senza errori

#### Scenario: Caricamento asincrono classi custom
- **WHEN** il character sheet si carica e le classi custom non sono ancora state recuperate da Firestore
- **THEN** viene mostrato uno stato di caricamento nel selettore, senza bloccare la UI

### Requirement: Il BAB del personaggio usa i valori della classe custom
Il calcolo del BAB del personaggio SHALL leggere `bab[level - 1]` dal documento della classe (built-in o custom), senza distinzione tra le due sorgenti.

#### Scenario: BAB calcolato da classe custom
- **WHEN** un personaggio ha selezionato una classe custom con `bab: [1,2,3,4,5,...]`
- **THEN** al livello N il BAB mostrato è `bab[N-1]`

#### Scenario: Multi-classe con classe custom
- **WHEN** un personaggio ha livelli in una classe built-in e in una classe custom
- **THEN** il BAB totale è la somma dei BAB di ciascuna classe al rispettivo livello

### Requirement: I tiri salvezza usano i valori della classe custom
Il calcolo dei tiri salvezza del personaggio SHALL leggere `saves.fort[level-1]`, `saves.ref[level-1]`, `saves.will[level-1]` dalla classe custom.

#### Scenario: Saves calcolati da classe custom
- **WHEN** un personaggio è al livello 5 in una classe custom con `saves.fort: [0,0,1,1,1,...]`
- **THEN** il bonus base Tempra è `1`

### Requirement: Le capacità speciali della classe custom appaiono nella scheda
Le features della classe custom SHALL essere mostrate nella sezione capacità di classe del character sheet, filtrate per livello (solo quelle con `level <= charLevel`).

#### Scenario: Feature sbloccata al livello attuale
- **WHEN** un personaggio raggiunge il livello a cui una feature è associata
- **THEN** la feature appare nella sezione "Capacità di Classe" con nome, tipo (Ex/Su/Sp) e descrizione

#### Scenario: Feature non ancora sbloccata
- **WHEN** il livello del personaggio è inferiore al livello di sblocco di una feature
- **THEN** la feature non è visibile nella sezione capacità di classe

### Requirement: Graceful handling di classi custom non trovate
Se una classe custom usata da un personaggio non esiste più in `library/classes/entries` (perché ritirata o eliminata), il character sheet SHALL mostrare i dati del personaggio salvati senza crashare.

#### Scenario: Classe ritirata - avviso mostrato
- **WHEN** il character sheet carica un personaggio la cui classe custom non è presente in `library/classes/entries`
- **THEN** viene mostrato un avviso "La classe '[nome]' non è più disponibile nella libreria"
- **THEN** i valori di BAB, saves e features già salvati nel documento del personaggio rimangono visibili

#### Scenario: Nessun crash su classe mancante
- **WHEN** la lookup di una classe custom restituisce `undefined`
- **THEN** il character sheet non lancia eccezioni non gestite e rimane utilizzabile
