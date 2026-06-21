# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-06-21

A ground-up redesign of the prototype: from a single-server flat entity list into a
multi-server app with a custom dashboard and live updates.

### Added
- Multi-server support: add, edit and quick-switch servers from a Settings menu, plus re-pick a server's entities.
- Grid dashboard with D-pad navigation, optimistic toggles, an offline banner, and Back-to-exit.
- Per-domain detail screens for lights, covers and climate.
- In-app setup: first-run onboarding, a server form, and an entity picker ordered by your Lovelace
  dashboard (with its card name overrides).
- CLI install: `npm run flash` (stable app id + relaunch) and `npm run flash-configure`
  (seed one or more servers); `npm run package` builds a flashable `application.zip`.

### Changed
- Live state now streams over the Home Assistant WebSocket API; the prototype's REST polling is gone.
- Configuration moved from a compile-time `env.ts` to runtime config stored in `localStorage`.
- Rebuilt on esbuild + Vitest, replacing the Parcel/Babel toolchain.

[Unreleased]: https://github.com/davidsmfreire/kaios-ha/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/davidsmfreire/kaios-ha/releases/tag/v0.2.0
