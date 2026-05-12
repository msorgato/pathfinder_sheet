## Context

Il pannello `AttacksPanel` ha due zone con bottoni d'attacco:
1. La sezione globale (Mischia / Distanza) con badge per ogni iterazione della catena
2. Le righe per singola arma (`WeaponRow`) con badge per ogni iterazione e uno per i danni

Tutti i bottoni d'attacco condividono lo stesso stile gold/amber ma non hanno indicazione visiva del tipo di attacco né hover state evidente.

## Goals / Non-Goals

**Goals:**
- Aggiungere icona ⚔ nei bottoni mischia e 🏹 nei bottoni distanza
- Rendere evidente l'interattività con hover effect (opacity/brightness) e cursor pointer
- Mantenere coerenza visiva tra la sezione globale e le WeaponRow

**Non-Goals:**
- Modificare la logica di calcolo degli attacchi
- Aggiungere animazioni complesse
- Cambiare il bottone dei danni (rimane viola, nessuna icona di tipo attacco)

## Decisions

**Icone Unicode invece di SVG/libreria**: le emoji ⚔ e 🏹 sono disponibili nativamente, non richiedono dipendenze e si adattano al font size. Alternativa (lucide-react) scartata per non aggiungere una dipendenza per due icone.

**Hover via Tailwind `hover:` classes**: aggiungere `hover:brightness-125` o `hover:opacity-90` ai bottoni esistenti. Alternativa (inline style con onMouseEnter) più verbosa e difficile da mantenere.

**Icona solo sui bottoni d'attacco (non danni)**: il bottone danni è già differenziato per colore (viola vs gold); aggiungere l'icona tipo-attacco sarebbe ridondante e rumoroso.

## Risks / Trade-offs

- [Emoji rendering cross-platform] → le emoji ⚔ e 🏹 hanno resa leggermente diversa su Windows/Mac/Linux, ma sono universalmente supportate e il contesto è un browser moderno → rischio basso
- [Spazio orizzontale] → aggiungere l'icona allarga leggermente ogni badge; con catene lunghe (4 attacchi) potrebbe andare a capo → accettabile, il wrap è già gestito con `flex-wrap`
