# Spec Delta

## ADDED Requirements

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
