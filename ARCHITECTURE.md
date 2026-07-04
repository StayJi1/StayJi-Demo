# StayJi Bangalore MVP Architecture

## Scope

StayJi is scoped to a Bangalore-only launch. The supported roles are:

- User
- Owner
- Admin

Nationwide city expansion, public comparison, blogs, recommendations, dummy inventory workflows, and Super Admin UI are outside the MVP launch path.

## Runtime Components

- Frontend: `pgfinder-frontend`, React, Vite, React Router, React Query, Tailwind.
- Backend: `pgfinder-backend`, Express, Mongoose, JWT auth, Multer uploads.
- Database: MongoDB collections for users, properties, visits, inquiries, conversations, messages, shortlists, notifications, audit logs, and update requests.
- Uploads: backend-served upload paths normalized by `pgfinder-frontend/src/api/propertyApi.js`.

## Bangalore Enforcement

Frontend constants live in `pgfinder-frontend/src/config/mvp.js`.

Backend constants live in `pgfinder-backend/controllers/clientController.js`:

- `MVP_CITY = Bangalore`
- `MVP_STATE = Karnataka`
- `MVP_CITY_REGEX = /^(bangalore|bengaluru)$/i`

Public property discovery defaults to Bangalore. `Bangalore`, `bangalore`, `BANGALORE`, and `Bengaluru` are treated as the same city.

## Core Flows

User:

- Search `/properties` and `/bangalore` for Bangalore listings.
- Filter by PG name, locality, budget, gender, and sharing type.
- Use current location or locality search for nearby sorting.
- Open property details with gallery, amenities, rent, occupancy, food, rules, address, map, and owner information.
- Save/remove shortlist items.
- Message owners through `/client/chats`.
- Request visits through `/client/addVisit`.
- View history from `/dashboard/user`.

Owner:

- Register/login as owner.
- Add, edit, delete/archive, and manage own listings only.
- Upload multiple images.
- Manage availability.
- View inquiries and visit requests from `/dashboard/owner/leads`.
- Reply to user-owner messages from `/dashboard/owner/messages`.

Admin:

- Manage Bangalore listings, users, and owners.
- Approve, reject, hide, and edit listings within Bangalore scope.
- Access admin routes from `/dashboard/admin`.

## Search And Pagination

`GET /client/getPropertyList` applies backend filtering before pagination. Launch-critical filters include:

- city
- PG/property name
- locality/area
- budget
- gender
- sharing type

The frontend listing page uses `propertyService.fetchPropertyPage` and renders backend pagination metadata.

## Messaging Security

User-owner messaging uses the `Conversation` and `Message` models through `/client/chats`.

Only authenticated users and owners can access this surface. Users can create conversations for a property owner; owners can reply only to their own conversations.

## Non-MVP Routes

- `/compare` redirects to `/properties`.
- `/blog*` redirects to `/bangalore`.
- `/recommendations*` redirects to `/properties`.
- `/super-admin-login` redirects to `/admin-login`.
- `/dashboard/super-admin` redirects to `/dashboard/admin`.

## Launch Status

The codebase is closer to a Bangalore MVP path, but public launch still requires live manual QA with real user, owner, admin, property, image upload, messaging, and visit data.
