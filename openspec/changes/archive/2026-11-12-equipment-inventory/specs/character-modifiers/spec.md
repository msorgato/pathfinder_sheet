# Spec Delta

## MODIFIED Requirements

### Requirement: Armor Class variants and Dexterity loss
The system SHALL compute Armor Class, touch AC and flat-footed AC. AC SHALL include the armor bonus of the equipped armor and the shield bonus of the equipped shield, and the positive Dexterity modifier SHALL be capped by their maximum Dexterity bonus. Touch AC SHALL exclude armor, shield and natural armor bonuses. Flat-footed AC SHALL exclude a positive Dexterity modifier and dodge bonuses. When an active condition makes the character lose its Dexterity bonus to AC, normal AC and CMD SHALL also exclude a positive Dexterity modifier and dodge bonuses. Penalties to AC SHALL also apply to CMD.

#### Scenario: Flat-footed condition
- **WHEN** a character with Dexterity modifier +3 becomes flat-footed
- **THEN** AC and CMD no longer include the +3

#### Scenario: Equipped armor in AC variants
- **WHEN** a character with Dexterity +2 wears "Armatura di cuoio borchiato" (+3, max Dex +5)
- **THEN** AC is 15, touch AC is 12 and flat-footed AC is 13
