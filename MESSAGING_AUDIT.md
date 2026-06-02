# Messaging Audit

Scope: messaging only. Reviewed `clientController.js`, conversation/message/admin-message/chat models, frontend API wrappers, visible UI flows, and backend permission enforcement. No code edits were made.

## Executive Summary

- There are two separate messaging implementations:
  - User-owner chat uses legacy `chatMaster` through `/client/chats`.
  - Admin-owner private messaging uses `adminMessage` through `/api/admin/vendors/:id/messages`.
- The newer `conversation` and `message` models exist and are imported in `clientController.js`, but no live route creates conversations or message records.
- Messaging routes are not protected by backend authentication/role middleware. They rely on caller-supplied IDs, `viewer`, `senderRole`, and sometimes `adminId`.
- Messages are encrypted at rest for `chatMaster.text` and `adminMessage.message`.
- Permissions are defined for roles, but there is no messaging-specific permission and no permission check on messaging routes.

## Implemented Messaging Paths

### User-owner chat

Backend:

- Model import: `pgfinder-backend/controllers/clientController.js:21`
- Routes:
  - `GET /client/chats`: `pgfinder-backend/controllers/clientController.js:2790-2804`
  - `POST /client/chats`: `pgfinder-backend/controllers/clientController.js:2806-2841`
- Storage model: `pgfinder-backend/models/chatMaster.js`
- Frontend callers:
  - `dashboardApi.chats()` and `dashboardApi.sendChat()`: `pgfinder-frontend/src/api/dashboardApi.js:114-118`
  - `propertyApi.sendChat()`: `pgfinder-frontend/src/api/propertyApi.js:209-212`
  - Property detail interest flow sends a chat message before creating an inquiry: `pgfinder-frontend/src/pages/PropertyDetailPage.jsx:138-158`

Behavior:

- `POST /client/chats` accepts `fromUserId`, optional `ownerId/vendorId`, optional `propertyId`, and message text.
- If `ownerId` is omitted and `propertyId` exists, backend resolves the property owner.
- Text is encrypted with AES-256-GCM before save.
- Contact/callback intent detection creates a lead event.
- Notifications are created for owner and admins.
- `GET /client/chats` decrypts messages before returning them.

### Admin-owner messages

Backend:

- Model import: `pgfinder-backend/controllers/clientController.js:20`
- Routes:
  - `GET /api/admin/vendors/:id/messages`: `pgfinder-backend/controllers/clientController.js:4010-4019`
  - `POST /api/admin/vendors/:id/messages`: `pgfinder-backend/controllers/clientController.js:4021-4065`
  - `POST /api/admin/vendors/:id/messages/:messageId/delete`: `pgfinder-backend/controllers/clientController.js:4068-4082`
- Storage model: `pgfinder-backend/models/adminMessage.js`
- Frontend callers:
  - `adminApi.vendorMessages`, `ownerMessages`, `sendVendorMessage`, `sendOwnerMessage`, delete methods: `pgfinder-frontend/src/api/adminApi.js:66-71`
  - Owner dashboard private support thread: `pgfinder-frontend/src/pages/dashboard/vendor/VendorDashboard.jsx:20-35,166-189`
  - Admin owner detail thread: `pgfinder-frontend/src/pages/dashboard/admin/AdminVendorDetailPage.jsx:16-31,87-111`
  - Admin property detail thread: `pgfinder-frontend/src/pages/dashboard/admin/AdminPropertyDetailPage.jsx:28-47,183-207`

Behavior:

- Messages are scoped primarily by `vendorId`.
- Property-specific messages can include `propertyId`, but fetching still returns all vendor messages; the admin property detail page filters by property client-side.
- Text is encrypted before save and decrypted on read.
- Owner/vendor delete is local-only through `deletedForOwner`/`deletedForVendor`.
- Admin delete can be local-only through `deletedForAdmin`.
- "Delete both" sets `isActive: false` only if body includes a valid active Admin `adminId`.

## Models

### `conversation`

Source: `pgfinder-backend/models/conversation.js`

- Fields: `userId`, `ownerId`, optional `propertyId`, `participants`, `conversationType`, `status`, unread counts, last-message preview/time, activity fields.
- Has useful indexes for user, owner, and property conversation lookup.
- Pre-save fills `participants` and `updatedOn`.
- Missing from live flow: no route creates, lists, updates, marks read, archives, blocks, or deletes conversations.

### `message`

Source: `pgfinder-backend/models/message.js`

- Fields: `conversationId`, optional `propertyId`, sender/receiver IDs, `senderRole`, `text`, metadata, `readAt`, activity.
- Has indexes for conversation timeline, sender/receiver lookup, and property.
- Missing from live flow: no route creates, lists, reads, soft-deletes, or marks these messages read.
- Unlike `chatMaster` and `adminMessage`, there is no evidence that `message.text` is encrypted before save because the model is not currently used.

### `chatMaster`

Source: `pgfinder-backend/models/chatMaster.js`

- Legacy chat record with `text`, sender/receiver IDs, `conversationType`, metadata, `addedOn`, `isActive`.
- No conversation ID, read status, unread counters, indexes, soft-delete flags, moderation status, or participant constraints.

### `adminMessage`

Source: `pgfinder-backend/models/adminMessage.js`

- Admin/owner private thread fields include vendor/admin/property IDs, `senderRole`, encrypted `message`, deletion flags, dummy/status flags, `addedOn`, and `isActive`.
- No indexes, read status, unread counters, attachment metadata, audit fields, edit history, or strict required fields.

## Permissions And Auth

Auth helpers exist:

- `attachAuthenticatedUser`: `pgfinder-backend/controllers/clientController.js:250-277`
- `requireRoles`: `pgfinder-backend/controllers/clientController.js:279-285`
- Default permissions: `pgfinder-backend/controllers/clientController.js:217-223`

Messaging routes do not use them:

- `/chats` GET/POST are declared without `attachAuthenticatedUser` or `requireRoles`.
- `/vendors/:id/messages` GET/POST/delete are declared without `attachAuthenticatedUser` or `requireRoles`.
- Role permissions include admin moderation/property permissions, but no route checks `manage_moderation`, owner identity, participant identity, or city scope for messaging.

Current trust model problems:

- Any caller who can hit the API can read `/client/chats` by supplying `userId`, `ownerId`, or `propertyId`.
- Any caller can send a chat using arbitrary `fromUserId`.
- Any caller can read admin-owner messages for any vendor ID.
- Any caller can send admin-owner messages with arbitrary `senderRole`.
- "Delete both" only checks a body-provided `adminId`; it does not verify the requester token.
- Owner local delete is controlled by `viewer: 'owner'` in request body/query, not authenticated ownership.

## API Gaps

- No conversation-list endpoint for users or owners using `Conversation`.
- No conversation-detail endpoint using `Message`.
- No send-message endpoint that upserts a `Conversation` and creates a `Message`.
- No mark-read endpoint.
- No unread-count endpoint.
- No archive/block conversation endpoint.
- No participant authorization enforcement.
- No owner dashboard route/page for user-owner chat threads; owner sees lead counts and admin messages, not an inbox for user chats.
- User dashboard shows message count from overview chats, but has no dedicated chat thread UI.
- Admin property detail filters property messages client-side after fetching all owner messages.
- No server-side pagination for admin-owner messages.
- User-owner `GET /chats` has a fixed `limit(200)` and no page/cursor.
- No delivery/read receipts in active APIs.
- No message attachments.
- No server-side message search.
- No explicit moderation workflow beyond notification on abusive admin-owner message text.

## Data Consistency Gaps

- `Conversation`/`Message` and `Chat` duplicate the same conceptual domain, but only `Chat` is used for user-owner messaging.
- `chatMaster.conversationType` model default is `user_vendor`, while controller writes `user_owner`.
- `chatMaster.addedOn` is a string in the model, but controller writes `new Date()`.
- `AdminMessage.senderRole` allows `vendor`, while frontend owner code sends `owner`; both are treated as owner-side in some logic.
- Property-scoped admin messages are stored with `propertyId`, but route fetching is vendor-wide.
- No unique conversation key prevents duplicate user-owner-property threads because `Conversation` is not used.

## Security And Privacy Gaps

- Backend route auth is missing for all messaging endpoints.
- Backend does not verify that sender/receiver are the authenticated user or the property owner.
- Backend does not validate that `propertyId` belongs to the owner receiving a user chat.
- Backend does not enforce admin/super-admin role before admin-owner messaging.
- Backend does not enforce city-admin scope for admin-owner messaging.
- Delete-both authority depends on request body `adminId`.
- Message content is returned decrypted to any caller that can provide IDs.
- There is no rate limit specific to messaging.
- There is no anti-spam throttling per sender/conversation.
- Moderation is limited and inconsistent; user-owner chat detects contact/callback intent but not abusive text, while admin-owner messaging checks a small hardcoded abusive regex.

## Missing Parts To Build

Highest priority:

- Add authenticated, role-checked messaging routes.
- Enforce participant ownership for every read/send/delete action.
- Decide whether to migrate to `Conversation`/`Message` or remove those unused models. The cleaner path is to use them for user-owner chat.
- Add server pagination/cursor pagination for message lists.
- Add mark-read/unread-count support.

Important next layer:

- Add owner and user inbox/thread UI for user-owner chats.
- Add server-side property filter for admin-owner messages.
- Add indexes on `adminMessage` and `chatMaster` or migrate to indexed `Conversation`/`Message`.
- Add consistent moderation and spam throttling.
- Add audit events for admin permanent deletion and moderation actions.

Lower priority:

- Attachments/media support.
- Message search.
- Edit history.
- Block/archive conversation workflow.

## Files Audited

- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-backend/models/conversation.js`
- `pgfinder-backend/models/message.js`
- `pgfinder-backend/models/adminMessage.js`
- `pgfinder-backend/models/chatMaster.js`
- `pgfinder-backend/app.js`
- `pgfinder-frontend/src/api/adminApi.js`
- `pgfinder-frontend/src/api/dashboardApi.js`
- `pgfinder-frontend/src/api/propertyApi.js`
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/vendor/VendorDashboard.jsx`
- `pgfinder-frontend/src/pages/dashboard/admin/AdminVendorDetailPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/admin/AdminPropertyDetailPage.jsx`
- `pgfinder-frontend/src/pages/dashboard/user/UserDashboard.jsx`
