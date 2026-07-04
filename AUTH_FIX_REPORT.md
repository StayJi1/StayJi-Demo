# AUTH_FIX_REPORT.md

## Status
Authentication-system audit completed. A targeted fix plan has been generated in **AUTH_FIX.md**.

## What was audited (authentication-only)
- Frontend auth wiring:
  - `pgfinder-frontend/src/context/AuthContext.jsx`
  - `pgfinder-frontend/src/api/axiosClient.js`
  - `pgfinder-frontend/src/components/common/RoleProtectedRoute.jsx`
  - `pgfinder-frontend/src/api/authApi.js`
  - `pgfinder-frontend/src/api/dashboardApi.js`
- Backend auth/RBAC/JWT/dashboard:
  - `pgfinder-backend/controllers/clientController.js`
  - `pgfinder-backend/controllers/adminController.js`
  - `pgfinder-backend/utils/security.js`
  - `pgfinder-backend/middleware/resilience.js`
  - `pgfinder-backend/app.js`

## Key issues identified (high-level)
- Frontend role normalization/persistence is not guaranteed to match backend `normalizeAccountType(user.userType)`.
- JWT Authorization header attachment timing/shape can cause intermittent 401 / missing auth.
- Admin dashboard data visibility likely impacted by admin city/state scope matching.
- Authorization enforcement must be consistent: some admin workflows can behave incorrectly if `attachAuthenticatedUser`/`requireRoles` isn’t applied uniformly.

## Fix instructions
All fix details are specified in **AUTH_FIX.md**. No code changes were applied in this step.

