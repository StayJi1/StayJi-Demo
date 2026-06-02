# Property Visibility Audit

Scope: property visibility only. Reviewed public listing APIs, public pages, admin/super-admin listing views, pagination, and dummy/live gating. No code changes were made beyond this audit file.

## Executive Summary

- The main public `/properties` page is not intentionally capped at 20. It calls `fetchProperties({ includeAllCities: true, limit: 100, allPages: true })` and the API wrapper follows backend `meta.pages` to fetch all pages.
- A 20-row cap exists in admin API defaults: `pgfinder-frontend/src/api/adminApi.js:10-14` sets `limit: 20` unless callers override it.
- Public backend listing default is 24, not 20: `pgfinder-backend/controllers/clientController.js:2492-2496` uses `DEFAULT_PAGE_LIMIT || 24`, capped at 100.
- Locality pages can appear capped because they request only the first backend page and then slice that already-limited result in batches of 6.
- Public visibility is controlled by approval/activity/status filters plus city-state dummy/live gates. Live cities show real properties; demo-visible cities show dummy properties.

## Hardcoded Limits

### Public property API

- `pgfinder-backend/controllers/clientController.js:2492-2496`
  - `page` defaults to `1`.
  - `limit` defaults to `process.env.DEFAULT_PAGE_LIMIT || 24`.
  - `limit` is clamped to `1..100`.
  - This affects `/client/getPropertyList`, `/api/properties`, admin property lists, vendors, audit logs, and other routes using `pageOptions()`.

- `pgfinder-frontend/src/api/propertyApi.js:140`
  - `allPages` requests set the first page `limit` to `100`.
  - If `allPages` is false, the wrapper does not pass a limit unless supplied by the caller.

- `pgfinder-frontend/src/api/propertyApi.js:147`
  - Remaining pages in `allPages` mode are fetched with `limit: 100`.

- `pgfinder-frontend/src/pages/PropertiesPage.jsx:252`
  - Main public search explicitly requests `limit: 100` and `allPages: true`.

### Public page display limits

- `pgfinder-frontend/src/pages/LocalityPage.jsx:24`
  - `pageSize = 6`.

- `pgfinder-frontend/src/pages/LocalityPage.jsx:35,78,181-184`
  - Locality page starts with `visibleCount = 6`, uses `slice(0, visibleCount)`, and increments by 6 on "Load more listings".

- `pgfinder-frontend/src/pages/HomePage.jsx:103`
  - Homepage featured cards are `popular.slice(0, 3)`.

- `pgfinder-frontend/src/pages/HomePage.jsx:308`
  - Homepage map receives `popular.slice(0, 8)`.

### Admin limits

- `pgfinder-frontend/src/api/adminApi.js:10-14`
  - Admin API wrapper defaults to `page: 1, limit: 20`.
  - This is the strongest direct explanation for "only 20" when viewing admin-backed lists without an explicit override.

- `pgfinder-frontend/src/pages/dashboard/admin/AdminDashboard.jsx:34`
  - Admin property dashboard overrides the default with `limit: 30`.

- `pgfinder-frontend/src/pages/dashboard/admin/SuperAdminDashboard.jsx:27`
  - Super-admin property dashboard overrides the default with `limit: 50`.

- `pgfinder-frontend/src/components/admin/AdvancedDataTable.jsx:4,31-32,50-52,160-162`
  - Client table page-size options are `[10, 20, 50, 100]`.
  - Initial table page size is `10`.
  - This paginates only the rows already returned by the API, not the backend total.

## Why Only 20 Properties Show

There are two likely cases:

1. Admin/API default path
   - Any admin API call using `adminApi.properties()` without a `limit` gets `limit: 20` from `paramsWithDefaults()`.
   - Backend honors that via `pageOptions()` and returns only page 1.
   - The response includes `total` and `pages`, but the frontend admin tables do not request later backend pages.

2. Public locality path
   - `/bangalore` and `/bangalore/:localitySlug` call `propertyService.fetchProperties(...)` without `allPages`.
   - `propertyApi.list()` returns only the first backend page when `allPages` is false.
   - Backend default is 24 unless `DEFAULT_PAGE_LIMIT` is set differently.
   - The locality UI then slices that first page into visible chunks of 6. Later backend pages are never fetched.

For the main public `/properties` page, the current code should not stop at 20 because it uses `allPages: true`. If that page shows only 20, the cause is likely backend filters/gating reducing the eligible total, an environment `DEFAULT_PAGE_LIMIT` plus failed all-pages follow-up requests, or a caller/view other than `PropertiesPage.jsx`.

## Pagination Flow

### Main public `/properties`

- Page loads from `pgfinder-frontend/src/pages/PropertiesPage.jsx:249-261`.
- It calls `propertyService.fetchProperties({ includeAllCities: true, limit: 100, allPages: true })`.
- `propertyService.fetchProperties()` delegates to `propertyApi.list()` at `pgfinder-frontend/src/services/propertyService.js:4`.
- `propertyApi.list()` fetches page 1, reads `meta.pages`, then fetches pages 2..N in parallel when `allPages` is true.
- Render maps every filtered property; there is no visible result pagination in this page.

### Public backend `/client/getPropertyList`

- Route: `pgfinder-backend/controllers/clientController.js:908-936`.
- Builds public filters, applies pagination with `skip` and `limit`, sorts by featured/locality/newest, and returns:
  - `data`
  - `meta: { page, limit, total, pages }`

### Locality pages

- `pgfinder-frontend/src/pages/LocalityPage.jsx:45-47` calls:
  - `{ cityName: 'Bangalore' }` for `/bangalore`
  - `{ cityName: 'Bangalore', areaName: locality.name }` for locality pages
- No `allPages`, no `limit`, no `page`.
- Backend returns only page 1.
- Frontend then applies local filters/sort and `slice(0, visibleCount)`.

### Admin properties

- Frontend calls `adminApi.properties(propertyParams)`.
- Backend route `pgfinder-backend/controllers/clientController.js:3522-3561` uses `pageOptions()`, returns `{ items, page, limit, total, pages }`.
- Frontend stores only `propertiesData.items`.
- `AdvancedDataTable` paginates client-side over the returned page only. It does not use backend `page`, `total`, or `pages` to fetch more records.

## Dummy/Live Merge Logic

### Public city gate

Source: `pgfinder-backend/controllers/clientController.js:146-158`.

- If there are no active `CityState` records, `publicCityGate()` returns `null`, so no city-state gate is applied.
- If active city states exist:
  - `status: 'live'` cities allow real properties only: `isDummy: { $ne: true }`.
  - `dummyVisible: true` cities allow dummy properties only: `isDummy: true`.
  - If both sets exist, they are merged with `$or`.
  - If neither set exists, it returns a no-match city regex, hiding all public properties.

### Public property eligibility

Source: `pgfinder-backend/controllers/clientController.js:527-532` and `908-918`.

- Public properties must match `publicPropertyQuery`, including active, not archived/suspended, and approval `Approved` or `Verified`.
- `/getPropertyList` also defaults to Bangalore/Bengaluru when no city and no `includeAllCities` are provided.
- `includeAllCities=true` bypasses that Bangalore default, but city-state gates still apply.
- Query flags can force dummy state:
  - `analyticsMode=real` or `includeDummy=false` sets `isDummy = false`.
  - `analyticsMode=demo` sets `isDummy = true`.

### Demo/live transitions

Source: `pgfinder-backend/controllers/clientController.js:3860-3885` and `3936-3975`.

- Super-admin dummy transition can update matching properties by city/locality:
  - `isDummy`
  - `status`
  - `isActive`
- It also updates the city's `dummyVisible` flag when a city is supplied.
- City launch marks the city `live`.
- By default, city launch hides demo listings by setting dummy properties to `status: 'archived'` and `isActive: false`.
- Real listings in the launched city get a `boostScore` update, but still need normal public eligibility.

## Visibility Failure Points

- Pending/rejected/suspended properties are excluded from public search.
- Inactive properties are excluded from public search.
- Archived/suspended statuses are excluded from public search.
- Dummy properties in live cities are hidden unless the city is also demo-visible.
- If any active city-state records exist but none are live or dummy-visible, public discovery returns no properties.
- Locality pages silently miss backend page 2+ because they combine server page 1 with frontend "load more".
- Admin tables can look capped because backend pagination is not wired to frontend pagination controls.

## Files Audited

- `pgfinder-frontend/src/api/propertyApi.js`
- `pgfinder-frontend/src/services/propertyService.js`
- `pgfinder-frontend/src/pages/PropertiesPage.jsx`
- `pgfinder-frontend/src/pages/LocalityPage.jsx`
- `pgfinder-frontend/src/pages/HomePage.jsx`
- `pgfinder-frontend/src/api/adminApi.js`
- `pgfinder-frontend/src/components/admin/AdvancedDataTable.jsx`
- `pgfinder-frontend/src/pages/dashboard/admin/AdminDashboard.jsx`
- `pgfinder-frontend/src/pages/dashboard/admin/SuperAdminDashboard.jsx`
- `pgfinder-backend/controllers/clientController.js`
- `pgfinder-backend/models/propertyMaster.js`
- `pgfinder-backend/models/cityStateMaster.js`
- `pgfinder-backend/app.js`
