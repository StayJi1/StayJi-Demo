# StayJi Bangalore MVP Final Release Report

Date: 2026-06-28

## Files Modified

- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-frontend/src/routes/AppRoutes.jsx`
- `pgfinder-frontend/src/pages/PropertiesPage.jsx`
- `pgfinder-frontend/src/pages/ComparePage.jsx`
- `pgfinder-frontend/src/components/property/PropertyCard.jsx`
- `pgfinder-frontend/src/pages/auth/LoginPage.jsx`
- `pgfinder-frontend/src/pages/auth/SignupPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/vendor/AddPropertyPage.jsx`

## Bugs Fixed

- Restored Compare as a real route and browsing workflow.
- Enforced a maximum of 3 compared properties.
- Kept compare selections persistent while browsing.
- Added missing compare fields: Availability and Property Type.
- Locked notifications to the authenticated account.
- Prevented notification read/mark-read actions from using arbitrary account IDs.
- Preserved login/signup form state when opening Terms or Privacy before submission.
- Added launch-required property categories to Owner, Search, and Compare flows.
- Added Five sharing, Dormitory, and Other sharing defaults while keeping custom values editable.

## APIs Fixed

- `GET /client/notifications`
- `POST /client/notifications/:id/read`
- `POST /client/notifications/mark-read`
- `/api/notifications/*` aliases inherit the same auth-bound behavior.
- `GET /client/user/overview` now returns only the authenticated user's notification history.

## Database Changes

No schema or migration changes were made.

## Authentication And Authorization

- Notification history now requires a valid JWT.
- Notification list/read/mark-read no longer trusts client-provided `userId`, `recipientId`, `role`, or `recipientRole`.
- Super Admin remains absent from active source-level routing and guards.

## Dashboard And Flow Notes

- User dashboard notification history is isolated.
- Owner add/edit property supports Bangalore launch categories and sharing models.
- Compare is available from listing cards and `/compare`.

## Verification Completed

- Backend syntax check passed.
- Frontend lint passed.
- Frontend production build passed.
- Frontend dev startup passed at `http://127.0.0.1:5173/`.
- Backend startup reached MongoDB successfully outside sandbox, but port `3000` was occupied by local `node` process PID `4804`.

## Remaining Issues

- Confirm whether local `node` process PID `4804` is the intended backend process before production startup.
- Complete browser QA for all three roles with real test accounts.
- Confirm no console errors or failed API requests during full user, owner, and admin journeys.

## Deployment Checklist

- Ensure backend environment variables are set: MongoDB URI, JWT secret, session secret, CORS origins, and any Google OAuth credentials.
- Confirm backend port ownership and process manager configuration.
- Run `npm run build` in `pgfinder-frontend`.
- Deploy backend before frontend.
- Verify production `VITE_API_BASE_URL` points to the deployed backend.
- Smoke test User, Owner, and Admin login after deployment.

## Rollback Notes

- Revert the eight modified source files listed above to restore the previous behavior.
- No database rollback is required.
- If notification isolation causes missing broadcast notifications, restore account-specific notification creation rather than reopening query-param notification access.

## Launch Readiness Score

87/100. Build-ready with focused browser QA and backend port cleanup still required.
