## ADDED Requirements

### Requirement: AdminPanel ha un tab "Classi"
L'AdminPanel SHALL includere un tab "Classi" nella barra di navigazione, accanto ai tab "Talenti", "Incantesimi" e "Libreria Condivisa".

#### Scenario: Tab Classi visibile nell'AdminPanel
- **WHEN** un admin apre l'AdminPanel
- **THEN** un tab "Classi" è visibile nella barra di navigazione

#### Scenario: Navigazione al tab Classi
- **WHEN** l'admin clicca il tab "Classi"
- **THEN** viene mostrata la lista delle classi custom (bozze e pubblicate) dell'admin
- **THEN** è presente il pulsante "+ Aggiungi Classe"

#### Scenario: Tab non visibile a utenti non-admin
- **WHEN** un utente non-admin accede all'AdminPanel (se raggiungibile)
- **THEN** il tab "Classi" non è visualizzato oppure l'intera area admin è inaccessibile
