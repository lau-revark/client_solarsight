# Changelog

All notable changes to the **Solar Sight** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to **Major.Minor.Bugfix** versioning.

## [0.2.0] - 2026-04-16

### Added
- Created `vite.config.js` to support multi-page production builds.
- Implemented CSS fallback animation for `.reveal` elements (auto-visible after 2s if JS fails).
- Added dedicated `400px` media query breakpoints for small mobile devices.
- Integrated Facebook Pixel tracking across all pages.

### Changed
- Increased site-wide font sizes for improved readability (16px base body).
- Updated CSS Grid tracks to `minmax(0, 1fr)` globally to eliminate horizontal overflow.
- Reduced form container padding in `.prequal__form-wrap` to maximize input field width on mobile.
- Refined global typography hierarchy and button spacing.
- Moved Mapbox access token injection to `main.js` using Vite environment variables.

### Fixed
- Resolved persistent "bleed" (horizontal scrolling) issues on mobile viewports (~360px).
- Fixed search icon overlap in the Mapbox address autocomplete field.
- Corrected broken navigation active states and CTA link alignments.
- Standardized site-wide responsive grid behavior.

## [0.1.0] - 2026-03-23

### Added
- Initial project setup with Vite.
- Folder structure for assets and client inbox.
- Universal header and footer navigation (in progress).
- Standard pages: Home, About, Services, Articles, Contact (in progress).
- GitHub preparation with `.gitignore`.


