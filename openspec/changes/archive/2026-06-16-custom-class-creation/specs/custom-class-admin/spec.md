## ADDED Requirements

### Requirement: Admin può creare una nuova classe custom
L'admin SHALL poter creare una nuova classe custom vuota dal tab "Classi" dell'AdminPanel. La classe viene salvata come bozza nella sottocollezione `users/{adminUid}/customClasses/{classId}` con `status: 'draft'`.

#### Scenario: Creazione nuova classe
- **WHEN** l'admin clicca "+ Aggiungi Classe" nel tab Classi
- **THEN** viene creata una bozza con valori di default (hitDie=8, bab di 20 zeri, saves di 20 zeri, features=[]) e l'editor si apre in modalità espansa

#### Scenario: Salvataggio bozza
- **WHEN** l'admin compila i campi obbligatori (nome) e clicca "Salva"
- **THEN** la bozza viene persistita su Firestore e la classe appare nell'elenco con badge "Bozza"

### Requirement: Admin definisce i metadati della classe
L'admin SHALL poter definire: nome (stringa, obbligatorio), descrizione (testo libero), dado vita (numero intero 4/6/8/10/12), competenze armatura (testo libero), competenze armi (testo libero), abilità di classe (lista selezionabile), abilità per livello (numero intero).

#### Scenario: Validazione nome obbligatorio
- **WHEN** l'admin tenta di salvare senza aver inserito il nome
- **THEN** il campo nome mostra un errore e il salvataggio viene bloccato

#### Scenario: Selezione dado vita
- **WHEN** l'admin seleziona il dado vita tra i valori disponibili (4, 6, 8, 10, 12)
- **THEN** il valore viene aggiornato nella bozza

### Requirement: Admin definisce il BAB manualmente per ogni livello
L'admin SHALL poter inserire il valore di BAB per ciascuno dei 20 livelli. I valori devono essere numeri interi non negativi.

#### Scenario: Griglia BAB a 20 livelli
- **WHEN** l'admin apre la sezione "Base Attack Bonus" nell'editor della classe
- **THEN** vengono visualizzati 20 campi numerici, uno per livello, disposti in una griglia compatta

#### Scenario: Validazione valori BAB
- **WHEN** l'admin inserisce un valore non numerico o negativo in un campo BAB
- **THEN** il campo mostra un errore di validazione e il salvataggio è bloccato

#### Scenario: Helper preset BAB
- **WHEN** l'admin clicca "Compila: Full BAB"
- **THEN** i 20 campi vengono precompilati con la progressione full BAB (1,2,3,...,20)
- **WHEN** l'admin clicca "Compila: 3/4 BAB"
- **THEN** i 20 campi vengono precompilati con la progressione 3/4 BAB (0,1,2,3,3,4,...)
- **WHEN** l'admin clicca "Compila: 1/2 BAB"
- **THEN** i 20 campi vengono precompilati con la progressione 1/2 BAB (0,1,1,2,2,3,...)

### Requirement: Admin definisce i Tiri Salvezza manualmente per ogni livello
L'admin SHALL poter inserire i valori di Tempra, Riflessi e Volontà per ciascuno dei 20 livelli. I valori sono numeri interi non negativi.

#### Scenario: Tre sezioni tiri salvezza
- **WHEN** l'admin apre la sezione "Tiri Salvezza" dell'editor
- **THEN** vengono mostrate tre griglie separate (Tempra, Riflessi, Volontà), ciascuna con 20 campi numerici

#### Scenario: Helper preset Good/Poor
- **WHEN** l'admin clicca "Buono" accanto a un tiro salvezza
- **THEN** i 20 valori vengono precompilati con la progressione Good (+2,+3,+3,...+12)
- **WHEN** l'admin clicca "Scarso"
- **THEN** i 20 valori vengono precompilati con la progressione Poor (+0,+0,+1,+1,...+6)

### Requirement: Admin gestisce le capacità speciali della classe
L'admin SHALL poter aggiungere, modificare e rimuovere capacità speciali. Ogni capacità ha: nome (obbligatorio), descrizione (testo libero), livello di sblocco (1-20, obbligatorio), tipo (Ex/Su/Sp/Speciale), modificatori meccanici (testo libero, opzionale).

#### Scenario: Aggiunta capacità speciale
- **WHEN** l'admin clicca "+ Aggiungi Capacità" nella sezione features
- **THEN** viene aggiunta una nuova riga/card vuota con i campi da compilare

#### Scenario: Ordinamento automatico per livello
- **WHEN** l'admin salva la classe dopo aver aggiunto capacità con livelli diversi
- **THEN** le capacità vengono visualizzate in ordine crescente di livello di sblocco

#### Scenario: Eliminazione capacità
- **WHEN** l'admin clicca il pulsante elimina su una capacità speciale
- **THEN** la capacità viene rimossa dalla lista (senza conferma aggiuntiva, essendo solo una bozza)

### Requirement: Admin configura il sistema di magia della classe
L'admin SHALL poter abilitare o disabilitare il casting. Se abilitato, SHALL poter specificare: lista sorgente esistente (select tra Wizard, Sorcerer, Cleric, Druid, Bard, Paladin, Ranger, nessuna) e/o una lista di ID incantesimi custom selezionabili dalla libreria condivisa.

#### Scenario: Classe non incantatore
- **WHEN** l'admin lascia il toggle "Incantesimi" disabilitato
- **THEN** nessuna sezione di incantesimi viene mostrata nel character sheet per questa classe

#### Scenario: Classe con lista sorgente
- **WHEN** l'admin abilita gli incantesimi e seleziona "Wizard" come lista sorgente
- **THEN** il campo `spellcasting.sourceList` viene impostato a `'wizard'`

#### Scenario: Classe con incantesimi custom
- **WHEN** l'admin abilita gli incantesimi e seleziona incantesimi dalla libreria condivisa
- **THEN** gli ID degli incantesimi selezionati vengono salvati in `spellcasting.customSpells`

### Requirement: Admin può eliminare una bozza
L'admin SHALL poter eliminare una classe in stato draft. Le classi pubblicate non possono essere eliminate direttamente (devono prima essere ritirate).

#### Scenario: Eliminazione bozza
- **WHEN** l'admin clicca "Elimina" su una classe draft e conferma
- **THEN** il documento viene rimosso da `users/{adminUid}/customClasses/{classId}`

#### Scenario: Impossibile eliminare una classe pubblicata
- **WHEN** l'admin tenta di eliminare una classe con status `published`
- **THEN** viene mostrato un messaggio: "Ritira la classe dalla libreria prima di eliminarla"
