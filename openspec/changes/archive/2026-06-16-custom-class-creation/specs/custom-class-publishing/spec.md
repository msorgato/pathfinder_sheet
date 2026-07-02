## ADDED Requirements

### Requirement: Admin pubblica una classe custom
L'admin SHALL poter pubblicare una classe draft sulla collezione condivisa `library/classes/entries/{classId}`. La pubblicazione copia il documento nella collezione condivisa e aggiorna `status` a `'published'` nel draft originale.

#### Scenario: Pubblicazione classe valida
- **WHEN** l'admin clicca "Pubblica" su una classe draft con nome compilato
- **THEN** la classe viene scritta su `library/classes/entries/{classId}` con `status: 'published'` e `publishedAt` impostato al timestamp corrente
- **THEN** il documento in `users/{adminUid}/customClasses/{classId}` viene aggiornato con `status: 'published'`
- **THEN** la classe appare nell'elenco con badge "Pubblicata"

#### Scenario: Pubblicazione classe senza nome
- **WHEN** l'admin tenta di pubblicare una classe senza nome
- **THEN** la pubblicazione viene bloccata con messaggio di errore

#### Scenario: Re-pubblicazione dopo modifica
- **WHEN** l'admin modifica una classe già pubblicata e clicca "Pubblica" di nuovo
- **THEN** il documento in `library/classes/entries/{classId}` viene sovrascritto con i nuovi dati
- **THEN** un badge "Modifiche non pubblicate" scompare

### Requirement: Badge stato pubblicazione
L'admin SHALL visualizzare lo stato attuale di ogni classe custom (Bozza / Pubblicata / Modifiche non pubblicate).

#### Scenario: Bozza mai pubblicata
- **WHEN** una classe ha `status: 'draft'` e non ha mai avuto `publishedAt`
- **THEN** viene mostrato il badge "Bozza"

#### Scenario: Modifiche non pubblicate
- **WHEN** una classe ha `status: 'published'` ma `updatedAt > publishedAt`
- **THEN** viene mostrato il badge "Modifiche non pubblicate"

### Requirement: Admin ritira una classe pubblicata
L'admin SHALL poter ritirare una classe dalla libreria condivisa. Il ritiro rimuove il documento da `library/classes/entries` e riporta `status` a `'draft'`.

#### Scenario: Ritiro classe
- **WHEN** l'admin clicca "Ritira" su una classe pubblicata e conferma
- **THEN** il documento viene rimosso da `library/classes/entries/{classId}`
- **THEN** `status` nel draft viene aggiornato a `'draft'`
- **THEN** la classe non è più selezionabile nel character sheet per nuovi personaggi

#### Scenario: Personaggi con classe ritirata
- **WHEN** una classe viene ritirata mentre dei personaggi la stanno usando
- **THEN** il character sheet mostra i dati salvati del personaggio con un avviso "Classe non più disponibile"
- **THEN** i calcoli del personaggio usano i valori già salvati nel documento del personaggio

### Requirement: Firestore rules per le classi custom
Le regole Firestore SHALL garantire che solo l'admin possa scrivere su `library/classes/entries` e su `users/{adminUid}/customClasses`. Tutti gli utenti autenticati SHALL poter leggere `library/classes/entries`.

#### Scenario: Scrittura non-admin bloccata
- **WHEN** un utente non-admin tenta di scrivere su `library/classes/entries/{classId}`
- **THEN** la richiesta Firestore viene rifiutata con errore di permesso

#### Scenario: Lettura classi pubblicate
- **WHEN** un utente autenticato legge `library/classes/entries`
- **THEN** la richiesta viene accettata e restituisce tutte le classi pubblicate

#### Scenario: Admin legge le proprie bozze
- **WHEN** l'admin legge `users/{adminUid}/customClasses`
- **THEN** la richiesta viene accettata
- **WHEN** un altro utente tenta di leggere `users/{adminUid}/customClasses`
- **THEN** la richiesta viene rifiutata
