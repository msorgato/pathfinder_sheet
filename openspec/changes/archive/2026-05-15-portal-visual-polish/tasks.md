## 1. CSS — Dice FAB and animations

- [x] 1.1 Replace the `.dice-fab` block in `src/index.css` with the full design 2.0 version: `border-radius: 50%`, gold `radial-gradient` background, gold border, multi-layer `box-shadow` glow, `z-index: 50`, bounce `transition`
- [x] 1.2 Add `.dice-fab:hover` (scale 1.08, rotate 15°) and `.dice-fab:active` (scale 0.95, rotate −30°) rules
- [x] 1.3 Add `.dice-fab::before` dashed-ring pseudo-element: `inset: -8px`, `border-radius: 50%`, `border: 1px dashed var(--gold)`, `opacity: 0.4`, `animation: ringSpin 24s linear infinite`
- [x] 1.4 Add `@keyframes ringSpinReverse { to { transform: rotate(-360deg); } }` to `src/index.css`
- [x] 1.5 Update the mobile media query for `.dice-fab` (already present at 680px breakpoint) to ensure sizes match (56×56px, icon 28px)

## 2. CharacterSheet — Dice FAB button

- [x] 2.1 Remove the Tailwind utility classes from the floating die `<button>` in `src/pages/CharacterSheet.tsx` and replace with `className="dice-fab"`
- [x] 2.2 Replace the `🎲` emoji inside the button with an inline SVG die icon (32×32, `fill="none"`, `stroke="currentColor"`, strokeWidth 1.6) — same icon as `Icon.dice` in the design reference
- [x] 2.3 Remove the now-redundant inline `style` overrides (background, color, border, borderRadius) from the FAB button; keep only the `title` and `onClick` props

## 3. CharacterSheet — Portrait sigil expansion

- [x] 3.1 Replace the single-layer sigil SVG in the portrait section of `src/pages/CharacterSheet.tsx` with a multi-ring ouroboros: outer circle (r≈30), middle solid circle (r≈22), inner circle (r≈14), dashed ring (strokeDasharray "2 4" on r≈22), 6 dot accents at r=22 positions at 0°/60°/120°/180°/240°/300°
- [x] 3.2 Add a second SVG layer (or group) with a hexagon/polygon (points matching a regular hexagon inscribed at r≈28) that uses `animation: ringSpinReverse 90s linear infinite` for counter-rotation, opacity 0.12
- [x] 3.3 Ensure the character initial `<div>` sits above the sigil layers by using `position: relative; z-index: 1` on the initial wrapper

## 4. Palette definition

- [x] 4.1 Add a `CHARACTER_PALETTES` const to `src/themes.ts` with 10 entries, each `{ id: string, name: string, hex: string }` — the 10 named colours defined in the spec (Oro Antico, Ametista, Sangue Antico, Verde Foresta, Bianco Mithral, Azzurro Celeste, Ambra Solare, Rosa del Tramonto, Ruggine del Ferro, Ombra Viola)

## 5. Character type — accentColor field

- [x] 5.1 Add `accentColor?: string` to the `Character` interface in `src/types/index.ts`

## 6. CharacterSheet — accent colour picker and CSS variable injection

- [x] 6.1 In `src/pages/CharacterSheet.tsx`, add `style={{ '--char-accent': char.accentColor ?? 'var(--gold)' } as React.CSSProperties}` to the root `<div>`
- [x] 6.2 Add a colour-picker row in the identity header below the HP bar: 10 small circular swatches (20px), each using the `CHARACTER_PALETTES` hex as `backgroundColor`. Active swatch has a `2px solid white` ring outline. Clicking calls `updateCharacter(char.id, { accentColor: hex })`
- [x] 6.3 Update HP bar fill colour in CharacterSheet header from hardcoded gold to `var(--char-accent, var(--gold))`
- [x] 6.4 Update the sigil overlay colour in the portrait to use `var(--char-accent, var(--gold))`
- [x] 6.5 Update the rotating-ring colour in the portrait to use `var(--char-accent, var(--gold))`

## 7. Wizard — step label brightness

- [x] 7.1 In `src/components/wizard/WizardLayout.tsx`, change the inactive (future) step label colour from `var(--theme-ghost-border)` to `var(--ink-mute)` or `rgba(255,255,255,0.45)`
- [x] 7.2 In `src/components/levelup/LevelUpWizard.tsx`, change the future-step indicator bar colour from `var(--theme-ghost-border)` to a visible muted tone (e.g. `var(--line-mid)`)

## 8. Wizard — text size increases

- [x] 8.1 In `src/components/wizard/WizardLayout.tsx`, increase step label font size from `text-xs` (12px) — verify and set to explicit `fontSize: 12` minimum; increase title text to at least `text-lg`
- [x] 8.2 In `src/components/wizard/Step1_Race.tsx` (and equivalently Step2_Class), increase option card title to ≥15px and description to ≥13px
- [x] 8.3 In `src/components/levelup/LevelUpWizard.tsx`, increase the body text of choice cards and section headers by 1–2px
