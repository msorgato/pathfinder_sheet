# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
