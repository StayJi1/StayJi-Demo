# StayJi Bangalore MVP Final Stabilization Audit

Date: 2026-06-20

## Status

Not marked launch-ready yet. Code-level stabilization was completed and the frontend production build/lint pass, but a real launch sign-off still needs live MongoDB data, seeded role accounts, image uploads, and browser QA across User, Owner, and Admin flows.

## Files Modified In This Pass

- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-frontend/src/context/AuthContext.jsx`
- `pgfinder-frontend/src/components/common/RoleProtectedRoute.jsx`
- `pgfinder-frontend/src/components/layout/Sidebar.jsx`
- `pgfinder-frontend/src/api/adminApi.js`
- `pgfinder-frontend/src/pages/auth/LoginPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/admin/ManageUsersPage.jsx`
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx`
- `pgfinder-frontend/src/routes/AppRoutes.jsx`
- `FINAL_MVP_AUDIT.md`

Note: the workspace already had many modified files before this pass. Those were preserved.

## APIs Fixed Or Stabilized

- `POST /client/loginByUser`
  - Legacy Super Admin account labels now authenticate through the Admin portal as `admin`.
  - Public login still blocks Admin accounts from using the public portal.

- `GET /client/getAdminStats`
  - Added owners, total properties, approved properties, rejected properties, visits today, monthly visits, messages, and latest activities.
  - Fixed scoped visit/inquiry counts by counting against scoped Bangalore property IDs instead of matching unprefixed lookup fields.

- `GET /client/user/overview`
  - Now requires authentication and self/Admin access.

- `POST /client/user/viewed-properties`
  - Now requires authenticated User ownership.

- `POST /client/user/saved-searches`
  - Now requires authenticated User ownership.

- `DELETE /client/user/saved-searches/:id`
  - Now requires authenticated User ownership.

- Admin governance endpoints
  - City-state, launch, governance, and password reset flows now use Admin governance checks instead of Super Admin checks.

## Bugs Fixed

- Removed active Super Admin role dependency from frontend auth, protected routes, sidebar, login page, admin API normalization, and route table.
- Migrated legacy Super Admin role strings to normalize as Admin for backward compatibility with old database records.
- Gave Admin the full former Super Admin permission set.
- Allowed Admin user-management controls that were previously hidden behind `super-admin`.
- Removed explicit `/super-admin-login` and `/dashboard/super-admin` routes.
- Fixed Admin stats response gaps that could make dashboard metrics blank or incomplete.
- Protected saved searches and recently viewed endpoints from cross-user mutation.
- Kept owner/user property detail private access checks aligned to `owner` and `admin` only.

## Verified

- `node --check pgfinder-backend/controllers/clientController.js`
- `node --check pgfinder-backend/app.js`
- `npm run build` in `pgfinder-frontend`
- `npm run lint` in `pgfinder-frontend`

## Remaining Issues Before Launch Sign-Off

- Live database QA is still required for User, Owner, and Admin accounts.
- Image upload/delete flows need browser testing with real multipart uploads.
- Google Login needs real OAuth credential testing.
- Email/password reset delivery depends on environment mail configuration.
- Mobile/tablet responsive QA needs visual browser validation.
- `pgfinder-frontend/src/pages/dashboard/admin/SuperAdminDashboard.jsx` still exists as dead, unrouted code from earlier work. It is not reachable from current routes, but can be deleted in a cleanup pass after confirming no local dependency.

## Manual Testing Checklist

- User: register, login, Google login, logout, profile update.
- User: search by PG name, locality, Bangalore, budget, gender, sharing.
- User: open property details, gallery, map, save, message, book visit, share, report.
- User: dashboard loads saved properties, saved searches, recently viewed, visits, messages.
- User: cancel/reschedule pending visit.
- Owner: login, dashboard stats, own properties only.
- Owner: add property with multiple images, edit, delete/archive, update occupancy.
- Owner: reply to messages, approve/reject/reschedule visits.
- Admin: login through `/admin-login`.
- Admin: dashboard metrics load without failed requests.
- Admin: users and owners tables load with search/filter.
- Admin: properties table load with search/filter and no blank pages.
- Admin: approve/reject/verify/hide/unhide property.
- Admin: manage Bangalore city settings and launch controls.
- Admin: review messages, visits, reviews, reports, move-ins, payout/update requests.
- Responsive: home, properties, detail, user dashboard, owner dashboard, admin dashboard, tables, navigation on desktop/laptop/tablet/mobile.
