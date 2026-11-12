# Spec Delta

## MODIFIED Requirements

### Requirement: Armor and shield bonus to AC
An equipped armor SHALL add its armor bonus and an equipped shield its shield bonus to AC and flat-footed AC, as typed modifiers named after the item; the item's enhancement bonus SHALL be included in that bonus. They SHALL follow the existing stacking rules (e.g. Armatura magica and a worn armor do not stack) and SHALL NOT apply to touch AC.

#### Scenario: Chain shirt and heavy shield
- **WHEN** a character with Dexterity +1 equips "Giaco di maglia" (+4) and "Scudo pesante di legno" (+2)
- **THEN** AC is 17, touch AC is 11 and flat-footed AC is 16

#### Scenario: Armor does not stack with Armatura magica
- **WHEN** a character wears a +4 armor and is under Armatura magica (+4 armor)
- **THEN** only one +4 armor bonus applies and the other is shown as not stacked

#### Scenario: Enhanced shield
- **WHEN** a character equips a heavy wooden shield +2
- **THEN** the shield bonus to AC is +4
