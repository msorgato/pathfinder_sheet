# Spec Delta

## ADDED Requirements

### Requirement: Presets at a caster level
An effect preset SHALL be applicable at a given caster level. Presets whose bonus grows with caster level SHALL compute it: Scudo della fede +2, +1 every 6 caster levels (maximum +5); Pelle coriacea +2, +1 every 3 caster levels above 3rd (maximum +5). Other presets SHALL be unchanged by the caster level.

#### Scenario: Shield of faith at caster level 6
- **WHEN** Scudo della fede is applied at caster level 6
- **THEN** it grants +3 deflection to AC

#### Scenario: Barkskin at caster level 12
- **WHEN** Pelle coriacea is applied at caster level 12
- **THEN** it grants +5 natural armor

#### Scenario: Preset without scaling
- **WHEN** Forza del toro is applied at caster level 9
- **THEN** it grants +4 enhancement to Strength
