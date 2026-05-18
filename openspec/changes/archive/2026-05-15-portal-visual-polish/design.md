## Context

The portal runs React 19 + TypeScript + Vite + Tailwind CSS 4. Visual tokens live in `src/index.css` as CSS custom properties. The `Character` type is in `src/types/index.ts`. The dice-roller FAB is currently a plain Tailwind `<button>` in `CharacterSheet.tsx`. The portrait sigil is an inline SVG with a single `ringSpin` animation. The wizard step labels use `var(--theme-ghost-border)` for inactive steps, which maps to a near-invisible colour in the current theme. The design 2.0 reference (`design 2.0/styles.css`, `design 2.0/sigils.jsx`) defines both the `.dice-fab` CSS and the multi-ring ouroboros sigil.

## Goals / Non-Goals

**Goals:**
- Dice FAB visually matches the design 2.0 reference (circular, gold gradient, animated dashed outer ring)
- Portrait sigil is expanded to a richer multi-ring ouroboros that frames the character initial
- Each character can store and display a named accent colour from a fixed palette of 10
- Inactive wizard/LevelUp step labels are legible (minimum ~40% brightness)
- Wizard and LevelUp text sizes are slightly larger (roughly +1–2px on key elements)

**Non-Goals:**
- Custom free-form colour picking (fixed palette only)
- Changing the global theme system (sigil/astral/blood unchanged)
- Animated transitions on colour change
- Uploading actual character portraits/images

## Decisions

**D1 — Dice FAB via CSS class, not Tailwind utilities**
Move the FAB button from ad-hoc Tailwind classes to `className="dice-fab"` backed by a full block in `src/index.css`. The design 2.0 `.dice-fab` block already has the gold radial gradient, `box-shadow` glow, dashed `::before` ring, and bounce transforms. This keeps the button visually identical to the prototype without duplicating styles.

The dice icon inside changes from the emoji `🎲` to an SVG die icon (matching `Icon.dice` in `sigils.jsx`) so it scales cleanly inside the circular button and can be coloured with `currentColor`.

**D2 — Portrait sigil: inline multi-ring SVG, no external dependency**
The current portrait renders one `<circle cx r=30>` + one `<circle cx r=22>` + 6 `<line>` spokes. Expanding it to match the ouroboros variant from `sigils.jsx` means adding:
- outer `r=30` solid circle
- middle `r=22` solid circle  
- inner `r=14` solid circle
- dashed `r=22` ring (strokeDasharray)
- 6 dot accents at r=22
- two counter-rotating hexagon outlines at different opacities and speeds

All inline SVG — no new component or file needed. The letter initial is kept at the same `fontSize: 36` but moved forward in z-order so the sigil layers sit behind it.

Counter-rotation is achieved with a second `@keyframes ringSpinReverse { to { transform: rotate(-360deg); } }` in `index.css`.

**D3 — Per-character accent colour: stored on Character, applied as CSS variable**
`Character.accentColor` is a nullable `string` (hex value). The fixed palette is defined as a const in `src/themes.ts` (same file as `THEMES`) — keeps colour definitions centralised. Each entry has `{ id, name, hex }`.

In `CharacterSheet`, after the character is loaded, a `style` prop on the root `<div>` injects `--char-accent: <hex>` when `accentColor` is set. All themed elements inside the sheet that currently use `var(--gold)` for character-specific accents are updated to prefer `var(--char-accent, var(--gold))` — the fallback means the gold theme remains default.

The colour picker lives in the character sheet header (small row of colour swatches below the HP bar), using `updateCharacter` for persistence. No new store changes needed.

**D4 — Wizard inactive step label colour: use `--ink-mute` instead of `--theme-ghost-border`**
`--ink-mute` is `rgba(255,255,255,0.45)` in the design 2.0 token set — clearly readable but visually subordinate to the active step. Current `--theme-ghost-border` is `rgba(255,255,255,0.08)` — nearly invisible. This is a one-line change per label in `WizardLayout.tsx` and `LevelUpWizard.tsx`.

**D5 — Wizard text size: +1–2px bump on key elements only**
Avoid global font-size changes (risk of breaking layouts elsewhere). Target:
- Step labels: 10px → 12px
- Option card titles: 13–14px → 15px
- Option card descriptions: 11–12px → 13px
- Body copy / instruction text: 13px → 14–15px
All changes are scoped to wizard and levelup components.

## Risks / Trade-offs

- [Accent colour cascades to `var(--gold)` fallback on all non-sheet pages] → No risk — `--char-accent` is only injected on the `CharacterSheet` root div; it is not a global variable.
- [Counter-rotating SVG ring adds a second keyframe animation] → Minimal — one extra `@keyframes` block in CSS; no JS overhead.
- [Adding `accentColor` to `Character` without migration] → Safe — the field is optional (`accentColor?: string`). Existing characters without it render identically (fallback to gold).
- [Tailwind purge stripping `.dice-fab` styles] → Not a risk — `.dice-fab` is defined in `src/index.css` which is always included, not subject to Tailwind's content scan.

## Migration Plan

No data migration. The new `accentColor` field is optional and backward-compatible. Deploying is a normal Vite build + static host push.
