# Solar Sight – Pre-Qualification Platform
ANTIGRAVITY-001 | v0.1

This repository contains the Solar Sight pre-qualification landing experience for DC/MD homeowners.

## Project Structure

- `index.html` - Primary pre-qualification landing page (hero, form, trust pillars, process).
- `about.html` - Explainer on the platform data sources and Phoenix Solar Group.
- `services.html` - Details of the Pre-Qual report contents.
- `contact.html` - User inquiry form.
- `articles.html` - Content hub stub for Phase 2.
- `src/` - Shared HTML components (`header.html`, `footer.html`).
- `assets/css/` - Local stylesheets (`home.css` for index, `pages.css` for secondary pages).
- `style.css` - Global design system variables and typography.
- `main.js` - Core functionality (component loader, form handler, HubSpot stubs, smooth scroll).
- `_inbox/` - Client drop folder for new assets. *Processed assets are automatically cleared from here.*

## Processed Assets (v0.1)

The following assets were moved from `_inbox/` to their correct locations in `assets/img/`:
- **Main Logos** (`assets/img/logo/`): Phoenix Solar Sight (White wordmark, Default, Dark Blue).
- **Accreditation Logos** (`assets/img/accreditation/`): NABCEP, Tesla Energy, Pepco, CBE, JATC, e7, CERC, CNHED, NLHIC.
- **Stock Images** (`assets/img/`): Prism Solar mockup images.

## Local Development

Run the Vite dev server:
```bash
npm run dev
```

> **Note to Developers:** Core integrations (HubSpot, Google Places API) are currently stubbed in `main.js` and need actual endpoints/keys before launch.
