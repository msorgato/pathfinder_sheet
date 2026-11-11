## ADDED Requirements

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
When a new version of the application is deployed, the installed app SHALL obtain it automatically, at the latest on the next reload after the update has been downloaded, without the user clearing caches.

#### Scenario: New version after deploy
- **WHEN** a new version is deployed and the user reopens the installed app
- **THEN** the new version is running after at most one reload
