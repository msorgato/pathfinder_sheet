## ADDED Requirements

### Requirement: Circular gold floating-die button
The dice-roller FAB SHALL be a circle (68px desktop, 56px mobile) styled with a gold radial gradient background, gold border, and a gold glow box-shadow. It SHALL use the `.dice-fab` CSS class defined in `src/index.css`.

#### Scenario: Button renders with gold gradient
- **WHEN** the character sheet is displayed
- **THEN** the floating die button appears as a circle with a gold-to-amber radial gradient and visible gold glow

#### Scenario: Hover animation
- **WHEN** the user hovers over the FAB
- **THEN** it scales to 1.08× and rotates 15° with a cubic-bezier bounce transition

#### Scenario: Active (press) animation
- **WHEN** the user presses the FAB
- **THEN** it scales to 0.95× and counter-rotates −30°

### Requirement: Animated dashed outer ring
The `.dice-fab::before` pseudo-element SHALL render a dashed circle ring 8px outside the button boundary and rotate continuously with the existing `ringSpin` animation at 24-second duration and 0.4 opacity.

#### Scenario: Ring spins continuously
- **WHEN** the character sheet is loaded
- **THEN** the dashed gold ring around the FAB rotates indefinitely without pausing

### Requirement: SVG die icon inside FAB
The FAB SHALL contain an SVG die icon (not an emoji) sized 32px on desktop and 28px on mobile, using `currentColor` so it inherits the button's contrasting dark colour.

#### Scenario: Icon scales with button
- **WHEN** the viewport is ≤680px
- **THEN** the FAB shrinks to 56×56px and the icon to 28×28px
