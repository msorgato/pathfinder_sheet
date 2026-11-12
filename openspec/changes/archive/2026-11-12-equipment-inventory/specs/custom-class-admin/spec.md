# Spec Delta

## MODIFIED Requirements

### Requirement: Admin definisce i metadati della classe
L'admin SHALL poter definire: nome (stringa, obbligatorio), descrizione (testo libero), dado vita (numero intero 4/6/8/10/12), competenze armatura (categorie selezionabili: leggere, medie, pesanti, scudi, scudo torre), competenze armi (gruppi selezionabili: semplici, da guerra, più un elenco di armi scelte dal catalogo e una nota libera), abilità di classe (lista selezionabile), abilità per livello (numero intero).

#### Scenario: Validazione nome obbligatorio
- **WHEN** l'admin tenta di salvare senza aver inserito il nome
- **THEN** il campo nome mostra un errore e il salvataggio viene bloccato

#### Scenario: Selezione dado vita
- **WHEN** l'admin seleziona il dado vita tra i valori disponibili (4, 6, 8, 10, 12)
- **THEN** il valore viene aggiornato nella bozza

#### Scenario: Competenze strutturate
- **WHEN** l'admin seleziona "Leggere", "Scudi", "Semplici" e aggiunge "Stocco" dal catalogo
- **THEN** i personaggi di quella classe sono competenti in armature leggere, scudi (non torre), armi semplici e stocco

#### Scenario: Migrazione del testo libero
- **WHEN** una classe custom salvata in precedenza ha competenze in testo libero
- **THEN** il testo viene mostrato nella nota delle competenze e nessun dato va perso
