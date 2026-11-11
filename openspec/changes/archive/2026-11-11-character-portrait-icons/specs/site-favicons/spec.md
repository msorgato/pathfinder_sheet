## ADDED Requirements

### Requirement: Site icons are declared
The site SHALL declare its icons so that browsers and devices use them: PNG favicons at 16, 32 and 48 pixels, an Apple touch icon, and a 512-pixel icon.

#### Scenario: Browser tab icon
- **WHEN** the site is opened in a desktop browser
- **THEN** the tab shows the site favicon

#### Scenario: Home screen icon
- **WHEN** the user adds the site to the home screen of an iOS device
- **THEN** the Apple touch icon is used
