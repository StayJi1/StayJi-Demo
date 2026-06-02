# Dashboard Flow Audit

Scope: dashboard flows only. This document maps user, owner, admin, and super-admin dashboards from the current frontend routing and API usage. No source code was modified.

## Shared Dashboard Shell

### Routes

- `/dashboard` - authenticated index route; redirects by normalized role.
- `/dashboard/profile` - authenticated profile route shared by all logged-in roles.

### Layout And Navigation

- `DashboardLayout.jsx` wraps all `/dashboard/*` routes in the sidebar shell.
- `Sidebar.jsx` builds navigation based on normalized role:
  - all roles: dashboard, browse stays, profile.
  - user: my bookings.
  - owner: my properties, my leads, add property.
  - admin and super-admin: manage users, manage properties.
  - super-admin: governance.
- `NotificationBell.jsx` is available in dashboard navigation and calls notification APIs.

### Global Permissions

- `/dashboard/*` is wrapped by `ProtectedRoute`, which requires `isAuthenticated`.
- Role normalization maps:
  - `vendor`, `host`, `hostel` -> `owner`
  - `student`, `personal` -> `user`
  - `super admin`, `super_admin`, `superadmin` -> `super-admin`
- `RoleProtectedRoute` enforces role-specific pages.
- Super admin is allowed through admin routes by role-guard logic.

### Shared APIs

- `POST /client/authStatus` - periodic account activity check from `AuthContext`.
- `POST /client/updateUser` - profile update.
- `POST /client/changePassword` - password change from profile.
- `GET /api/notifications`
- `POST /api/notifications/:id/read`
- `POST /api/notifications/mark-read`

### Missing Or Weak Shared Flows

- `/dashboard/profile` is authenticated but not role-gated. This is probably intentional for a common profile page, but it means all roles share the same profile UI.
- The dashboard role redirect uses the current frontend auth role only; there is no visible loading/verification state before redirect if auth is still being restored.
- Sidebar exposes `Browse stays` for admin and super-admin, which may be useful but mixes public browsing into operational dashboards.
- Notification permissions are role/user-id based at the API call level; frontend does not show deeper permission checks beyond authentication.

## User Dashboard

### Routes

- `/dashboard/user` - `UserDashboard.jsx`, guarded by `RoleProtectedRoute role="user"`.
- `/dashboard/profile` - `UserProfilePage.jsx`, authenticated only.
- Related outbound links:
  - `/properties`
  - `/properties/:id`
  - `/compare`
  - `/properties?city=...&area=...`

### Pages

- `pages/dashboard/user/UserDashboard.jsx`
- `pages/dashboard/user/UserProfilePage.jsx`

### APIs Used

- `dashboardService.getUserOverview(userId)`
  - `GET /client/user/overview?userId=...`
  - fallback can use `POST /client/getShortlistById`
- `propertyService.removeShortlistProperty`
  - `POST /client/deleteShortlist`
- `dashboardService.updateVisit`
  - `POST /client/visits/:id/status`
- `dashboardService.deleteSavedSearch`
  - `DELETE /client/user/saved-searches/:id`
- `dashboardService.requestWalletPayout`
  - `POST /client/wallet/payouts`
- `authService.changePassword`
  - `POST /client/changePassword`
- `userService.updateUser`
  - `POST /client/updateUser`

### Permissions

- Requires authenticated user.
- Requires normalized role `user` for `/dashboard/user`.
- Profile route requires authentication only, not user role.
- API requests include Authorization header when token exists, but most user dashboard calls also pass `userId`/`userIDFK` from frontend state.

### Flow Map

- User opens `/dashboard/user`.
- Dashboard loads overview: shortlist, visits, inquiries, chats/messages, saved searches, viewed properties, notifications, wallet, and move-in records.
- User can remove wishlisted properties.
- User can reschedule or cancel visit bookings.
- User can rerun or delete saved searches.
- User can view inquiry history and property links.
- User can view rental history / reward status.
- User can request wallet payout with UPI/bank details and optional QR image.
- User can update profile and change password from `/dashboard/profile`.

### Missing Or Weak Flows

- There is no dedicated user messages page; messages/chats appear only as dashboard summary/overview data.
- Contact support is static email/phone, not an in-app support ticket flow.
- Payout form sends UPI/bank details but does not show payout request history after submit unless returned in overview later.
- Saved search creation is not present inside the user dashboard; dashboard only displays/deletes saved searches created elsewhere.
- Viewed count partly reads from localStorage while viewed properties can also come from backend, so history may be split.
- Visit reschedule/cancel action has no explicit confirmation step.
- User dashboard does not expose a full booking detail page.

## Owner Dashboard

### Routes

- `/dashboard/owner` - `VendorDashboard.jsx`, guarded by `RoleProtectedRoute role="owner"`.
- `/dashboard/vendor` - redirects to `/dashboard/owner`.
- `/dashboard/vendor/*` - redirects to `/dashboard/owner`.
- `/dashboard/owner/add-property` - `AddPropertyPage.jsx`, owner guarded.
- `/dashboard/owner/leads` - `VendorLeadsPage.jsx`, owner guarded.
- `/dashboard/owner/leads?propertyId=:id` - same page filtered by property.
- `/dashboard/owner/properties` - `ManagePropertiesPage.jsx`, owner guarded.
- `/dashboard/owner/properties/:propertyId` - `PropertyDetailPage.jsx`, owner guarded.
- `/dashboard/owner/properties/:propertyId/edit` - `AddPropertyPage.jsx`, owner guarded.
- `/owner` and `/vendor` - public redirects to `/dashboard/owner`.

### Pages

- `pages/dashboard/vendor/VendorDashboard.jsx`
- `pages/dashboard/vendor/VendorLeadsPage.jsx`
- `pages/dashboard/vendor/ManagePropertiesPage.jsx`
- `pages/dashboard/vendor/AddPropertyPage.jsx`
- `pages/PropertyDetailPage.jsx` for owner property detail route.
- `pages/dashboard/user/UserProfilePage.jsx` via shared `/dashboard/profile`.

### APIs Used

- `dashboardService.getOwnerOverview(userId)`
  - combines:
  - `POST /client/getPropertyListByUser`
  - `POST /client/getVisitorList`
  - `POST /client/getInquiry`
  - `POST /client/getShortlistByVendor`
- `dashboardService.moveIns`
  - `GET /client/moveIns`
- `adminApi.ownerMessages`
  - `GET /api/admin/vendors/:id/messages`
- `adminApi.sendOwnerMessage`
  - `POST /api/admin/vendors/:id/messages`
- `adminApi.deleteOwnerMessage`
  - `POST /api/admin/vendors/:id/messages/:messageId/delete`
- `adminApi.ownerConfirmMoveIn`
  - `POST /client/moveIns/:id/owner-confirm`
- `dashboardService.getOwnerLeads`
  - `POST /client/getVisitorList`
  - `POST /client/getInquiry`
  - `POST /client/getShortlistByVendor`
- `dashboardService.markLeadConverted`
  - `POST /client/markLeadConverted`
- `dashboardService.updateVisit`
  - `POST /client/visits/:id/status`
- `dashboardService.getOwnerProperties`
  - `POST /client/getPropertyListByUser`
- `propertyService.deleteProperty`
  - `POST /client/deleteProperty`
- `propertyService.updateOccupancy`
  - `POST /client/properties/:id/occupancy`
- `propertyService.fetchPropertyById`
  - `POST /client/getPropertyById`
- `propertyService.createProperty`
  - `POST /client/addProperty`
- `propertyService.updateProperty`
  - `POST /client/updateProperty`
- `axiosClient.get('/client/city-options')`
  - `GET /client/city-options`

### Permissions

- Requires authenticated user.
- Requires normalized role `owner`.
- `vendor`, `host`, and `hostel` are normalized to `owner`.
- Owner property add/edit checks frontend role for post-submit navigation, but route access is controlled by owner/admin route guards.
- Owner message APIs are called through `adminApi`, but the owner page passes `viewer: 'owner'` and `senderRole: 'owner'`.

### Flow Map

- Owner opens `/dashboard/owner`.
- Overview loads properties, visits, inquiries, shortlist analytics, move-ins, and private admin messages.
- Owner can navigate to add property.
- Owner can open listings table.
- Owner can open leads page.
- Owner can confirm tenant joined successfully for move-in records.
- Owner can message StayJi admin in a private thread.
- Owner leads page shows:
  - visit requests
  - interest messages
  - wishlist analytics
  - per-property filtering via query string
- Owner can approve/reject visit requests.
- Owner can mark visits or inquiries as converted.
- Owner properties page shows listing table with filters.
- Owner can quick edit availability/occupancy.
- Owner can request delete/archive.
- Owner can open property detail, analytics, edit, or add property.
- Add/edit property loads city options, existing property data for edit, then creates or updates the property.

### Missing Or Weak Flows

- Owner delete flow text says “request admin approval,” but it calls the delete API directly and relies on backend behavior; frontend does not show an approval request tracker.
- Owner full property edit appears to call update directly; protected-field approval is only partially represented by separate `requestProtectedUpdate` service and may not be used from this page.
- Owner dashboard has private admin messaging, but there is no dedicated message inbox route.
- Owner can approve/reject visits, but there is no visit calendar or schedule management page.
- Wishlist leads are analytics only; there is no follow-up workflow except waiting for contact/visit/chat.
- Commission due is derived from verified move-ins, but there is no full finance ledger or payment-status detail page.
- Owner property detail reuses public `PropertyDetailPage`, so owner-specific operational controls may be limited on the detail route.

## Admin Dashboard

### Routes

- `/dashboard/admin` - `AdminDashboard.jsx`, guarded for `admin` and `super-admin`.
- `/admin` - redirects to `/dashboard/admin`.
- `/dashboard/admin/users` - `ManageUsersPage.jsx`, guarded for `admin` and `super-admin`.
- `/dashboard/admin/users?role=Owner` - same page filtered by role.
- `/dashboard/admin/vendors/:vendorId` - `AdminVendorDetailPage.jsx`, guarded for `admin` and `super-admin`.
- `/dashboard/admin/owners/:ownerId` - `AdminVendorDetailPage.jsx`, guarded for `admin` and `super-admin`.
- `/dashboard/admin/properties/:propertyId` - `AdminPropertyDetailPage.jsx`, guarded for `admin` and `super-admin`.
- `/dashboard/admin/properties/:propertyId/edit` - `AddPropertyPage.jsx`, guarded for `admin` and `super-admin`.

### Pages

- `pages/dashboard/admin/AdminDashboard.jsx`
- `pages/dashboard/admin/ManageUsersPage.jsx`
- `pages/dashboard/admin/AdminVendorDetailPage.jsx`
- `pages/dashboard/admin/AdminPropertyDetailPage.jsx`
- `pages/dashboard/vendor/AddPropertyPage.jsx` for admin property edit.
- `pages/dashboard/user/UserProfilePage.jsx` via shared `/dashboard/profile`.

### APIs Used

- `adminApi.analytics`
  - `GET /api/admin/analytics`
- `adminApi.properties`
  - `GET /api/admin/properties`
- `adminApi.owners`
  - `GET /api/admin/vendors`
- `adminApi.moveIns`
  - `GET /api/admin/moveIns`
- `adminApi.walletPayouts`
  - `GET /client/wallet/payouts`
- `adminApi.propertyUpdateRequests`
  - `GET /client/property-update-requests`
- `adminApi.updatePropertyStatus`
  - `POST /api/admin/properties/:id/status`
- `adminApi.bulkProperties`
  - `POST /api/admin/properties/bulk`
- `adminApi.reviewMoveIn`
  - `POST /api/admin/moveIns/:id/review`
- `adminApi.reviewWalletPayout`
  - `POST /client/wallet/payouts/:id/review`
- `adminApi.reviewPropertyUpdateRequest`
  - `POST /client/property-update-requests/:id/review`
- `adminApi.users`
  - `GET /api/admin/users`
- `adminApi.updateUserStatus`
  - `POST /api/admin/users/:id/status`
- `adminApi.updateUser`
  - `POST /api/admin/users/:id`
- `adminApi.ownerDetail`
  - `GET /api/admin/vendors/:id`
- `adminApi.ownerMessages` / `vendorMessages`
  - `GET /api/admin/vendors/:id/messages`
- `adminApi.sendOwnerMessage` / `sendVendorMessage`
  - `POST /api/admin/vendors/:id/messages`
- `adminApi.deleteOwnerMessage` / `deleteVendorMessage`
  - `POST /api/admin/vendors/:id/messages/:messageId/delete`
- `adminApi.propertyDetail`
  - `GET /api/admin/properties/:id`
- Admin edit property route also uses:
  - `GET /client/city-options`
  - `POST /client/getPropertyById`
  - `POST /client/updateProperty`

### Permissions

- Requires authenticated user.
- Allows normalized roles `admin` and `super-admin`.
- Super admin can access admin pages through the route guard.
- `ManageUsersPage` detects `currentRole === 'super-admin'` to show additional edit fields for assigned city/state and role changes.
- Admin dashboard text references assigned-city scope when present on the user object; the actual enforcement appears API-side or data-side, not through frontend guards.

### Flow Map

- Admin opens `/dashboard/admin`.
- Dashboard loads live analytics, properties, owners search data, move-ins, wallet payouts, and property update requests.
- Admin can filter/search operational properties.
- Admin can inspect charts, city heatmap, lead analytics, live/demo/pending/hidden listing counts.
- Admin can view/edit/verify/reject/hide/unhide properties.
- Admin can run bulk property workflows.
- Admin can review move-ins, wallet payouts, and owner protected update requests.
- Admin can navigate to user management.
- Admin can list, filter, view, edit, suspend, activate users.
- Admin can verify owners.
- Admin owner detail shows owner profile, property tree, owner-private messages, and property actions.
- Admin property detail shows media, operational state, lead mix, owner info, reviews/complaints, location, and owner messaging.

### Missing Or Weak Flows

- Direct admin password reset is intentionally blocked in UI; it only displays a handoff message to OTP flow.
- Admin dashboard supports payout review but does not expose a full finance/reconciliation ledger.
- Property update request review is on the dashboard queue only; no dedicated request detail route is visible.
- Move-in review appears as queue action; no dedicated move-in detail route is visible.
- Admin user bulk actions suspend/activate selected users without an explicit confirmation modal.
- Admin property bulk actions have confirmation, but single property verify/reject/hide actions are immediate.
- Admin city scope is displayed when assigned, but frontend does not visibly prevent changing filters outside assigned city.
- Admin owner/user management has no explicit audit trail view unless user is super admin.

## Super Admin Dashboard

### Routes

- `/dashboard/super-admin` - `SuperAdminDashboard.jsx`, guarded by `RoleProtectedRoute role="super-admin"`.
- Also allowed into all admin routes:
  - `/dashboard/admin`
  - `/dashboard/admin/users`
  - `/dashboard/admin/vendors/:vendorId`
  - `/dashboard/admin/owners/:ownerId`
  - `/dashboard/admin/properties/:propertyId`
  - `/dashboard/admin/properties/:propertyId/edit`
- `/super-admin-login` - login page variant outside dashboard.

### Pages

- `pages/dashboard/admin/SuperAdminDashboard.jsx`
- All admin dashboard pages listed above.
- `pages/dashboard/user/UserProfilePage.jsx` via shared `/dashboard/profile`.

### APIs Used

- `adminApi.governance`
  - `GET /api/admin/governance`
- `adminApi.cityStates`
  - `GET /api/admin/city-states`
- `adminApi.users`
  - `GET /api/admin/users`
- `adminApi.properties`
  - `GET /api/admin/properties`
- `adminApi.createAccount`
  - `POST /api/admin/create-account`
- `adminApi.dummyTransition`
  - `POST /api/admin/dummy-transition`
- `adminApi.bulkProperties`
  - `POST /api/admin/properties/bulk`
- `adminApi.launchCity`
  - `POST /api/admin/city-states/:id/launch`
- `adminApi.saveCityState`
  - `POST /api/admin/city-states`
- Inherited admin APIs:
  - analytics, property management, user management, owner detail, property detail, messaging, move-in review, payout review, update-request review.

### Permissions

- Requires authenticated user.
- Requires normalized role `super-admin` for `/dashboard/super-admin`.
- Super admin also passes admin route checks.
- Super admin edit mode in `ManageUsersPage` enables assigned city/state and user role editing.
- Backend endpoints such as city-state operations are expected to enforce super-admin authority; frontend route guard only protects the page entry.

### Flow Map

- Super admin opens `/dashboard/super-admin`.
- Governance dashboard loads global summary, city rows, audit logs, active city states, admin users, and global properties.
- Super admin can create Admin, Owner, or User accounts with assigned city/state and temporary password.
- Super admin can apply dummy-to-real transitions by city/locality/scope/status.
- Super admin can show/hide demo listings for selected cities.
- Super admin can launch or pause cities.
- Super admin can filter global property operations by city, locality, status, demo/live, verification, approval, and occupancy.
- Super admin can run bulk property workflows:
  - mark live
  - mark demo
  - hide publicly
  - archive
  - unarchive
  - verify
  - suspend
  - assign city
  - assign admin
- Super admin can view operational audit trail and audit detail.
- Super admin can navigate into admin property detail pages from global listings.
- Super admin can use all admin dashboard flows.

### Missing Or Weak Flows

- `permissionOptions` are displayed, but the account form only sends default permissions for Admin accounts; there is no UI to select/customize permission options.
- `assign_admin` bulk action defaults to the first available admin if present; user must change it in confirmation, but there is no search/filter for admins in that modal.
- City pause uses `saveCityState` with paused values; there is no separate city detail page or richer launch checklist.
- City-state creation/update is limited to flows embedded in launch/pause and account forms; no standalone city-state management page is visible.
- Governance audit log is view-only; no export, diff filtering, or rollback flow is visible.
- Super admin can create accounts but there is no visible invitation/email delivery status flow.
- Dummy transition can target `users` or `properties`, but UI text and table flows are mostly property-focused.
- Global finance controls are inherited from admin queues; no super-admin-only finance dashboard is visible.

## Cross-Dashboard API Surface Summary

### User-Facing Dashboard APIs

- `/client/user/overview`
- `/client/getShortlistById`
- `/client/deleteShortlist`
- `/client/visits/:id/status`
- `/client/user/saved-searches/:id`
- `/client/wallet/payouts`
- `/client/updateUser`
- `/client/changePassword`

### Owner Dashboard APIs

- `/client/getPropertyListByUser`
- `/client/getVisitorList`
- `/client/getInquiry`
- `/client/getShortlistByVendor`
- `/client/markLeadConverted`
- `/client/visits/:id/status`
- `/client/moveIns`
- `/client/moveIns/:id/owner-confirm`
- `/client/properties/:id/occupancy`
- `/client/getPropertyById`
- `/client/addProperty`
- `/client/updateProperty`
- `/client/deleteProperty`
- `/client/city-options`
- `/api/admin/vendors/:id/messages`
- `/api/admin/vendors/:id/messages/:messageId/delete`

### Admin Dashboard APIs

- `/api/admin/analytics`
- `/api/admin/properties`
- `/api/admin/properties/:id`
- `/api/admin/properties/:id/status`
- `/api/admin/properties/:id/commission`
- `/api/admin/properties/bulk`
- `/api/admin/vendors`
- `/api/admin/vendors/:id`
- `/api/admin/vendors/:id/messages`
- `/api/admin/vendors/:id/messages/:messageId/delete`
- `/api/admin/users`
- `/api/admin/users/:id`
- `/api/admin/users/:id/status`
- `/api/admin/moveIns`
- `/api/admin/moveIns/:id/review`
- `/client/wallet/payouts`
- `/client/wallet/payouts/:id/review`
- `/client/property-update-requests`
- `/client/property-update-requests/:id/review`

### Super Admin Dashboard APIs

- `/api/admin/governance`
- `/api/admin/city-states`
- `/api/admin/city-states/:id/launch`
- `/api/admin/create-account`
- `/api/admin/dummy-transition`
- `/api/admin/properties/bulk`
- plus inherited admin APIs.
