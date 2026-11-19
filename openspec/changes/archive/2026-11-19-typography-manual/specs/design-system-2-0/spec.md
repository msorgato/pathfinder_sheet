# Spec Delta

## REMOVED Requirements

### Requirement: Typography utility classes
**Reason**: the classes move from Cormorant Garamond and EB Garamond with tiny tracked labels to the manual style (Cinzel titles, Literata text and numerals, larger labels); see "Typography classes".
**Migration**: the class names stay the same; only their font, size and tracking change, so components need no change.

### Requirement: Google Fonts loaded in HTML head
**Reason**: the fonts are bundled with the app (see "Self-hosted fonts"), so they work offline from the first start and no request reaches Google.
**Migration**: the `<link>` tags and the service worker caching rules for Google Fonts are removed; the font files are imported from `@fontsource` packages and precached.

## ADDED Requirements

### Requirement: Typography classes
The system SHALL expose the global classes `.display-xl`, `.display-l` and `.display-m` (titles in Cinzel, upright), `.label-rune` (13px uppercase Cinzel, gold, about 0.14em tracking), `.label-rune-soft` (12px uppercase Cinzel, ink-mute colour, about 0.12em tracking) and `.numeral` (Literata with lining tabular figures). They SHALL be defined in `src/index.css` and available to all components without import.

#### Scenario: Display heading renders in Cinzel
- **WHEN** a component uses `className="display-xl"`
- **THEN** the text renders in Cinzel (or a fallback serif), upright

#### Scenario: Rune label renders in Cinzel with tracking
- **WHEN** a component uses `className="label-rune"`
- **THEN** the text is uppercase Cinzel at 13px, gold-coloured, with about 0.14em letter-spacing

### Requirement: Self-hosted fonts
The application SHALL serve its fonts (Literata and Cinzel) from its own build, and SHALL NOT load fonts from third-party servers. The font files SHALL be part of the offline cache, and text SHALL be shown with a fallback serif while they load.

#### Scenario: Offline first start
- **WHEN** the installed app starts with no network
- **THEN** the text renders in Literata and the titles in Cinzel

#### Scenario: No third-party request
- **WHEN** the app loads
- **THEN** no request is made to fonts.googleapis.com or fonts.gstatic.com

### Requirement: Readable text sizes
Body text SHALL use Literata at 16px. Running and secondary text SHALL NOT be smaller than 13px, and uppercase labels SHALL NOT be smaller than 12px. The small text sizes of the utility framework SHALL follow this scale, so existing components grow with it.

#### Scenario: Smallest secondary text
- **WHEN** a component uses the smallest text utility for secondary text
- **THEN** it renders at 13px or more

#### Scenario: No tiny text
- **WHEN** any style or component sets a font size
- **THEN** it is 12px or more

### Requirement: Readable text contrast
Every text colour of the design (primary, soft, muted and faint ink, negative values in red, and the colours of spell school tags) SHALL have a contrast ratio of at least 4.5:1 against the backgrounds and surfaces it is drawn on, in each of the three themes. Decorative borders and disabled controls are excluded.

#### Scenario: Faint text
- **WHEN** secondary text uses the faintest ink colour on a card surface
- **THEN** its contrast ratio against that surface is at least 4.5:1 in every theme

#### Scenario: Negative values
- **WHEN** a negative modifier is shown in red on a card
- **THEN** its contrast ratio is at least 4.5:1

#### Scenario: Hierarchy kept
- **WHEN** primary, soft, muted and faint ink are compared
- **THEN** each is dimmer than the previous one, so the hierarchy stays visible

### Requirement: Lining tabular numerals
Numbers in statistics, modifiers, totals and dice SHALL use Literata with lining, tabular figures, so that digits share the same height and width.

#### Scenario: Ability score
- **WHEN** the abilities panel shows 18, 14 and 16
- **THEN** all digits have the same height and the numbers line up

#### Scenario: Dice faces
- **WHEN** a 3D or 2D die shows its value
- **THEN** the value is printed in Literata
