# StayJi Bangalore MVP User, Owner & Messaging Stabilization Audit

Date: 2026-06-20

## Files Modified

- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-frontend/src/api/dashboardApi.js`
- `pgfinder-frontend/src/components/gallery/GalleryTrigger.jsx`
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/MessagesPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/user/UserDashboard.jsx`
- `pgfinder-frontend/src/pages/dashboard/vendor/VendorDashboard.jsx`
- `pgfinder-frontend/src/pages/dashboard/vendor/VendorLeadsPage.jsx`

## APIs Fixed

- `POST /api/client/getVisitorList`
  - Owner visit aggregation now resolves ownership from `vendorId` first and falls back to `userIDFK`.
  - Invalid or missing owner ID now returns a graceful failure payload.

- `POST /api/client/getInquiry`
  - Owner inquiry aggregation now supports both `vendorId` and legacy `userIDFK`.
  - Prevents missing owner leads for properties created through newer owner flows.

- `POST /api/client/getShortlistByVendor`
  - Shortlist analytics now count properties owned through either `vendorId` or `userIDFK`.
  - Invalid owner IDs return a safe failure payload.

- `GET /api/client/chats`
  - Frontend polling and unread-count rendering stabilized against mixed `_id` / `id` shapes.

- `POST /api/client/visits/:id/status`
  - Frontend visit actions now send updates using either `_id` or normalized `id`.
  - Owner lead UI now displays lifecycle labels consistently.

## Bugs Fixed

- Owner dashboard visit status no longer labels status `2` as rejected; it is shown as completed.
- Owner leads now support approve, reject, and reschedule actions even when API DTOs return `id` instead of `_id`.
- Owner visit, inquiry, and shortlist analytics no longer disappear for listings that use `vendorId`.
- User dashboard saved-property removal no longer crashes when a property has been deleted or is partially populated.
- User dashboard message count and message card navigation now use real chat overview data.
- Messaging page no longer risks `NaN` unread totals.
- Messaging page keeps the active conversation stable during the 15-second refresh cycle.
- Property detail actions now use `property.id` fallback for save, message owner, callback, book visit, review, and move-in proof.
- Property detail missing/deleted property handling now shows a user-friendly unavailable message.
- Property detail map defaults now point to Bangalore coordinates instead of an unrelated fallback city.
- Gallery images now fall back gracefully if an uploaded image URL fails to load.

## Verification Completed

- Frontend lint: passed with `npm run lint`.
- Frontend production build: passed with `npm run build`.
- Backend syntax check: passed with `node --check pgfinder-backend/controllers/clientController.js`.
- Diff hygiene: passed with `git diff --check`.

## Remaining Issues

- Backend `npm test` is still a placeholder and exits with `Error: no test specified`.
- Full manual verification needs a running MongoDB-backed local environment with seeded Bangalore users, owners, properties, visits, and conversations.
- Browser/API smoke testing was not completed in this pass because no live app session was started against a database.

## Manual Testing Checklist

### User

- [ ] View profile from dashboard navigation.
- [ ] Edit profile and confirm saved changes persist.
- [ ] Change password and verify old password no longer works.
- [ ] View saved properties.
- [ ] Remove a saved property.
- [ ] Open a deleted/missing saved property and confirm graceful fallback.
- [ ] View recently viewed properties.
- [ ] View inquiry history.
- [ ] View visit requests.
- [ ] Cancel a pending visit.
- [ ] Reschedule a pending visit.
- [ ] View saved searches.
- [ ] Delete a saved search.
- [ ] View notifications.
- [ ] Open messages from dashboard.
- [ ] Send a message to an owner from property detail.

### Owner

- [ ] View owner dashboard stats.
- [ ] View only logged-in owner's properties.
- [ ] Confirm owner Browse/My Properties uses the shared `PropertyCard`.
- [ ] Add property with Bangalore locality, coordinates, rent, amenities, sharing, food, and images.
- [ ] Edit property rent, availability, amenities, sharing, food, and status.
- [ ] Upload multiple images.
- [ ] Remove existing and selected images before saving.
- [ ] Delete/archive request creates an approval request.
- [ ] Update availability from quick edit.
- [ ] View visit requests.
- [ ] Accept visit.
- [ ] Reject visit.
- [ ] Reschedule visit.
- [ ] Open user-owner messages and reply.

### Messaging

- [ ] User to owner conversation creates once per user, owner, and property.
- [ ] Duplicate Message Owner clicks reuse the existing conversation.
- [ ] Owner reply appears in user conversation history.
- [ ] Unread count increments for recipient.
- [ ] Opening conversation marks recipient messages read.
- [ ] Last message preview and timestamp update after every send.
- [ ] Unauthorized user cannot access another user's conversation.
- [ ] Unauthorized owner cannot access another owner's conversation.

### Visits

- [ ] User requests visit with date and time.
- [ ] Owner sees the visit under leads.
- [ ] Owner approves visit and user dashboard shows Approved.
- [ ] Owner rejects visit and user dashboard shows Rejected.
- [ ] Owner reschedules visit and date/time update.
- [ ] User cancels visit and history remains visible.
- [ ] Completed visits display as Completed.

### Property Detail & Gallery

- [ ] Rent, images, amenities, sharing, food, availability, owner details, locality, map, and contact options render.
- [ ] Message Owner opens/creates the right property conversation.
- [ ] Book Visit requires date/time and creates a pending visit.
- [ ] Save Property adds to dashboard shortlist.
- [ ] Share copies or opens native share.
- [ ] Report opens mail client with property context.
- [ ] Gallery opens from image click.
- [ ] Gallery supports next/previous buttons.
- [ ] Gallery supports left/right keyboard navigation.
- [ ] Gallery supports mobile swipe.
- [ ] Gallery closes with Escape and close button.
- [ ] Missing/broken images show fallback instead of a blank/broken view.

## Bangalore MVP Readiness Report

User and Owner modules are code-stabilized for the Bangalore MVP at the API-contract and UI-routing level. The main broken surfaces found in this pass were owner data ownership drift (`vendorId` vs `userIDFK`), message refresh/unread edge cases, stale property ID assumptions, missing-image handling, and incorrect visit status display.

Readiness status: **Conditionally ready for manual QA**.

The modules are not production-signoff ready until the manual checklist above is run against real seeded Bangalore data and the backend gains executable tests for user dashboard, owner dashboard, messaging, visits, and property CRUD.
