# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-10-10

### Added

- `SCROBBLE_UNIQUE` environment option (default `false`). The scrobbler now mirrors
  the station faithfully by scrobbling **every** play, including repeated tracks.
  Set `SCROBBLE_UNIQUE=true` to restore one-scrobble-per-track de-duplication.

### Changed

- Startup log now reports whether repeated tracks are scrobbled.
- README documents `SCROBBLE_UNIQUE` in both English and Spanish.

## [1.0.0] - 2026-10-09

### Added

- Dependency-free Node.js connector that mirrors an AzuraCast station's now-playing
  to Last.fm (`track.updateNowPlaying` + `track.scrobble`).
- Auto-detection of a single station, or explicit `STATION_SHORTCODE`.
- `npm run auth` for interactive Last.fm authorization and `npm run diagnose` for
  station and credential checks.
- Docker and systemd deployment options.

[Unreleased]: https://github.com/dis-mal-skull/azuracast-lastfm-scrobbler/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/dis-mal-skull/azuracast-lastfm-scrobbler/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/dis-mal-skull/azuracast-lastfm-scrobbler/releases/tag/v1.0.0
