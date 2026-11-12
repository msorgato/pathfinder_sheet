# item-enhancements Specification

## Purpose

Qualità perfetta, bonus di potenziamento, materiali speciali e capacità speciali di armi, armature e scudi dell'inventario, con i loro effetti su statistiche e prezzo secondo le regole PF1.

## Requirements

### Requirement: Weapon masterwork and enhancement
A weapon SHALL be able to be masterwork and to have an enhancement bonus from +1 to +5; an enhanced weapon is always masterwork. Masterwork SHALL give +1 enhancement on attack rolls only. An enhancement bonus SHALL apply as an enhancement bonus to attack and damage rolls with that weapon; it does not stack with the masterwork bonus.

#### Scenario: Masterwork longsword
- **WHEN** a character attacks with a masterwork longsword
- **THEN** the to-hit includes +1 and the damage does not change

#### Scenario: Longsword +1
- **WHEN** a character attacks with a longsword +1
- **THEN** to-hit and damage include +1 each, and the masterwork bonus is not added on top

### Requirement: Armor masterwork and enhancement
An armor or shield SHALL be able to be masterwork and to have an enhancement bonus from +1 to +5; an enhanced armor is always masterwork. Masterwork SHALL reduce the armor check penalty by 1 (to a minimum of 0). The enhancement bonus SHALL add to the item's armor or shield bonus.

#### Scenario: Chainmail +1
- **WHEN** a character wears "Cotta di maglia" +1
- **THEN** the armor bonus to AC is +7 and the armor check penalty is −4

### Requirement: Special materials
An item SHALL be able to be made of one special material among Mithral, Adamantio, Ferro freddo, Argento alchemico and Legnoscuro. Mithral, Adamantio and Legnoscuro make the item masterwork; Ferro freddo and Argento alchemico do not. Effects that only matter against damage reduction or hardness SHALL be shown as a note on the item and on its attacks.

#### Scenario: Cold iron note
- **WHEN** an attack uses a cold iron longsword
- **THEN** the attack shows the note "Ferro freddo: supera la RD/ferro freddo"

### Requirement: Mithral armor
Mithral armor and shields SHALL have maximum Dexterity increased by 2, armor check penalty reduced by 3 (minimum 0, instead of, not in addition to, the masterwork reduction), arcane spell failure reduced by 10% (minimum 0) and half weight. Mithral armor SHALL count as one category lighter for speed, but not for proficiency.

#### Scenario: Mithral chain shirt
- **WHEN** a character wears a mithral "Giaco di maglia"
- **THEN** its armor bonus is +4, maximum Dexterity +6, armor check penalty 0 and arcane spell failure 10%

#### Scenario: Mithral breastplate speed
- **WHEN** a human wears a mithral "Corazza di piastre" (medium armor)
- **THEN** speed stays 9 m and proficiency in medium armor is still required

### Requirement: Darkwood and alchemical silver
Legnoscuro shields SHALL reduce the armor check penalty by 2 (minimum 0, instead of the masterwork reduction) and weigh half. Argento alchemico weapons SHALL take −1 on damage rolls.

#### Scenario: Darkwood shield
- **WHEN** a character equips a darkwood heavy wooden shield
- **THEN** its armor check penalty is 0

#### Scenario: Alchemical silver dagger
- **WHEN** a character rolls damage with an alchemical silver dagger
- **THEN** the damage modifier includes −1 "Argento alchemico"

### Requirement: Special abilities
A weapon, armor or shield with an enhancement bonus of at least +1 SHALL be able to have special abilities chosen from a curated list. The total of the enhancement bonus and of the abilities' bonus equivalents SHALL NOT exceed +10. Each ability SHALL apply its automatic effects (extra damage dice, threat range, typed modifiers) and show the rest as a note.

#### Scenario: Flaming longsword
- **WHEN** a character attacks with a flaming longsword +1
- **THEN** the attack shows an extra "+1d6 fuoco" damage roll

#### Scenario: Keen weapon
- **WHEN** a longsword (19–20) is keen
- **THEN** its threat range is 17–20

#### Scenario: Shadow armor
- **WHEN** a character wears a +1 shadow armor
- **THEN** Furtività gets +5 competence named after the armor

#### Scenario: Bonus cap
- **WHEN** the owner adds abilities to a +5 weapon for a total above +10
- **THEN** the abilities that would exceed the cap cannot be selected

#### Scenario: No abilities without enhancement
- **WHEN** a weapon has no enhancement bonus
- **THEN** no special ability can be added

### Requirement: Computed list price
The list price of a weapon, armor or shield SHALL be computed from its base price plus masterwork (300 mo weapon, 150 mo armor or shield, not added when the material already makes it masterwork), the material cost and the enhancement cost: (enhancement + ability bonus equivalents)² × 2,000 mo for weapons and × 1,000 mo for armor and shields, plus the flat costs of abilities. The purchase dialog SHALL propose this price, still editable.

#### Scenario: Longsword +1 price
- **WHEN** a longsword (15 mo) is made +1
- **THEN** its list price is 2,315 mo

#### Scenario: Flaming longsword +1 price
- **WHEN** a longsword +1 gets the Infuocata ability (+1 equivalent)
- **THEN** its list price is 8,315 mo

#### Scenario: Mithral chain shirt price
- **WHEN** a "Giaco di maglia" (100 mo) is made of mithral
- **THEN** its list price is 1,100 mo

### Requirement: Cold iron price
A cold iron weapon SHALL cost double its base price, and its first enhancement SHALL add 2,000 mo once, not once per added ability.

#### Scenario: Cold iron longsword price
- **WHEN** a longsword (15 mo) is made of cold iron and +1
- **THEN** its list price is 30 + 2,000 + 2,000 + 300 = 4,330 mo
