# Spec Delta

## Purpose

Defines the look of scrollbars across the portal so they match the visual design of the active theme and look the same in every supported desktop browser, instead of mixing a custom style with the operating system's default.

## ADDED Requirements

### Requirement: Scrollbars are slim with a transparent track
Every scrollable area of the portal SHALL show a slim scrollbar, not wider than 10 CSS pixels, whose track has no background fill so the page or panel surface shows through. The thumb SHALL have fully rounded ends.

#### Scenario: Scrollable panel
- **WHEN** a scrollable panel (for example the desktop sidebar or a modal body) overflows
- **THEN** its scrollbar is slim, the track shows the panel background, and the thumb has rounded ends

### Requirement: Scrollbar colours follow the active theme
The scrollbar thumb colour SHALL derive from the active theme's line colours (the same accent hue as panel borders), so it changes when the theme changes. It SHALL NOT use a fixed colour shared by all themes.

#### Scenario: Theme switch
- **WHEN** the user changes the theme from Sigillo to Astrale
- **THEN** the scrollbar thumb changes from a gold tone to a violet tone without reloading

### Requirement: Thumb highlights on hover and drag
On browsers that allow it, the scrollbar thumb SHALL become more prominent when the pointer is over it and while it is being dragged, using the theme's stronger line colour.

#### Scenario: Hover
- **WHEN** the pointer moves over the scrollbar thumb in Chrome, Edge or Safari
- **THEN** the thumb is drawn in a stronger tone than at rest

### Requirement: Same look in Firefox
Browsers that support only the standard scrollbar properties SHALL show a slim scrollbar with a transparent track and a thumb in the same theme-derived colour as the other browsers.

#### Scenario: Firefox
- **WHEN** a scrollable panel overflows in Firefox
- **THEN** the scrollbar is thin, has a transparent track and a thumb in the theme's line colour

### Requirement: Intentionally hidden scrollbars stay hidden
Areas that hide their scrollbar by design (status chips, horizontally scrolling tab bars on small screens) SHALL keep scrolling without showing a scrollbar.

#### Scenario: Status chips
- **WHEN** the status chips row overflows horizontally
- **THEN** it scrolls with no visible scrollbar
