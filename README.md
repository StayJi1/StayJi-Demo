# StayJi Bangalore Phase-1 Launch

StayJi is a full-stack accommodation discovery and management platform for paying guest homes, hostels, co-living spaces, flats, houses, apartments, and villas. Phase 1 is scoped to Bangalore only and supports three active roles: User, Owner/Vendor, and Admin.

The current product lets users discover properties, compare stays, save favourites, message owners, schedule visits, and manage their profile. Owners manage their own listings, media, availability, visit requests, leads, and messages. Admins manage Bangalore users, owners, properties, approvals, messages, visits, analytics, reports, filters, quick actions, and pagination.

## Architecture

StayJi is split into two independently started projects:

- `pgfinder-frontend`: React, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Leaflet, Recharts.
- `pgfinder-backend`: Node.js, Express, MongoDB, Mongoose, JWT authentication, session cookies, Helmet, CORS, rate limiting, Multer.

The frontend talks to the backend through `VITE_API_BASE_URL`, defaulting to `http://localhost:3000` for local development. The backend exposes legacy `/client` and `/admin` endpoints plus REST-style `/api/*` aliases used by the current frontend.

## Folder Structure

```text
PG-Finder/
  pgfinder-backend/
    app.js
    server.js
    connection/
    controllers/
    middleware/
    models/
    public/upload/
    scripts/
    utils/
    views/
  pgfinder-frontend/
    src/
      api/
      components/
      context/
      hooks/
      layouts/
      pages/
      routes/
      services/
      utils/
    vite.config.js
  docs/
  README.md
```

## Installation

Install dependencies separately:

```bash
cd pgfinder-backend
npm install

cd ../pgfinder-frontend
npm install
```

## Environment Variables

Backend variables live in `pgfinder-backend/.env`:

```env
DATABASE=mongodb+srv://user:password@cluster/db
PORT=3000
SESSION_SECRET=replace-with-a-long-random-secret
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=optional-google-client-id
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

Frontend variables live in `pgfinder-frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_GOOGLE_MAPS_API_KEY=optional-google-maps-key
```

Never commit real `.env` secrets.

## Backend Setup

```bash
cd pgfinder-backend
npm run dev
```

The backend runs on `http://localhost:3000` unless `PORT` is changed.

Useful checks:

```bash
node --check app.js
node --check controllers/clientController.js
node --check controllers/adminController.js
```

## Frontend Setup

```bash
cd pgfinder-frontend
npm run dev
```

The Vite dev server usually runs on `http://localhost:5173`.

Useful checks:

```bash
npm run lint
npm run build
```

## Database Setup

StayJi uses MongoDB through Mongoose. Set `DATABASE` to a MongoDB Atlas or local MongoDB connection string, then start the backend. The backend uses collections for users, properties, images, shortlists, chats, visits, notifications, inquiries, reviews, move-ins, audit logs, and operational city state.

For Bangalore launch data, keep property city/locality values normalized around Bangalore areas such as Whitefield, Bellandur, Koramangala, HSR Layout, Indiranagar, Marathahalli, Electronic City, and nearby launch localities.

## Running Project

Use two terminals:

```bash
cd pgfinder-backend
npm run dev
```

```bash
cd pgfinder-frontend
npm run dev
```

Open `http://localhost:5173`.

## API Structure

Primary active frontend-facing endpoints include:

- Auth: `/client/loginByUser`, `/client/addUser`, `/api/auth/login`, `/api/auth/signup`.
- Properties: `/client/getPropertyList`, `/client/getPropertyById/:id`, `/client/addProperty`, `/api/properties`.
- User dashboard: `/client/user/overview`, saved properties, visits, saved searches, wallet requests.
- Owner dashboard: owner properties, leads, visits, availability, image and property updates.
- Messaging: `/client/chats` for User to Owner and Owner to User conversation history.
- Notifications: `/client/notifications` and `/api/notifications` with authenticated account scoping.
- Admin: `/client/getAdminStats`, `/client/getAdminUsers`, `/client/admin/searchProperty`, property approval and management endpoints.

## Authentication Flow

Users, Owners, and Admins authenticate with JWT-backed sessions. The frontend stores auth state under `stayji-auth`, and `axiosClient` attaches `Authorization: Bearer <token>` to API calls. Unauthorized responses clear stale auth state and emit `stayji-auth-expired`.

Route protection is handled by `ProtectedRoute`, `RoleProtectedRoute`, and dashboard routing in `pgfinder-frontend/src/routes/AppRoutes.jsx`.

## Project Roles

- User: browse, search, compare, save, message, schedule visits, view history, edit profile.
- Owner/Vendor: manage only their own properties, availability, images, leads, visit requests, messages, profile, and password.
- Admin: manage Bangalore users, owners, properties, approvals, analytics, messages, visits, reports, filters, pagination, and quick actions.

Phase 1 supports only User, Owner/Vendor, and Admin functionality.

## Available Features

- Bangalore-only property discovery.
- Case-insensitive and partial search by name, area, budget, sharing, gender, and property category.
- Property details, images, amenities, pricing, room sharing, rules, nearby places, availability, and maps.
- Compare page for price, distance, amenities, food, room type, deposit, sharing, ratings, owner, availability, and property type.
- Persistent favourites and recently viewed properties.
- User to Owner messaging with timestamps and history.
- Visit request booking, owner status updates, and history.
- Database notifications with unread count and mark-as-read.
- Admin dashboards for operational management.
- Responsive React UI with loading, empty, forbidden, unauthorized, and not-found states.

## Deployment Guide

1. Create production `.env` files for backend and frontend.
2. Set `VITE_API_BASE_URL` to the deployed backend URL.
3. Run frontend checks with `npm run lint` and `npm run build`.
4. Run backend syntax checks with `node --check app.js` and controller checks.
5. Deploy backend first, then frontend.
6. Verify CORS allows the frontend domain.
7. Smoke test User, Owner, and Admin login after deployment.
8. Verify property search, compare, save, message, visit, owner CRUD, and admin approval flows.

## Testing

Manual release QA should cover:

- Registration, login, forgot password, Google login, logout.
- User search, details, map, compare, save, message, visit, notifications, profile.
- Owner add/edit/delete property, image upload, availability, leads, visits, messages.
- Admin user, owner, property, approval, analytics, message, visit, report, filter, pagination, and quick-action workflows.
- Mobile, tablet, laptop, and desktop responsiveness.

Automated checks currently available:

```bash
cd pgfinder-frontend && npm run lint && npm run build
cd ../pgfinder-backend && node --check app.js && node --check controllers/clientController.js && node --check controllers/adminController.js
git diff --check
```

## Performance

The frontend uses lazy-loaded routes and API-level pagination. Keep property images optimized before upload, avoid unnecessary dashboard refetches, and prefer indexed MongoDB queries for listing, owner, status, city, locality, and created-date filters.

## Security

Use strong `SESSION_SECRET` and `JWT_SECRET` values. Validate ObjectIds, restrict owner resources by owner id, restrict notifications to the authenticated account, hash passwords, enforce role-based routes, and keep CORS limited to known frontend domains.

## Phase-2 Roadmap

- AI property recommendation assistant.
- AI search query understanding for locality, commute, budget, and lifestyle preferences.
- AI listing-quality scoring for owners.
- AI moderation for suspicious listings, images, and messages.
- n8n workflows for lead follow-up, visit reminders, owner onboarding, stale listing checks, and admin alerts.
- Payment and move-in automation.
- More city launches after Bangalore stabilizes.

## Contribution Guide

Keep changes scoped, run checks before committing, do not commit secrets, preserve database compatibility, and avoid adding routes or controls that are not implemented end to end.

## License

ISC. See `pgfinder-backend/LICENSE`.
