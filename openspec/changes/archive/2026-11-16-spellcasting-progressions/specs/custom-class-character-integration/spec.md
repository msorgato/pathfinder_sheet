# Spec Delta

## ADDED Requirements

### Requirement: Le classi custom incantatrici lanciano incantesimi come le classi built-in
Una classe custom pubblicata con incantesimi abilitati e configurazione completa SHALL comparire nella sezione Incantesimi della scheda, nel level-up e nella creazione del personaggio. Slot, incantesimi conosciuti, preparazione, CD (10 + livello dell'incantesimo + modificatore della caratteristica) e livello dell'incantatore SHALL essere calcolati come per una classe built-in.

#### Scenario: Incantatore custom nella scheda
- **WHEN** un personaggio ha 3 livelli in una classe custom con progressione piena, incantesimi preparati, Intelligenza e lista sorgente Mago
- **THEN** la sezione Incantesimi mostra quella classe con gli slot del mago di 3° livello e i suoi incantesimi

#### Scenario: Level-up
- **WHEN** quel personaggio sale al 4° livello nella classe custom
- **THEN** il level-up propone la scelta degli incantesimi come per un mago

#### Scenario: Classe custom senza magia
- **WHEN** la classe custom ha gli incantesimi disabilitati
- **THEN** non compare nella sezione Incantesimi
