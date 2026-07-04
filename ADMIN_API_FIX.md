# ADMIN_API_FIX.md — Admin Dashboard APIs Empty Data Audit Fix Plan

## Scope (per request)
Fix only Admin APIs. Audit only these files:
- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-backend/app.js`
- `pgfinder-frontend/src/context/AuthContext.jsx`
- `pgfinder-frontend/src/api/axiosClient.js`

## Problem statement
Admin dashboard UI loads, but:
- Users list is empty
- Owners list is empty
- Properties list is empty

## 1) What to verify (ordered, minimal)

### 1.1 Mongo query constraints (RBAC + scope)
Admin endpoints generally apply:
- `attachAuthenticatedUser`
- `requireRoles(['admin'])`
- `adminUserCityScope(req)` / `adminCityScope(req)`

**Verify: admin token payload user has**:
- `assignedCity` (and optionally `assignedState`) matching DB values
- or that fallback to `bangalore...Scope()` triggers as intended

**Common empty-data causes**
- `assignedCity` is empty string in DB/JWT => scope becomes overly restrictive or falls back incorrectly
- legacy fields mismatch: DB has `city/cityName` but JWT uses `assignedCity`

### 1.2 populate() is failing silently
For admin vendor profile / search endpoints, properties are fetched with `populate(...)` chains.

**Verify**
- referenced fields exist in schema and match relation names:
  - `userIDFK` -> userMaster
  - `vendorId` -> userMaster
  - `propertyTypeIDFK` -> propertyType
- `populate` paths used in code are correct and are not overwritten by aggregation/$lookup aliases.

If populate fails, Mongoose usually returns null/empty objects but arrays may still be returned—so also verify frontend mapping.

### 1.3 API response shape mismatch (backend vs frontend)
Admin dashboard frontend uses `dashboardApi.js` which typically expects:
- `res.data?.data` to be an array OR a specific object shape

**Verify**
- backend returns:
  - `{ result: 'success', data: [...] }` for list APIs
  - not `{ result:'success', data: { users: [...] } }` unless frontend reads nested keys

If backend returns nested objects, frontend will render empty arrays.

### 1.4 Admin endpoints accidentally missing middleware (attachAuthenticatedUser)
For every admin dashboard route used by UI, ensure:
- the route includes `attachAuthenticatedUser`
- and role gating uses `requireRoles(['admin'])`

If middleware is missing, `req.auth` may be undefined, causing code paths to apply wrong defaults or skip city scoping.

### 1.5 Remove any remaining “SuperAdmin” checks
Search in `clientController.js` for gating like:
- `superAdmin`
- `SuperAdmin`
- or any role list that excludes `admin`.

If found, remove/replace with consistent admin gating.

## 2) Exact endpoint checklist (from frontend usage)
In `pgfinder-frontend/src/api/dashboardApi.js`, confirm the UI calls:
- `GET /client/getAdminUsers`
- `POST /client/getAdminStats`
- `POST /client/admin/searchProperty`
- `POST /client/admin/getVendorFullProfile`

For each endpoint, verify:
1. Middleware includes `attachAuthenticatedUser`
2. `requireRoles(['admin'])` exists
3. City scoping is applied consistently
4. Response shape matches frontend mapping

## 3) Backend fixes (only Admin API related)
Implement only if verification fails:

### 3.1 Fix admin city scope matching
- Ensure `adminCityScope(req)` and `adminUserCityScope(req)` match both:
  - `assignedCity/assignedState`
  - and legacy `city/cityName/state/stateName`

- If `req.auth.assignedCity` is blank but admin should see global data, fall back only when explicitly intended (document default).

### 3.2 Fix response shape for list APIs
Return consistently:
- users endpoint => `data: []`
- properties endpoint => `data: []` or `{ properties: [] }` AND update frontend mapping accordingly (but per scope, prefer backend adjustment if frontend mapping already correct).

### 3.3 Ensure populate paths and alias consistency
- In aggregation pipelines that use `$lookup ... as: property`, ensure `$addFields` uses the correct alias.
- Ensure `populate()` is not applied to fields that are already overwritten by aggregation outputs.

## 4) Frontend-side checks (only for auth + mapping)
Per scope, only:
- Confirm `axiosClient` always sends `Authorization: Bearer <token>` after admin login.
- Ensure `AuthContext` sets token before dashboard renders.

If mapping fails, adjust mapping logic only if backend response shape is corrected.

## 5) Deliverables / Acceptance
Admin dashboard must show:
- at least one user row for admins with assigned scope
- at least one owner row (Vendor/Owner accounts)
- at least one property row

If still empty:
- log/trace the resolved filters used in admin scope functions
- confirm JWT scope fields match DB values.

