# character-inventory Specification

## Purpose

Inventario del personaggio: oggetti posseduti, slot corporei, stato indossato, monete e peso trasportato.

## Requirements

### Requirement: Equipment tab
The character sheet SHALL have an "Equipaggiamento" tab showing the equipped items grouped by body slot, the carried items, the coins, the total weight and the character's proficiencies.

#### Scenario: Open equipment tab
- **WHEN** the owner opens the "Equipaggiamento" tab
- **THEN** equipped items, carried items, coins and total weight are shown

### Requirement: Add item from catalogue
The owner SHALL be able to search the catalogue and add an entry to the inventory with a chosen quantity. The added item SHALL be a copy of the catalogue data, so later catalogue changes do not alter it.

#### Scenario: Add a longsword
- **WHEN** the owner adds "Spada lunga" from the catalogue
- **THEN** the inventory contains a "Spada lunga" with the catalogue's damage, critical, price and weight

### Requirement: Purchase with coins
When adding a catalogue item, the owner SHALL be able to add it for free or purchase it. The purchase price SHALL be pre-filled with price × quantity as a proposal and SHALL be editable (e.g. GM discount) before confirming. Confirming SHALL deduct the paid price from the coins, using other denominations as change. The item's listed price SHALL NOT change.

#### Scenario: Purchase with change
- **WHEN** a character with 0 mo and 2 mp (20 mo) purchases a longsword at the proposed 15 mo
- **THEN** the item is added and the remaining coins are worth 5 mo

#### Scenario: Discounted purchase
- **WHEN** the owner changes the proposed price of a longsword from 15 mo to 10 mo and confirms
- **THEN** 10 mo are deducted and the item still lists a price of 15 mo

### Requirement: Coins never go below zero
A purchase SHALL be refused when the paid price exceeds the total value of all coins, and no coin denomination SHALL ever become negative. The confirm action SHALL be disabled while the price is invalid (negative, not a number, or above available coins), with a message showing the missing amount.

#### Scenario: Insufficient coins
- **WHEN** a character with 12 mo in total enters a purchase price of 15 mo
- **THEN** the confirm action is disabled, the message states that 3 mo are missing, and nothing changes

#### Scenario: Negative price
- **WHEN** the owner enters a purchase price of −5 mo
- **THEN** the confirm action is disabled and the coins are unchanged

#### Scenario: Change keeps denominations non-negative
- **WHEN** a character with 0 mr, 0 ma, 1 mo, 1 mp pays 1 ma
- **THEN** every denomination stays at zero or above and the total decreases by exactly 1 ma

### Requirement: Custom items
The owner SHALL be able to create a custom item with name, kind (weapon, armor, shield, gear), the kind-specific statistics, price, weight, quantity, slot and note, and SHALL be able to edit any inventory item, including those copied from the catalogue.

#### Scenario: Rename a catalogue item
- **WHEN** the owner renames a "Spada lunga" to "Lama del nonno"
- **THEN** the item keeps its statistics and shows the new name everywhere

### Requirement: Body slots
Items SHALL be assignable to one of these slots: armor, shield, head, headband, eyes, neck, shoulders, chest, body, belt, wrists, hands, ring (two), feet, or no slot. Armor entries SHALL default to the armor slot and shields to the shield slot.

#### Scenario: Default slot for armor
- **WHEN** the owner adds "Cotta di maglia"
- **THEN** its slot is armor

### Requirement: Slot overview
The equipment tab SHALL show a fixed list of all body slots, in the order of the classic character sheet (armor, shield, head, headband, eyes, neck, shoulders, chest, body, belt, wrists, hands, two rings, feet), each with the equipped item or marked as free. Equipped items with no slot (e.g. wielded weapons) SHALL be listed after the slots. The owner SHALL be able to equip a carried item by choosing a free slot.

#### Scenario: Free and occupied slots
- **WHEN** a character wears "Cotta di maglia" and nothing else
- **THEN** the armor slot shows "Cotta di maglia" and every other slot, including both ring slots, is shown as free

#### Scenario: Equip from a free slot
- **WHEN** the owner taps the free shield slot
- **THEN** the carried items for the shield slot are offered, and choosing one equips it

#### Scenario: More items than the slot holds
- **WHEN** two items are equipped in the neck slot
- **THEN** both are shown in the slot and the extra one is marked as exceeding the slot

### Requirement: Equipped state
Each item SHALL be either equipped (worn or wielded) or carried. Only equipped armor and shields SHALL affect statistics. Equipping an armor while another armor is equipped SHALL unequip the previous one; the same SHALL apply to shields.

#### Scenario: Swap armor
- **WHEN** the owner equips "Armatura di cuoio" while "Cotta di maglia" is equipped
- **THEN** only "Armatura di cuoio" is equipped and AC reflects it

#### Scenario: Carried armor has no effect
- **WHEN** an armor is in the inventory but not equipped
- **THEN** AC, Dexterity limit and armor check penalty are not affected by it

### Requirement: Quantity and removal
The owner SHALL be able to change an item's quantity and remove an item. Removing an item linked to an attack SHALL keep the attack, which keeps the item's last known statistics.

#### Scenario: Remove linked weapon
- **WHEN** the owner removes a weapon linked to an attack
- **THEN** the attack remains usable with the last known weapon statistics

### Requirement: Informational total weight
The system SHALL show the total weight of the inventory (weight × quantity) and of the coins (50 coins per 0.5 kg). The weight SHALL NOT impose any encumbrance penalty.

#### Scenario: Weight total
- **WHEN** the inventory holds a longsword (2 kg) and 20 arrows (1.5 kg in total)
- **THEN** the total weight shown is 3.5 kg and no stat changes

### Requirement: Owner-only management
Only the character's owner SHALL be able to modify the inventory. Other viewers (e.g. lobby members) SHALL see it read-only where it is shown.

#### Scenario: Read-only for non-owner
- **WHEN** a non-owner views the character
- **THEN** no inventory editing controls are shown

### Requirement: Backward compatibility
Characters without inventory data, or with items in the previous minimal format, SHALL load without errors; previous items SHALL be shown as carried custom items.

#### Scenario: Legacy item
- **WHEN** a character has an old item with only name, type, weight, value, quantity, notes and equipped
- **THEN** it is shown in the inventory with that data and no error occurs
