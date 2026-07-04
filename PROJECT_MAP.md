# Project Map

Generated from repository structure only. No application source files were modified.

## Top-Level Structure

- `pgfinder-frontend/` - React 19 + Vite frontend.
- `pgfinder-backend/` - Express + Mongoose backend.
- `docs/` - user/admin/security/QA documentation.
- `vercel.json` - root Vercel routing/deployment config.
- `README.md`, `DEPLOYMENT.md`, `TESTING_ARCHITECTURE.md` - project docs.

## Frontend Pages

Source directory: `pgfinder-frontend/src/pages`

### Public Pages

- `HomePage.jsx` - `/`
- `PropertiesPage.jsx` - `/properties`
- `PropertyDetailPage.jsx` - `/properties/:id`, `/property/:id`, dashboard owner property detail
- `ComparePage.jsx` - `/compare`
- `LocalityPage.jsx` - `/bangalore`, `/bangalore/:localitySlug`
- `FAQPage.jsx` - `/faq`, `/faq/:category`
- `FAQDetailPage.jsx` - `/faq/:category/:faqSlug`
- `BlogPage.jsx` - `/blog`, `/blog/:slug`, `/blogs`, `/blogs/:slug`
- `RecommendationPage.jsx` - `/recommendations`, `/recommendations/:slug`
- `LegalPage.jsx` - `/terms-and-conditions`, `/privacy-policy`, `/refund-policy`, `/vendor-policy`, `/community-guidelines`
- `NotFoundPage.jsx` - `*`

### Auth Pages

- `auth/LoginPage.jsx` - `/login`, `/admin-login`, `/super-admin-login`
- `auth/SignupPage.jsx` - `/signup`

### Dashboard Pages

- `dashboard/admin/AdminDashboard.jsx` - `/dashboard/admin`
- `dashboard/admin/SuperAdminDashboard.jsx` - `/dashboard/super-admin`
- `dashboard/admin/ManageUsersPage.jsx` - `/dashboard/admin/users`
- `dashboard/admin/AdminVendorDetailPage.jsx` - `/dashboard/admin/vendors/:vendorId`, `/dashboard/admin/owners/:ownerId`
- `dashboard/admin/AdminPropertyDetailPage.jsx` - `/dashboard/admin/properties/:propertyId`
- `dashboard/vendor/VendorDashboard.jsx` - `/dashboard/owner`
- `dashboard/vendor/AddPropertyPage.jsx` - `/dashboard/owner/add-property`, `/dashboard/owner/properties/:propertyId/edit`, `/dashboard/admin/properties/:propertyId/edit`
- `dashboard/vendor/ManagePropertiesPage.jsx` - `/dashboard/owner/properties`
- `dashboard/vendor/VendorLeadsPage.jsx` - `/dashboard/owner/leads`
- `dashboard/user/UserDashboard.jsx` - `/dashboard/user`
- `dashboard/user/UserProfilePage.jsx` - `/dashboard/profile`

## Frontend Components

Source directory: `pgfinder-frontend/src/components`

### Root Components

- `FilterPanel.jsx`
- `PGCard.jsx`
- `SEO.jsx`
- `SearchBar.jsx`

### Admin Components

- `admin/AdvancedDataTable.jsx`

### Common Components

- `common/Button.jsx`
- `common/Card.jsx`
- `common/Input.jsx`
- `common/Loader.jsx`
- `common/ProtectedRoute.jsx`
- `common/RoleProtectedRoute.jsx`
- `common/SectionHeading.jsx`

### Layout Components

- `layout/Navbar.jsx`
- `layout/Sidebar.jsx`
- `layout/Footer.jsx`

### Map Components

- `map/PropertyMap.jsx`

### Notification Components

- `notifications/NotificationBell.jsx`

### Property Components

- `property/PropertyCard.jsx`

### SEO Components

- `seo/SeoContentCard.jsx`

## Frontend Supporting Modules

### Routing And Layout

- `routes/AppRoutes.jsx` - central React Router route map.
- `layouts/PageLayout.jsx` - public layout, uses `Navbar` and `Footer`.
- `layouts/DashboardLayout.jsx` - dashboard layout, uses `Sidebar` and auth context.

### API Layer

- `api/axiosClient.js` - shared Axios client, base URL, auth header interceptor, error handling.
- `api/authApi.js` - auth endpoints.
- `api/propertyApi.js` - property, shortlist, visit, review, move-in, chat, occupancy endpoints.
- `api/dashboardApi.js` - dashboard overview, user/vendor/admin summary endpoints.
- `api/adminApi.js` - modern admin endpoints under `/api/admin`.
- `api/userApi.js` - user auth status and profile update endpoints.
- `api/notificationApi.js` - notification endpoints under `/api/notifications`.

### Service Layer

- `services/authService.js` -> `api/authApi.js`
- `services/propertyService.js` -> `api/propertyApi.js`
- `services/dashboardService.js` -> `api/dashboardApi.js`
- `services/userService.js` -> `api/userApi.js`

### Context, Hooks, Utils, Data

- `context/AuthContext.jsx`
- `hooks/useCurrentLocation.js`
- `hooks/useDebouncedValue.js`
- `hooks/useFetch.js`
- `hooks/useLocalStorage.js`
- `utils/distance.js`
- `utils/operationalStatus.jsx`
- `data/pgs.js`
- `data/seoContent.js`
- `animations/variants.js`

## Backend Routes

Backend entry: `pgfinder-backend/app.js`

### App-Level Routes And Mounts

- `GET /` - health text response.
- `USE /admin` - mounted to `controllers/adminController.js`.
- `USE /client` - mounted to `controllers/clientController.js`.
- `POST /api/auth/login` - alias to client `/loginByUser`.
- `POST /api/auth/signup` - alias to client `/addUser`.
- `GET /api/properties` - alias to client `/getPropertyList`.
- `POST /api/properties` - alias to client `/addProperty`.
- `GET /api/admin/stats` - alias to client `/getAdminStats`.
- `USE /api/auth` - mounted to `clientController`.
- `USE /api/properties` - mounted to `clientController`.
- `USE /api/vendors` - mounted to `clientController`.
- `USE /api/admin` - mounted to `clientController`.
- `USE /api/leads` - rewrites to client `/leads`.
- `USE /api/notifications` - rewrites to client `/notifications`.

### Static Routes

- `USE /upload` - serves `pgfinder-backend/public/upload`.
- `USE /upload` - serves `pgfinder-backend/upload`.
- `USE /public` - serves `pgfinder-backend/public`.

### Admin Controller Routes

Mounted under `/admin`.

- `GET /`
- `POST /loginEJS`
- `GET /logout`
- `GET /addArea`
- `POST /addAreaEJS`
- `GET /showArea`
- `GET /fetchArea/:id`
- `POST /updateAreaEJS`
- `POST /deleteArea`
- `GET /addPropertyType`
- `POST /addPropertyTypeEJS`
- `GET /showPropertyType`
- `GET /fetchPropertyType/:id`
- `POST /updatePropertyTypeEJS`
- `POST /deletePropertyType`
- `GET /addProperty`
- `POST /addPropertyEJS`
- `GET /showProperty`
- `GET /showInactiveProperty`
- `POST /reactivateProperty`
- `POST /updatePropertyStatus`
- `GET /fetchProperty/:id`
- `POST /updatePropertyEJS`
- `POST /deleteProperty`
- `GET /addAminityFeatures/:id`
- `POST /updateAminityFeature`
- `GET /addUser`
- `POST /addUserEJS`
- `GET /showUser`
- `GET /showVendorProperties/:id`
- `GET /fetchUser/:id`
- `POST /updateUserEJS`
- `POST /deleteUser`
- `GET /addPropertyImage/:id`
- `POST /addPropertyImageEJS`
- `GET /showPropertyImage/:id`
- `GET /fetchPropertyImage/:id`
- `POST /deletePropertyImage`
- `GET /addAminity`
- `POST /addAminityEJS`
- `GET /showAminity`
- `GET /fetchAminity/:id`
- `POST /updateAminityEJS`
- `POST /deleteAminity`
- `GET /showUserRequest`
- `GET /fetchRequest/:id`
- `POST /updateRequestEJS`
- `GET /showUserReview`
- `GET /showShortlist`
- `GET /showInquiry`
- `GET /showVisit`
- `GET /fetchVisit/:id`
- `POST /updateVisitEJS`
- `GET /showPayment`

### Client Controller Routes

Mounted under `/client`, `/api/auth`, `/api/properties`, `/api/vendors`, `/api/admin`, and through `/api/leads` and `/api/notifications` rewrites.

- `GET /city-options`
- `POST /addUser`
- `POST /googleAuth`
- `GET /getUserList`
- `POST /loginByUser`
- `POST /updateUserPhoto`
- `POST /getUser`
- `POST /authStatus`
- `POST /updateUser`
- `GET /getPropertyList`
- `POST /getAreaListByCity`
- `POST /getPropertyByCity`
- `POST /getPropertyByArea`
- `POST /getVisitorList`
- `POST /getVisitorListStatus`
- `POST /getVisitById`
- `POST /getInquiryById`
- `POST /getInquiry`
- `POST /getPropertyById`
- `POST /getPropertyByUserId`
- `POST /getAminityById`
- `POST /getPropertyImageById`
- `POST /getReviewById`
- `POST /getShortlistById`
- `POST /getShortlistByVendor`
- `POST /getShortlistByPropertyId`
- `POST /addInquiry`
- `POST /addInterest`
- `POST /addPropertyImages`
- `POST /addVisit`
- `POST /markLeadConverted`
- `POST /addReview`
- `GET /reviews`
- `POST /reviews/:id/reply`
- `POST /reviews/:id/moderate`
- `POST /addShortlist`
- `DELETE /deleteShortlist`
- `POST /deleteShortlist`
- `GET /getPropertyType`
- `POST /addProperty`
- `POST /resetPassword`
- `POST /updateVisitTime`
- `POST /updateVisitStatus`
- `POST /updateAminityFeature`
- `POST /updateReply`
- `POST /getemailbydata`
- `POST /getPropertyListByUser`
- `GET /getAllPropertyList`
- `POST /reviewProperty`
- `POST /moveIns`
- `GET /moveIns`
- `POST /moveIns/:id/owner-confirm`
- `POST /moveIns/:id/review`
- `GET /payment-requests`
- `POST /payment-requests/:id/review`
- `POST /reactivateProperty`
- `POST /updateProperty`
- `POST /deleteProperty`
- `GET /getAdminStats`
- `GET /getAdminVendorLeadSummary`
- `GET /user/overview`
- `POST /user/viewed-properties`
- `POST /user/saved-searches`
- `DELETE /user/saved-searches/:id`
- `GET /chats`
- `POST /chats`
- `POST /visits/:id/status`
- `POST /wallet/payouts`
- `GET /wallet/payouts`
- `POST /wallet/payouts/:id/review`
- `POST /properties/:id/occupancy`
- `POST /properties/:id/update-request`
- `GET /property-update-requests`
- `POST /property-update-requests/:id/review`
- `POST /admin/searchProperty`
- `POST /admin/getVendorFullProfile`
- `POST /vendor/getVendorFullProfile`
- `GET /getAdminUsers`
- `POST /updateUserStatus`
- `POST /users/:id`
- `POST /requestPasswordReset`
- `POST /resetPasswordWithOtp`
- `POST /changePassword`
- `POST /users/:id/reset-password`
- `GET /analytics`
- `GET /properties`
- `GET /properties/:id`
- `POST /properties/:id/status`
- `POST /properties/:id/commission`
- `POST /properties/bulk`
- `GET /vendors`
- `GET /vendors/:id`
- `GET /users`
- `POST /users/:id/status`
- `POST /create-account`
- `GET /auditLogs`
- `GET /governance`
- `POST /dummy-transition`
- `GET /city-states`
- `POST /city-states`
- `POST /city-states/:id/assign-admins`
- `POST /city-states/:id/launch`
- `GET /leads`
- `GET /vendors/:id/messages`
- `POST /vendors/:id/messages`
- `POST /vendors/:id/messages/:messageId/delete`
- `GET /notifications`
- `POST /notifications/:id/read`
- `POST /notifications/mark-read`
- `POST /getPropertyListByType`
- `POST /getPropertyListByTypeId`
- `POST /updateuserPassword`

## Controllers

Source directory: `pgfinder-backend/controllers`

- `adminController.js` - Express router for legacy/admin EJS views and admin CRUD flows.
- `clientController.js` - Express router for client REST-style APIs, modern admin APIs, auth, properties, user dashboard, vendor dashboard, leads, notifications, chats, move-ins, wallet payouts, governance, and city-state operations.

## Models

Source directory: `pgfinder-backend/models`

- `adminMessage.js`
- `aminityMaster.js`
- `areaMaster.js`
- `auditLog.js`
- `chatMaster.js`
- `cityStateMaster.js`
- `conversation.js`
- `inquiryMaster.js`
- `leadEvent.js`
- `message.js`
- `moveInConfirmation.js`
- `notification.js`
- `paymentMaster.js`
- `propertyImage.js`
- `propertyMaster.js`
- `propertyType.js`
- `propertyUpdateRequest.js`
- `shortlistMaster.js`
- `userMaster.js`
- `userRequest.js`
- `userReview.js`
- `visitDetails.js`
- `walletPayout.js`

## Middleware

Source directory: `pgfinder-backend/middleware`

- No implemented middleware files found.
- `middleware/.keep` exists as a placeholder.
- Inline/global middleware is configured in `app.js`:
  - `cors`
  - `helmet`
  - `express-rate-limit` on `/api`
  - custom security header function
  - `body-parser` JSON and URL-encoded parsers
  - `express.static` for uploads/public assets
  - `express-session`
- Controller-local middleware/helpers are defined inline in controllers, including upload handling and role/auth helpers.

## Routes Directory

Source directory: `pgfinder-backend/routes`

- No implemented route files found.
- `routes/.keep` exists as a placeholder.
- Routes are currently declared in `app.js`, `controllers/adminController.js`, and `controllers/clientController.js`.

## Dependency Mapping

### Runtime Flow

```text
Browser
  -> pgfinder-frontend/src/main.jsx
  -> App.jsx
  -> AuthProvider
  -> AppRoutes.jsx
  -> PageLayout or DashboardLayout
  -> Pages
  -> Components
  -> Services
  -> API modules
  -> axiosClient
  -> pgfinder-backend/app.js
  -> adminController or clientController
  -> Mongoose models
  -> MongoDB via connection/dbconnect.js
```

### Frontend Routing Dependencies

- `main.jsx` imports `App.jsx`.
- `App.jsx` imports `AuthProvider` and `AppRoutes`.
- `AppRoutes.jsx` imports:
  - `AuthContext`
  - `PageLayout`
  - `DashboardLayout`
  - `Loader`
  - `ProtectedRoute`
  - `RoleProtectedRoute`
  - all page modules via lazy imports.
- Public routes use `PageLayout`.
- Dashboard routes use `ProtectedRoute` + `DashboardLayout`.
- Role-specific dashboard routes use `RoleProtectedRoute`.

### Frontend Page-To-Service/API Dependencies

- `HomePage.jsx` -> `propertyService`, `useCurrentLocation`, `AuthContext`, `PropertyCard`, `PropertyMap`, `SEO`.
- `PropertiesPage.jsx` -> `propertyService`, `dashboardService`, `useCurrentLocation`, `AuthContext`, `PropertyCard`, `PropertyMap`, `SEO`.
- `PropertyDetailPage.jsx` -> `propertyService`, `AuthContext`, `useCurrentLocation`, `PropertyMap`.
- `ComparePage.jsx` -> `propertyService`.
- `LocalityPage.jsx` -> `propertyService`, SEO content data, `PropertyCard`, `PropertyMap`.
- `BlogPage.jsx`, `FAQPage.jsx`, `FAQDetailPage.jsx`, `RecommendationPage.jsx`, `LegalPage.jsx` -> SEO/content data.
- `LoginPage.jsx` -> `authService`, `AuthContext`.
- `SignupPage.jsx` -> `AuthContext`, `axiosClient`.
- `UserDashboard.jsx` -> `dashboardService`, `propertyService`, `AuthContext`.
- `UserProfilePage.jsx` -> `authService`, `AuthContext`.
- `VendorDashboard.jsx` -> `dashboardService`, `adminApi`, `AuthContext`.
- `VendorLeadsPage.jsx` -> `dashboardService`, `AuthContext`.
- `AddPropertyPage.jsx` -> `propertyService`, `axiosClient`, `AuthContext`, SEO locality data.
- `ManagePropertiesPage.jsx` -> `dashboardService`, `propertyService`, `AuthContext`, `AdvancedDataTable`.
- `AdminDashboard.jsx` -> `adminApi`, `useDebouncedValue`, `AuthContext`, `AdvancedDataTable`, operational status utils.
- `SuperAdminDashboard.jsx` -> `adminApi`, `AuthContext`, `AdvancedDataTable`, operational status utils.
- `ManageUsersPage.jsx` -> `adminApi`, `useDebouncedValue`, `AuthContext`, `AdvancedDataTable`.
- `AdminVendorDetailPage.jsx` -> `adminApi`.
- `AdminPropertyDetailPage.jsx` -> `adminApi`, operational status utils.

### Frontend API-To-Backend Endpoint Dependencies

- `authApi.js`
  - `/client/loginByUser`
  - `/client/addUser`
  - `/client/googleAuth`
  - `/client/requestPasswordReset`
  - `/client/resetPasswordWithOtp`
  - `/client/changePassword`
- `propertyApi.js`
  - `/client/getPropertyList`
  - `/client/getPropertyById`
  - `/client/getAllPropertyList`
  - `/client/reviewProperty`
  - `/client/getPropertyType`
  - `/client/getPropertyByCity`
  - `/client/getPropertyByArea`
  - `/client/addShortlist`
  - `/client/deleteShortlist`
  - `/client/getShortlistById`
  - `/client/addVisit`
  - `/client/addInterest`
  - `/client/reviews`
  - `/client/addReview`
  - `/client/moveIns`
  - `/client/chats`
  - `/client/user/viewed-properties`
  - `/client/properties/:id/occupancy`
  - `/client/properties/:id/update-request`
  - `/client/addProperty`
  - `/client/updateProperty`
  - `/client/deleteProperty`
  - `/client/reactivateProperty`
- `dashboardApi.js`
  - `/client/getAdminStats`
  - `/client/getAdminUsers`
  - `/client/getAllPropertyList`
  - `/client/getPropertyListByUser`
  - `/client/getShortlistById`
  - `/client/getVisitorList`
  - `/client/getInquiry`
  - `/client/getShortlistByVendor`
  - `/client/admin/searchProperty`
  - `/client/admin/getVendorFullProfile`
  - `/client/vendor/getVendorFullProfile`
  - `/client/user/overview`
  - `/client/getAdminVendorLeadSummary`
  - `/client/updateUserStatus`
  - `/client/moveIns`
  - `/client/user/saved-searches`
  - `/client/chats`
  - `/client/visits/:id/status`
  - `/client/wallet/payouts`
  - `/client/markLeadConverted`
- `adminApi.js`
  - `/api/admin/analytics`
  - `/api/admin/governance`
  - `/api/admin/auditLogs`
  - `/api/admin/create-account`
  - `/api/admin/users/:id/reset-password`
  - `/api/admin/city-states`
  - `/api/admin/city-states/:id/assign-admins`
  - `/api/admin/city-states/:id/launch`
  - `/api/admin/dummy-transition`
  - `/api/admin/properties`
  - `/api/admin/properties/:id`
  - `/api/admin/properties/:id/status`
  - `/api/admin/properties/:id/commission`
  - `/api/admin/properties/bulk`
  - `/api/admin/vendors`
  - `/api/admin/vendors/:id`
  - `/api/admin/users`
  - `/api/admin/users/:id`
  - `/api/admin/users/:id/status`
  - `/api/admin/leads`
  - `/api/admin/vendors/:id/messages`
  - `/api/admin/vendors/:id/messages/:messageId/delete`
  - `/api/admin/moveIns`
  - `/api/admin/moveIns/:id/review`
  - `/client/moveIns/:id/owner-confirm`
  - `/client/wallet/payouts`
  - `/client/wallet/payouts/:id/review`
  - `/client/property-update-requests`
  - `/client/property-update-requests/:id/review`
- `userApi.js`
  - `/client/authStatus`
  - `/client/updateUser`
- `notificationApi.js`
  - `/api/notifications`
  - `/api/notifications/:id/read`
  - `/api/notifications/mark-read`

### Backend Controller-To-Model Dependencies

- `adminController.js` imports:
  - `areaMaster`
  - `propertyType`
  - `propertyMaster`
  - `userMaster`
  - `propertyImage`
  - `aminityMaster`
  - `userRequest`
  - `userReview`
  - `shortlistMaster`
  - `inquiryMaster`
  - `visitDetails`
  - `paymentMaster`
  - `utils/security`
- `clientController.js` imports:
  - `areaMaster`
  - `propertyType`
  - `propertyMaster`
  - `userMaster`
  - `propertyImage`
  - `aminityMaster`
  - `userRequest`
  - `userReview`
  - `shortlistMaster`
  - `inquiryMaster`
  - `visitDetails`
  - `paymentMaster`
  - `adminMessage`
  - `chatMaster`
  - `conversation`
  - `message`
  - `notification`
  - `leadEvent`
  - `moveInConfirmation`
  - `auditLog`
  - `cityStateMaster`
  - `walletPayout`
  - `propertyUpdateRequest`
  - `utils/security`

### Backend App Dependencies

- `app.js` imports:
  - `dotenv`
  - `mongoose`
  - `express`
  - `connection/dbconnect`
  - `body-parser`
  - `path`
  - `express-session`
  - `cors`
  - `helmet`
  - `express-rate-limit`
  - `ejs`
  - `controllers/adminController`
  - `controllers/clientController`

### Package Dependencies

Frontend runtime dependencies:

- `@tanstack/react-query`
- `axios`
- `framer-motion`
- `leaflet`
- `react`
- `react-dom`
- `react-icons`
- `react-leaflet`
- `react-router-dom`
- `recharts`

Backend runtime dependencies:

- `bcryptjs`
- `body-parser`
- `cors`
- `dotenv`
- `ejs`
- `express`
- `express-rate-limit`
- `express-session`
- `express-validator`
- `helmet`
- `install`
- `jsonwebtoken`
- `moment`
- `mongodb`
- `mongoose`
- `mongoose-validator`
- `multer`
- `nodemailer`
- `nodemon`
- `zod`
