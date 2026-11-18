# dice-roll-reveal Specification

## Purpose

Presentazione animata del risultato di un tiro di dadi al centro dello schermo: dadi, bonus con il nome, totale, critico e fumble, con un'impostazione per personaggio.

## Requirements

### Requirement: Roll reveal overlay
When a character with dice animations enabled makes a roll, the system SHALL show a temporary overlay at the center of the screen over a dimmed background. It SHALL appear whether or not the dice panel is open. The result SHALL be decided before the overlay starts, and SHALL equal the total in the history and in the lobby chat.

#### Scenario: Quick roll from the sheet
- **WHEN** the user clicks the Tempra save of a character with animations enabled
- **THEN** the overlay appears at the center of the screen and the roll is also added to the dice history

#### Scenario: Same result everywhere
- **WHEN** the overlay shows a total of 17
- **THEN** the history and the lobby chat message show 17

### Requirement: Reveal sequence
The overlay SHALL present the roll in order: the dice spinning, the dice stopping on their values, each named bonus entering one at a time, then the total. Rolls with more than 5 dice SHALL show no dice: only the values rolled and the total.

#### Scenario: Attack roll
- **WHEN** an attack of 1d20 with bonuses "Base +9", "Benedizione +1" and "Scosso −2" is rolled
- **THEN** the d20 spins and stops, the three bonuses appear one after the other, then the total

#### Scenario: Many dice
- **WHEN** 10d6 are rolled
- **THEN** the overlay shows the ten values and the total, without dice

### Requirement: Skip and close
A tap or click on the overlay during the sequence SHALL jump to its end state. A tap or click after the end SHALL close the overlay. Without interaction, the overlay SHALL close by itself about 1.5 seconds after the total is shown. A new roll SHALL replace the overlay of the previous one.

#### Scenario: Skip
- **WHEN** the user taps the overlay while the dice are spinning
- **THEN** the values, bonuses and total are shown at once

#### Scenario: Auto close
- **WHEN** the total has been shown and the user does nothing
- **THEN** the overlay closes after about 1.5 seconds

### Requirement: Unnamed modifier
A roll without a breakdown of its modifier SHALL show the modifier as a single unnamed entry, and no entry when the modifier is 0. Manual rolls from the dice panel SHALL be animated like the others.

#### Scenario: Manual roll
- **WHEN** the user rolls 2d6+3 with the dice panel's roll button
- **THEN** the overlay shows the two dice, a single "+3" and the total

### Requirement: Critical, threat and fumble
On a single d20, a natural 20 SHALL be presented as a critical and a natural 1 as a fumble, each with its own visual effect. An attack roll whose natural result falls within the weapon's threat range but is below 20 SHALL be presented as a threat.

#### Scenario: Natural 20
- **WHEN** a d20 shows 20
- **THEN** the overlay shows "CRITICO!" with the critical effect

#### Scenario: Threat
- **WHEN** an attack with threat range 19–20 rolls a natural 19
- **THEN** the overlay shows "Minaccia"

#### Scenario: Natural 1
- **WHEN** a d20 shows 1
- **THEN** the overlay shows "FUMBLE!" with the fumble effect

### Requirement: Dice animations setting
Each character SHALL have a "Animazioni dei dadi" setting in its customization panel, enabled by default, including for existing characters. When disabled, rolls SHALL NOT show the overlay and SHALL behave as before (result in the dice panel).

#### Scenario: Existing character
- **WHEN** a character created before this change rolls
- **THEN** the overlay is shown

#### Scenario: Disabled
- **WHEN** the owner disables the setting and rolls
- **THEN** no overlay is shown and the result appears in the dice panel

### Requirement: Reduced motion
When the device asks for reduced motion, the overlay SHALL still appear but without movement, showing values, bonuses and total at once.

#### Scenario: Reduced motion
- **WHEN** reduced motion is active and the character rolls
- **THEN** the overlay shows the final state immediately

### Requirement: Private presentation
The animation SHALL be shown only to the user who rolls. Lobby members SHALL receive the roll in chat as today, without any animation.

#### Scenario: Lobby roll
- **WHEN** a player rolls from the lobby sheet panel
- **THEN** the player sees the overlay and the other members only see the chat message

### Requirement: Named bonuses from the sheet
Rolls started from the sheet SHALL carry the breakdown of their modifier as named entries whose sum equals the modifier: ability checks, saving throws, skills, initiative, CMB, and the global attack chain.

#### Scenario: Save with an effect
- **WHEN** a character with a base Riflessi of +4 wearing a Mantello della Resistenza +1 rolls Riflessi
- **THEN** the overlay shows "+4" for the base and "+1" named after the cloak, and the roll modifier is +5

### Requirement: No spoilers in the dice panel
While the reveal overlay is shown, the dice panel SHALL NOT show the result of that roll. The result SHALL appear in the panel when the overlay closes. With animations disabled the result SHALL appear at once.

#### Scenario: Panel during the reveal
- **WHEN** a roll is made with the dice panel open and the overlay is still playing
- **THEN** the panel shows no result for that roll, and shows it once the overlay is closed

### Requirement: 3D dice
When the reveal shows dice (5 or fewer), it SHALL show them as three-dimensional dice of the rolled type (d4, d6, d8, d10, d12, d20; d100 as a tens die and a units die). The dice SHALL fly in, tumble and come to rest with the face of the rolled value turned towards the viewer, in the character's accent colour. The rolled values SHALL be decided before the animation starts.

#### Scenario: Single d20
- **WHEN** a d20 roll of 17 is revealed on a device that supports 3D graphics
- **THEN** a 3D icosahedron tumbles and stops with the face 17 towards the viewer

#### Scenario: Damage dice
- **WHEN** 2d6 showing 3 and 5 are revealed
- **THEN** two 3D cubes stop showing 3 and 5

#### Scenario: Percentile
- **WHEN** a d100 roll of 47 is revealed
- **THEN** two 3D d10 stop showing 40 and 7

#### Scenario: Accent colour in the lobby
- **WHEN** a player rolls from the lobby sheet panel with a character whose accent colour is blue
- **THEN** the dice and the total are blue, as on the character sheet

#### Scenario: Critical in 3D
- **WHEN** a d20 stops on 20
- **THEN** the die glows gold and the reveal shows "CRITICO!"

### Requirement: 2D fallback
The reveal SHALL use the 2D dice instead of the 3D dice when the device does not support 3D graphics, while the 3D graphics are loading, when reduced motion is requested, or when the 3D scene fails. The rest of the reveal SHALL be the same in all cases.

#### Scenario: No 3D support
- **WHEN** the device has no WebGL
- **THEN** the reveal shows the 2D dice with the same values, bonuses and total

#### Scenario: First load
- **WHEN** the first animated roll happens and the 3D graphics are not loaded yet
- **THEN** that roll shows the 2D dice, and later rolls show the 3D dice once loaded

### Requirement: Dice sounds
When the reveal is shown and the character's "Suoni dei dadi" setting is enabled (enabled by default, including for existing characters), the app SHALL play a short sound of dice rolling and stopping, and a distinct sound for a critical and for a fumble. With the setting disabled, or with dice animations disabled, no sound SHALL be played.

#### Scenario: Sound on
- **WHEN** a character with default settings rolls
- **THEN** a dice sound plays as the dice stop

#### Scenario: Sound off
- **WHEN** the owner disables "Suoni dei dadi" and rolls
- **THEN** the reveal is shown without any sound

#### Scenario: Skip
- **WHEN** the user taps the overlay to skip the animation
- **THEN** the rolling sound stops and the result appears
