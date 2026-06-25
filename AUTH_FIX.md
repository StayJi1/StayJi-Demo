# AUTH_FIX.md — Authentication / Admin RBAC / JWT Audit Fix Plan (Audit-Only)

This document audits the authentication & authorization system and proposes minimal, targeted fixes to address the issues listed:
- Admin authentication
- JWT
- Authorization (RBAC)
- Admin dashboard APIs
- Users not loading
- Owners not loading

## 0) What I inspected (key files)
- **Backend**
  - `pgfinder-backend/controllers/clientController.js` (JWT verification, role gating, admin scopes, dashboard endpoints)
  - `pgfinder-backend/controllers/adminController.js` (session-based admin EJS flow; default admin bootstrap)
  - `pgfinder-backend/app.js` / `server.js` (route wiring)
  - `pgfinder-backend/utils/security.js` (password hashing/verification)
- **Frontend**
  - `pgfinder-frontend/src/context/AuthContext.jsx` (token/role persistence, axios header wiring)
  - `pgfinder-frontend/src/api/axiosClient.js` (Authorization header interceptor / 401 expiry)
  - `pgfinder-frontend/src/api/dashboardApi.js` (admin dashboard API usage)
  - `pgfinder-frontend/src/components/common/RoleProtectedRoute.jsx` (route gating)

## 1) Root causes found

### 1.1 Frontend role normalization mismatch (causes “Users/Owners not loading”, and admin access issues)
**Frontend** normalizes roles as:
- owner/host/hostel/vendor => `owner`
- personal/student => `user`
- admin => `admin`

**Backend** expects roles based on `user.userType` mapped through `normalizeAccountType`:
- owner/host/vendor => `owner`
- personal/student/user => `user`
- admin => `admin`

However, the frontend frequently stores/uses `role` from the **persisted token payload**, while the backend endpoints do role checks using `req.auth.role` derived from the DB.

If the frontend ends up with:
- `role = user` while backend account is `Owner` (or vice-versa)
then:
- admin-only protected routes may redirect
- dashboard calls may be made with missing/incorrect permissions or wrong endpoint assumptions.

### 1.2 JWT header parsing & token attachment inconsistencies (causes 401 / invalid auth)
Backend `getBearerToken` uses:
```js
const header = req.headers.authorization || req.headers.Authorization || ''
if (!header || !header.toString().startsWith('Bearer ')) return null
return header.toString().slice(7).trim()
```
So the correct header must be exactly `Authorization: Bearer <token>`.

Frontend sets `axiosClient.defaults.headers.common.Authorization = Bearer ${token}`.
But `AuthContext` stores token under `stayji-auth` and `AuthContext` also updates the axios default header.

Potential failure mode:
- Some calls happen before `AuthContext` sets token into axios defaults
- Or the stored auth entry has a different shape and token is `undefined`
- Or the interceptor fallback pulls from storage but the stored key contains different JSON fields.

### 1.3 Admin authorization scope logic is hardcoded to Bangalore (can lead to empty lists)
Backend uses:
- `MVP_CITY = 'Bangalore'`
- `bangalorePropertyScope()` and `adminCityScope()`

Admin endpoints often apply city/state scopes, and if admin assignment doesn’t match the expected format (`assignedCity` / `assignedState`), queries can yield **no records**.

This directly matches “Users not loading” / “Owners not loading” symptoms on admin dashboards.

### 1.4 Admin endpoint protection uses a generic role middleware, but some routes are missing proper auth attachment
In `clientController.js`, some admin workflows correctly use:
- `attachAuthenticatedUser`
- `requireRoles(['admin'])`

But there are also several endpoints used by the admin dashboard that may not attach auth consistently (observed patterns include endpoints without `attachAuthenticatedUser` or with broader guards).

Even when RBAC exists, if attach is missing, `req.auth` will be undefined leading to:
- fallback behavior (sometimes open access / sometimes hard failure)
- or inconsistent behavior between endpoints.

### 1.5 `RoleProtectedRoute` may be gating admin pages incorrectly
Frontend `RoleProtectedRoute` maps roles into `currentRole` with:
- owner-like => `owner`
- personal/student => `user`
- else uses rawRole

If admin dashboard routes are guarded with `role="admin"`, this is fine.
But if routes pass `role` incorrectly (ex: `role="user"` or similar), then admin can’t see dashboard.

Also, `isAuthenticated` is computed as `Boolean(user)`; but some flows set token without setting `user` early, leading to redirect loops.

## 2) Required fixes (implementation scope)

> **Important**: This section is the fix specification for code changes. The current task requests only generation of `AUTH_FIX.md`. No unrelated code modifications should be made.

### 2.1 Admin authentication fixes
**Backend (JWT-based)**
- Ensure admin login returns a JWT and a role consistent with backend `normalizeAccountType`.
- Enforce that `loginByUser` blocks incorrect portal usage (already partially done), but align the frontend login payload.

**Backend (session-based EJS)**
- `adminController.js` uses **express-session** for EJS pages.
- Ensure it doesn’t interfere with JWT endpoints.
- Do not mix session cookies and JWT in the same “authorization meaning”.

### 2.2 JWT fixes
- Ensure backend `signAuthToken` includes fields used by frontend if frontend relies on persisted token role.
- Standardize payload keys (prefer `{ sub: <id>, role, userType }`).
- Make backend accept both `decoded.id` and `decoded.userId` (already does).

**Frontend**
- Only treat `token` as source-of-truth for auth header, not `user` presence.
- Update `AuthContext` so that `isAuthenticated` becomes `Boolean(token && user)` or `Boolean(token)` depending on expected UX.

### 2.3 Authorization (RBAC) fixes
- Apply `attachAuthenticatedUser` and `requireRoles` consistently for ALL dashboard/admin APIs.
- Ensure admin-only routes do not accept owner/user tokens.
- Add explicit permission checks for admin operations where needed.

### 2.4 Admin dashboard API fixes
Symptoms:
- Users not loading
- Owners not loading

Backend admin list endpoints referenced by frontend `dashboardApi.js`:
- `GET /client/getAdminUsers`
- `POST /client/getAdminStats`
- `POST /client/admin/searchProperty`
- `POST /client/admin/getVendorFullProfile`

Fix strategy:
1. Confirm all these endpoints apply city scope based on `req.auth.assignedCity/assignedState`.
2. Normalize admin stored `assignedCity/assignedState` values so regex matching works.
3. Provide fallback scope for admins with empty assignedCity:
   - either allow `Bangalore` fallback (already exists)
   - but only if admin truly intended global access.

### 2.5 Users not loading / Owners not loading (data visibility)
Primary suspected cause: **scope mismatch**.
- Admin dashboard list uses `adminUserCityScope(req)` which returns `$or` constraints.
- If admin assigned fields are stored as blank/legacy (`assignedCity` vs `city` vs missing `assignedCity`) then:
  - `adminUserCityScope` may fall back to `bangaloreUserScope()` OR may over-constrain depending on token payload.
  - dashboard endpoints may return empty arrays leading to “Users/Owners not loading”.

### 2.6 Specific backend hardening for admin dashboard APIs
- Ensure `attachAuthenticatedUser` is applied for ALL admin dashboard endpoints used by `dashboardApi.js`.
- Ensure dashboard endpoints always return `{ result, data }` consistently and never leak `null` for `data` (frontend expects arrays).
- If an admin is assigned to a state/city, make `adminCityScope` match both:
  - `assignedCity/assignedState`
  - and legacy `city/cityName/state/stateName` fields.

### 2.7 Frontend data-loading fixes (owners/users)
- Ensure `dashboardApi` functions treat response shape correctly:
  - Many functions currently use `res.data?.data` and assume arrays.
  - If backend returns `{ result, data: { ... } }`, update normalization to read nested arrays.
- Ensure `AuthContext` sets `token` before route render triggers dashboard calls.

## 3) Verification checklist (no code changes)
- Login admin via the dedicated admin portal.
- Confirm JWT is returned and `Authorization` header is set.
- Call admin endpoints:
  - `/client/getAdminUsers`
  - `/client/getAdminStats`
  - `/client/admin/searchProperty`
  - `/client/admin/getVendorFullProfile`
- Confirm responses are not empty when admin is assigned and that counts match DB.
- Confirm frontend:
  - users list component renders after token/user state is ready.
  - owners list component renders with correct scope.

