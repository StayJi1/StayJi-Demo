# PG-Finder Comprehensive Codebase Audit

**Generated**: June 11, 2026  
**Scope**: Full stack analysis of PG-Finder MVP (Bangalore-only)  
**Status**: Detailed inventory and issue identification

---

## 1. Backend API Endpoints

### Overview
- **Frontend Controller** (`clientController.js`): 4548 lines - 60+ endpoints for users, properties, messaging, dashboards
- **Admin Controller** (`adminController.js`): 1150 lines - legacy EJS-based admin UI endpoints
- **Architecture**: Express.js with JWT auth, Mongoose ORM, Multer file uploads
- **City Constraint**: `MVP_CITY = 'Bangalore'`, `MVP_STATE = 'Karnataka'`, `MVP_CITY_REGEX = /^(bangalore|bengaluru)$/i`

### Client Controller Endpoints (Primary API)

#### Authentication & User Management
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addUser` | User signup | None | Creates user account with password hashing |
| POST | `/client/loginByUser` | User login | None | Returns JWT token, checks role/portal access |
| POST | `/client/googleAuth` | Google OAuth signup | None | Auto-role detection, consent tracking |
| POST | `/client/authStatus` | Check session | Optional JWT | Validates token expiry, account status |
| POST | `/client/updateUser` | Update profile | JWT + Self/Admin | Name, email, bio, social links, photo |
| POST | `/client/updateUserPhoto` | Upload profile pic | JWT | Multer single file upload |
| GET | `/client/getUserList` | List all users | JWT + Admin | City-scoped pagination |
| POST | `/client/getUser` | Get user details | JWT + Self/Admin | Returns user profile without password |
| POST | `/client/changePassword` | Change password | JWT + Self | Bcrypt password update |
| POST | `/client/resetPassword` | Reset via token | JWT | Password recovery flow |
| POST | `/client/requestPasswordReset` | Request reset OTP | None | OTP generation (incomplete) |
| POST | `/client/resetPasswordWithOtp` | Reset with OTP | None | OTP validation (incomplete) |
| POST | `/client/users/:id/reset-password` | Super admin force reset | JWT + SuperAdmin | Override user password |

#### Property Search & Discovery
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/client/getPropertyList` | List properties | None | Public search, Bangalore default, paginated |
| GET | `/client/getAllPropertyList` | All properties | None | No pagination, admin/demo use |
| POST | `/client/getPropertyByCity` | Properties by city | None | Exact city match (legacy) |
| POST | `/client/getPropertyByArea` | Properties by area | None | Exact area match (legacy) |
| POST | `/client/getPropertyById` | Property details | Optional JWT | Public detail view, visit form |
| POST | `/client/getPropertyByUserId` | Properties by owner | None | List owner's properties |
| GET | `/client/getPropertyType` | Property types | None | Lists PG/Hostel/Co-living |
| POST | `/client/admin/searchProperty` | Admin search | JWT + Admin | Full-text property search, returns owner+visits+inquiries |
| GET | `/api/properties` | Alias to getPropertyList | None | Modern REST naming |

#### Property Management (Owner)
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addProperty` | Create listing | JWT + Owner | Multer multi-file, room inventory, amenities |
| POST | `/client/updateProperty` | Edit listing | JWT + Owner | Updates all fields, revalidates |
| POST | `/client/deleteProperty` | Soft delete listing | JWT + Owner | Sets `isActive: false` |
| POST | `/client/reactivateProperty` | Restore listing | JWT + Owner | Resets `isActive: true` |
| GET | `/client/getPropertyListByUser` | Owner's listings | JWT + Owner | Pagination, includes inactive |
| POST | `/client/properties/:id/occupancy` | Update vacancy | None | Room inventory, beds available, waiting list |
| POST | `/client/properties/:id/update-request` | Request data update | None | Triggers admin review |

#### Shortlist & Wishlist
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addShortlist` | Save property | JWT + User | User wishlist entry |
| DELETE | `/client/deleteShortlist` | Remove from wishlist | JWT + User | Soft delete, can restore |
| POST | `/client/deleteShortlist` | Remove (POST alias) | JWT + User | Same as DELETE |
| POST | `/client/getShortlistById` | Get user's wishlist | JWT + User | Paginated favorites |
| POST | `/client/getShortlistByVendor` | Vendor's wishlist followers | None | Who saved owner's property |
| POST | `/client/getShortlistByPropertyId` | Property's wishlist count | None | Popularity metric |

#### Inquiries & Leads
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addInquiry` | Submit inquiry | JWT + User | Pre-visit interest capture |
| POST | `/client/addInterest` | Quick interest (callback) | JWT + User | Phone number collection |
| POST | `/client/getInquiry` | Get inquiries | JWT + Owner/Admin | Paginated lead list |
| POST | `/client/getInquiryById` | Inquiry details | None | Single inquiry view |
| POST | `/client/markLeadConverted` | Convert to tenant | JWT + Owner/Admin | Closes inquiry as successful |

#### Visit Requests
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addVisit` | Schedule visit | JWT + User | Date/time picker, visitor details |
| POST | `/client/getVisitById` | Get visit details | None | Single visit view |
| POST | `/client/getVisitorList` | List visits to property | JWT + Owner/Admin | Scheduled visitors, paginated |
| POST | `/client/getVisitorListStatus` | Visit status summary | None | Count by status |
| POST | `/client/updateVisitTime` | Reschedule visit | None | Change date/time (incomplete) |
| POST | `/client/updateVisitStatus` | Change visit status | None | Approve/reject/mark complete |
| POST | `/client/visits/:id/status` | Modern status update | JWT + Owner/Admin | Set to scheduled/confirmed/completed/cancelled |

#### Reviews & Ratings
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addReview` | Submit review | None | 1-5 star rating, text, photos |
| GET | `/client/reviews` | List property reviews | None | Public reviews, pagination |
| POST | `/client/reviews/:id/reply` | Owner reply | None | Response to tenant review |
| POST | `/client/reviews/:id/moderate` | Admin moderation | JWT + Admin | Flag/suspend/restore review |
| POST | `/client/getReviewById` | Single review | None | View with helpful votes |
| POST | `/client/reviewProperty` | Alternative review endpoint | None | Duplicate flow (incomplete) |

#### Messaging & Chat
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/client/chats` | List conversations | None | User-owner chats, decrypts messages |
| POST | `/client/chats` | Send message | None | AES-256-GCM encryption, auto-lead-event |
| GET | `/api/admin/vendors/:id/messages` | Vendor messages | None | Admin-owner thread, city-scoped |
| POST | `/api/admin/vendors/:id/messages` | Send vendor message | None | Encrypted, soft-delete flags |
| POST | `/api/admin/vendors/:id/messages/:messageId/delete` | Delete message | None | Sender/admin delete, isActive flag |

#### Move-In & Confirmations
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/moveIns` | Confirm move-in | Multer | Payment screenshot, room image |
| GET | `/client/moveIns` | List move-in records | None | Tenant confirmation records |
| POST | `/client/moveIns/:id/owner-confirm` | Owner confirms | None | Two-way confirmation |
| POST | `/client/moveIns/:id/review` | Post move-in review | None | Triggers reward/loyalty |

#### Admin & Analytics
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/client/getAdminStats` | Dashboard stats | JWT + Admin | Properties, users, inquiries, revenue |
| GET | `/client/getAdminVendorLeadSummary` | Vendor lead KPIs | None | Owner performance metrics (incomplete) |
| GET | `/client/user/overview` | User dashboard | None | Shortlist, visits, reviews, wallet |
| POST | `/client/admin/searchProperty` | Search + detail | JWT + Admin | Returns owner+visits+inquiries |
| POST | `/client/admin/getVendorFullProfile` | Vendor full profile | JWT + Admin | All properties, linked leads |
| POST | `/client/vendor/getVendorFullProfile` | Vendor self-profile | None | Vendor dashboard data |
| POST | `/client/users/:id` | User detail | None | Individual user profile view |
| POST | `/client/updateUserStatus` | Change user status | None | Active/suspended/blocked |

#### Wallet & Payouts
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/wallet/payouts` | Request payout | Multer UPI QR | Bank/UPI details, amount |
| GET | `/client/wallet/payouts` | List payouts | JWT + Admin | Admin review queue |
| POST | `/client/wallet/payouts/:id/review` | Admin review payout | JWT + Admin | Approve/reject, add notes |

#### Saved Searches & User Preferences
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/user/saved-searches` | Save search params | None | Filters, price, area, nearby |
| DELETE | `/client/user/saved-searches/:id` | Delete saved search | None | Remove from history |
| POST | `/client/user/viewed-properties` | Track viewed | None | User browse history |

#### Property Images
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| POST | `/client/addPropertyImages` | Upload images | Multer | Single/batch upload, JPEG/PNG only |
| POST | `/client/getPropertyImageById` | Get image | None | Single image detail |

#### Config & Reference Data
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/client/city-options` | Available cities | None | Returns Bangalore only (MVP) |
| POST | `/client/getAreaListByCity` | Areas by city | None | Localities in Bangalore |
| POST | `/client/getAminityById` | Amenity details | None | Parse JSON amenity list |

#### Admin Governance (Super Admin)
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/client/city-states` | City/state config | JWT + SuperAdmin | Launch/demo status |
| POST | `/client/city-states` | Create city | JWT + SuperAdmin | Add new region (future) |
| GET | `/client/governance` | Platform status | JWT + SuperAdmin | Features, flags, limits |
| GET | `/client/auditLogs` | Audit log search | JWT + SuperAdmin | All user/admin actions |
| POST | `/client/dummy-transition` | Demo data cleanup | JWT + SuperAdmin | Marks demo listings as archived |

### Admin Controller Endpoints (Legacy EJS)

#### Legacy HTML Dashboard
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/admin/` | Dashboard view | Session | EJS render, legacy UI |
| POST | `/admin/loginEJS` | Session login | None | Sets `req.session` cookie |
| GET | `/admin/logout` | Session logout | Session | Clears session |

#### Legacy Area Management
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/admin/addArea` | Add area form | Session | EJS render |
| POST | `/admin/addAreaEJS` | Create area | Session | JSON + EJS render |
| GET | `/admin/showArea` | List areas | Session | EJS table |
| GET | `/admin/fetchArea/:id` | Get area JSON | Session | For AJAX updates |
| POST | `/admin/updateAreaEJS` | Update area | Session | EJS render response |
| POST | `/admin/deleteArea` | Delete area | Session | Soft delete |

#### Legacy Property Type Management
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/admin/addPropertyType` | Add type form | Session | EJS render |
| POST | `/admin/addPropertyTypeEJS` | Create type | Session + Multer | Icon image required |
| GET | `/admin/showPropertyType` | List types | Session | EJS table |
| GET | `/admin/fetchPropertyType/:id` | Get type JSON | Session | For AJAX |
| POST | `/admin/updatePropertyTypeEJS` | Update type | Session + Multer | EJS render response |
| POST | `/admin/deletePropertyType` | Delete type | Session | Soft delete |

#### Legacy Property Management
| Method | Endpoint | Purpose | Auth | Notes |
|--------|----------|---------|------|-------|
| GET | `/admin/addProperty` | Add property form | Session | EJS render |
| POST | `/admin/addPropertyEJS` | Create property | Session + Multer | Multi-image upload |
| GET | `/admin/showProperty` | List properties | Session | EJS table, active only |
| GET | `/admin/showInactiveProperty` | List inactive | Session | EJS table, inactive only |
| POST | `/admin/reactivateProperty` | Restore property | Session | Reactivate archived |
| POST | `/admin/updatePropertyStatus` | Change status | Session | Active/inactive toggle |

**Architecture Notes**:
- No error handler middleware → unhandled promise rejections
- Admin controller missing `wrapAsync` → potential crashes on async errors
- File upload routes assume files exist → 500s on missing files
- Mixed encryption: chatMaster and adminMessage use AES-256-GCM; message model unused
- City scoping via regex patterns, not database index lookups

---

## 2. Database Models

### User Model (`userMaster.js`)

**Fields**:
```
userName, userFname, userLname, userEmail, userPassword (bcrypt)
dob, gender, contact, occupation, bio, city, state
emailVerified, phoneVerified
accountStatus (active|suspended|blocked|pending_verification)
approvalStatus (Pending|Approved|Rejected|Suspended|Verified)
userType (user|owner|admin|super_admin)
permissions (array of role-based strings)
assignedCity, assignedState (city scope for admins)
lastLogin, forceLogoutAt (session control)
termsAcceptedAt, privacyAcceptedAt (consent tracking)
termsConsent, privacyConsent (metadata + acceptance timestamp)
consentHistory (array of consent records)
suspiciousActivity (array of flagged actions)
socialLinks, profile (image), isActive, addedOn
```

**Status**: ✅ Complete - all core fields present, supports multi-role role history

**Relationships**:
- Referenced by: Property (userIDFK), Inquiry, Visit, Shortlist, Review, Chat, AdminMessage, Conversation, WalletPayout
- Foreign key: `userIDFK`, `userId` (duplicated for sync)

---

### Property Model (`propertyMaster.js`)

**Fields**:
```
userIDFK, vendorId (owner reference)
propertyName, description, address
rent (string), sharing (single|double|triple), genderType (boys|girls|unisex)
areaName, localitySlug (indexed), cityName, stateName
latitude, longitude (coordinates)
propertyTypeIDFK (PG|Hostel|Co-living)
aminityFeatures (JSON string), customFeatures (array)
propertyImage, propertyImageUrls (string URLs)
propertyCategory (default: PG)
pricingUnit (month|day)
dailyRate, perDayCheckIn (boolean)
depositAmount, availableBeds
roomInventory (array with occupancy, rent per room type)
roomTypes (alternative structure)
verificationChecklist {identity, ownership, photos, location, pricing, safety}
vacancyStatus, mealsAvailable (array), menuPhoto
videoUrl, youtubeUrl
rating, reviewSummary {averageRating, reviewsCount, updatedOn}
isActive, isDummy, verified, approvalStatus
status (active|inactive|pending|rejected)
addedOn, updatedOn
```

**Status**: ⚠️ Incomplete - missing fields:
- No `photoTypes` for real-photo enforcement
- No `honestScore` for quality metrics
- No `nearby` precomputed essentials (metro, hospital, etc.)
- No `verified: Boolean` flag (has approvalStatus instead)
- `roomInventory` and `roomTypes` duplicate each other (schema debt)

**Relationships**:
- Owner: Property.userIDFK → User._id
- Type: Property.propertyTypeIDFK → PropertyType._id
- Images: Property._id → PropertyImage.propertyIDFK
- Inquiries: Property._id ← Inquiry.propertyIDFK
- Visits: Property._id ← Visit.propertyIDFK
- Shortlists: Property._id ← Shortlist.propertyIDFK
- Reviews: Property._id ← UserReview.propertyIDFK
- Chats: Property._id ← Chat.propertyId

---

### Inquiry Model (`inquiryMaster.js`)

**Fields**:
```
propertyIDFK, propertyId (duplicated, synced in pre-save hook)
userIDFK (inquirer)
vendorId (property owner)
subject, description, preferredVisitTime, moveInPreference
leadStage (qualified|negotiating|converted|lost), isConverted
reply (owner response)
status (active|inactive|pending|rejected)
isDummy, isVerified, isActive
addedOn
```

**Status**: ⚠️ Incomplete - missing:
- `createdAt`, `updatedAt` proper date fields (stores string addedOn)
- No `followUpDate` for CRM workflows
- No `priority` or `budget` capture
- No `source` (website|app|referral)

**Relationships**:
- Property: inquiryMaster.propertyIDFK → propertyMaster._id
- User: inquiryMaster.userIDFK → userMaster._id
- Owner: inquiryMaster.vendorId → userMaster._id

**Indexes**: propertyIDFK, propertyId, vendorId, userIDFK, isDummy

---

### Visit Details Model (`visitDetails.js`)

**Fields**:
```
propertyIDFK, propertyId (synced)
userIDFK, userId (synced)
vendorId (owner)
visitDate, visitTime (strings, not Date)
moveInPreference
leadStage, isConverted
status (scheduled|completed|cancelled|no-show)
isDummy, isVerified, isActive
addedOn
```

**Status**: ⚠️ Incomplete - missing:
- No `confirmedAt` timestamp for owner confirmation
- No `checkinTime`, `duration` for actual visit tracking
- No `notes` for visit feedback
- No `rating` for property condition on visit
- Stores visitDate/visitTime as strings (should be Date)

**Relationships**:
- Property: Visit.propertyIDFK → Property._id
- User: Visit.userIDFK → User._id
- Owner: Visit.vendorId → User._id

**Indexes**: propertyIDFK, propertyId, vendorId, userIDFK, isDummy

---

### Message Model (`message.js`)

**Fields**:
```
conversationId (required)
propertyId (optional)
fromUserIDFK, toUserIDFK (required, user references)
senderRole (user|owner)
text (required)
metadata (mixed object)
readAt (Date, null = unread)
addedOn (Date, default: now)
isActive (boolean)
```

**Status**: ❌ Unused - Model is imported but no live route creates/reads these records

**Relationships**:
- Conversation: message.conversationId → conversation._id
- Property: message.propertyId → propertyMaster._id
- Users: message.fromUserIDFK, toUserIDFK → userMaster._id

**Indexes**: conversationId+addedOn, fromUserIDFK+isActive, toUserIDFK+isActive+readAt, propertyId+isActive

**Note**: Text is **not encrypted** in this model (unlike chatMaster and adminMessage)

---

### Conversation Model (`conversation.js`)

**Fields**:
```
userId, ownerId (required participant references)
propertyId (optional, context for conversation)
participants (array, auto-filled in pre-save)
conversationType (user_owner|admin_owner|internal)
status (active|archived|blocked)
unreadCountUser, unreadCountOwner, unreadCountAdmin
lastMessage, lastMessageTime
updatedOn (synced in pre-save)
isActive
```

**Status**: ❌ Unused - Model exists but no live route creates, lists, marks read, or manages these records

**Relationships**:
- User: conversation.userId → userMaster._id
- Owner: conversation.ownerId → userMaster._id
- Property: conversation.propertyId → propertyMaster._id

**Note**: Useful structure designed but abandoned in favor of legacy chatMaster and adminMessage

---

### Chat Master Model (`chatMaster.js`) — Legacy, In Use

**Fields**:
```
fromUserId, toUserId (required)
conversationType (user_owner|admin_owner)
text (AES-256-GCM encrypted)
metadata (mixed, stores contact intent detection, lead event ID)
addedOn
isActive
propertyId (optional, inferred from Inquiry if omitted)
```

**Status**: ✅ In use - primary messaging for user-owner chats

**Encryption**: Text field is encrypted with AES-256-GCM using `MESSAGE_SECRET` before save

**Relationships**:
- Sender/Receiver: Chat.fromUserId, toUserId → userMaster._id
- Property: inferred from Property.vendorId if needed

**Missing Indexes**: No indexes defined

---

### Admin Message Model (`adminMessage.js`) — Legacy, In Use

**Fields**:
```
vendorId, adminId (message participants)
propertyId (optional, property context)
senderRole (admin|vendor)
message (AES-256-GCM encrypted)
deletedForAdmin, deletedForVendor (soft-delete flags)
isDummy, isVerified
status (active|archived|suspended)
addedOn
isActive
```

**Status**: ✅ In use - private admin-owner messaging thread

**Encryption**: Message field encrypted like chatMaster

**Soft Delete**: Owner/vendor can delete locally; full delete only if admin also deletes

**Relationships**:
- Vendor: adminMessage.vendorId → userMaster._id
- Admin: adminMessage.adminId → userMaster._id
- Property: optional context, but stored message thread is vendor-wide

**Missing Indexes**: No indexes defined

---

### User Review Model (`userReview.js`)

**Fields**:
```
propertyIDFK (required)
userIDFK (reviewer)
vendorId (property owner)
rating (1-5)
reviewText, reviewImages (array)
helpful, notHelpful (vote counts)
reply (owner response)
status (active|pending|flagged|suspended|archived)
isDummy, isVerified, isActive
addedOn
```

**Status**: ✅ Mostly complete - used for 1-5 star ratings with photos

**Relationships**:
- Property: review.propertyIDFK → propertyMaster._id
- Reviewer: review.userIDFK → userMaster._id
- Owner: review.vendorId → userMaster._id

---

### Shortlist Master Model (`shortlistMaster.js`)

**Fields**:
```
propertyIDFK, propertyId (synced)
userIDFK, userId (synced)
status (active|archived|demo|suspended)
isDummy, isVerified, isActive
addedOn
```

**Status**: ✅ Complete - user wishlist entries

**Relationships**:
- Property: shortlist.propertyIDFK → propertyMaster._id
- User: shortlist.userIDFK → userMaster._id

**Indexes**: propertyIDFK, propertyId, userIDFK, isDummy

---

### Notification Model (`notification.js`)

**Fields**:
```
recipientId (user or owner)
recipientRole (user|vendor|admin|all)
actorId (who triggered the event)
propertyId (context)
type (inquiry|visit|review|message|payment)
title, message, link (action URL)
readAt (null = unread)
metadata (event-specific data)
addedOn (Date)
isActive
```

**Status**: ⚠️ Incomplete - in-app notifications model exists but:
- No unread count fields
- No notification preferences per user
- No batch read/archive endpoints fully implemented

**Relationships**:
- Recipient: notification.recipientId → userMaster._id
- Actor: notification.actorId → userMaster._id
- Property: notification.propertyId → propertyMaster._id

---

### Payment Master Model (`paymentMaster.js`)

**Fields**:
```
userIDFK, vendorId (payment participants)
propertyIDFK, moveInConfirmationId (context)
amount, currency (string)
paymentMethod (razorpay|paytm|bank_transfer)
status (pending|completed|failed|refunded)
transactionId, receiptUrl
isDummy, isVerified, isActive
addedOn
```

**Status**: ⚠️ Incomplete - schema exists but no API endpoints use it; no integration visible

---

### Move-In Confirmation Model (`moveInConfirmation.js`)

**Fields**:
```
propertyIDFK, vendorId (tenant and owner)
userIDFK
moveInDate, confirmedAt (timestamps)
paymentScreenshot, roomImage (upload paths)
notes (tenant notes)
confirmationStatus (pending|confirmed|completed)
isDummy, isVerified, isActive
addedOn
```

**Status**: ⚠️ Incomplete - schema exists; limited endpoint coverage

---

### Wallet Payout Model (`walletPayout.js`)

**Fields**:
```
vendorId (owner requesting payout)
amount, currency
payoutMethod (bank_transfer|upi)
bankDetails or upiDetails (JSON)
upiQr (image upload path)
status (pending|approved|rejected|processed)
adminNotes
isDummy, isVerified, isActive
addedOn, processedAt
```

**Status**: ⚠️ Incomplete - schema exists; minimal admin review endpoints

---

### Property Update Request Model (`propertyUpdateRequest.js`)

**Fields**:
```
propertyIDFK, vendorId
updateType (occupancy|images|amenities|pricing)
changes (JSON diff)
requestedAt, reviewedAt
reviewerAdminId
status (pending|approved|rejected)
isDummy, isVerified, isActive
```

**Status**: ⚠️ Incomplete - schema for data audit trail but limited admin workflow

---

### Audit Log Model (`auditLog.js`)

**Fields**:
```
userId, adminId (actor)
action (create_property|update_user|delete_review)
resourceType (property|user|inquiry)
resourceId
changes (before/after JSON)
ipAddress, userAgent
timestamp
status (success|failure)
```

**Status**: ⚠️ Incomplete - schema exists; not actively logged on all actions

---

### Other Models

- **Property Type** (`propertyType.js`): PG, Hostel, Co-living types with icon images
- **Area Master** (`areaMaster.js`): Bangalore localities, zip codes, coordinates
- **City State Master** (`cityStateMaster.js`): Cities and states, launch status flags
- **Amenity Master** (`aminityMaster.js`): Common amenities (WiFi, AC, Food, etc.)
- **Lead Event** (`leadEvent.js`): Event trail for lead lifecycle (inquiry → visit → conversion)
- **User Request** (`userRequest.js`): Future feature requests or support tickets

---

## 3. Authentication & Authorization

### JWT-Based Authentication

**Token Generation** (`clientController.js`):
```javascript
const signAuthToken = (user) => {
  const token = jwt.sign({
    id: user._id,
    userId: user._id,
    userName: user.userName,
    userType: user.userType,
    email: user.userEmail,
    role: tokenRoleName(user.userType),
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000)
  }, jwtSecret)
  return token
}
```

**Token Fields**:
- `id`, `userId`: ObjectId of user
- `userType`: user|owner|admin|super_admin
- `role`: normalized role name
- `permissions`: array of permission strings
- `iat`: issued-at timestamp

**Storage**: Bearer token in `Authorization: Bearer <token>` header

**Expiry**: No explicit `exp` claim → tokens valid indefinitely (⚠️ Security risk)

### Role Model

| Role | userType | Normalized | Permissions | Dashboard |
|------|----------|-----------|-----------|-----------|
| **User** | user, personal, student | user | browse_properties, manage_own_profile | `/dashboard/user` |
| **Owner** | owner, vendor, host, hostel | owner | manage_own_properties, view_own_leads, view_own_finance | `/dashboard/owner` |
| **Admin** | admin | admin | manage_users, manage_properties, manage_moderation, manage_seo, view_city_analytics | `/dashboard/admin` |
| **Super Admin** | super_admin, super admin, super-admin, superadmin | super_admin | manage_users, manage_properties, manage_finance, manage_admins, manage_dummy_data, manage_seo, manage_moderation, view_global_analytics | `/dashboard/super-admin` |

### Access Control Patterns

#### Middleware Guards

```javascript
// Attached to request if JWT present
const attachAuthenticatedUser = (req, res, next) => {
  const token = getBearerToken(req)
  if (!token) return next()
  const decoded = jwt.verify(token, jwtSecret)
  req.user = decoded
  next()
}

// Optional auth (used on public property detail)
const attachOptionalAuthenticatedUser = (req, res, next) => {
  attachAuthenticatedUser(req, res, next)
}

// Require JWT + role check
const requireRoles = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({...})
  if (!allowedRoles.includes(normalizeAccountType(req.user.userType))) {
    return res.status(403).json({...})
  }
  next()
}

// Super admin only
const requireSuperAdmin = (req, res, next) => {
  if (normalizeAccountType(req.user?.userType) !== 'super_admin') {
    return res.status(403).json({...})
  }
  next()
}
```

#### City Scoping

```javascript
// Properties restricted to Bangalore
const bangalorePropertyScope = () => ({ cityName: MVP_CITY_REGEX })

// Admin can manage users in their assigned city
const adminCityScope = (req) => ({
  $or: [
    { assignedCity: new RegExp(escapeRegex(normalizeText(req.user.assignedCity)), 'i') },
    { userType: 'super_admin' }
  ]
})
```

### Endpoint Protection

**Unprotected** (public access):
- `/client/getPropertyList` - public search
- `/client/loginByUser`, `/client/addUser` - auth entry points
- `/client/addInquiry`, `/client/addVisit` - guests can submit interest
- `/client/reviews`, `/client/addReview` - public reviews

**Optional Auth** (better experience if logged in):
- `/client/getPropertyById` - public detail, but checks JWT for wishlist UI
- `/client/chats` - can send message anonymously or as user

**Protected** (must have JWT):
- `/client/updateUser` - self or admin
- `/client/getShortlistById` - user only
- `/client/addProperty` - owner only
- `/client/getAdminStats` - admin only
- `/client/admin/searchProperty` - admin only

### Session Management

**Force Logout**:
```javascript
// Admin can force user logout by setting forceLogoutAt
await User.updateOne({ _id: userId }, { forceLogoutAt: new Date() })
// On next auth check, if decoded.iat < forceLogoutAt, return 401
```

**Last Login Tracking**:
```javascript
// Updated on each successful login
await User.updateOne({ _id: objUser._id }, { lastLogin: new Date() })
```

### Account Status Enforcement

| Status | Access | Notes |
|--------|--------|-------|
| active | Full access | Default |
| pending_verification | Reduced access | Owner accounts await approval |
| suspended | No access | Admin suspension, can appeal |
| blocked | No API access | Abuse/violation, permanent |

**Check**:
```javascript
if (['suspended', 'blocked'].includes(objUser.accountStatus)) {
  return res.json({ result: "fail", msg: "This account is not active. Contact StayJi admin support." })
}
```

### ⚠️ Authentication Issues

1. **No JWT Expiry**: Tokens issued without `exp` claim → valid indefinitely
2. **Backend Routes Unauthenticated**: Many `/client/*` routes trust body IDs instead of JWT identity
3. **Missing Permission Checks**: Permissions array exists but not enforced on routes
4. **Mixed Auth Methods**:
   - Modern `/api/admin/*` routes: JWT-protected
   - Legacy `/admin/*` routes: Session-based (EJS)
   - Most `/client/*` routes: caller-supplied IDs (risky)
5. **No Rate Limiting Per User**: Global rate limit 600 req/15min, not per-account

---

## 4. Search Implementation

### Search Endpoints & Behavior

#### Main Property Search (GET /client/getPropertyList)

**Query Parameters**:
```
q, search, name, propertyName - property name
city, cityName - defaults to Bangalore
area, areaName, locality - exact match or regex
category - PG|Hostel|Co-living
minPrice, maxPrice - budget range
gender - boys|girls|unisex
sharing - single|double|triple
amenities - array or comma-separated
sort - recommended|rating|price_low|price_high|new
page, limit - pagination
includeAllCities - bypass Bangalore default
```

**Normalization**:
```javascript
const normalizeText = (value = '') => value.toString().trim().replace(/\s+/g, ' ')
const canonicalLocationName = (value = '') => {
  const normalized = normalizeText(value)
  if (/^(bengaluru|bangalore)$/i.test(normalized)) return 'Bangalore'
  return normalized
}
// Example: "bangalore" → "Bangalore", "  Whitefield  " → "Whitefield"
```

**Filter Building**:
```javascript
const buildPropertyFilters = (source = {}) => {
  const filters = { ...publicPropertyQuery } // isActive: true, etc.
  
  // City normalization & regex matching
  if (source.cityName || source.city) {
    filters.cityName = new RegExp(
      `^${normalizedRegexSource(canonicalLocationName(source.cityName || source.city))}$`, 
      'i'
    )
  }
  
  // Area: exact match via regex (case-insensitive, whitespace-flexible)
  if (source.areaName || source.area || source.locality) {
    filters.areaName = new RegExp(
      `^${normalizedRegexSource(source.areaName || source.area || source.locality)}$`, 
      'i'
    )
  }
  
  // Category: exact match
  if (source.category) {
    filters.propertyCategory = new RegExp(`^${normalizedRegexSource(source.category)}$`, 'i')
  }
  
  // Property name & text search
  const search = normalizeText(source.q || source.search || source.name || source.propertyName || '')
  if (search) {
    const normalizedSearch = canonicalLocationName(search)
    const regexes = [...new Set([search, normalizedSearch])]
      .map((value) => normalizedRegex(value))
    filters.$or = [
      { propertyName: { $in: regexes } },
      { description: { $in: regexes } },
      { address: { $in: regexes } }
    ]
  }
  
  return filters
}
```

**Searchable Fields**:
- ✅ `propertyName` (text search, case-insensitive, flexible whitespace)
- ✅ `cityName` (regex, canonicalized)
- ✅ `areaName` (regex, exact word match)
- ✅ `category` (PG|Hostel|Co-living)
- ❌ `amenities` (parsed JSON, not indexed)
- ❌ `rent` (string, not numeric range)
- ⚠️ `gender` (only in room inventory, not top-level property)

**Pagination**:
```javascript
const page = parseInt(req.query.page) || 1
const limit = parseInt(req.query.limit) || 10
const skip = (page - 1) * limit
const results = await Property.find(filters).skip(skip).limit(limit).exec()
```

**Case Sensitivity**: ✅ Case-insensitive (uses `/i` flag)

#### Admin Search (POST /client/admin/searchProperty)

**Purpose**: Admin property lookup with full owner + visits + inquiries context

**Payload**:
```javascript
{
  q: "property name or ID",
  city: "Bangalore",
  limit: 50
}
```

**Behavior**:
- Searches `propertyName`, description, address, city, area, category, ObjectId
- Uses `new RegExp(q, 'i')` directly (not escaped)
- Returns property + owner + visits + inquiries in single response
- Admin-scoped (city-filtered)

**Status**: ✅ Implemented

#### Legacy City/Area APIs (POST)

**Routes**:
- `POST /client/getPropertyByCity` - exact city match
- `POST /client/getPropertyByArea` - exact area match

**Behavior**:
```javascript
// Exact string equality (not regex)
const properties = await Property.find({
  cityName: req.body.cityName,
  ...publicPropertyQuery
})
```

**Issues**:
- ❌ No regex → "bangalore" and "Bangalore" are different
- ❌ No pagination → returns all matches
- ❌ No property name search
- ❌ Deprecated in favor of main search

#### Frontend Search (PropertiesPage.jsx)

**Implementation**: Client-side filters on server-paginated results

**Flow**:
1. Fetch all pages of properties with `getPropertyList(includeAllCities=true)`
2. Filter in React by: name, gender, sharing, amenities, budget, rating
3. Sort by: recommended, rating, price, new
4. Paginate on frontend by slicing array

**Issues**:
- ⚠️ No server-side pagination on initial fetch
- ⚠️ All cities mixed (multi-city data sent to client)
- ⚠️ Client-side filters not reflected in URL (no deeplink for shared searches)

---

### Search Issues & Gaps

| Issue | Status | Impact |
|-------|--------|--------|
| **Case sensitivity in legacy APIs** | ⚠️ Partially fixed | "bangalore" vs "Bangalore" inconsistency |
| **Property name search missing from Bangalore page** | ❌ Missing | Can't search by PG name on `/bangalore` |
| **No full-text search** | ❌ Missing | Regex-based search inefficient at scale |
| **Amenities not queryable** | ❌ Missing | Stored as JSON, not indexed array |
| **Rent range filtering** | ❌ Missing | Rent stored as string, not number |
| **Distance sorting** | ⚠️ Partial | User location tracked but not used for sort |
| **Nearby essentials (metro, hospital)** | ❌ Missing | No precomputed nearby data |
| **Price per bed vs property** | ❌ Ambiguous | roomInventory has per-room rent, unclear which to display |

---

## 5. Frontend Pages

### Public Pages

| Page | File | Route | Purpose | Components |
|------|------|-------|---------|-----------|
| **Home** | HomePage.jsx | `/` | Landing, CTAs, featured areas | Navbar, hero section, area cards, testimonials, Footer |
| **Properties Search** | PropertiesPage.jsx | `/properties` | Main search & filter UI | SearchBar, FilterPanel, PropertyCard list, PropertyMap, sort/paginate |
| **Property Detail** | PropertyDetailPage.jsx | `/properties/:id`, `/property/:id` | Full PG/hostel profile, reviews, book visit | GalleryTrigger, amenity badges, reviews, contact form, map |
| **Locality Page** | LocalityPage.jsx | `/bangalore`, `/bangalore/:localitySlug` | Area-specific listings | Area heading, property cards, nearby essentials, breadcrumbs |
| **Compare** | ComparePage.jsx | `/compare` | Side-by-side PG comparison | Property cards in columns, shared filters, export table |
| **FAQ** | FAQPage.jsx, FAQDetailPage.jsx | `/faq`, `/faq/:category`, `/faq/:category/:faqSlug` | Help content | Category nav, accordion, related FAQs |
| **Blog** | BlogPage.jsx | `/blog`, `/blog/:slug`, `/blogs`, `/blogs/:slug` | Editorial content | Blog list/detail, related posts, author info |
| **Recommendations** | RecommendationPage.jsx | `/recommendations`, `/recommendations/:slug` | Curated lists | Dynamic recommendation cards |
| **Legal** | LegalPage.jsx | `/terms-and-conditions`, `/privacy-policy`, `/refund-policy` | Terms, privacy, policies | Static markdown/HTML |
| **Login** | LoginPage.jsx | `/login`, `/admin-login`, `/super-admin-login` | Authentication UI | Email/password form, Google OAuth, role selector, forgot password link |
| **Signup** | SignupPage.jsx | `/signup` | Registration UI | Email/password form, Google OAuth, role selector, terms accept |
| **404** | NotFoundPage.jsx | `*` | Not found page | Redirect to home, suggestions |

### Dashboard — User (`/dashboard/user/...`)

| Page | File | Purpose | Components |
|------|------|---------|-----------|
| **Dashboard Home** | UserDashboard.jsx | Overview: shortcuts, shortlist count, visits, reviews, wallet | Summary cards, recent activity, quick actions |
| **Profile** | UserProfilePage.jsx | Edit profile, change password, photo | Form inputs, password change, account settings |

### Dashboard — Owner (`/dashboard/owner/...`)

| Page | File | Purpose | Components |
|------|------|---------|-----------|
| **Dashboard Home** | VendorDashboard.jsx | Overview: property count, lead summary, recent inquiries, messages | Summary cards, lead pipeline, recent activity |
| **My Properties** | ManagePropertiesPage.jsx | List owner's listings, edit, deactivate | Property table/grid, bulk actions, add button |
| **Add/Edit Property** | AddPropertyPage.jsx | Create or update PG listing with images, amenities, room inventory | Form with multi-step or long form, image upload, room type inputs |
| **My Leads** | VendorLeadsPage.jsx | Inquiries and visit requests to owner's properties | Lead table, filter by status, assign/follow up, message link |

### Dashboard — Admin (`/dashboard/admin/...`)

| Page | File | Purpose | Components |
|------|------|---------|-----------|
| **Dashboard Home** | AdminDashboard.jsx | KPIs: properties, users, inquiries, revenue, moderation queue | Stats cards, charts, pending approvals, recent activity |
| **Manage Users** | ManageUsersPage.jsx | User list, search, status, permissions | AdvancedDataTable, filters, bulk actions, user detail modal |
| **Owner Detail** | AdminVendorDetailPage.jsx | Owner profile, properties, leads, messages | Owner card, property list, lead history, messaging thread |
| **Property Detail** | AdminPropertyDetailPage.jsx | Property edit, verification, reviews, inquiries, visits | Property form, approval checklist, lead list, messaging |

### Dashboard — Super Admin (`/dashboard/super-admin/...`)

| Page | File | Purpose | Components |
|------|------|---------|-----------|
| **Dashboard Home** | SuperAdminDashboard.jsx | Global KPIs, admin management, platform status | Stats, admin list, governance controls, audit summary |

### Shared Dashboard Pages

| Page | File | Route | Purpose |
|------|------|-------|---------|
| **Profile** | UserProfilePage.jsx | `/dashboard/profile` | Shared profile editor for all authenticated users |
| **Messages** | MessagesPage.jsx | `/dashboard/messages` | Chat/messaging interface for user/owner |

---

## 6. Frontend Components

### Component Inventory

**Root Level**:
- `FilterPanel.jsx` - Filter widget (gender, food, capacity)
- `PGCard.jsx` - Property card preview
- `SEO.jsx` - SEO meta tag helper
- `SearchBar.jsx` - Search input with suggestions

**Layout** (`layout/`):
- `Navbar.jsx` - Top navigation, role-aware links, logout
- `Sidebar.jsx` - Dashboard sidebar, role-based nav
- `Footer.jsx` - Global footer, links, copyright

**Common** (`common/`):
- `Button.jsx` - Reusable button component
- `Card.jsx` - Generic card wrapper
- `Input.jsx` - Form input field
- `Loader.jsx` - Loading spinner
- `ProtectedRoute.jsx` - Auth guard for routes
- `RoleProtectedRoute.jsx` - Role-specific route guard
- `SectionHeading.jsx` - Section title component

**Property** (`property/`):
- `PropertyCard.jsx` - Main property card (150 lines) with image, name, rating, wishlist button

**Gallery** (`gallery/`):
- `GalleryTrigger.jsx` - Image gallery modal launcher

**Admin** (`admin/`):
- `AdvancedDataTable.jsx` - Data table with sort, filter, export, pagination

**Map** (`map/`):
- `PropertyMap.jsx` - Google Maps display for properties

**Notifications** (`notifications/`):
- `NotificationBell.jsx` - Bell icon with unread count, dropdown menu

**SEO** (`seo/`):
- `SeoContentCard.jsx` - SEO content module

### Categorization by Type

**Layout & Structure** (5):
- Navbar, Sidebar, Footer, PageLayout, DashboardLayout

**Forms & Input** (2):
- Input, Button

**Data Display** (5):
- PropertyCard, PGCard, AdvancedDataTable, Card, SectionHeading

**User Interaction** (3):
- SearchBar, FilterPanel, GalleryTrigger

**Routing & Guards** (2):
- ProtectedRoute, RoleProtectedRoute

**Modals & Overlays** (1):
- GalleryTrigger (implied modal)

**Maps & Location** (1):
- PropertyMap

**Notifications** (1):
- NotificationBell

**SEO & Meta** (2):
- SEO, SeoContentCard

**Utilities** (1):
- Loader

---

## 7. Key Issues to Fix

### 1. Multi-City vs Bangalore-Only

**Current State**: Code has both multi-city and single-city paths

**Issues**:
- ✅ Backend constants enforce Bangalore via `MVP_CITY_REGEX`
- ✅ Frontend `/bangalore` route exists for Bangalore-specific browsing
- ⚠️ `/properties` fetches all cities (uses `includeAllCities: true`)
- ⚠️ City selector exposed in some components
- ❌ City/area legacy APIs use exact string equality → breaks "bangalore" vs "Bangalore"

**Fix Steps**:
1. Remove `includeAllCities` from frontend property fetches
2. Change all `getPropertyByCity` / `getPropertyByArea` calls to use regex-based search with canonicalization
3. Hide multi-city selectors in UI
4. Test `/properties` and `/bangalore` pages return only Bangalore listings
5. Update seed data to only include Bangalore properties

**Files to Update**:
- `pgfinder-frontend/src/pages/PropertiesPage.jsx` - remove `includeAllCities`
- `pgfinder-backend/controllers/clientController.js` - fix exact match → regex in legacy APIs
- `pgfinder-frontend/src/config/mvp.js` - verify city config

---

### 2. Role Simplification (Remove Super Admin)

**Current State**: 4 roles (user, owner, admin, super_admin) with frontend/backend support

**Issues**:
- Frontend has `/dashboard/super-admin` route
- Backend creates default super_admin on startup
- Permissions & role guards complicate codebase
- MVP only needs 3 roles: user, owner, admin

**Fix Steps**:
1. Comment out or remove default super_admin creation in `adminController.js`
2. Remove `/dashboard/super-admin` route and `SuperAdminDashboard.jsx`
3. Remove super_admin from role guards (allow admin to access admin routes only)
4. Redirect any `/dashboard/super-admin/*` to `/dashboard/admin`
5. Keep super_admin logic in codebase but disable in UI/routing
6. Update role normalization to map `super_admin` → `admin`

**Files to Update**:
- `pgfinder-backend/controllers/adminController.js` - comment out super_admin creation
- `pgfinder-frontend/src/routes/AppRoutes.jsx` - remove super_admin routes
- `pgfinder-frontend/src/components/common/RoleProtectedRoute.jsx` - simplify role check
- `pgfinder-frontend/src/components/layout/Sidebar.jsx` - remove super_admin nav links

---

### 3. Search Normalization

**Current State**: Multiple search paths with inconsistent filtering

**Issues**:
- Legacy APIs use exact string match (`cityName: req.body.cityName`)
- New APIs use regex with canonicalization
- "bangalore" and "Bangalore" produce different results
- Property name search missing from area page
- No full-text index (uses regex scan)
- Amenities not queryable (JSON string, not array)
- Rent stored as string (not numeric for range filtering)

**Fix Steps**:
1. Ensure all property queries use `buildPropertyFilters()` helper with regex + canonicalization
2. Replace exact `getPropertyByCity` / `getPropertyByArea` with updated calls
3. Add property name search to `/bangalore` page filters
4. Index propertyName for better search performance
5. Convert rent from string to number in propertyMaster schema (or add rentNumeric field)
6. Parse amenities as array on save, not JSON string
7. Add Mongoose text index on propertyName, description, areaName

**Files to Update**:
- `pgfinder-backend/controllers/clientController.js` - fix legacy search APIs
- `pgfinder-backend/models/propertyMaster.js` - add indexes, data type fixes
- `pgfinder-frontend/src/pages/LocalityPage.jsx` - add property name filter
- `pgfinder-backend/scripts/seedData.js` - ensure data conforms to new schema

---

### 4. Image Gallery Implementation

**Current State**: Single featured image displayed; gallery modal incomplete

**Issues**:
- `GalleryTrigger.jsx` exists but integration unclear
- No fullscreen swipe/pinch-to-zoom
- Multiple images uploaded but only first used in search results
- Property detail page shows limited images

**Fix Steps**:
1. Complete `GalleryTrigger` component with fullscreen modal, swipe gestures, zoom
2. Integrate into `PropertyDetailPage.jsx` as main gallery
3. Load all propertyImageUrls into gallery component
4. Add keyboard navigation (arrow keys, ESC to close)
5. Add slide counter and thumbnail strip
6. Test on mobile (swipe, pinch, portrait/landscape)
7. Add lazy-loading for images outside viewport

**Recommended Library**: Lightbox-style component like `photoswipe` or `yet-another-react-lightbox`

**Files to Update**:
- `pgfinder-frontend/src/components/gallery/GalleryTrigger.jsx` - expand implementation
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx` - integrate gallery
- `pgfinder-frontend/package.json` - add gallery library

---

### 5. Messaging System Status

**Current State**: Two separate implementations (user-owner via chatMaster, admin-owner via adminMessage)

**Issues**:
- No unified conversation view
- No unread count tracking
- No read receipts
- `conversation` and `message` models unused
- Encryption works but keys not rotated
- No message search or archive
- Admin can't mediate user-owner chats directly
- No notification integration for new messages

**Incomplete Flow**:
- ⚠️ New message notifications partially implemented
- ❌ Message read status not synced
- ❌ Conversation threads not consolidated
- ❌ Search within messages not available

**Fix Steps**:
1. Consolidate onto `conversation` + `message` models
2. Create migration script to port chatMaster and adminMessage data
3. Add `readAt` timestamp for read receipts
4. Add `unreadCount` fields on conversation
5. Create `GET /client/chats/:conversationId/messages` with pagination
6. Create `POST /client/chats/:conversationId/mark-read`
7. Implement notification on new message for both parties
8. Add search via `GET /client/chats/search?q=text`
9. Add soft-archive via conversation status
10. Test multi-user messaging (ensure only participants can view)

**Files to Create/Modify**:
- `pgfinder-backend/controllers/clientController.js` - add new messaging endpoints
- `pgfinder-backend/scripts/migrateMessages.js` - new migration script
- `pgfinder-frontend/src/pages/dashboard/MessagesPage.jsx` - redesign UI

**Timeline**: Medium complexity, affects 2 major user flows

---

### 6. Visit Request System Status

**Current State**: Visit model and endpoints exist; flow incomplete

**Issues**:
- ⚠️ Inquiry and Visit are separate (unclear which to use)
- ⚠️ Visit date/time stored as strings (not proper Date)
- ❌ Owner confirmation flow unclear (no confirmedAt timestamp)
- ❌ No visit reminder/notification before scheduled time
- ❌ No cancellation reasons or feedback
- ❌ Visit duration not tracked
- ⚠️ Status transitions not enforced (e.g., can't go completed → scheduled)

**Incomplete Flow**:
1. User requests visit → inquiry created
2. Owner confirms → updates visit status (unclear to what)
3. Visit scheduled → no pre-visit reminder
4. Visit date arrives → owner marks completed? (API unclear)
5. No feedback on visit quality

**Fix Steps**:
1. Define visit status enum: scheduled → confirmed → completed → cancelled
2. Convert visitDate/visitTime to proper Date field (timestamp)
3. Add `confirmedAt`, `completedAt` timestamps
4. Add cancellationReason and cancelledBy fields
5. Create status state machine (only allow valid transitions)
6. Add CRON job to send visit reminders 1 day before
7. Owner confirms via `PUT /client/visits/:id/confirm`
8. After visit, user + owner can rate/review
9. Add visit history to user and owner dashboards
10. Test full lifecycle: request → confirm → remind → complete → feedback

**Files to Update**:
- `pgfinder-backend/models/visitDetails.js` - add fields, status enum
- `pgfinder-backend/controllers/clientController.js` - refactor visit endpoints
- `pgfinder-backend/scripts/visitReminder.js` - new CRON job
- `pgfinder-frontend/src/pages/PropertyDetailPage.jsx` - visit booking form

**Timeline**: Medium complexity

---

### 7. Owner Dashboard Status

**Current State**: `VendorDashboard.jsx` exists but feature-incomplete

**Issues**:
- ⚠️ Property count widget OK, but no quick-add button
- ❌ Lead pipeline not visualized (bar chart by status)
- ⚠️ Recent inquiries shown but no filtering/sorting
- ❌ Wallet/earnings not visible
- ⚠️ Messages thread limited (admin-owner only)
- ❌ Performance metrics (views, click-through, conversion rate) missing
- ❌ Bulk property actions (pause, activate, edit multiple) missing

**Incomplete Features**:
- Revenue dashboard (inquiry → visit → conversion value)
- Lead scoring / hot leads
- Property performance (views per day, CTR)
- Photo approval status
- Messaging integrated into leads flow

**Fix Steps**:
1. Add property performance metrics (views, wishlist saves, inquiries)
2. Implement lead pipeline visualization (funnel: inquiry → visit → moved-in)
3. Add wallet balance + recent transactions
4. Integrate user-owner chat into lead detail view
5. Add quick property edit (modal form, not full page redirect)
6. Add bulk actions (pause, activate, archive, edit prices)
7. Add monthly stats comparison (chart for trend)
8. Add property verification checklist if any photos incomplete
9. Create drag-drop lead status board (visual pipeline)
10. Add export leads/properties as CSV

**Files to Update**:
- `pgfinder-frontend/src/pages/dashboard/vendor/VendorDashboard.jsx` - add widgets/charts
- `pgfinder-frontend/src/pages/dashboard/vendor/VendorLeadsPage.jsx` - add kanban/pipeline view
- `pgfinder-frontend/src/api/dashboardApi.js` - add analytics endpoints
- `pgfinder-backend/controllers/clientController.js` - add performance metric endpoints

**Timeline**: Medium to high complexity

---

### 8. Admin Dashboard Status

**Current State**: `AdminDashboard.jsx` exists; feature-incomplete

**Issues**:
- ✅ Stats cards (properties, users, inquiries, revenue) present
- ✅ Recent activity shown
- ⚠️ Moderation queue visible but limited controls
- ❌ No dashboard for property verification (photos, details, pricing)
- ❌ No bulk property approval workflow
- ❌ No user abuse/compliance reports
- ❌ No property listing timeline (pending, approved, rejected)
- ❌ No owner performance/quality metrics
- ❌ Payment reconciliation missing
- ⚠️ Audit trail visible but no search/filter

**Incomplete Features**:
- Property approval batch processing
- User KYC/compliance status tracking
- Revenue & payout reconciliation
- Report generation (properties, users, inquiries, revenue)
- Alert dashboard (abuse, downtime, data quality)
- Owner tier/rating system
- Property quality score computation

**Fix Steps**:
1. Add property verification queue with batch approve/reject
2. Add user compliance dashboard (verified, pending, flagged)
3. Add payment reconciliation view (invoices, payouts, disputes)
4. Create alert dashboard for unusual activity (spam inquiries, price anomalies)
5. Add reporting suite (export properties, users, leads, revenue by date range)
6. Add owner tier management (bronze/silver/gold based on metrics)
7. Add mass email to owners (broadcast notifications)
8. Add manual lead creation (for offline inquiries)
9. Add dispute resolution (refund, lead ownership conflicts)
10. Add data quality checks (missing photos, incomplete amenities)

**Files to Update**:
- `pgfinder-frontend/src/pages/dashboard/admin/AdminDashboard.jsx` - add widgets/sections
- `pgfinder-frontend/src/pages/dashboard/admin/AdminPropertyDetailPage.jsx` - add verification workflow
- `pgfinder-frontend/src/api/adminApi.js` - add new admin endpoints
- `pgfinder-backend/controllers/clientController.js` - add admin analytics/operations endpoints

**Timeline**: High complexity

---

## 8. Missing Implementation Summary

### Major Features Not Yet Built

| Feature | Scope | Backend | Frontend | Priority |
|---------|-------|---------|----------|----------|
| **Unified Messaging** | Messages consolidated, read receipts, search | ❌ Partial | ❌ Partial | High |
| **Visit Reminders** | CRON job, email/SMS notifications | ❌ None | ❌ N/A | High |
| **Property Verification** | Photo checklist, admin batch approval, owner response | ⚠️ Partial | ⚠️ Partial | High |
| **Analytics Dashboard** | Property views, click-through, conversion rate | ❌ None | ❌ None | High |
| **Payment & Wallet** | Payout reconciliation, commission calculation | ⚠️ Schema only | ❌ None | High |
| **Owner Performance** | Tier system, ratings, KPIs | ❌ None | ❌ None | Medium |
| **Lead Scoring** | Hot leads, conversion probability | ❌ None | ❌ None | Medium |
| **User Abuse Reports** | Report/block system, admin review | ⚠️ Partial models | ❌ None | Medium |
| **Fullscreen Image Gallery** | Swipe, pinch, zoom, thumbnails | ⚠️ Component exists | ⚠️ Incomplete | Medium |
| **Email Notifications** | Transactional emails (inquiry, visit, message) | ❌ None | N/A | Medium |
| **SMS Integration** | Two-factor auth, OTP, visit reminders | ❌ None | N/A | Medium |
| **Admin Bulk Actions** | Approve/reject/edit properties in batch | ❌ None | ❌ None | Low |
| **Blog/CMS** | Content management, editing | ❌ None | ⚠️ Display only | Low |
| **Recommendation Engine** | Curated PG lists, personalized suggestions | ❌ None | ⚠️ Display only | Low |
| **Map-Based Search** | Interactive map with property pins, filter on map | ⚠️ Component exists | ⚠️ Limited | Low |

### Schema/Data Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **Rent as string** | Can't range query | Add rentNumeric field, migrate data |
| **Visit date as string** | Can't sort/compare | Add Date type visitDate, migrate |
| **Amenities as JSON** | Can't array query | Parse as array on save, index |
| **No createdAt on most models** | Audit trail incomplete | Add timestamps to all models |
| **Duplicate ID fields** (userIDFK + userId) | Schema confusion | Migrate to one pattern, update all queries |
| **No soft-delete consistent pattern** | Data recovery unclear | Add `deletedAt` timestamp, consistent flag |

### API Design Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **No API versioning** | Breaking changes hard to manage | Add `/api/v1/` prefix, maintain v0 → v1 migration layer |
| **No consistent error format** | Client error handling complex | Define error response schema, global handler middleware |
| **No request/response logging** | Debugging difficult | Add structured logging middleware, log all requests |
| **No rate limiting per user** | Abuse possible | Implement rate limit by user ID, not global |
| **Mixed auth methods** (JWT + session + body IDs) | Security gaps | Move all to JWT + role-based access |

### Frontend Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| **No error boundaries** | Page crashes not caught | Add React error boundary wrapper |
| **No loading states** | UX unclear during API calls | Add global loading spinner, per-component states |
| **No offline mode** | Broken on poor connection | Add service worker, cache GET requests |
| **No deeplinks for searches** | Can't share filtered results | Store filter state in URL params |
| **Multi-city in code but hidden** | Confusion about scope | Remove multi-city code paths, simplify |

---

## 9. Architecture Recommendations

### Short-Term Fixes (1-2 weeks)

1. **Fix search normalization** - ensure all APIs use regex + canonical names
2. **Fix visit date fields** - convert string to Date type
3. **Fix rent filtering** - add numeric rent field or range query support
4. **Add error middleware** - catch all async errors and return JSON
5. **Fix admin controller** - wrap async routes with error handler
6. **Add file validation** - check req.file exists before dereferencing

### Medium-Term Improvements (2-4 weeks)

1. **Consolidate messaging** - use conversation + message models, migrate data
2. **Add property verification workflow** - admin approval UI and batch processing
3. **Implement visit reminders** - CRON job + email/SMS integration
4. **Complete image gallery** - fullscreen modal with swipe/zoom
5. **Add analytics endpoints** - property views, CTR, conversion rate
6. **Role simplification** - remove super_admin from production UI

### Long-Term Architecture (1-2 months)

1. **API versioning** - `/api/v1/` with v0 compatibility layer
2. **Global search** - Elasticsearch or MongoDB text index instead of regex
3. **Notifications system** - email/SMS service integration (SendGrid, Twilio)
4. **Payment integration** - Razorpay or Stripe for commissions
5. **Admin dashboard overhaul** - React dashboard library (Chart.js, D3.js)
6. **Mobile app** - React Native sharing codebase components
7. **Performance** - Redis caching for properties, user sessions, search results

---

## Summary Table

| Category | Status | Key Gaps |
|----------|--------|----------|
| **Backend API** | ✅ 70% | Error handling, file validation, unified messaging |
| **Database Models** | ⚠️ 60% | Missing fields (verified, honestScore), unused models (conversation, message) |
| **Authentication** | ⚠️ 50% | No JWT expiry, mixed auth methods, unprotected endpoints |
| **Search** | ⚠️ 55% | No full-text, regex-based, legacy APIs broken, amenities not queryable |
| **Frontend Pages** | ✅ 85% | Most pages exist, dashboard features incomplete |
| **Frontend Components** | ⚠️ 65% | Gallery incomplete, no error boundaries, image optimization missing |
| **Dashboards** | ⚠️ 50% | Stats present, analytics/bulk actions missing |
| **Messaging** | ❌ 30% | Two implementations, no read receipts, no unread count |
| **Notifications** | ❌ 20% | Model exists, no transactional email/SMS, limited triggers |
| **Admin Workflows** | ⚠️ 40% | Property approval partial, no bulk actions, no reporting |

---

## Project Files Reference

**Backend**:
- Controllers: `pgfinder-backend/controllers/clientController.js` (4548 lines), `adminController.js` (1150 lines)
- Models: `pgfinder-backend/models/*.js` (24 files)
- App: `pgfinder-backend/app.js` (280+ lines)
- Middleware: `pgfinder-backend/middleware/resilience.js`
- Security: `pgfinder-backend/utils/security.js`

**Frontend**:
- Pages: `pgfinder-frontend/src/pages/` (16 files)
- Components: `pgfinder-frontend/src/components/` (20+ files)
- API: `pgfinder-frontend/src/api/` (5 files)
- Routes: `pgfinder-frontend/src/routes/AppRoutes.jsx`

**Documentation**:
- Architecture: `ARCHITECTURE.md`
- Search: `SEARCH_AUDIT.md`
- Messaging: `MESSAGING_AUDIT.md`
- RBAC: `RBAC_AUDIT.md`
- Dashboard Flow: `DASHBOARD_FLOW.md`
- Error Handling: `ERROR_HANDLING.md`
- Project Map: `PROJECT_MAP.md`

---

**End of Audit** | Generated June 11, 2026
