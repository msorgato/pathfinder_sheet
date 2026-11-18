# pwa-install Specification

## Purpose

Installabilità dell'app come PWA, avvio della shell senza rete, esclusione del backend dalla cache e aggiornamenti automatici.

## Requirements

### Requirement: Installable web app
The application SHALL publish a web app manifest with an Italian name and short name, `standalone` display mode, start URL and scope at the site root, theme and background colours matching the app's dark background, and icons at 192 and 512 pixels, including one usable as a maskable icon. The application SHALL meet the browser installability criteria.

#### Scenario: Install on Android
- **WHEN** the user opens the site in Chrome on Android
- **THEN** the browser offers to install the app, and the installed app opens without browser UI using the site icon and name

#### Scenario: Add to home screen on iOS
- **WHEN** the user adds the site to the home screen from Safari on iOS
- **THEN** the home screen shows the site's Apple touch icon and the app opens in standalone mode

### Requirement: App shell available without network
The application SHALL cache its app shell (HTML, scripts, styles and static icons) so that, after one successful visit, it starts even when the network is unavailable. Any route of the app SHALL load the cached shell when offline.

#### Scenario: Offline start
- **WHEN** a user who has visited the app before opens it with no network
- **THEN** the app interface loads instead of a browser error page

### Requirement: Backend requests are never served from cache
Requests to the authentication, database and cloud function backends SHALL always go to the network and SHALL NOT be answered by the service worker cache. Authentication redirect routes SHALL NOT be replaced by the app shell.

#### Scenario: Fresh character data
- **WHEN** a character is changed on another device and the user reloads the app online
- **THEN** the updated data is shown, not a cached copy

#### Scenario: Login redirect works
- **WHEN** the user signs in through a redirect-based provider
- **THEN** the sign-in completes as without the service worker

### Requirement: Automatic updates
When a new version of the application is deployed, the installed app SHALL detect it and offer it without the user clearing caches. A version found shortly after the app starts SHALL be applied automatically. A version found while the app is in use SHALL wait until the user accepts it. A user who does not accept it SHALL get the new version the next time the app is opened from scratch.

#### Scenario: New version after deploy
- **WHEN** a new version is deployed and the user reopens the installed app
- **THEN** the new version is running after at most one reload, which happens by itself and without any prompt

#### Scenario: New version found while in use
- **WHEN** a new version is deployed while the app is open
- **THEN** the running version keeps working until the user accepts the update

#### Scenario: Update ignored
- **WHEN** the user ignores the update prompt and later closes and reopens the app
- **THEN** the new version is running

### Requirement: Update checks while the app stays open
The installed app SHALL check for a new version when it returns to the foreground, when the network comes back and about every 30 minutes while open, with at least 5 minutes between two checks.

#### Scenario: Resumed after a deploy
- **WHEN** a new version is deployed while the installed app is in the background and the user brings it to the foreground
- **THEN** the app checks for the new version at that moment

#### Scenario: Frequent switching
- **WHEN** the user returns to the app twice within a minute
- **THEN** only one check is made

### Requirement: Update prompt
When a new version is ready and the app is in use, the app SHALL show a notice "Nuova versione disponibile" with the actions "Aggiorna" and "Dopo". "Aggiorna" SHALL activate the new version and reload the app. "Dopo" SHALL hide the notice until the app next returns to the foreground.

#### Scenario: Accept
- **WHEN** the user taps "Aggiorna"
- **THEN** the app reloads and runs the new version

#### Scenario: Later
- **WHEN** the user taps "Dopo"
- **THEN** the notice disappears and the app keeps running the current version until it returns to the foreground

### Requirement: Recovery from a stale version
Each build SHALL publish its identifier in a file that is never cached. At startup and when returning to the foreground, the app SHALL compare it with its own. When they differ and no new version becomes available from the update check within a few seconds, the app SHALL clear its caches and service worker and reload, once for each published version. While the app is in use, it SHALL offer the recovery in a notice instead of reloading by itself.

#### Scenario: Stuck at startup
- **WHEN** the app starts, the published build differs from the running one and the update check yields nothing
- **THEN** the app clears its caches and service worker and reloads into the published version

#### Scenario: No reload loop
- **WHEN** the recovery has already run for the published version and the identifiers still differ
- **THEN** the app does not reload again

#### Scenario: Stuck while in use
- **WHEN** the app is in use, the identifiers differ and the update check yields nothing
- **THEN** a notice offers to update, and nothing is reloaded until the user accepts

#### Scenario: Up to date
- **WHEN** the published build is the running build
- **THEN** nothing happens
