### Requirement: Multi-ring ouroboros sigil overlays the portrait
The character portrait area in `CharacterSheet` SHALL render a multi-layer animated sigil behind the character initial letter, composed of: outer solid circle (r≈30), middle solid circle (r≈22), inner solid circle (r≈14), a dashed ring, a hexagon or polygon accent, and 6 dot accents at the mid-ring positions.

#### Scenario: Sigil layers are visible
- **WHEN** the character sheet identity header is displayed
- **THEN** the portrait shows concentric sigil rings in gold at low opacity (≤0.2) behind the character initial

---

### Requirement: Counter-rotating ring layer
At least one sigil ring SHALL rotate in the reverse direction using a `ringSpinReverse` animation, creating visual depth and differentiation from the outer ring.

#### Scenario: Counter-rotation is active
- **WHEN** the character sheet is loaded
- **THEN** one sigil ring rotates clockwise and another counter-clockwise simultaneously

---

### Requirement: Character initial remains prominent
The character name initial letter SHALL remain visually dominant over the sigil, rendered at ≥36px in the display font at 0.6 opacity gold.

#### Scenario: Initial is readable over sigil
- **WHEN** the portrait is displayed with the full sigil behind it
- **THEN** the initial letter is clearly legible in front of all sigil layers
