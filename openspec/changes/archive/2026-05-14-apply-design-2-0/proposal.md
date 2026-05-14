## Why

The existing UI uses a functional but visually generic Tailwind layout that doesn't match the mystical Pathfinder fantasy aesthetic envisioned in the design 2.0 prototype. The `design 2.0/` folder contains a polished HTML/JSX prototype with a fully developed "Mystical Sigil/Ritual" visual language — three new themes (Sigil, Astral, Bloodpact), richer typography, decorative corner frames, glowing stat tiles, and animated elements — that should be adopted as the production visual system.

## What Changes

- **Theme system replaced**: Current four themes (fantasy, eva01, cyberpunk, persona5) replaced with three new themes from design 2.0 (sigil, astral, blood) with new CSS variable tokens (`--bg-deep`, `--bg-base`, `--surface-1`, `--gold`, `--amethyst`, `--ink`, etc.)
- **Typography upgraded**: New font stack (`Cormorant Garamond`, `Cinzel`, `EB Garamond`, `JetBrains Mono`) replaces Georgia/monospace; typography classes (`display-xl`, `label-rune`, `label-rune-soft`, `numeral`) added to global CSS
- **HomePage redesigned**: Character list becomes a 3-column card grid with a hero header, HP/XP progress bars, stat chips (CA, BAB, INIT), and decorative corner frames; "new character" card uses hexagram sigil
- **CharacterSheet redesigned**: Identity panel with portrait + rotating ouroboros overlay, HP/XP vital bars, action buttons row, ability stats in a grid layout; tab bar with icon+label pairs
- **CombatStats/ability panels restyled**: Stat tiles adopt `.stat-tile` pattern with rune labels, glow effects on hover
- **Global decorative system added**: `.frame-corners-4` CSS pattern with `.corner` pseudo-elements for consistent parchment-frame aesthetic across cards, modals, panels
- **DiceRoller FAB redesigned**: Floating hexagonal d20 button with natural-20/fumble states and redesigned result popup
- **ThemeSwitcher updated**: New theme names and visual variants
- **Google Fonts added**: Import `Cormorant Garamond`, `Cinzel`, `EB Garamond` from Google Fonts

## Capabilities

### New Capabilities

- `design-system-2-0`: CSS design system from design 2.0 — new tokens, typography classes, frame corners, theme variants (sigil/astral/blood), and animation utilities

### Modified Capabilities

- None — this is a visual redesign; no spec-level behavioral requirements change.

## Impact

- `src/index.css` — full theme token replacement and new global CSS classes
- `src/App.css` — global layout and typography rules
- `src/pages/HomePage.tsx` — character card and list layout rewrite
- `src/pages/CharacterSheet.tsx` — identity panel and sheet layout rewrite
- `src/components/sheet/CombatStats.tsx`, `AbilityPanel.tsx`, `SkillsPanel.tsx` — stat tile restyling
- `src/components/ui/ThemeSwitcher.tsx` — updated theme names
- `src/components/ui/DiceRoller.tsx` or equivalent — FAB and popup redesign
- `src/store/themeStore.ts` — theme enum updated (sigil | astral | blood)
- `index.html` — add Google Fonts link tags
- No Firebase, routing, or state logic changes required
