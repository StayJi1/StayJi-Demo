# Backend Error Handling Audit

Scope: backend resilience only. Reviewed Express app setup, controllers, middleware, file upload handling, async flows, and schema validation. No application code was modified.

## Executive Summary

The API controller has a useful async wrapper in `pgfinder-backend/controllers/clientController.js:35-47`, so most `/client` and `/api` route promises are forwarded to `next(error)`. However, the app has no global Express error middleware after the routers in `pgfinder-backend/app.js:170-243`, so forwarded errors fall through Express defaults instead of returning consistent JSON.

The legacy admin controller is the largest crash surface. Its async route handlers are not wrapped and do not use local `try/catch`, so database, render, cast, and upload assumptions can produce unhandled promise rejections in Express 4.

Validation is uneven. Core user/property schemas leave many important fields optional, while many routes use body IDs and uploaded files directly. Invalid ObjectIds, missing files, malformed dates/numbers, and unsupported enum values can become 500s instead of controlled 400 responses.

## Highest Priority Findings

### 1. Missing Global Error Handler

Severity: High

Evidence:

- Controllers are mounted in `pgfinder-backend/app.js:170-243`.
- `module.exports = app` follows at `pgfinder-backend/app.js:283`.
- No `app.use((err, req, res, next) => ...)` exists after route registration.
- CORS rejects disallowed origins with `callback(new Error("CORS Not Allowed"))` in `pgfinder-backend/app.js:40-51`.
- `clientController` forwards async failures with `next(error)` in `pgfinder-backend/controllers/clientController.js:35-47`.

Impact:

- API errors can return Express default HTML/error bodies instead of the app's JSON shape.
- CORS, JSON parse, Multer, Mongoose cast, validation, and duplicate-key errors are not normalized.
- Production responses may be inconsistent across `/client`, `/api`, and `/admin`.

Recommendation:

- Add one terminal error middleware after all routes.
- Normalize `ValidationError`, `CastError`, duplicate key `11000`, `MulterError`, CORS errors, and JSON parse errors.
- Return JSON for API routes and render/redirect safely for admin EJS routes.

### 2. Admin Controller Async Routes Lack Try/Catch Or Async Wrapper

Severity: High

Evidence:

- `adminController` defines many `async` Express 4 handlers directly, starting at `pgfinder-backend/controllers/adminController.js:131`.
- Examples include dashboard reads at `pgfinder-backend/controllers/adminController.js:131-179`, login at `182-206`, CRUD flows at `228-277`, property flows at `357-393`, and user flows at `562-735`.
- Unlike `clientController`, there is no wrapper around `router.get/post` in `adminController`.

Impact:

- Any rejected Mongoose query, failed render, invalid ObjectId, or upload error can become an unhandled promise rejection.
- Admin pages can hang or crash the process depending on Node/Express runtime behavior.

Recommendation:

- Apply the same `wrapAsync` pattern used in `clientController`.
- Add targeted `try/catch` where the route needs custom recovery, such as upload pages and EJS render fallbacks.

### 3. File Upload Routes Assume Files Exist

Severity: High

Evidence:

- Admin property type create reads `req.file.filename` at `pgfinder-backend/controllers/adminController.js:287-291`.
- Admin property create reads `req.files["propertyImage"][0].filename` and loops `req.files["image"]` at `pgfinder-backend/controllers/adminController.js:357-388`.
- Admin user create reads `req.file.filename` at `pgfinder-backend/controllers/adminController.js:562-575`.
- Admin property image upload maps `req.files` at `pgfinder-backend/controllers/adminController.js:782-793`.
- API user photo and property image routes read `req.file.filename` at `pgfinder-backend/controllers/clientController.js:854-862` and `1571-1579`.
- Upload filters silently reject unsupported files with `cb(null, false)` in `adminController.js:113-118` and `clientController.js:621-626`.

Impact:

- Missing or rejected files produce `Cannot read properties of undefined` errors.
- Users receive 500s instead of clear "file required" or "unsupported file type" responses.
- Multi-file saves can partially succeed before later image saves fail.

Recommendation:

- Validate `req.file`, `req.files`, field names, and minimum file counts before dereferencing.
- Convert rejected file types into explicit 400 responses.
- Add Multer error handling for file-size limits.

### 4. Unhandled Async Work In Array Iteration

Severity: Medium

Evidence:

- Admin property image saves run inside `images.forEach(async ...)` without awaiting at `pgfinder-backend/controllers/adminController.js:380-388`.
- Admin additional property images use `req.files.map(async ...)` without awaiting at `pgfinder-backend/controllers/adminController.js:784-791`.

Impact:

- The response redirects before image records finish saving.
- Save failures are unhandled and can leave property/image data inconsistent.

Recommendation:

- Replace async `forEach`/`map` fire-and-forget patterns with `await Promise.all(...)` or a serial `for...of`.
- Treat property creation and image creation as one operation where possible.

### 5. ObjectId Validation Is Missing In Many Routes

Severity: High

Evidence:

- Admin routes pass `req.params.id` and `req.body.id` directly into Mongoose queries, for example `adminController.js:247-250`, `258-265`, `269-275`, `306-309`, `338-344`, `433-440`, `493-499`, `652-660`, and `727-734`.
- API aggregation routes construct ObjectIds directly at `clientController.js:1072-1074` and `1246-1248`.
- Several API routes use `_id: req.body.id` or `_id: req.params.id` without `mongoose.Types.ObjectId.isValid`, including `clientController.js:1294-1300`, `2116-2124`, `2282-2286`, `2372-2408`, `2422-2445`, `2962-2970`, `3024-3036`, and `4222-4228`.

Impact:

- Invalid IDs can trigger Mongoose `CastError` and return 500/default error responses.
- Some routes may fail before business validation runs.

Recommendation:

- Add reusable `validateObjectId` middleware/utility for route params and body IDs.
- Return 400 for malformed IDs and 404 for valid-but-missing records.

### 6. Sensitive Legacy Routes Miss Auth/Ownership Middleware

Severity: High

Evidence:

- Admin/API guard is registered late at `pgfinder-backend/controllers/clientController.js:3084-3088`, so only routes declared after that point under listed prefixes are protected.
- Earlier routes update profile/property/lead/payment state using body-supplied IDs, for example:
  - `updateUser` at `clientController.js:919-950` and duplicate at `1358-1382`.
  - `addProperty` at `clientController.js:1860-1954`.
  - `updateProperty` at `clientController.js:2292-2420`.
  - `deleteProperty` at `clientController.js:2422-2451`.
  - visit and lead status routes at `clientController.js:1977-2008`, `2027-2050`, and `2962-2982`.
  - move-in and payout creation/review routes before the guard at `clientController.js:2130-2280` and `2984-3004`.

Impact:

- Resilience and authorization are coupled here: bad or malicious payloads hit business logic directly instead of being rejected by middleware.
- Routes trust `userIDFK`, `ownerId`, `vendorId`, `adminId`, and `performerRole` from the request body.

Recommendation:

- Move auth/role middleware before sensitive route declarations or attach it per route.
- Validate ownership from `req.auth.user`, not request body IDs.

## Missing Validations

### Request Body Shape

- `express-validator` is imported in `adminController.js:19` but not used.
- `zod` is installed in `package.json`, but no route schemas were found.
- Public signup validates password and some consent fields at `clientController.js:639-722`, but does not consistently validate email shape, required first/last name, or phone format beyond suspicious repeated numbers.
- Login at `clientController.js:818-852` does not validate required email/password before querying.
- Admin login at `adminController.js:182-206` also lacks required field validation.

### Numeric And Date Fields

- Property create requires coordinates at `clientController.js:1861-1863`, then converts with `toNumberOrUndefined` at `1898-1899`, but does not reject non-numeric latitude/longitude.
- Rent, deposit, daily rate, commission, payout amount, available beds, and rating are often accepted as arbitrary strings/numbers.
- Date fields such as `visitDate`, `joiningDate`, `availableFrom`, `dateFrom`, and `dateTo` are not consistently checked for valid dates.

### Enum And Status Fields

- Some routes whitelist statuses, for example review moderation at `clientController.js:1748-1758` and property bulk actions at `3775-3824`.
- Other routes directly assign statuses from request bodies, for example property update at `clientController.js:2341-2344` and admin property status at `3724-3737`.
- Schema enums catch some invalid values later, but this becomes database validation error handling instead of a clear 400.

### Schema Required Fields

- `userMaster` has no `required` constraints for email, password, role, or contact in `pgfinder-backend/models/userMaster.js:4-190`.
- `propertyMaster` has no `required` constraints for owner, name, address, rent, city, coordinates, image, or approval fields in `pgfinder-backend/models/propertyMaster.js:3-265`.
- This makes route validation the primary defense, but route validation is incomplete.

## Missing Middleware

- Global error handler: absent after route registration in `app.js`.
- 404 JSON handler: absent after all routes, so unknown API routes may receive default HTML 404 behavior.
- Request validation middleware: no shared schema validation layer for body/query/params.
- ObjectId validation middleware: missing for common `:id`, `id`, `userIDFK`, `propertyIDFK`, `vendorId`, `ownerId`.
- Multer error middleware: missing for size/type/upload failures.
- Auth/ownership middleware: missing from many legacy state-changing routes.
- Permission middleware: roles exist, but route-level permission strings are not enforced.
- Session store middleware/config: `express-session` uses the default in-memory store in `app.js:120-135`, which is not resilient for production restarts or multiple instances.
- Process-level safety hooks: no centralized `unhandledRejection` / `uncaughtException` logging and graceful shutdown were found.

## Positive Patterns Already Present

- `clientController` wraps registered route handlers and forwards thrown async errors at `clientController.js:35-47`.
- `attachAuthenticatedUser` handles JWT verification failures with a 401 response at `clientController.js:250-276`.
- `requireRoles` provides a reusable role guard at `clientController.js:279-288`.
- Some helper functions safely parse JSON/list values, normalize locations, and validate ObjectIds through `asObjectId`.
- Mongo connection failure is caught and logged in `pgfinder-backend/connection/dbconnect.js:6-14`.
- `ensureDefaultAdmin` catches setup errors in `adminController.js:62-77`.

## Recommended Fix Order

1. Add a terminal global error handler and 404 handler in `app.js`.
2. Wrap all `adminController` async routes with the same `wrapAsync` strategy used by `clientController`.
3. Add shared validators for IDs, required body fields, enum values, dates, coordinates, and numeric ranges.
4. Add explicit Multer validation and upload error handling.
5. Move or attach auth/role/ownership middleware to all state-changing legacy routes.
6. Replace unawaited async array operations with awaited `Promise.all` or `for...of`.
7. Add production-grade session store and process-level error logging/graceful shutdown.

