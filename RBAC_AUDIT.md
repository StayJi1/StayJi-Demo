# RBAC Audit

Scope: permissions only. This audit verifies user, owner, admin, and super-admin role handling, hidden controls, missing permissions, and privilege escalation risks. No application code was modified.

## Executive Summary

The frontend has clear route-level RBAC for dashboards, but backend enforcement is uneven. Modern `/api/admin/*` routes are mostly protected by a controller-level admin guard, while many `/client/*` routes remain unauthenticated and trust IDs or role markers supplied in the request body.

The largest risk is not hidden frontend controls. The largest risk is backend endpoints that allow user, owner, or admin-like actions without verifying the caller from a JWT.

## Role Model Observed

### User

- Frontend normalized roles: `user`, `personal`, `student`.
- Default permissions in backend helper: `browse_properties`, `manage_own_profile`.
- Dashboard route: `/dashboard/user`.

### Owner

- Frontend normalized roles: `owner`, `vendor`, `host`, `hostel`.
- Default permissions in backend helper: `manage_own_properties`, `view_own_leads`, `view_own_finance`.
- Dashboard route: `/dashboard/owner`.

### Admin

- Frontend normalized role: `admin`.
- Default permissions in backend helper: `manage_users`, `manage_properties`, `manage_moderation`, `manage_seo`, `view_city_analytics`.
- Dashboard route: `/dashboard/admin`.
- Backend city scoping exists through `adminCityScope()` and `adminUserCityScope()`.

### Super Admin

- Frontend normalized roles: `super-admin`, `super admin`, `super_admin`, `superadmin`.
- Backend normalized role: `super_admin`.
- Default permissions in backend helper: `manage_users`, `manage_properties`, `manage_finance`, `manage_admins`, `manage_dummy_data`, `manage_seo`, `manage_moderation`, `view_global_analytics`.
- Dashboard route: `/dashboard/super-admin`.
- Super admin can also access admin routes from the frontend guard.

## Frontend Permission Gates

### Present Controls

- `/dashboard/*` is wrapped by `ProtectedRoute`.
- Role-specific dashboards use `RoleProtectedRoute`.
- Super admin is intentionally allowed through admin routes.
- Sidebar hides/shows links by normalized role:
  - user sees user dashboard/profile/browse.
  - owner sees owner dashboard, properties, leads, add property.
  - admin sees manage users/properties.
  - super admin sees admin links plus governance.
- Admin-only edit fields in `ManageUsersPage` are hidden unless `currentRole === 'super-admin'`.

### Hidden Controls

- `ManageUsersPage` hides assigned city/state and role editing unless the frontend role is `super-admin`.
- Super-admin governance link is hidden unless normalized role is `super-admin`.
- Owner-only links for adding properties and viewing leads are hidden unless normalized role is `owner`.
- User booking link is only added when `role === 'user'`.

### Frontend Gaps

- Frontend RBAC is client-side only and can be bypassed by direct API calls.
- `/dashboard/profile` is authenticated but not role-specific. This is likely intentional, but all roles share the same profile UI.
- Sidebar uses `role === 'user'` for the user-specific “My bookings” link, while other areas normalize role aliases. A `student`/`personal` role may pass user routing but not see this sidebar link.
- Frontend stores user/role/token in `sessionStorage`; route gating trusts restored client state until backend auth status checks run.

## Backend Permission Architecture

### Stronger Patterns Present

- `attachAuthenticatedUser` verifies Bearer JWT and loads active user.
- `requireRoles(['admin', 'super_admin'])` can attach auth if `req.auth` is absent.
- Modern admin route group is protected by:
  - `router.use(['/admin', '/analytics', '/properties', '/vendors', '/users', '/create-account', '/auditLogs', '/governance', '/dummy-transition', '/city-states', '/leads', '/moveIns', '/payment-requests'], attachAuthenticatedUser, requireRoles(['admin', 'super_admin']))`
- Admin city scoping exists for many modern admin property/user queries.
- `assertAdminCanManageUser` blocks city admins from managing admins/super admins and from managing users outside assigned city.
- Some sensitive queues are explicitly protected:
  - wallet payout review
  - property update request review
  - review moderation
  - change password

### Weak Patterns Present

- Many `/client/*` routes are unauthenticated.
- Many routes use `req.body.userIDFK`, `req.body.ownerId`, `req.body.vendorId`, `req.body.adminId`, or `req.body.performerRole` as authority signals.
- Some routes distinguish owner versus admin behavior using body fields rather than `req.auth`.
- `permissions` arrays are issued in JWT/default helpers, but most route guards check only role, not specific permission strings.

## Critical Findings

### 1. User Profile Update Can Target Arbitrary User IDs

Risk: privilege escalation / account tampering.

Observed endpoints:

- `POST /client/updateUser`

Issue:

- The route updates by `req.body._id`, `req.body.id`, or equivalent body-provided user id.
- It is not protected by `attachAuthenticatedUser`.
- The authenticated user is not required to match the target user id.

Impact:

- A caller who knows another user id may update profile fields such as name, contact, occupation, gender, city/state, bio, and social links.

### 2. Owner Property Update/Delete Relies On Body Markers

Risk: property tampering or unauthorized delete/archive.

Observed endpoints:

- `POST /client/updateProperty`
- `POST /client/deleteProperty`
- `POST /client/reactivateProperty`
- `POST /client/properties/:id/occupancy`

Issue:

- These endpoints are not generally JWT-protected.
- `updateProperty` decides whether an update is an owner self-update using `ownerId/vendorId/userIDFK` and absence of `adminId/performerRole` in the body.
- If a caller supplies admin-like body fields, protected-field approval behavior can be bypassed.
- `deleteProperty` submits owner approval requests only when body owner id matches; otherwise it directly sets `isActive: false`.
- `occupancy` updates a property by id without verifying owner/admin role.
- `reactivateProperty` updates by id without verifying role.

Impact:

- A caller with property ids may update availability, reactivate, deactivate, or alter unprotected property fields.

### 3. Lead And Visit State Can Be Changed Without Owner/Admin Auth

Risk: unauthorized lead manipulation.

Observed endpoints:

- `POST /client/markLeadConverted`
- `POST /client/updateVisitTime`
- `POST /client/updateVisitStatus`
- `POST /client/visits/:id/status`

Issue:

- Legacy lead/visit endpoints are not consistently authenticated.
- `markLeadConverted` updates by lead id only.
- Visit status/time updates trust user/property ids or visit id from request.

Impact:

- A caller may mark another owner’s lead as converted, approve/reject/cancel visits, or alter visit state.

### 4. Public Or Legacy Admin Data Endpoints Exist Outside Guarded Admin Group

Risk: data exposure.

Observed endpoints:

- `GET /client/getAdminStats`
- `GET /api/admin/stats` alias in `app.js`
- `GET /client/getUserList`
- `POST /client/getUser`
- `GET /client/getAllPropertyList`

Issue:

- These routes are not protected by the modern admin route group.
- `getUserList` returns users excluding passwords but still exposes user data.
- `getAdminStats` exposes operational counts and is also aliased as `/api/admin/stats` before the guarded `/api/admin` mount.

Impact:

- Non-admin callers may retrieve admin-oriented metrics and user lists.

### 5. Admin-Like Mutations Are Protected By Route Group Only In Modern Paths

Risk: inconsistent enforcement.

Protected modern paths:

- `/api/admin/users/:id`
- `/api/admin/users/:id/status`
- `/api/admin/properties/:id/status`
- `/api/admin/properties/bulk`

Weak legacy/client paths:

- `/client/updateUserStatus`
- `/client/reviewProperty`
- `/client/updateAminityFeature`
- `/client/updateReply`

Issue:

- The modern `/api/admin/*` access path is guarded.
- The same or similar controller handlers can still be reached through `/client/*`, where not all paths are guarded.

Impact:

- Security depends on callers using intended URLs. Direct legacy endpoints may bypass frontend/modern RBAC.

## High Findings

### 6. Super Admin Password Reset Endpoint Is Miswired

Risk: missing permission flow / broken control.

Observed endpoint:

- `POST /client/users/:id/reset-password`

Issue:

- It uses `requireSuperAdmin`, but this route is declared before the router-level admin auth middleware.
- `requireSuperAdmin` checks `req.auth` but does not attach auth itself.

Impact:

- The route appears intended for super admin but may always reject because `req.auth` is absent.
- This is more of a missing permission/control issue than an escalation risk.

### 7. Permission Strings Are Not Enforced

Risk: coarse-grained access.

Issue:

- Backend has `permissions` arrays and default permissions by role.
- Route guards use roles, not permission names.

Impact:

- An admin with limited intended permissions still receives broad admin route access if their role is `Admin`.
- Super-admin account factory displays permission options, but there is no fine-grained route-level enforcement.

### 8. City Admin Scope Is Partial

Risk: cross-city access for some operations.

Strong points:

- `adminCityScope(req)` is applied to many modern property routes.
- `adminUserCityScope(req)` is applied to users/vendors.
- Property update request review checks city scope.

Gaps:

- Some aggregate metrics include global payment/revenue data.
- Legacy routes do not consistently apply city scope.
- City scoping is not a frontend permission boundary; it relies on backend query filters where implemented.

Impact:

- City admins are mostly scoped in modern admin pages, but legacy endpoints and some analytics may still expose broader data.

## Medium Findings

### 9. Auth Status Endpoint Allows ID-Based Checks Without Token

Observed endpoint:

- `POST /client/authStatus`

Issue:

- If a Bearer token is present, it verifies token id matches body id.
- If no token is present, it still checks account status for a supplied id.

Impact:

- This can leak whether a user id is active/inactive.
- It is not as severe as mutation risks but is still an ID enumeration signal.

### 10. Notifications Trust User ID And Role Parameters

Observed endpoints:

- `GET /api/notifications`
- `POST /api/notifications/mark-read`

Issue:

- Frontend sends `{ userId, role }`.
- Backend filters notifications based on supplied user id/role.
- The notification routes are under `/api/notifications`, which rewrites to client controller paths and are not listed in the admin guard.

Impact:

- A caller may read or mark notifications by guessing/supplying other user ids or roles unless backend notification logic separately validates ownership.

### 11. Signup Allows Owner Role But Backend Requires Later Approval For Listings

Observed behavior:

- Signup maps selected owner role to `userType: Owner`.
- Backend owner property creation checks owner approval before listing.

Risk:

- This is mostly controlled: owners cannot submit listings until approved.
- However, owner dashboard route access may be possible for pending owners if login returns role `owner`.

Impact:

- Pending owners may access owner UI but fail listing operations. This is a UX/permission mismatch more than a direct escalation.

## Role Verification

### User Verification

Expected:

- Browse properties.
- Manage own profile.
- Wishlist, visits, inquiries, saved searches, chats, move-in proof, payout request.

Observed missing permissions:

- Own-resource checks are often missing on backend. Actions use body `userIDFK` or `userId`.
- Profile update is not tied to token identity.
- Saved searches and wallet payout requests need token-user equality checks.

Escalation risks:

- Update another user profile.
- Create leads/visits/reviews as another user by supplying their id.
- Request payout as another user if wallet route does not validate token-user ownership.

### Owner Verification

Expected:

- Manage own properties.
- View own leads.
- Manage own availability.
- Confirm own move-ins.
- Message admin for own account/properties.

Observed missing permissions:

- Own-property checks are inconsistent.
- Availability update does not verify owner.
- Lead conversion does not verify owner owns the lead/property.
- Property delete/update can fall through to direct mutation based on body marker combinations.

Hidden controls:

- Owner routes and sidebar links are hidden unless normalized role is owner.
- Admin-only property controls are not visible to owner in frontend.

Escalation risks:

- Modify another owner’s listing availability.
- Mark another owner’s lead converted.
- Delete/deactivate/reactivate property by id through legacy/client endpoints.

### Admin Verification

Expected:

- Manage users/properties within assigned city.
- Moderate listings, reviews, move-ins, payout requests, update requests.
- View analytics scoped to city where applicable.
- Cannot manage admin/super-admin accounts.

Observed missing permissions:

- Role-based admin guard exists for modern admin routes.
- Permission strings such as `manage_finance` or `manage_moderation` are not individually enforced.
- Some legacy admin-like endpoints remain accessible outside `/api/admin/*`.

Hidden controls:

- Role/scope editing is hidden from non-super-admin in user edit modal.
- Governance link is hidden from admin.

Escalation risks:

- Through modern routes, city admin role escalation is partly blocked by backend.
- Through legacy/client routes, an authenticated or unauthenticated caller may access admin-like mutation/read endpoints.

### Super Admin Verification

Expected:

- Global governance.
- Create admins/owners/users.
- Assign city/admin.
- Launch/pause cities.
- Dummy/live transitions.
- Global property bulk workflows.
- Audit logs.

Observed missing permissions:

- Super-admin governance is guarded in modern route group.
- City-state routes are under the modern admin guard, then `requireSuperAdmin`.
- The separate reset-password route is declared before auth attachment and appears broken.
- Permission option UI is not backed by fine-grained route guards.

Hidden controls:

- Governance route/link visible only to super admin.
- ManageUsers role/scope edit fields visible only to super admin.

Escalation risks:

- If any user can hit unguarded `/client/users/:id` style mutations, they may alter role fields in paths not protected by the modern guard. The modern `/api/admin/users/:id` path is protected, but direct legacy reachability should be locked down.

## Recommended Permission Boundaries

### Backend Must Enforce

- Every state-changing endpoint should require `attachAuthenticatedUser`.
- Every own-resource endpoint should compare `req.auth.user._id` to the target resource owner.
- Every admin endpoint should use `requireRoles(['admin', 'super_admin'])`.
- Every super-admin endpoint should use `attachAuthenticatedUser` before `requireSuperAdmin`.
- Permission strings should be enforced where they exist:
  - `manage_users`
  - `manage_properties`
  - `manage_finance`
  - `manage_admins`
  - `manage_dummy_data`
  - `manage_moderation`
  - `view_city_analytics`
  - `view_global_analytics`

### Route Groups To Lock Down

- `/client/updateUser`
- `/client/updateUserPhoto`
- `/client/getUserList`
- `/client/getUser`
- `/client/getAdminStats`
- `/client/getAllPropertyList`
- `/client/reviewProperty`
- `/client/updateUserStatus`
- `/client/addProperty`
- `/client/updateProperty`
- `/client/deleteProperty`
- `/client/reactivateProperty`
- `/client/properties/:id/occupancy`
- `/client/markLeadConverted`
- `/client/updateVisitTime`
- `/client/updateVisitStatus`
- `/client/updateAminityFeature`
- `/client/updateReply`
- `/client/users/:id/reset-password`
- `/api/admin/stats` alias

## Risk Ranking

### Critical

- Unauthenticated or body-id based user profile updates.
- Unauthenticated property update/delete/reactivate/occupancy actions.
- Unauthenticated lead/visit conversion/status actions.
- Legacy admin/user data endpoints outside guarded admin group.

### High

- Super-admin reset-password route missing auth attachment.
- Role-only guards despite existing permission strings.
- Partial city-admin scoping and legacy route bypasses.

### Medium

- Notification read/mark-read uses supplied user id and role.
- Auth status leaks account activity by id when no token is supplied.
- Pending owner UI access before owner approval.

## Bottom Line

Frontend RBAC is organized, but backend RBAC is the deciding layer and currently inconsistent. Modern `/api/admin/*` routes are mostly protected; legacy `/client/*` routes need systematic authentication, ownership checks, and permission checks before this RBAC model is reliable.
