# StayJi — Comprehensive Production Architecture

**Last Updated:** June 2026  
**Status:** Production-Ready for Bangalore Launch  
**Scope:** Bangalore-only PG discovery platform with User, Owner, and Admin roles

## Table of Contents

1. [System Overview](#system-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [Database Architecture](#database-architecture)
5. [API Architecture](#api-architecture)
6. [Frontend Architecture](#frontend-architecture)
7. [Authentication & Authorization](#authentication--authorization)
8. [Search System](#search-system)
9. [Key Features](#key-features)
10. [Deployment](#deployment)

---

## System Overview

StayJi is a **Bangalore-only** PG discovery platform connecting users with property owners. The platform enables:

- **Users**: Discover PGs, search by location/budget/amenities, message owners, request visits, save favorites
- **Owners**: List properties, upload photos/videos, manage inquiries, handle visit requests
- **Admins**: Moderate listings, verify properties, manage users/owners, view analytics

### Key Principles

- **Bangalore-only**: All data, APIs, and UI are constrained to Bangalore/Bengaluru
- **Production-ready**: Stable, tested, monitored, with proper error handling
- **Mobile-first**: Responsive design for phones, tablets, desktops
- **Performance**: Optimized queries, lazy-loading, image compression
- **Security**: JWT authentication, input validation, role-based access control

---

## Project Structure

```
PG-Finder/
├── pgfinder-backend/              # Node.js/Express REST API
│   ├── app.js                     # Express app setup
│   ├── server.js                  # Server entry point
│   ├── package.json              # Dependencies
│   ├── config/                   # Configuration (env, constants)
│   ├── connection/
│   │   └── dbconnect.js          # MongoDB connection
│   ├── models/                   # Mongoose schemas
│   │   ├── userMaster.js         # User schema
│   │   ├── propertyMaster.js     # Property listing
│   │   ├── conversation.js       # Private messaging
│   │   ├── visitDetails.js       # Visit requests
│   │   ├── inquiryMaster.js      # Property inquiries
│   │   ├── areaMaster.js         # Bangalore areas
│   │   ├── propertyImage.js      # Property photos/videos
│   │   ├── shortlistMaster.js    # User favorites
│   │   ├── notification.js       # User notifications
│   │   ├── auditLog.js           # Admin audit trail
│   │   └── [19 other models]     # Various features
│   ├── controllers/
│   │   ├── clientController.js   # User & owner endpoints
│   │   └── adminController.js    # Admin endpoints
│   ├── middleware/
│   │   └── resilience.js         # Auth, error handling, validation
│   ├── routes/                   # [EMPTY - routes in controllers]
│   ├── services/                 # [EMPTY - business logic in controllers]
│   ├── utils/
│   │   ├── security.js           # Encryption, JWT helpers
│   │   └── [validation helpers]
│   ├── uploads/                  # Uploaded files (temporary)
│   └── scripts/
│       └── seedData.js           # Test data seeding
│
├── pgfinder-frontend/             # React + Vite frontend
│   ├── index.html                # Entry HTML
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   ├── package.json              # Dependencies
│   ├── public/                   # Static assets
│   │   ├── robots.txt
│   │   └── sitemap.xml
│   └── src/
│       ├── main.jsx              # React entry point
│       ├── App.jsx               # Root component
│       ├── api/                  # API client
│       │   └── [API service files]
│       ├── components/           # Reusable components
│       │   ├── common/           # Header, footer, etc.
│       │   ├── gallery/          # Image gallery components
│       │   ├── property/         # Property display
│       │   ├── admin/            # Admin dashboard UI
│       │   ├── layout/           # Layouts
│       │   ├── map/              # Map components
│       │   ├── forms/            # Form components
│       │   └── notifications/    # Notifications UI
│       ├── pages/                # Page components
│       │   ├── HomePage.jsx      # Landing page
│       │   ├── PropertiesPage.jsx    # Search results
│       │   ├── PropertyDetailPage.jsx # Property details
│       │   ├── LocalityPage.jsx  # Area-specific page
│       │   ├── auth/             # Auth pages
│       │   ├── dashboard/        # User/owner/admin dashboards
│       │   └── [other pages]
│       ├── routes/               # Route configuration
│       ├── context/              # React context (state)
│       ├── hooks/                # Custom React hooks
│       ├── utils/                # Utility functions
│       ├── config/               # App configuration
│       └── styles/               # CSS files
│
├── docs/                         # Documentation
│   ├── ADMIN_MANUAL.md
│   ├── OWNER_MANUAL.md
│   ├── USER_MANUAL.md
│   ├── SECURITY_AND_PASSWORDS.md
│   └── [audit reports]
│
└── [Root documentation]
    ├── ARCHITECTURE.md           # (this file)
    ├── DEVELOPER_GUIDE.md        # Developer onboarding
    ├── TESTING.md                # Testing strategy
    ├── DEPLOYMENT.md             # Deployment guide
    ├── CHANGELOG.md              # Version history
    └── README.md                 # Quick start
```

---

## Technology Stack

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18+ | JavaScript runtime |
| Framework | Express.js | 4.18+ | Web framework |
| Database | MongoDB | 4.10+ | NoSQL database |
| ODM | Mongoose | 6.6+ | MongoDB schema/validation |
| Authentication | JWT (jsonwebtoken) | 9.0+ | Stateless auth tokens |
| Passwords | bcryptjs | 3.0+ | Password hashing |
| Validation | express-validator | 6.14+ | Input validation |
| CORS | cors | 2.8+ | Cross-origin requests |
| Security | helmet | 8.1+ | Security headers |
| Rate Limiting | express-rate-limit | 8.5+ | API rate limiting |
| File Upload | multer | 1.4+ | File uploads |
| Email | nodemailer | 6.8+ | Email sending |
| Utilities | moment.js | 2.29+ | Date/time handling |

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| UI Library | React | 19.2+ | Component framework |
| Build Tool | Vite | 5.4+ | Fast bundler |
| Router | react-router-dom | 6.16+ | Client-side routing |
| HTTP Client | axios | 1.16+ | HTTP requests |
| State Query | @tanstack/react-query | 5.100+ | Data fetching/caching |
| Maps | Leaflet | 1.9+ | Interactive maps |
| Charts | recharts | 3.8+ | Data visualization |
| Animations | framer-motion | 12.5+ | Smooth animations |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first CSS |
| Icons | react-icons | 4.11+ | Icon library |

---

## Database Architecture

### Core Models

#### `userMaster` — User Accounts

**Purpose**: Stores user registration, profile, preferences

**Fields**:
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  password: String (hashed),
  role: "user" | "owner" | "admin", // Roles
  gender: "male" | "female" | "other",
  profilePicture: String, // URL to image
  bio: String,
  isEmailVerified: Boolean,
  isPhoneVerified: Boolean,
  isActive: Boolean (default: true),
  preferences: {
    budgetMin: Number,
    budgetMax: Number,
    occupancy: String,
    genderPreference: String,
    amenities: [String]
  },
  addresses: [{
    type: String, // "current" | "permanent"
    street: String,
    area: String,
    city: String, // Always "Bangalore"
    pincode: String
  }],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: email (unique), phone, role, isActive, createdAt

**Relationships**: 
- Many conversations (as participant)
- Many properties (as owner)
- Many visit requests (as requester)
- Many shortlists (favorites)

---

#### `propertyMaster` — PG Listings

**Purpose**: Main property listing document

**Fields**:
```javascript
{
  _id: ObjectId,
  ownerId: ObjectId (ref: userMaster),
  name: String, // PG name
  description: String,
  category: "pg" | "hostel" | "coliving",
  
  // Location
  cityName: String, // Always "Bangalore" (canonical)
  locality: String, // Area name (Koramangala, Whitefield, etc.)
  area: String, // Sub-area
  address: String, // Full address
  googleMapsUrl: String,
  coordinates: {
    latitude: Number,
    longitude: Number,
    type: "Point"
  },
  
  // Pricing
  rentPerMonth: Number,
  depositAmount: Number,
  maintenanceFee: Number,
  
  // Occupancy
  occupancy: "single" | "double" | "triple" | "shared",
  capacity: Number, // Total rooms/beds
  availableCount: Number, // Currently available
  
  // Property Details
  furnished: "unfurnished" | "semi-furnished" | "fully-furnished",
  floorsAvailable: [Number], // [1, 2, 3]
  totalFloors: Number,
  ageOfProperty: Number, // Years
  
  // Amenities
  amenities: [String], // ["wifi", "parking", "gym", ...]
  
  // Food
  foodIncluded: Boolean,
  foodType: "veg" | "non-veg" | "both",
  cookingAllowed: Boolean,
  
  // Gender Policy
  genderRestriction: "male" | "female" | "all",
  
  // Verification Status (CRITICAL FOR PRODUCTION)
  verified: Boolean (default: false),
  verifiedAt: Date,
  verifiedBy: ObjectId (ref: userMaster), // Admin who verified
  verificationNotes: String,
  
  // Photo/Video Requirements
  photos: [String], // URLs to uploaded images
  photoCount: Number,
  photoTypes: {
    room: Number, // Count of room photos
    washroom: Number,
    common: Number,
    kitchen: Number
  },
  videoTours: [String], // URLs to video tours
  
  // Quality Scoring
  honestScore: {
    cleanliness: Number (1-5),
    food: Number (1-5),
    internet: Number (1-5),
    safety: Number (1-5),
    computed: Number (1-5, average)
  },
  
  // Nearby Essentials (Pre-computed)
  nearby: {
    metro: {
      name: String,
      distance: Number (meters),
      lineColor: String
    },
    busStop: {
      name: String,
      distance: Number
    },
    hospital: {
      name: String,
      distance: Number
    },
    grocery: {
      name: String,
      distance: Number
    }
  },
  
  // Engagement Metrics
  viewCount: Number (default: 0),
  likeCount: Number (default: 0),
  messageCount: Number (default: 0),
  
  // Status & Moderation
  status: "active" | "inactive" | "pending_approval" | "rejected",
  rejectionReason: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**: ownerId, cityName, locality, coordinates (2dsphere), verified, status, createdAt

**Search Strategy**: 
- Full-text index on (name, locality, area)
- Geospatial index on coordinates for nearby search
- Compound index on (cityName, verified, status) for filtering

---

#### `propertyImage` — Photo/Video References

**Purpose**: Manage image/video uploads with metadata

**Fields**:
```javascript
{
  _id: ObjectId,
  propertyId: ObjectId (ref: propertyMaster),
  uploadedBy: ObjectId (ref: userMaster),
  
  // File Info
  filename: String,
  fileUrl: String, // S3 or local URL
  fileSize: Number (bytes),
  mimeType: String, // "image/jpeg", "video/mp4"
  
  // Image Metadata
  imageType: "room" | "washroom" | "common" | "kitchen" | "entrance",
  caption: String,
  order: Number, // Display order in gallery
  
  // Processing
  isProcessed: Boolean,
  thumbnailUrl: String,
  width: Number (px),
  height: Number (px),
  
  // Moderation
  isApproved: Boolean (default: true for owner uploads, false for admin approval)
  reportCount: Number (default: 0),
  
  // Timestamps
  uploadedAt: Date
}
```

---

#### `conversation` — Private Messaging

**Purpose**: Thread-based private messaging between users and owners

**Fields**:
```javascript
{
  _id: ObjectId,
  
  // Participants
  participants: [ObjectId], // [userId, ownerId]
  initiatedBy: ObjectId, // Who started conversation
  
  propertyId: ObjectId, // Related property (optional)
  
  // Message Data
  lastMessage: {
    text: String,
    sentBy: ObjectId,
    timestamp: Date,
    isRead: Boolean
  },
  
  // Unread Counts
  unreadCounts: {
    [userId]: Number, // Unread messages for this user
    [ownerId]: Number  // Unread messages for owner
  },
  
  // Status
  status: "active" | "archived" | "blocked",
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Design Note**: Individual messages are stored in `message` collection with `conversationId` reference

---

#### `message` — Individual Messages

**Purpose**: Store individual messages within conversations

**Fields**:
```javascript
{
  _id: ObjectId,
  conversationId: ObjectId (ref: conversation),
  
  sender: {
    userId: ObjectId (ref: userMaster),
    name: String,
    profilePic: String
  },
  
  content: {
    text: String,
    attachments: [{
      type: "image" | "document",
      url: String,
      filename: String
    }]
  },
  
  // Status
  status: "sent" | "delivered" | "read",
  readAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

**Index**: conversationId, createdAt

---

#### `visitDetails` — Visit Requests

**Purpose**: Track visit requests from users to properties

**Fields**:
```javascript
{
  _id: ObjectId,
  propertyId: ObjectId (ref: propertyMaster),
  userId: ObjectId (ref: userMaster),
  ownerId: ObjectId (ref: userMaster),
  
  // Visit Details
  preferredDate: Date,
  preferredTime: String, // "10:00-11:00"
  notes: String, // User's additional notes
  
  // Status Workflow
  status: "requested" | "confirmed" | "rejected" | "cancelled" | "completed",
  rejectionReason: String,
  
  // Timestamps
  requestedAt: Date,
  confirmedAt: Date,
  visitDate: Date,
  completedAt: Date
}
```

---

#### `shortlistMaster` — User Favorites

**Purpose**: Track user's saved/favorited properties

**Fields**:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: userMaster),
  propertyId: ObjectId (ref: propertyMaster),
  
  // Metadata
  savedAt: Date,
  notes: String, // User's personal notes
  reminderSet: Boolean,
  reminderDate: Date
}
```

**Index**: userId, propertyId (compound unique)

---

#### `areaMaster` — Bangalore Localities

**Purpose**: Define searchable areas and locality pages

**Fields**:
```javascript
{
  _id: ObjectId,
  name: String, // "Koramangala", "Whitefield", etc.
  slug: String, // URL-friendly: "koramangala"
  description: String,
  
  // Location
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  bounds: {
    north: Number,
    south: Number,
    east: Number,
    west: Number
  },
  
  // SEO & Content
  metaTitle: String,
  metaDescription: String,
  content: String, // Locality description for page
  
  // Stats
  propertyCount: Number,
  popularityScore: Number,
  
  // Featured
  isFeatured: Boolean
}
```

---

#### `notification` — User Notifications

**Purpose**: Track and deliver notifications to users

**Fields**:
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: userMaster),
  
  // Notification Content
  type: "visit_request" | "message" | "property_approved" | "listing_updated",
  title: String,
  message: String,
  
  // Related Data
  relatedId: ObjectId, // Property/Message/Visit ID
  relatedType: String,
  
  // Status
  isRead: Boolean (default: false),
  readAt: Date,
  
  // Timestamp
  createdAt: Date
}
```

---

#### `inquiryMaster` — Owner Inquiries

**Purpose**: Track inquiry submissions about properties

**Fields**:
```javascript
{
  _id: ObjectId,
  propertyId: ObjectId (ref: propertyMaster),
  userId: ObjectId (ref: userMaster),
  ownerId: ObjectId (ref: userMaster),
  
  // Inquiry Details
  inquiryType: "price_negotiation" | "availability" | "customization",
  message: String,
  
  // Response
  response: String,
  respondedAt: Date,
  
  // Status
  status: "open" | "responded" | "closed",
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

---

#### `auditLog` — Admin Audit Trail

**Purpose**: Track all admin actions for compliance

**Fields**:
```javascript
{
  _id: ObjectId,
  adminId: ObjectId (ref: userMaster),
  
  // Action Details
  action: "verified_property" | "rejected_property" | "warned_user" | "deleted_listing",
  targetType: "property" | "user" | "message",
  targetId: ObjectId,
  
  // Change Details
  changes: Object, // Before/after values
  reason: String,
  
  // Timestamp
  timestamp: Date
}
```

---

### Database Statistics

```
Total Collections: 24
Production Collections: 9 (listed above)
Legacy Collections: 5 (payment, wallet, admin message, etc. - to be archived)
Unused Collections: 10 (move-in confirmation, lead events, etc.)

Total Documents (estimated for launch):
- users: 1,000
- properties: 2,000 (verified)
- messages: 50,000
- visit requests: 10,000
- shortlists: 5,000
```

---

## API Architecture

### Authentication

All API endpoints (except login/signup) require JWT token in Authorization header:

```
Authorization: Bearer <JWT_TOKEN>
```

**JWT Payload**:
```javascript
{
  userId: ObjectId,
  email: String,
  role: "user" | "owner" | "admin",
  iat: Number, // Issued at
  exp: Number  // Expiration (24 hours)
}
```

**Implementation**: `middleware/resilience.js` exports `authenticateToken` middleware

---

### Base Response Format

All API responses follow consistent structure:

**Success (2xx)**:
```javascript
{
  success: true,
  data: { /* response data */ },
  message: "Optional success message"
}
```

**Error (4xx, 5xx)**:
```javascript
{
  success: false,
  error: {
    code: "VALIDATION_ERROR", // Error code
    message: "Human readable message",
    details: { /* field-level errors */ }
  },
  statusCode: 400
}
```

---

### Client Endpoints (from `clientController.js`)

#### Authentication

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/auth/register` | User registration | None |
| POST | `/api/auth/login` | User login | None |
| POST | `/api/auth/logout` | Logout (invalidate token) | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |
| POST | `/api/auth/verify-email` | Verify email with OTP | Yes |
| POST | `/api/auth/verify-phone` | Verify phone with OTP | Yes |

#### User Profile

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/user/profile` | Get current user profile | Yes |
| PUT | `/api/user/profile` | Update profile | Yes |
| DELETE | `/api/user/account` | Delete user account | Yes |

#### Property Search

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/properties/search` | Search properties (main endpoint) | No |
| GET | `/api/properties/:id` | Get property details | No |
| GET | `/api/properties/nearby` | Find nearby properties (geospatial) | No |
| GET | `/api/areas` | List all Bangalore areas | No |
| GET | `/api/areas/:slug` | Get area details & properties | No |
| GET | `/api/properties/trending` | Trending properties | No |

**Query Parameters for Search**:
- `city`: "bangalore" (default, normalized)
- `locality`: Area name
- `area`: Sub-area
- `rentMin`, `rentMax`: Budget range
- `occupancy`: "single" | "double" | "shared"
- `gender`: "male" | "female" | "all"
- `amenities`: Comma-separated list
- `hasFood`: true | false
- `furnished`: "unfurnished" | "semi" | "fully"
- `search`: Text search on property name
- `page`: Pagination (default: 1)
- `limit`: Per-page limit (default: 20)
- `sortBy`: "rent" | "newest" | "popular"

---

#### Owner Management

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/properties/create` | Create new property listing | Yes (Owner) |
| PUT | `/api/properties/:id/edit` | Update property | Yes (Owner) |
| DELETE | `/api/properties/:id` | Delete property | Yes (Owner) |
| GET | `/api/owner/properties` | List owner's properties | Yes (Owner) |
| GET | `/api/owner/analytics` | Owner dashboard analytics | Yes (Owner) |
| POST | `/api/properties/:id/upload-image` | Upload property image | Yes (Owner) |
| DELETE | `/api/properties/:id/image/:imageId` | Delete image | Yes (Owner) |

---

#### Messaging

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/messages/conversations` | List user's conversations | Yes |
| POST | `/api/messages/conversation/:conversationId` | Send message | Yes |
| GET | `/api/messages/conversation/:conversationId` | Get conversation messages | Yes |
| POST | `/api/messages/mark-read/:conversationId` | Mark messages as read | Yes |
| GET | `/api/messages/unread-count` | Get total unread count | Yes |

---

#### Visit Requests

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/visits/request` | Request a visit | Yes (User) |
| GET | `/api/visits/my-requests` | List user's visit requests | Yes (User) |
| GET | `/api/owner/visits` | List visits for owner's properties | Yes (Owner) |
| PUT | `/api/visits/:id/confirm` | Confirm visit request | Yes (Owner) |
| PUT | `/api/visits/:id/reject` | Reject visit request | Yes (Owner) |
| PUT | `/api/visits/:id/cancel` | Cancel visit request | Yes (User) |

---

#### Favorites/Shortlist

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/api/shortlist/add` | Add to favorites | Yes |
| DELETE | `/api/shortlist/remove/:propertyId` | Remove from favorites | Yes |
| GET | `/api/shortlist` | List user's favorites | Yes |
| POST | `/api/shortlist/:id/set-reminder` | Set visit reminder | Yes |

---

### Admin Endpoints (from `adminController.js`)

#### Property Moderation

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/properties/pending` | List pending properties | Yes (Admin) |
| PUT | `/api/admin/properties/:id/verify` | Approve property | Yes (Admin) |
| PUT | `/api/admin/properties/:id/reject` | Reject property | Yes (Admin) |
| PUT | `/api/admin/properties/:id/edit` | Force-edit property | Yes (Admin) |
| DELETE | `/api/admin/properties/:id` | Delete property | Yes (Admin) |

#### User Management

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/users` | List all users | Yes (Admin) |
| PUT | `/api/admin/users/:id/warn` | Warn user | Yes (Admin) |
| PUT | `/api/admin/users/:id/suspend` | Suspend user account | Yes (Admin) |
| PUT | `/api/admin/users/:id/unsuspend` | Unsuspend user | Yes (Admin) |

#### Owner Management

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/owners` | List all owners | Yes (Admin) |
| PUT | `/api/admin/owners/:id/verify` | Verify owner | Yes (Admin) |
| PUT | `/api/admin/owners/:id/suspend` | Suspend owner | Yes (Admin) |

#### Analytics & Reporting

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/admin/dashboard` | Admin dashboard stats | Yes (Admin) |
| GET | `/api/admin/analytics/properties` | Property metrics | Yes (Admin) |
| GET | `/api/admin/analytics/users` | User metrics | Yes (Admin) |
| GET | `/api/admin/audit-log` | Audit trail | Yes (Admin) |

---

## Frontend Architecture

### Page Structure

#### Public Pages

1. **HomePage** (`/`)
   - Hero banner with search
   - Featured areas
   - Featured properties
   - Call-to-action for owners

2. **PropertiesPage** (`/search` | `/bangalore`)
   - Search filters sidebar
   - Property list with cards
   - Map view toggle
   - Pagination

3. **PropertyDetailPage** (`/property/:id`)
   - Image gallery (fullscreen capable)
   - Property details
   - Amenities & pricing
   - Owner card
   - Message owner button
   - Request visit button
   - Reviews section

4. **LocalityPage** (`/areas/:slug`)
   - Area overview
   - Area properties
   - Area statistics
   - Locality description

---

#### Authenticated Pages

5. **User Dashboard** (`/user/dashboard`)
   - Profile management
   - My visits (requests/confirmations)
   - Saved properties
   - Conversations/messages
   - Preferences

6. **Owner Dashboard** (`/owner/dashboard`)
   - Property management
   - Create/edit properties
   - Image uploads
   - Inquiries & visits
   - Analytics (view count, messages, etc.)
   - Payout management

7. **Admin Dashboard** (`/admin/dashboard`)
   - Pending approvals
   - User/owner management
   - Moderation queue
   - Analytics
   - Audit logs

---

### Component Architecture

#### Forms
- `LoginForm` — User login
- `SignupForm` — User registration
- `PropertyForm` — Create/edit property
- `SearchFilterForm` — Search filters
- `MessageForm` — Compose message

#### Cards & Display
- `PGCard` — Property listing card (search results)
- `PropertyDetailCard` — Full property details
- `OwnerCard` — Owner info display
- `VisitCard` — Visit request card

#### Gallery
- `ImageGallery` — Fullscreen photo gallery with swipe/zoom
- `ImageUpload` — Multi-file image upload

#### Maps
- `PropertyMap` — Show property on map
- `NearbyMap` — Show nearby essentials on map
- `AreaMap` — Area boundary map

#### Navigation
- `Header` — Top navigation
- `Footer` — Bottom footer
- `Sidebar` — Filters/navigation menu

#### Admin
- `PropertyModerationPanel` — Approve/reject listings
- `UserManagementTable` — User list & actions
- `AnalyticsDashboard` — Charts & statistics

---

### State Management

#### Context API Structure

```javascript
// contexts/AuthContext.jsx
- currentUser: { userId, role, email }
- token: JWT
- login(), logout(), register()

// contexts/SearchContext.jsx
- filters: { city, locality, rentMin, rentMax, amenities }
- results: [properties]
- pagination: { page, limit, total }
- updateFilters(), search()

// contexts/NotificationContext.jsx
- notifications: [notification]
- unreadCount: Number
- addNotification(), markAsRead()
```

#### Data Fetching with React Query

- Queries for properties, users, conversations
- Mutations for create/update/delete operations
- Automatic caching and background refetching

---

## Authentication & Authorization

### Registration Flow

1. User enters email, phone, password
2. System validates input
3. System hashes password with bcryptjs
4. User document created with `isEmailVerified: false`
5. OTP sent to email & phone
6. User verifies both
7. User can login

### Login Flow

1. User enters email + password
2. System retrieves user document
3. System verifies password hash
4. System generates JWT token (expiry: 24 hours)
5. Token sent to client
6. Client stores token in localStorage
7. Client includes token in all subsequent requests

### Role-Based Access Control (RBAC)

```javascript
const permissions = {
  user: {
    canSearch: true,
    canMessage: true,
    canRequestVisit: true,
    canCreateProperty: false,
    canModerate: false
  },
  owner: {
    canSearch: true,
    canMessage: true,
    canCreateProperty: true,
    canModerate: false,
    canViewAnalytics: true
  },
  admin: {
    canModerate: true,
    canVerifyProperties: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canViewAuditLogs: true
  }
};
```

**Enforcement**: Every protected endpoint checks `req.user.role` against required permissions

---

## Search System

### Search Endpoints

**Main Search**: `GET /api/properties/search`

```javascript
Query: {
  city: "bangalore", // Normalized to canonical form
  locality: "Koramangala",
  area: "Koramangala A Block",
  rentMin: 10000,
  rentMax: 30000,
  occupancy: "single",
  gender: "female",
  amenities: "wifi,parking",
  furnished: "semi-furnished",
  hasFood: true,
  search: "luxury pg", // Text search on name/description
  page: 1,
  limit: 20,
  sortBy: "rent" // or "newest" | "popular"
}

Response: {
  success: true,
  data: {
    properties: [{
      _id, name, locality, rent, occupancy, 
      photos, honestScore, verified, ...
    }],
    pagination: {
      page: 1,
      limit: 20,
      total: 150,
      pages: 8
    },
    filters: {
      availableLocalities: [...],
      priceRange: [min, max],
      amenities: [...]
    }
  }
}
```

**Nearby Search**: `GET /api/properties/nearby?lat=X&lon=Y&radius=2000`
- Uses geospatial index
- Returns properties within radius (meters)
- Sorted by distance

**Area Page**: `GET /api/areas/:slug`
- Returns all properties in specific area
- Pre-filtered and optimized

### Search Normalization

**City Normalization**:
```javascript
const cityMap = {
  'bangalore': 'Bangalore',
  'bengaluru': 'Bangalore',
  'BANGALORE': 'Bangalore',
  'bengaluru': 'Bangalore'
};
```

**Implementation**: Applied at API layer before database query

**Case-Insensitive Search**:
- MongoDB regex with `i` flag: `propertyName: { $regex: searchTerm, $options: 'i' }`

**Amenity Filtering**:
- Exact match on amenity array
- Example: `amenities: { $all: ["wifi", "parking"] }`

### Search Optimization

1. **Indexes**: 
   - Text index on (propertyName, area, locality, description)
   - Geospatial index on coordinates
   - Compound index on (cityName, verified, status)

2. **Pagination**: Always paginate to limit memory/CPU

3. **Caching**: Cache area-level results (areas don't change frequently)

4. **Lazy Loading**: Frontend loads images on scroll

---

## Key Features

### 1. Property Verification Workflow

**Process**:
1. Owner uploads property with photos
2. System requires minimum 3 photos (room, washroom, common)
3. Admin reviews and verifies (`verified: true`)
4. Verified badge appears on property
5. Unverified properties shown with warning label

**Implementation**:
- `propertyMaster.verified` Boolean field
- `propertyMaster.verifiedAt` timestamp
- `propertyMaster.verifiedBy` admin user ID
- Endpoint: `PUT /api/admin/properties/:id/verify`

---

### 2. Image Gallery

**Features**:
- Click to fullscreen
- Swipe left/right to navigate
- Pinch-to-zoom on mobile
- Thumbnail strip at bottom
- Photo type labels (Room, Washroom, etc.)

**Implementation**: Lightweight library (e.g., PhotoSwipe or custom with Framer Motion)

**Storage**: S3 (recommended) or local `uploads/` directory

---

### 3. Messaging System

**Conversation Flow**:
1. User clicks "Message Owner" button
2. System creates conversation if not exists
3. User types message
4. Message stored with `status: "sent"`
5. Owner receives notification
6. Owner replies
7. Messages marked as `read` when viewed

**Endpoints**:
- `GET /api/messages/conversations` — List all conversations
- `POST /api/messages/send` — Send message
- `GET /api/messages/:conversationId` — Get conversation
- `PUT /api/messages/:id/mark-read` — Mark as read

**Real-time** (Future): WebSocket via Socket.io

---

### 4. Visit Request System

**User Workflow**:
1. User views property
2. User clicks "Request Visit"
3. User selects preferred date/time
4. System sends notification to owner
5. Owner receives visit request
6. Owner confirms/rejects
7. System notifies user

**Endpoints**:
- `POST /api/visits/request` — Create request
- `PUT /api/visits/:id/confirm` — Owner confirms
- `PUT /api/visits/:id/reject` — Owner rejects

**Status**: `requested` → `confirmed` | `rejected` | `cancelled`

---

### 5. Owner Dashboard Analytics

**Metrics**:
- Total properties listed
- Total views (aggregated view counts)
- New inquiries (last 7 days)
- New messages (last 7 days)
- Pending visit requests
- Property-level stats (views, messages per property)

**Endpoint**: `GET /api/owner/analytics`

---

### 6. Admin Dashboard

**Capabilities**:
- Pending property approvals
- Recent user registrations
- Platform statistics (total properties, users, revenue)
- Moderation queue (reported listings)
- Audit logs of all admin actions

**Key Endpoint**: `GET /api/admin/dashboard`

---

## Deployment

### Environment Variables

**Backend** (`.env`):
```
# Server
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stayji

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRY=24h

# Uploads
UPLOAD_DIR=/usr/local/uploads
MAX_UPLOAD_SIZE=10485760 # 10MB

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@stayji.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGINS=https://stayji.com,https://www.stayji.com,http://localhost:5173

# File Storage (S3 recommended for production)
S3_BUCKET=stayji-uploads
S3_REGION=ap-south-1
S3_ACCESS_KEY=your-key
S3_SECRET_KEY=your-secret

# Admin
SUPER_ADMIN_EMAIL=admin@stayji.com
```

**Frontend** (`.env.local`):
```
VITE_API_BASE_URL=https://api.stayji.com
VITE_GOOGLE_MAPS_KEY=your-key-here
VITE_ANALYTICS_ID=your-analytics-id
```

### Production Checklist

- [ ] Database indexed and optimized
- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Helmet security headers set
- [ ] Error tracking (Sentry) configured
- [ ] Logging centralized (CloudWatch)
- [ ] Database backups scheduled
- [ ] Image compression on upload
- [ ] CDN configured for static assets
- [ ] Monitoring and alerting in place
- [ ] Load balancing for API servers
- [ ] Database connection pooling

---

## Summary

This architecture supports a stable, production-ready Bangalore-only PG discovery platform. The system is:

✅ **Scalable**: Indexed database, paginated results, cacheable endpoints  
✅ **Secure**: JWT auth, input validation, RBAC, audit logging  
✅ **Reliable**: Error handling middleware, transaction support, data validation  
✅ **User-Friendly**: Mobile-first design, smooth UX, responsive  
✅ **Bangalore-Focused**: City constraints at API layer, locality-specific pages

For detailed implementation steps, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).
