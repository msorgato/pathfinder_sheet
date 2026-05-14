## Context

The production app (`src/`) uses React 19 + TypeScript + Vite + Tailwind CSS 4 with a CSS-variable-based theme system (`[data-theme="fantasy|eva01|cyberpunk|persona5"]`). Theme tokens are declared in `src/index.css`, applied via `data-theme` attribute on `<html>`, and consumed with `var(--theme-*)` throughout components. The design 2.0 prototype (`design 2.0/`) delivers a fully designed "Mystical Sigil/Ritual" aesthetic with its own CSS variable vocabulary and three theme variants. The goal is to transplant that visual system into the production codebase with minimal structural changes.

## Goals / Non-Goals

**Goals:**
- Replace CSS theme token set with design 2.0's sigil/astral/blood variables
- Add global typography classes, button styles, frame/corner decorations, and vital bar styles from design 2.0
- Restyle existing pages (HomePage, CharacterSheet) and components (CombatStats, AbilityPanel, ThemeSwitcher) using the new system
- Update `themes.ts` and `themeStore.ts` to reflect the three new themes
- Add Google Fonts (Cormorant Garamond, Cinzel, EB Garamond) to `index.html`

**Non-Goals:**
- Changing any Firebase, routing, auth, or game-logic code
- Rewriting component state or business logic
- Adding the TweaksPanel debugging widget from the prototype to production
- Adding the animated starfield backdrop (too heavy for default UX; can be a future option)
- Pixel-perfect reproduction of the prototype — the prototype uses CDN React without TypeScript; production components may deviate where TypeScript/Tailwind patterns are cleaner

## Decisions

### Decision 1: Extend existing CSS variable system rather than replace Tailwind

The current codebase mixes Tailwind utilities with `var(--theme-*)` tokens. Replacing all Tailwind classes would require touching every component. Instead, the new design tokens replace the `var(--theme-*)` set with `var(--bg-*)`, `var(--gold)`, `var(--ink-*)` etc. and the few Tailwind structural utilities (flex, grid, gap, padding) are kept as-is.

**Alternative considered:** Full Tailwind removal. Rejected — too much churn for a visual-only change.

### Decision 2: Keep `data-theme` attribute strategy, update theme names

The existing approach of toggling `data-theme` on `<html>` works well. We rename the values to `sigil | astral | blood` instead of adding a parallel mechanism. `themes.ts` is updated and `themeStore.ts` default becomes `sigil`.

**Alternative considered:** CSS class approach (`.theme-blood` on body). Rejected — `data-theme` is already wired; no benefit to switching.

### Decision 3: Typography classes as global CSS, not Tailwind plugins

`display-xl`, `label-rune`, `label-rune-soft`, `numeral` are one-liners that map to specific font stacks. Adding them as plain `.className` rules in `index.css` is simpler than writing a Tailwind plugin.

### Decision 4: Frame-corner decoration via React helper component

The `.frame-corners-4` + `.corner.tl/tr/bl/br` pattern requires four `<span>` children injected into each card. To avoid copy-pasting, a lightweight `<FrameCorners />` component in `src/components/ui/` will render the four spans. Cards include it as `<FrameCorners />` first-child.

### Decision 5: Google Fonts loaded in `index.html`, not CSS `@import`

Loading fonts via `<link rel="preconnect">` + `<link href="...">` in the HTML head is faster than a CSS `@import` inside `index.css`, and avoids FOUC on initial render.

## Risks / Trade-offs

- **[Risk] Breaking existing theme names in localStorage** → Persisted `theme` value (`fantasy`, `eva01`, etc.) won't match new values. Mitigation: add a migration shim in `themeStore.ts` that maps old keys to `sigil` on hydration.
- **[Risk] Cormorant Garamond / Cinzel not available offline** → Fallback serif/monospace stacks cover the worst case. Mitigation: `font-display: swap` ensures text remains visible.
- **[Risk] `color-mix(in oklab, ...)` CSS feature not supported on older browsers** → Used in design 2.0 for gradient backgrounds. Mitigation: wrap backdrop gradient in a `@supports` block; degrade to a flat `bg-deep` color.
- **[Risk] Tailwind class conflicts with new CSS variable names** → Some Tailwind utilities (e.g., `text-gold`) don't exist and won't collide. If custom Tailwind tokens were previously named `--tw-*`, they are unaffected.

## Migration Plan

1. Update `index.html` to add Google Fonts links
2. Replace all theme token declarations in `src/index.css` with design 2.0 tokens (sigil/astral/blood)
3. Add global helpers to `index.css`: typography classes, button styles, frame styles, vital bar, divider-rune
4. Update `src/themes.ts` with new `ThemeId` and `THEMES` array; add localStorage migration shim to `themeStore.ts`
5. Restyle `src/pages/HomePage.tsx` — character grid cards with portrait placeholder, HP/XP bars, stat chips, FrameCorners
6. Restyle `src/pages/CharacterSheet.tsx` — identity panel with portrait overlay, vital bars, tab bar
7. Restyle `src/components/sheet/CombatStats.tsx` and `AbilityPanel.tsx` — stat tiles with rune labels
8. Update `src/components/ui/ThemeSwitcher.tsx` — new swatch values and labels
9. Add `src/components/ui/FrameCorners.tsx` helper component

Rollback: git revert the branch. No database migrations required.

## Open Questions

- Should the animated starfield backdrop be opt-in via a user preference toggle (mirroring the prototype's "Sfondo stellato" tweak)? Current plan: omit entirely; add as a follow-up if users request it.
- Do we keep the existing themes (eva01, cyberpunk, persona5) as hidden/legacy options, or fully remove them? Current plan: fully remove to keep the token set clean.
