# MESSAGE_FIX.md — Messaging (Conversations/Replies/Unread/Read) Audit Fix Plan

## Scope (per request)
Audit ONLY messaging features:
- Conversations
- Replies
- Unread counts
- Read receipts
- Owner vs User messaging access

## Files to audit
From the repo context, messaging is implemented in backend under `pgfinder-backend/controllers/clientController.js` and consumed by frontend via `dashboardApi.js`.

## 1) What to verify (backend)

### 1.1 Conversation access control (Owner vs User)
Verify these invariants in `clientController.js`:
- A `user` can fetch conversations where `conversationType: 'user_owner'` and `userId === viewerId`.
- An `owner` can fetch conversations where `conversationType: 'user_owner'` and `ownerId === viewerId`.
- A user can only reply inside the correct conversation.

Common empty/incorrect behavior:
- viewerRole mis-detected from JWT `req.auth.role`.
- wrong query field names (`userId` vs `userIDFK`, `ownerId` vs `vendorId`).

### 1.2 Reply endpoint correctness
Verify reply endpoint behavior:
- `POST /client/chats` handles sending (user->owner or owner->user reply) based on `req.auth.role`.
- It should update:
  - `conversation.lastMessagePreview`
  - `conversation.lastMessageAt`
  - increment the unread counter for the recipient (`$inc: { unreadByOwner: 1 }` when viewer is user, `$inc: { unreadByUser: 1 }` when viewer is owner)

### 1.3 Unread counts update when reading
Verify `GET /client/chats` updates unread counters when `conversationId` is provided:
- If viewerRole is `user`:
  - sets `Conversation.unreadByUser = 0`
  - marks messages read for `toUserIDFK === viewerId` by setting `readAt`.
- If viewerRole is `owner`:
  - sets `Conversation.unreadByOwner = 0`
  - marks messages read for `toUserIDFK === viewerId`.

Common causes for unread bugs:
- Incorrect filter key when marking messages read (e.g. using `toUserIDFK` but schema uses `toUserId`)
- `conversationId` not applied to the message query.
- viewerId comparison mismatch due to string vs ObjectId.

### 1.4 “Read” state consistency
Verify `Message` model uses correct fields:
- `readAt` should be set when marking read.
- `MessageDto` decrypt/read preview should not override `readAt`.

### 1.5 Encryption/decryption doesn’t break preview/ordering
If messaging uses encryption (seen in clientController), ensure:
- `lastMessagePreview` is encrypted on write
- `conversationDto` decrypts `lastMessagePreview`
- sorting uses `lastMessageAt` or `updatedOn` consistently.

## 2) What to verify (frontend)

### 2.1 dashboardApi expects consistent response shape
Backend `GET /client/chats` returns:
- `data.conversations`, `data.messages`, `data.unreadTotal`

Frontend `dashboardApi.chats(params)` expects:
- `res.data?.data || { conversations: [], messages: [], unreadTotal: 0 }`

Verify:
- frontend passes `params.conversationId` when opening a conversation so backend can mark messages as read.

### 2.2 Sender/recipient role mapping
Frontend RoleProtectedRoute may coerce owner/host/vendor to `owner`.
Verify the JWT role matches backend expectations so unread increments happen for the correct side.

## 3) Proposed fix checklist (no code changes in this file)

1. Confirm middleware is applied for messaging endpoints:
   - `attachAuthenticatedUser` is always present.
2. Confirm messaging access checks match schema IDs:
   - `viewerRole` derived from JWT `req.auth.role` must map to conversation ownership fields.
3. Confirm unread counters and readAt marking use the same field names used in Mongoose schema.
4. Confirm frontend includes `conversationId` when viewing a conversation.
5. Confirm response shape alignment between backend and `dashboardApi`.

## 4) Acceptance tests (manual)
- User sends message -> Owner sees conversation and unread count increments.
- Owner opens conversation -> unread count becomes 0 and messages show read.
- Owner replies -> User receives unread count increment.
- User opens conversation -> unread count becomes 0.

