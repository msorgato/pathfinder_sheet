# Spec Delta

## MODIFIED Requirements

### Requirement: Admin configura il sistema di magia della classe
L'admin SHALL poter abilitare o disabilitare il casting. Se abilitato, SHALL specificare: caratteristica (Intelligenza, Saggezza, Carisma), tipo (preparati o spontanei; per i preparati, con o senza libro degli incantesimi), tradizione (arcana o divina), progressione (piena, media, ridotta; la ridotta solo con incantesimi preparati), lista sorgente esistente (select tra Wizard, Sorcerer, Cleric, Druid, Bard, Paladin, Ranger, nessuna) e/o incantesimi aggiuntivi dalla libreria condivisa, ciascuno con il proprio livello (da 0 al livello massimo della progressione). Il livello proposto è il più basso fra le liste in cui l'incantesimo compare.

#### Scenario: Classe non incantatore
- **WHEN** l'admin lascia il toggle "Incantesimi" disabilitato
- **THEN** nessuna sezione di incantesimi viene mostrata nel character sheet per questa classe

#### Scenario: Classe con lista sorgente
- **WHEN** l'admin abilita gli incantesimi e seleziona "Wizard" come lista sorgente
- **THEN** il campo `spellcasting.sourceList` viene impostato a `'wizard'` e caratteristica, tipo, tradizione e progressione sono proposti come quelli del mago

#### Scenario: Classe con incantesimi custom
- **WHEN** l'admin abilita gli incantesimi e seleziona Palla di Fuoco dalla libreria condivisa
- **THEN** l'incantesimo viene salvato in `spellcasting.customSpells` con livello proposto 3, modificabile

#### Scenario: Progressione ridotta spontanea
- **WHEN** l'admin sceglie la progressione ridotta
- **THEN** il tipo spontaneo non è selezionabile

#### Scenario: Configurazione incompleta
- **WHEN** l'admin abilita gli incantesimi senza lista sorgente e senza caratteristica
- **THEN** l'editor segnala i campi mancanti e la classe non viene trattata come incantatrice finché non sono completi
