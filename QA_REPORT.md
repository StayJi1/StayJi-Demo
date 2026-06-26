# StayJi Bangalore MVP QA Report

Audit date: 2026-06-27

Scope: final release QA and stabilization for the Bangalore-only MVP. This audit was completed before code changes, per the release brief.

## Executive Summary

The application is close to the Bangalore MVP shape: public property search is scoped to Bangalore, JWT login exists, owner/user/admin dashboards are wired, and the main dashboard route tree exposes only User, Owner, and Admin roles.

The highest-risk launch blockers are remaining Super Admin route/role references in active code, lack of centralized scroll restoration, unsecured legacy admin-owner message endpoints, and several legacy endpoints that still expose mutation or data access without modern auth guards. Search filtering is backend-side before pagination for the primary public and admin list APIs, but admin search has a narrower field set than public search.

## P0 Findings

| Area | Finding | Evidence | Impact |
| --- | --- | --- | --- |
| Roles / Routing | Super Admin routes still exist as redirect aliases. | `pgfinder-frontend/src/routes/AppRoutes.jsx` has `/super-admin-login` and `/dashboard/super-admin/*`. | Violates the launch requirement to completely remove Super Admin routes and references. |
| Roles / Auth | Active auth normalization still accepts Super Admin aliases and maps them to Admin. | `AuthContext.jsx`, `LoginPage.jsx`, `adminApi.js`, `dashboardApi.js`, and `clientController.js` include `super_admin`, `super admin`, `super-admin`, `superadmin`. | Leaves a fourth legacy role path in active auth/RBAC logic. |
| Admin / Messaging | Admin-vendor messaging endpoints depend on the broad `/api/admin` guard but are still reachable under `/client/vendors/:id/messages` without an admin/owner route guard. | `clientController.js` defines `/vendors/:id/messages`, `/vendors/:id/messages/:messageId/delete`; `dashboardApi` and `adminApi` call API variants inconsistently. | Data leakage and unauthorized message creation/deletion risk through legacy `/client` paths. |
| Visits / Move-ins / Wallet | Some legacy payment/move-in routes are unauthenticated even though they affect launch workflows. | `clientController.js` has `/moveIns`, `/moveIns/:id/owner-confirm`, `/moveIns/:id/review`, `/payment-requests`, `/wallet/payouts` without full role guards. | Users can hit sensitive workflow APIs outside the protected dashboard path. |

## P1 Findings

| Area | Finding | Evidence | Impact |
| --- | --- | --- | --- |
| Scroll / Navigation | No centralized scroll restoration exists. Listing cards manually save scroll, and `PropertiesPage` manually restores it. | `PropertyCard.jsx` writes `stayji-properties-scroll`; `PropertiesPage.jsx` calls `window.scrollTo`. | Property detail pages can open mid-scroll; behavior is duplicated and inconsistent. |
| Admin Data | `getAdminVendorLeadSummary` is public under `/client`. | `dashboardApi.adminVendorLeadSummary` calls `/client/getAdminVendorLeadSummary`; route lacks auth. | Admin summary data can be fetched without a token. |
| Search | Public search supports partial/case-insensitive matching before pagination, but admin quick search covers fewer fields. | `buildPropertyQuery` searches amenities, sharing, gender, meals, room inventory; `/admin/searchProperty` only searches core text fields. | Admin search may miss properties that public search can find. |
| Error Handling | Frontend pages still log avoidable console errors for expected API failures. | `HomePage.jsx`, `PropertiesPage.jsx` contain `console.error` in user-facing fallback flows. | Produces noisy release console output. |
| Legacy Admin UI | `/admin` EJS controller remains mounted with many unguarded legacy admin routes and console logs. | `app.js` mounts `adminController` at `/admin`; `adminController.js` exposes many EJS routes. | Legacy surface is outside MVP React app and may confuse release hardening. |

## P2 Findings

| Area | Finding | Evidence | Impact |
| --- | --- | --- | --- |
| Documentation | User-facing docs still mention Super Admin. | `docs/SUPER_ADMIN_MANUAL.md`, `docs/SECURITY_AND_PASSWORDS.md`, `docs/USER_MANUAL.md`, `docs/OWNER_MANUAL.md`, `docs/ADMIN_MANUAL.md`. | Launch documentation conflicts with the three-role MVP. |
| Navigation | Blog and recommendation pages are implemented but app routes redirect them to Bangalore/properties. | `AppRoutes.jsx` redirects `/blog`, `/blogs`, `/recommendations`. | Dead code exists, but redirects prevent blank pages. |
| Console Logging | Backend seed/admin legacy scripts log operational data. | `seedData.js`, `adminController.js`, `clientController.js`. | Not critical for production API if legacy routes remain unused, but release logs are noisy. |

## Feature Audit

### Authentication

- Register: present through `/api/auth/signup` and `/client/addUser`.
- Login: present through `/api/auth/login` and `/client/loginByUser`; JWT is signed with `JWT_SECRET` or session fallback.
- Logout: frontend clears session/local storage and Axios default auth header.
- Token storage: `sessionStorage` primary, `localStorage` fallback.
- Axios Authorization header: request interceptor restores bearer token from storage.
- Protected routes: dashboard routes are wrapped in `ProtectedRoute` and `RoleProtectedRoute`.
- Admin authentication: `/admin-login` uses Admin portal and blocks public Admin login.

### Admin

- Dashboard, users, owners, properties, analytics, governance, city-state, leads, and messages are present.
- Admin statistics come from database counts.
- Several admin APIs are protected through the `/api/admin` router prefix, but some legacy `/client` aliases remain public or inconsistently guarded.

### User

- Search, property detail, gallery, save, message owner, book visit, dashboard, and logout flows are present.
- Save/message/visit actions require user auth and redirect unauthenticated users to login.

### Owner

- Dashboard, add/edit/delete property, image upload, own properties, messages, visits/leads, and logout are present.
- Dedicated image deletion is not clearly exposed as an owner control.

### Search

- Primary public search filters before pagination in `buildPropertyQuery`.
- Case-insensitive partial matching is used through regular expressions.
- Public property API is scoped to Bangalore via `MVP_CITY`.
- Search covers property name, category, area/locality, budget, gender, sharing, food, amenities, and availability.

### Property Details

- Gallery, images, amenities, food/rent/availability, owner, map-related coordinates, save, message, visit, share, and report UI surfaces exist.
- Missing/deleted property states are handled with a fallback not-found panel.

### Messaging

- User-owner conversation storage uses `Conversation` and `Message`.
- Duplicate user-owner conversations are prevented by `findOneAndUpdate` with user, owner, property, type, and active status.
- Unread counts and read status are updated when opening a conversation.
- Legacy admin-owner messaging needs stricter role checks.

### Visits

- Booking is available through `/client/addVisit`.
- Approve/reject/reschedule/cancel status updates exist through `/client/visits/:id/status`.
- Owner/admin role checks exist for the modern status route.

### Responsive / Navigation

- Navbar/sidebar use responsive Tailwind patterns.
- Dashboard tables and dense admin sections need final viewport testing after fixes.
- Centralized scroll restoration is missing and must be added.

## Recommended Stabilization Order

1. Remove active Super Admin route aliases and role aliases from live code.
2. Add centralized scroll restoration while preserving listing back-position behavior.
3. Add role guards to legacy admin-vendor messaging and admin summary endpoints.
4. Remove avoidable frontend console noise in expected API fallback paths.
5. Run frontend build/lint and backend syntax/start checks.
