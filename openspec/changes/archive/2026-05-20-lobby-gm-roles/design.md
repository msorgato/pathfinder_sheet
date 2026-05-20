## Context

L'app usa Vue 3 + Pinia con Firestore come backend. Non esistono Cloud Functions: tutta la logica è client-side con regole di sicurezza Firestore. La lobby ha già un campo `ownerId` che identifica il creatore; i membri sono sub-documenti in `lobbies/{id}/members/{uid}`. I messaggi di tipo `roll` includono già `rollData`; il flag `hidden` non esiste ancora.

## Goals / Non-Goals

**Goals:**
- Introdurre `gmUid` sulla lobby per tracciare il GM corrente.
- Permettere al GM di trasferire il ruolo a un altro membro (con cambio atomico di `gmUid`).
- Aggiungere `hidden?: boolean` ai messaggi roll; i client dei non-GM filtrano questi messaggi.
- Toggle UI lato GM per impostare se il prossimo tiro sarà nascosto.
- Il GM accede ai propri personaggi esattamente come un giocatore (nessun flusso separato).

**Non-Goals:**
- Ruoli aggiuntivi oltre GM e player.
- Storico dei tiri nascosti accessibile in un secondo momento.
- Notifiche push quando il GM lancia in segreto.
- Gestione del trasferimento in caso di disconnessione/abbandono forzato.

## Decisions

### D1 — `gmUid` sul documento lobby, non sulla sub-collection members

**Scelta:** campo `gmUid: string` direttamente in `lobbies/{id}`.

**Perché:** leggere il ruolo GM non richiede una lettura extra sulla sub-collection. Il vincolo di unicità (un solo GM) è naturale su un singolo campo scalare; con un flag su ogni `LobbyMember` servirebbero query multi-documento e transazioni per garantire l'unicità.

**Alternativa scartata:** campo `role` su `LobbyMember`. Richiederebbe una transazione per garantire che esista un solo `role: 'gm'` e complica le Firestore rules.

### D2 — Trasferimento GM tramite update diretto di `gmUid`

**Scelta:** il client GM scrive direttamente `gmUid = targetUid` sul documento lobby; la Firestore rule valida che `request.auth.uid == resource.data.gmUid` (solo il GM corrente può cambiare il campo).

**Perché:** non servono Cloud Functions per un update atomico su un singolo campo. La regola è semplice da esprimere e atomica per natura su Firestore.

**Alternativa scartata:** due update separati (rimuovi vecchio GM, assegna nuovo). Non atomico, rischio di lobby senza GM.

### D3 — Messaggi nascosti filtrati lato client, `hidden` opzionale su Firestore

**Scelta:** i messaggi nascosti vengono salvati su Firestore con `hidden: true`. Il listener in `lobbyStore` filtra i messaggi con `hidden === true && senderId !== currentUserUid` prima di aggiungerli allo state locale. I messaggi nascosti non vengono mai trasmessi al DOM dei non-GM.

**Perché:** mantenere `hidden` lato Firestore anziché non scrivere il messaggio permette al GM di vedere i propri tiri segreti su tutti i dispositivi. Il filtro client è sufficiente: un utente malintenzionato che aggira il filtro vede solo strutture Firestore, non un vantaggio di gioco rilevante; la sicurezza critica è già garantita dalle security rules (accesso alla lobby = membro).

**Alternativa scartata:** Firestore security rule che blocca la lettura di `hidden: true` ai non-GM. Complicherebbe le query (le rules Firestore non supportano filtri per-documento sulle `list` queries senza riscrivere l'intera struttura con indici custom).

### D4 — Toggle "hidden roll" come stato locale UI, non persistito

**Scelta:** `isHiddenRollEnabled: boolean` su `lobbyStore` come campo reattivo locale (non su Firestore). Il toggle è visibile solo ai GM nell'area DiceRoller.

**Perché:** è preferenza di sessione, non dato di stato condiviso. Semplifica il modello dati e non richiede sync aggiuntivo.

## Risks / Trade-offs

- **Filtro client bypass** → Un utente può leggere i raw Firestore docs e vedere i tiri nascosti. Accettato: le security rules limitano l'accesso alla sub-collection ai membri, e i dati sensibili (tiro del dado) non sono informazioni critiche di sicurezza applicativa.
- **GM abbandona la lobby** → Spec esistente blocca l'owner dall'abbandonare; il GM potrebbe non essere l'owner. Mitigation: aggiungere check che blocca l'abbandono anche se `gmUid === currentUid`, oppure trasferire automaticamente al primo membro disponibile. Decisione da prendere in implementation (preferire blocco esplicito per semplicità).
- **gmUid inizializzato a vuoto** → Le lobby create prima di questo deploy non avranno `gmUid`. Mitigation: il client fa fallback a `ownerId` se `gmUid` è assente; al primo accesso del creatore si auto-assegna il campo.

## Migration Plan

1. Deploy aggiornamento Firestore rules (permette scrittura `gmUid` solo a GM corrente o owner se `gmUid` assente).
2. Deploy frontend con fallback `gmUid ?? ownerId`.
3. Nessuna migrazione batch necessaria: il fallback gestisce le lobby esistenti.
4. Rollback: ripristinare le regole precedenti e il frontend; i campi `gmUid` e `hidden` vengono ignorati dai client vecchi (campi opzionali).

## Open Questions

- Se il GM abbandona la lobby, il ruolo GM viene trasferito automaticamente o la lobby rimane senza GM fino a nomina manuale? (Proposta: blocco abbandono finché il GM non trasferisce il ruolo, come già avviene per l'owner.)
