# Spec Delta

## Purpose

Defines how the character sheet arranges its panels according to the viewport width: a single stacked column on mobile and tablet, and a persistent sidebar beside a multi-column main area on desktop, so wide screens show more of the sheet at once.

## ADDED Requirements

### Requirement: Mobile and tablet layout is unchanged
Below a viewport width of 1024 CSS pixels, the character sheet SHALL keep its single-column layout: identity header, then the tab bar, then the active tab's panels stacked vertically. The "Combattimento" tab SHALL show, in order, characteristics, hit points, conditions and effects, combat statistics, attacks and consumables.

#### Scenario: Phone width
- **WHEN** the sheet is viewed at a viewport width of 375px
- **THEN** there is no sidebar, the tab bar sits below the header, and the "Combattimento" tab stacks its panels in a single column in the order above

#### Scenario: Just below the desktop threshold
- **WHEN** the sheet is viewed at a viewport width of 1023px
- **THEN** the mobile layout is used

### Requirement: Desktop layout has a sidebar and a main area
From a viewport width of 1024 CSS pixels, the character sheet SHALL place, below the identity header, a sidebar on the left and a main area on the right. The two regions together SHALL be horizontally centred and no wider than 1600 CSS pixels.

#### Scenario: Desktop width
- **WHEN** the sheet is viewed at a viewport width of 1280px
- **THEN** a sidebar is shown to the left of the main area

#### Scenario: Very wide screen
- **WHEN** the sheet is viewed at a viewport width of 2560px
- **THEN** sidebar and main area together are at most 1600px wide and centred, and no horizontal scrollbar appears

### Requirement: Sidebar shows the core statistics on every tab
On desktop, the sidebar SHALL contain the characteristics panel, the hit points panel and the combat statistics (armour class, saving throws, base attack, manoeuvres, initiative, speed), whichever tab is active. Quick rolls started from the sidebar SHALL open the dice roller as they do on mobile.

#### Scenario: Sidebar persists across tabs
- **WHEN** the user switches from "Combattimento" to "Abilità" on desktop
- **THEN** characteristics, hit points and combat statistics remain visible in the sidebar

#### Scenario: Quick roll from the sidebar
- **WHEN** the user clicks a saving throw in the sidebar on desktop
- **THEN** the dice roller opens with that saving throw's roll

### Requirement: Sidebar stays in view while scrolling
On desktop, the sidebar SHALL remain visible while the main area is scrolled. When the sidebar's content is taller than the viewport, the sidebar SHALL be scrollable on its own so that all of its content can be reached.

#### Scenario: Long tab content
- **WHEN** the user scrolls to the bottom of the skills list on desktop
- **THEN** the sidebar is still visible beside it

#### Scenario: Short viewport
- **WHEN** the viewport is 1280×700px and the sidebar content is taller than the visible space
- **THEN** the user can scroll the sidebar to reach its last item without scrolling the main area

### Requirement: Tab bar belongs to the main area on desktop
On desktop, the tab bar SHALL be placed at the top of the main area, not across the sidebar, and SHALL remain reachable while the main area is scrolled. The set of tabs, their labels and the active tab SHALL be the same as on mobile.

#### Scenario: Switching tab after scrolling
- **WHEN** the user has scrolled far down the spells tab on desktop
- **THEN** the tab bar is still visible and another tab can be selected without scrolling back up

### Requirement: Combat tab avoids duplicating the sidebar on desktop
On desktop, the "Combattimento" tab SHALL show attacks, conditions and effects, and consumables, and SHALL NOT repeat the characteristics, hit points or combat statistics panels shown in the sidebar.

#### Scenario: Combat tab on desktop
- **WHEN** the "Combattimento" tab is open on desktop
- **THEN** the characteristics panel appears once on the page, in the sidebar

### Requirement: Main area uses two columns when wide enough
When the main area is at least 760 CSS pixels wide, each tab SHALL arrange its blocks in two columns instead of one stacked column. When it is narrower, the tab SHALL use a single column. Reading order SHALL follow the mobile order: left column first, then right column.

#### Scenario: Combat tab in two columns
- **WHEN** the "Combattimento" tab is open at a viewport width of 1440px
- **THEN** attacks are in the left column, and conditions and effects followed by consumables are in the right column

#### Scenario: Equipment tab in two columns
- **WHEN** the "Equipaggiamento" tab is open at a viewport width of 1440px
- **THEN** the summary, the add actions and the worn equipment are in the left column, and carried items, coins and proficiencies are in the right column

#### Scenario: Notes tab in two columns
- **WHEN** the "Note" tab is open at a viewport width of 1440px
- **THEN** the notes are in the left column, and the character details and background are in the right column

#### Scenario: Narrow main area
- **WHEN** any tab is open at a viewport width of 1024px
- **THEN** the main area shows its blocks in a single column beside the sidebar

### Requirement: Skills list splits into two columns when wide enough
When the main area is at least 760 CSS pixels wide, the skills list SHALL be divided into two columns, each with its own column header, filling the left column first in the list's order. Search and filters SHALL stay above both columns.

#### Scenario: Skills in two columns
- **WHEN** the "Abilità" tab is open at a viewport width of 1440px
- **THEN** the first half of the skills is in the left column and the rest in the right column, each column with the header row

### Requirement: Features tab shows class features and feats side by side
When the main area is at least 760 CSS pixels wide, the "Capacità" tab SHALL show class features and feats side by side, each with its own heading, without the sub-tabs used to switch between them. When narrower, the sub-tabs SHALL be kept.

#### Scenario: Wide features tab
- **WHEN** the "Capacità" tab is open at a viewport width of 1440px
- **THEN** class features and feats are both visible, in two columns, with no sub-tab buttons

#### Scenario: Narrow features tab
- **WHEN** the "Capacità" tab is open at a viewport width of 1024px
- **THEN** the sub-tabs "Capacità di Classe" and "Talenti" are shown as on mobile

### Requirement: Spells tab places spell-level blocks side by side
When the main area is at least 760 CSS pixels wide, the "Incantesimi" tab SHALL arrange its per-level blocks in two columns. The spellcasting summary SHALL span the full width above them.

#### Scenario: Wide spells tab
- **WHEN** a caster's "Incantesimi" tab is open at a viewport width of 1440px
- **THEN** the summary spans the main area and the per-level blocks are laid out in two columns below it

### Requirement: Layout switch keeps the active tab
When the viewport crosses the 1024 CSS pixel threshold in either direction, the sheet SHALL switch layout without reloading and SHALL keep the active tab.

#### Scenario: Resize from desktop to mobile
- **WHEN** the "Equipaggiamento" tab is open on desktop and the window is narrowed to 800px
- **THEN** the mobile layout is shown with the "Equipaggiamento" tab still active
