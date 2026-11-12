# Spec Delta

## MODIFIED Requirements

### Requirement: Slot overview
The equipment tab SHALL show a fixed list of all body slots, in the order of the classic character sheet (armor, shield, head, headband, eyes, neck, shoulders, chest, body, belt, wrists, hands, two rings, feet), each with the equipped item or marked as free. Equipped items with no slot (e.g. wielded weapons) SHALL be listed after the slots. The owner SHALL be able to equip a carried item by choosing a free slot. Items beyond a slot's capacity SHALL be shown as inactive.

#### Scenario: Free and occupied slots
- **WHEN** a character wears "Cotta di maglia" and nothing else
- **THEN** the armor slot shows "Cotta di maglia" and every other slot, including both ring slots, is shown as free

#### Scenario: Equip from a free slot
- **WHEN** the owner taps the free shield slot
- **THEN** the carried items for the shield slot are offered, and choosing one equips it

#### Scenario: More items than the slot holds
- **WHEN** two items are equipped in the neck slot
- **THEN** both are shown in the slot and the second is marked "non attivo" because its effects do not apply
