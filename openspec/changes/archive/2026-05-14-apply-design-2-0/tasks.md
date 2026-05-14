## 1. Fonts & HTML entry point

- [x] 1.1 Add `<link rel="preconnect" href="https://fonts.googleapis.com">` and `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` to `index.html`
- [x] 1.2 Add Google Fonts stylesheet link for Cormorant Garamond (ital 400/500, roman 400/500), Cinzel (400/500/600), and EB Garamond (ital/roman 400) with `&display=swap` to `index.html`

## 2. CSS design tokens

- [x] 2.1 Remove all `[data-theme="fantasy"]`, `[data-theme="eva01"]`, `[data-theme="cyberpunk"]`, `[data-theme="persona5"]` blocks and old `--theme-*` variable declarations from `src/index.css`
- [x] 2.2 Add `:root, [data-theme="sigil"]` token block with all design 2.0 sigil values (`--bg-deep`, `--bg-base`, `--bg-elev`, `--bg-glass`, `--surface-1`, `--surface-2`, `--line-soft/mid/strong`, `--gold`, `--gold-bright`, `--gold-deep`, `--amethyst`, `--amethyst-bright`, `--amethyst-deep`, `--ember`, `--blood`, `--blood-deep`, `--vital`, `--vital-deep`, `--ink`, `--ink-soft`, `--ink-mute`, `--ink-faint`, `--rune-glow`, `--card-shadow`, `--inner-shadow`)
- [x] 2.3 Add `[data-theme="astral"]` overrides block with violet/pink palette
- [x] 2.4 Add `[data-theme="blood"]` overrides block with crimson/amber palette
- [x] 2.5 Add font stack variables to `:root`: `--font-display`, `--font-rune`, `--font-body`, `--font-mono`
- [x] 2.6 Update `body` styles to use new tokens (`background: var(--bg-deep)`, `color: var(--ink)`, `font-family: var(--font-body)`)

## 3. Global CSS utilities

- [x] 3.1 Add typography classes to `src/index.css`: `.display-xl`, `.display-l`, `.display-m`, `.label-rune`, `.label-rune-soft`, `.numeral`
- [x] 3.2 Add button classes: `.btn`, `.btn-primary`, `.btn-ghost` with hover states
- [x] 3.3 Add frame/corner classes: `.frame`, `.frame-corners-4`, `.corner.tl/.tr/.bl/.br`
- [x] 3.4 Add vital bar classes: `.vital-row`, `.vital-label`, `.vital-bar`, `.vital-bar-fill`, `.vital-bar.xp`
- [x] 3.5 Add `.divider-rune` separator class (flex row with centered icon + label)
- [x] 3.6 Add `@keyframes ringSpin` animation (used by identity portrait sigil overlay)

## 4. Theme store & type updates

- [x] 4.1 Update `src/themes.ts`: change `ThemeId` to `'sigil' | 'astral' | 'blood'` and replace `THEMES` array with new entries (swatch1/swatch2 from design 2.0 palette)
- [x] 4.2 Add legacy migration shim to `src/store/themeStore.ts`: on hydration, if stored theme is one of `['fantasy','eva01','cyberpunk','persona5']`, remap it to `'sigil'`
- [x] 4.3 Update default theme in `themeStore` from `'fantasy'` to `'sigil'`

## 5. FrameCorners helper component

- [x] 5.1 Create `src/components/ui/FrameCorners.tsx` that renders four `<span>` elements with classes `corner tl`, `corner tr`, `corner bl`, `corner br` (no props needed)

## 6. HomePage restyling

- [x] 6.1 Replace the homepage character list layout with a 3-column grid (`.list-grid`) matching the design 2.0 `CharacterList` layout: hero header with `display-xl` title, subtitle in italic, and action button row
- [x] 6.2 Restyle each character card to use `.frame-corners-4` + `<FrameCorners />`, portrait area, name in display font, race/class/level/alignment meta row, HP and XP `vital-row` bars, stat chips (CA, BAB, INIT)
- [x] 6.3 Add "new character" card slot at end of grid using hexagram sigil placeholder and `label-rune` label
- [x] 6.4 Replace existing inline Tailwind button styles on the "Crea personaggio" and "Esporta" buttons with `.btn` / `.btn-primary` classes

## 7. CharacterSheet restyling

- [x] 7.1 Restyle the identity/sidebar panel: add `.frame.frame-corners-4` wrapper with `<FrameCorners />`, portrait area with rotating ouroboros overlay (CSS `ringSpin` animation, `opacity: 0.18`), name overlaid in `.identity-name` display font, meta badges row
- [x] 7.2 Replace HP/XP display with `.vital-row` + `.vital-bar` + `.vital-bar-fill` pattern; XP bar adds `.xp` modifier
- [x] 7.3 Restyle the tab bar using `.label-rune` labels and active indicator with `--gold` underline
- [x] 7.4 Replace back-button and action button row with `.btn-ghost` / `.btn-primary` styles

## 8. Stat panels restyling

- [x] 8.1 Restyle `src/components/sheet/CombatStats.tsx` stat tiles: each tile gets `.stat-tile` class with `.label-rune-soft` label and `.numeral` value
- [x] 8.2 Restyle `src/components/sheet/AbilityPanel.tsx` ability score boxes: use `.stat-tile` pattern, modifier badge in `.numeral`
- [x] 8.3 Restyle `src/components/sheet/SkillsPanel.tsx` skill rows: skill name in body font, rank/total in `.numeral`, separator lines using `--line-soft`

## 9. ThemeSwitcher update

- [x] 9.1 Update `src/components/ui/ThemeSwitcher.tsx` — no code changes needed beyond `themes.ts` update, but verify the three new swatches render correctly with updated swatch colors

## 10. Cleanup & verification

- [x] 10.1 Search for any remaining `var(--theme-*)` references in `.tsx`/`.css` files and replace with the new token equivalents
- [x] 10.2 Run `npm run build` (or `vite build`) and confirm no TypeScript errors
- [x] 10.3 Visually verify all three themes (sigil/astral/blood) on HomePage and CharacterSheet in the browser
- [x] 10.4 Verify returning user with legacy theme stored in localStorage gets migrated to `sigil` without console errors
