## ADDED Requirements

### Requirement: Limite di 10 messaggi al minuto per utente nella chat lobby
Il sistema SHALL impedire a un singolo utente di inviare più di 10 messaggi in una qualsiasi finestra di 60 secondi all'interno di una lobby. Tentativi oltre il limite SHALL essere rifiutati con un messaggio di errore visibile nel client.

#### Scenario: Utente entro il limite
- **WHEN** un utente invia 10 messaggi in 60 secondi
- **THEN** tutti i messaggi vengono recapitati correttamente

#### Scenario: Utente supera il limite
- **WHEN** un utente tenta di inviare un 11° messaggio entro 60 secondi dall'ultimo reset
- **THEN** il messaggio viene rifiutato e l'utente vede "Stai inviando messaggi troppo velocemente. Riprova tra qualche secondo."

#### Scenario: Reset automatico dopo 60 secondi
- **WHEN** sono trascorsi 60 secondi dall'inizio della finestra di rate limit
- **THEN** l'utente può tornare ad inviare messaggi normalmente

---

### Requirement: Feedback UI durante il rate limit
Il sistema SHALL mostrare un indicatore visivo nel campo di input della chat quando l'utente è in stato di rate limit, impedendo ulteriori invii fino al reset.

#### Scenario: Input disabilitato durante rate limit
- **WHEN** l'utente ha raggiunto il limite di messaggi
- **THEN** il pulsante di invio è disabilitato e il campo di testo mostra un messaggio di attesa

#### Scenario: Input riabilitato dopo il cooldown
- **WHEN** il periodo di cooldown scade
- **THEN** il pulsante di invio diventa nuovamente attivo senza richiedere azioni dall'utente

---

### Requirement: Rate limit applicato server-side tramite Cloud Function
Il sistema SHALL verificare il rate limit tramite Cloud Function (`onMessageCreate`) che controlla e aggiorna un counter in `users/{uid}/rateLimits/messages`. Il controllo lato client è aggiuntivo (UX) ma non sostitutivo.

#### Scenario: Bypass del controllo client bloccato server-side
- **WHEN** un client invia messaggi direttamente tramite Firestore SDK senza passare dal componente React
- **THEN** la Cloud Function rileva il superamento del limite e cancella il messaggio in eccesso
