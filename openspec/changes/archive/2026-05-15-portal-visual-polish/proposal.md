## Why

The portal already carries the design 2.0 aesthetic, but several high-impact visual details from the reference prototype remain unimplemented. Users also lack any way to personalise individual characters beyond the global theme, and the creation/level-up wizards are difficult to use because inactive step labels are too dim and body text is too small.

## What Changes

- **Dice-roller FAB**: Replace the current plain Tailwind button with the design 2.0 `.dice-fab` — circular, gold radial gradient, outer dashed ring with `ringSpin` animation, bounce-scale hover/active transforms.
- **Character portrait sigil**: Expand the existing rotating sigil overlay in `CharacterSheet` so it surrounds the initial-letter avatar more dramatically — larger, multi-ring ouroboros sigil matching the design reference (concentric circles + dashed ring + hexagon + dot accents).
- **Per-character accent palette**: Add an `accentColor` field to the `Character` type. Present a fixed palette of 10 evocative named colors (e.g., "Oro Antico", "Verde Foresta", "Bianco Mithral"). When set, the chosen color is applied as a `--char-accent` CSS variable override that tints the character sheet header, HP bar fill, and vital accents.
- **Wizard/LevelUp step label brightness**: Raise the brightness of inactive (future) step labels in `WizardLayout` and `LevelUpWizard` — currently using `--theme-ghost-border` which is nearly invisible.
- **Wizard/LevelUp text size increase**: Slightly enlarge base text, step labels, option card text, and body copy in the wizard and level-up flows.

## Capabilities

### New Capabilities
- `dice-fab-design`: Circular gold floating-die button with animated dashed ring, matching the design 2.0 reference.
- `character-portrait-sigil`: Enhanced multi-ring sigil animation surrounding the character avatar initial letter.
- `character-accent-palette`: Per-character accent color selection stored on `Character.accentColor`, applied as a scoped CSS variable in the sheet.

### Modified Capabilities
- `design-system-2-0`: Wizard step label color tokens and text-size baseline updated.

## Impact

- `src/types/index.ts` — add `accentColor?: string` to `Character`
- `src/store/characterStore.ts` — `accentColor` propagates automatically via existing `updateCharacter`
- `src/pages/CharacterSheet.tsx` — FAB restyled; portrait sigil expanded; color-picker UI added to header; `--char-accent` applied via inline style on root element
- `src/components/wizard/WizardLayout.tsx` — step label colors and text sizes updated
- `src/components/levelup/LevelUpWizard.tsx` — step indicator and body text sizes updated
- `src/index.css` — `.dice-fab` block updated; optional `.char-accent-*` utility tokens added
