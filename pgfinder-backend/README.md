# StayJi Backend

Express and MongoDB API for the Bangalore Phase-1 StayJi launch.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

The backend runs on `http://localhost:3000` unless `PORT` is changed.

## Environment

```env
DATABASE=mongodb+srv://user:password@cluster/db
PORT=3000
SESSION_SECRET=replace-with-a-long-random-secret
JWT_SECRET=replace-with-a-long-random-secret
GOOGLE_CLIENT_ID=optional-google-client-id
CORS_ORIGINS=http://localhost:5173,https://your-frontend-domain.com
```

## Active Roles

- User
- Owner/Vendor
- Admin

Phase 1 supports only User, Owner/Vendor, and Admin routes or permissions.

## API Areas

- Auth and profile
- Property search and CRUD
- Property images and amenities
- Shortlists, recently viewed, compare history
- User to Owner messaging
- Visit requests and status updates
- Database notifications
- Owner leads and availability
- Admin users, owners, properties, approvals, visits, messages, reports, analytics

## Checks

```bash
node --check app.js
node --check controllers/clientController.js
node --check controllers/adminController.js
```

`npm test` is currently a placeholder and should not be used as release proof.
