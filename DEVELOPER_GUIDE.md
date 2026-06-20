# StayJi Bangalore MVP Developer Guide

## Setup

Backend:

```bash
cd pgfinder-backend
npm install
cp .env.example .env
npm start
```

Frontend:

```bash
cd pgfinder-frontend
npm install
npm run dev
```

## Verification Commands

Frontend:

```bash
cd pgfinder-frontend
npm run lint
npm run build
```

Backend syntax:

```bash
cd pgfinder-backend
node --check app.js
node --check controllers/clientController.js
node --check controllers/adminController.js
```

Note: backend `npm test` is still a placeholder and is not a real automated test suite.

## MVP Boundaries

Keep new work inside the Bangalore launch scope:

- Do not add multi-city UI.
- Do not re-enable Super Admin dashboard routes.
- Do not add dummy property management.
- Do not add nationwide expansion modules.
- Reuse existing controllers, services, and models unless a small extension is needed.

## Important Files

- `pgfinder-frontend/src/config/mvp.js`: frontend city constants.
- `pgfinder-frontend/src/pages/PropertiesPage.jsx`: Bangalore search, filters, nearby sorting, pagination, scroll restoration.
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx`: property detail and gallery.
- `pgfinder-frontend/src/pages/dashboard/MessagesPage.jsx`: user-owner messaging UI.
- `pgfinder-frontend/src/routes/AppRoutes.jsx`: public/dashboard route scope.
- `pgfinder-backend/controllers/clientController.js`: auth, search, properties, visits, messaging, owner/user/admin API routes.
- `pgfinder-backend/middleware/resilience.js`: shared error and validation helpers.

## Search Contract

Frontend search should call `propertyService.fetchPropertyPage` for paginated listing results. Backend filtering must happen before pagination for:

- `search`
- `area` / `locality`
- `minPrice`
- `maxPrice`
- `gender`
- `sharingType`
- `page`
- `limit`

Use `fetchProperties({ allPages: true })` only for small secondary surfaces that truly need a complete list.

## Manual QA Rule

Do not mark the MVP launch-ready until the checklist in `TESTING.md` has been manually verified against a running backend, MongoDB database, and real test accounts.
