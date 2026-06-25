# VISIT_FIX.md — Visit Booking Workflow Audit Fix Plan

## Scope (per request)
Audit ONLY Visit booking workflow:
- User: `User -> Book`
- Owner: `Approve / Reject / Reschedule`

## Expected endpoints (from backend patterns)
Messaging/visits are implemented in `pgfinder-backend/controllers/clientController.js`.

The booking workflow typically maps to:
- create visit request
- owner/admin update visit status
- user reschedule/reject/cancel

## 1) What to verify (backend)

### 1.1 Create visit request (User -> Book)
Verify `POST /client/addVisit`:
- Ensure it is guarded by:
  - `attachAuthenticatedUser`
  - `requireRoles(['user'])`
- Ensure it enforces ownership:
  - `req.body.userIDFK` must match `req.auth.user._id` (self-update)
- Ensure it checks property scope (StayJi MVP area) and availability.

Common failures:
- `requireRoles(['user'])` rejects tokens where backend role normalization yields `owner` or `admin`.
- `assertSelfOrRoles` fails if userId field is wrong.
- property lookup uses strict Bangalore scope.

### 1.2 Owner approve/reject/reschedule
Verify the status update endpoint:
- `POST /client/visits/:id/status`

Check:
- It uses middleware:
  - `attachAuthenticatedUser`
  - `requireRoles(['user', 'owner', 'admin'])`
- For `owner` role:
  - it must verify that the visit belongs to one of owner’s properties.
  - It should allow only valid status transitions.

Common failures:
- owner property ownership check uses `existingVisit.vendorId` but actual field differs.
- `statusMap` mapping doesn’t include the UI actions.

### 1.3 Reschedule semantics
Verify that “Reschedule” maps to expected status codes:
- UI action => choose correct target status in `statusMap`
- If reschedule is a subset of “Pending visit time update”, ensure updates happen only when allowed.

### 1.4 Admin scope doesn’t break owner actions
For admin, `adminCityScope(req)` must not block updates meant for the same city.

### 1.5 Response shape used by frontend
Verify that after status update backend returns:
- `{ result:'success', data: ... }` with updated visit details.

## 2) What to verify (frontend mapping)
Frontend should:
- Send `visitDate`, `visitTime`, and `moveInPreference` on create/reschedule.
- Call status update with:
  - `action/status` matching backend expectations.

## 3) Acceptance tests (manual)
1. User books a visit (visit created, status pending).
2. Owner approves:
   - status becomes approved (expected status label)
   - user receives confirmation.
3. Owner rejects:
   - status becomes rejected
4. Owner reschedules:
   - visit date/time updated
   - status remains pending/appropriate

## 4) Deliverable
- Backend status transition logic aligned with UI actions.
- Ensure owner authorization uses correct ownership fields.

