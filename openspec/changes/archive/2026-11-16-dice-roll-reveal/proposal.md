# Proposal

## Why

Oggi un tiro di dado non ha nessuna presentazione: il totale compare di colpo nel pannellino in basso a destra. Il momento del tiro è il più emozionante al tavolo, e la scheda può renderlo vivo. Può anche raccontare da dove arriva il risultato, perché i bonus con il loro nome sono già calcolati.

È la prima di due change: questa porta un'animazione 2D al centro dello schermo; i dadi 3D sono rimandati a una change successiva.

## What Changes

**Rivelazione del tiro**
- A ogni tiro compare al centro dello schermo un overlay temporaneo, con lo sfondo scurito. La sequenza:
  1. i dadi girano;
  2. si fermano sul valore uscito;
  3. i bonus entrano uno alla volta con il loro nome;
  4. compare il totale.
- Un tocco durante l'animazione salta alla fine; un tocco a sequenza conclusa chiude l'overlay. Senza tocchi, l'overlay si chiude da solo circa 1,5 s dopo il totale.
- Fino a 5 dadi sono mostrati animati. Oltre i 5 non compaiono dadi, solo i valori usciti e il totale.
- Il 20 naturale ha un effetto «critico» e l'1 naturale un effetto «fumble».
- Un tiro per colpire che cade nella minaccia dell'arma (es. 19 con minaccia 19–20) mostra «Minaccia».

**Bonus con il nome**
- I tiri lanciati dalla scheda portano la scomposizione del modificatore: tiri salvezza, abilità, caratteristiche, iniziativa, BMC e attacchi.
- I tiri senza scomposizione (es. il «Lancia!» manuale del pannello dadi) mostrano un solo modificatore senza nome.

**Impostazione per personaggio**
- Nuova spunta «Animazioni dei dadi» nelle impostazioni del personaggio, attiva di default.
- Con la spunta disattivata, il tiro torna al comportamento attuale.
- Se il dispositivo chiede movimento ridotto, l'overlay compare comunque, ma senza movimento.

**Invariati**
- La cronologia nel pannello dadi.
- L'invio del risultato in chat della lobby.
- Il risultato, che è sempre deciso prima dell'animazione.
- In lobby l'animazione resta privata: gli altri giocatori non la vedono.

## Capabilities

### New Capabilities
- `dice-roll-reveal`: presentazione animata del risultato di un tiro (overlay, sequenza, salto e chiusura, molti dadi, critico, minaccia e fumble, bonus con il nome), con la sua impostazione per personaggio.

### Modified Capabilities
- `attack-rolls`: il tiro rapido per colpire trasmette anche la minaccia di critico dell'arma e la scomposizione del bonus.

## Impact

**Tipi**
- `Character` riceve `diceAnimations?: boolean`, dove un valore assente vale attivo.
- `RollRequest` riceve i campi opzionali `parts` (bonus con il nome) e `critRange`.

**Interfaccia**
- Nuovo overlay della rivelazione, montato accanto al pannello dadi e visibile anche a pannello chiuso.
- Spunta in `CharacterCustomizationPanel`.
- Le chiamate a `onQuickRoll` di `AbilityPanel`, `CombatStats`, `SkillsPanel` e `AttacksPanel` passano la scomposizione.

**Dipendenze**: nessuna. Solo CSS e Web Animations API.

**Firestore**: un solo campo opzionale nuovo, senza modifiche alle regole.
