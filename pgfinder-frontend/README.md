# StayJi Frontend

React and Vite frontend for the Bangalore Phase-1 StayJi launch.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The frontend usually runs on `http://localhost:5173`.

## Environment

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=optional-google-maps-key
```

### Demo inventory

Set `VITE_DEMO_PROPERTY_MODE=true` only for the demo frontend deployment (or
open `/properties?demo=true`). This uses the curated frontend-only sample
properties for browsing, filters, maps, details, comparison, and local demo
favourites. The normal production setting remains API-backed owner listings.

## Active Roles

- User dashboard
- Owner/Vendor dashboard
- Admin dashboard

Phase 1 supports only User, Owner/Vendor, and Admin screens.

## Feature Areas

- Bangalore property search, filters, maps, and details
- Compare page
- Saved properties and recently viewed properties
- User profile and password management
- User to Owner messaging
- Visit requests and history
- Owner property CRUD, media, availability, leads, visits, and messages
- Admin users, owners, properties, approvals, analytics, visits, messages, filters, and pagination
- Notifications with unread count and mark-as-read

## Checks

```bash
npm run lint
npm run build
```
