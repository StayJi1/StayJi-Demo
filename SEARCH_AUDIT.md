# Search System Audit

Scope: search APIs, frontend filters, backend filters, normalization logic, pagination logic, and root causes for case-sensitive Bangalore search, missing PG-name search, and differing Explore results.

No application code was changed for this audit.

## Executive Summary

The project has multiple search paths that do not share one normalization or filtering contract.

- `/properties` is mostly client-side search. It fetches public property pages with `includeAllCities=true`, then searches name, address, city, locality, type, category, gender, and amenities in React.
- `/bangalore` and `/bangalore/:localitySlug` use backend city/locality filters first, then only local gender/category/sort filters. They do not offer property-name search on that page.
- Legacy city/area APIs use exact string equality, while the newer list APIs use regex and canonicalization. This is why `Bangalore` and `bangalore` can differ.
- Public city launch/demo gating can also change what public search returns, depending on `CityState` status and dummy visibility.
- Pagination is inconsistent: public list API is paginated, `/properties` pulls all pages, LocalityPage paginates by slicing on the frontend, and legacy city/area APIs do not paginate.

## Search API Inventory

### Public property list

- Route: `GET /client/getPropertyList`
- Alias: `GET /api/properties`
- Frontend wrapper: `propertyApi.list()`
- Source:
  - `pgfinder-backend/controllers/clientController.js:902`
  - `pgfinder-frontend/src/api/propertyApi.js:131`

Behavior:

- Builds filters with `buildPropertyFilters(req.query)`.
- Defaults to Bangalore/Bengaluru when no `includeAllCities`, `city`, or `cityName` is provided.
- Applies public visibility filter through `publicPropertyQuery`.
- Applies city launch/demo gate through `publicCityGate()`.
- Supports server pagination via `page`, `limit`, and response `meta`.

### Public all property list

- Route: `GET /client/getAllPropertyList`
- Frontend wrapper: `propertyApi.all()`
- Source:
  - `pgfinder-backend/controllers/clientController.js:2048`
  - `pgfinder-frontend/src/api/propertyApi.js:157`

Behavior:

- Uses `buildPropertyFilters(req.query)`.
- Does not apply `publicPropertyQuery` or `publicCityGate()`.
- No server pagination in this route.
- This is used by dashboard-style data, not the main public `/properties` search.

### Legacy city and area APIs

- `POST /client/getPropertyByCity`
- `POST /client/getPropertyByArea`
- Frontend wrapper: `propertyApi.nearby()`, though LocalityPage does not currently use this wrapper.
- Source:
  - `pgfinder-backend/controllers/clientController.js:943`
  - `pgfinder-backend/controllers/clientController.js:956`
  - `pgfinder-frontend/src/api/propertyApi.js:166`

Behavior:

- Uses exact equality:
  - `{ cityName: req.body.cityName, ...publicPropertyQuery }`
  - `{ areaName: req.body.areaName, ...publicPropertyQuery }`
- Applies `publicCityGate()`.
- Does not paginate.
- Does not search `propertyName`.

### Admin property list/search

- Route: `GET /api/admin/properties`
- Controller route under mounted `/client`: `GET /client/properties`
- Frontend wrapper: `adminApi.properties()`
- Source:
  - `pgfinder-backend/controllers/clientController.js:3509`
  - `pgfinder-frontend/src/api/adminApi.js:43`

Behavior:

- Uses `buildAdminPropertyQuery(req.query)`.
- Supports `q`/`search`.
- Searches `propertyName`, description, address, city, area, category, ObjectId, and owner fields.
- Applies admin city scope.
- Server paginated.

### Admin quick property search

- Route: `POST /client/admin/searchProperty`
- Frontend wrapper exists in `dashboardApi`, not the main public search path.
- Source:
  - `pgfinder-backend/controllers/clientController.js:2943`
  - `pgfinder-frontend/src/api/dashboardApi.js:45`

Behavior:

- Requires auth/admin role.
- Searches `propertyName`, description, address, city, area, category, and amenities.
- Uses `new RegExp(q, 'i')` directly.

## Frontend Filter Inventory

### `/properties`

Source: `pgfinder-frontend/src/pages/PropertiesPage.jsx`

Data loading:

- Fetches `propertyService.fetchProperties({ includeAllCities: true, limit: 100, allPages: true })`.
- Source: `PropertiesPage.jsx:178`
- `propertyApi.list()` fetches first page, reads `meta.pages`, then fetches remaining pages in parallel.
- Source: `propertyApi.js:138`

Search and filters:

- Initializes query from `search`, `city`, or `area` URL param.
- Source: `PropertiesPage.jsx:70`
- Lowercases and tokenizes search.
- Drops words: `near`, `nearby`, `me`, `my`, `location`, `around`.
- Singularizes a few plural tokens such as `pgs -> pg`.
- Source: `PropertiesPage.jsx:39`
- Haystack includes:
  - `item.name`
  - `item.description`
  - `item.address`
  - `item.city`
  - `item.locationLabel`
  - `item.type`
  - `item.category`
  - `item.gender`
  - `item.amenities`
- Source: `PropertiesPage.jsx:238`
- Also has fuzzy-ish token matching against name, city, location label, category, and type.
- Source: `PropertiesPage.jsx:266`
- Filters:
  - category: PG, Flat, Hotel, Hostel, Co-living
  - gender: Boys, Girls, Co-ed
  - utility: per-day check-in, food, AC, Non-AC, attached bathroom, parking, available now, rating 4+, sharing type
  - price min/max
  - nearby radius when location is available
- Source: `PropertiesPage.jsx:246`, `PropertiesPage.jsx:292`, `PropertiesPage.jsx:307`, `PropertiesPage.jsx:314`
- Sorts by price, deposit, nearest, or name relevance for search tokens.
- Source: `PropertiesPage.jsx:317`

Important note:

- The placeholder says "Search city, locality or college", but the implementation does include PG name through `item.name`.
- `item.name` comes from `propertyName` normalization.
- Source: `propertyApi.js:65`

### `/bangalore` and `/bangalore/:localitySlug`

Source: `pgfinder-frontend/src/pages/LocalityPage.jsx`

Data loading:

- Calls `propertyService.fetchProperties({ cityName: 'Bangalore' })` for `/bangalore`.
- Calls `propertyService.fetchProperties({ cityName: 'Bangalore', areaName: locality.name })` for locality pages.
- Source: `LocalityPage.jsx:45`

Filters:

- Gender exact match against normalized `property.gender`.
- Category exact match against normalized `property.category` or `property.type`.
- Sorts by rent, rating, featured, and boost score.
- Source: `LocalityPage.jsx:64`

Pagination:

- `pageSize = 6`.
- Uses `visibleCount` and `slice(0, visibleCount)`.
- "Load more listings" increments count by 6.
- Source: `LocalityPage.jsx:24`, `LocalityPage.jsx:78`, `LocalityPage.jsx:181`

Important note:

- LocalityPage has no PG-name search box. Its "Advanced search" link sends the locality name to `/properties?search=...`.
- Source: `LocalityPage.jsx:164`

### Home search

Source: `pgfinder-frontend/src/pages/HomePage.jsx`

Behavior:

- The home search field navigates to `/properties?search=<query>`.
- The placeholder mentions PG name, but actual matching happens later on `/properties`.

## Backend Filter Inventory

### Shared public filter builder

Source: `pgfinder-backend/controllers/clientController.js:487`

`buildPropertyFilters(source, includeInactive = false)`:

- Defaults `isActive = true`.
- Supports status, approval status, city, area/locality, category, owner/vendor.
- City uses `canonicalLocationName()` and case-insensitive regex.
- Area/locality uses `normalizeText()` and case-insensitive regex.
- Search query uses `source.q || source.search || source.name`.
- Search fields include:
  - ObjectId
  - StayJi ID suffix
  - `propertyName`
  - `description`
  - `address`
  - `cityName`
  - `areaName`
  - `propertyCategory`
  - `aminityFeatures`

### Public visibility filter

Source: `pgfinder-backend/controllers/clientController.js:521`

`publicPropertyQuery` requires:

- `isActive: true`
- `status` not archived or suspended
- `approvalStatus` Approved, Verified, or missing

### Public city/demo gate

Source: `pgfinder-backend/controllers/clientController.js:144`

`publicCityGate()`:

- If no active `CityState` records exist, returns no gate.
- Otherwise:
  - live cities show non-dummy properties
  - demo-visible cities show dummy properties
  - no qualifying cities returns an impossible city regex

This gate is applied by `/client/getPropertyList`, `/client/getPropertyByCity`, and `/client/getPropertyByArea`.

### Admin filter builder

Source: `pgfinder-backend/controllers/clientController.js:2589`

`buildAdminPropertyQuery(query)`:

- Supports active/status/approval/city/area/category/vendor/date/rating/occupancy/dummy/verification/propertyStatus filters.
- Supports `q` or `search`.
- Search fields include ObjectId, `propertyName`, description, address, city, area, and category.
- Route also adds owner name/email/phone matching.
- Source: `clientController.js:3509`

## Normalization Logic

### Backend text normalization

Source: `pgfinder-backend/controllers/clientController.js:49`

- `normalizeText()` trims and collapses whitespace.
- `canonicalLocationName()` maps `bengaluru` or `bangalore` to `Bangalore`, case-insensitively.
- `escapeRegex()` escapes user input for safer regex filters.

This normalization is used in `buildPropertyFilters()` and admin filters, but not in legacy `getPropertyByCity` / `getPropertyByArea`.

### Frontend property normalization

Source: `pgfinder-frontend/src/api/propertyApi.js:20`

Important mappings:

- `property.propertyName || property.name -> name`
- `property.cityName || property.city -> city`
- `property.areaName || property.area -> area`
- `property.address || property.areaName || property.city -> locationLabel`
- `property.propertyCategory || property.category || propertyTypeIDFK.typeName || property.type || 'PG' -> category/type`
- `property.genderType || property.gender || 'Co-ed' -> gender`
- coordinates fallback by lowercased city name for map display

### Frontend search-token normalization

Source: `pgfinder-frontend/src/pages/PropertiesPage.jsx:39`

- Lowercase search query.
- Remove filler location words.
- Singularize selected terms.
- Apply simple similarity matching with up to two mismatches for similarly-sized words.

## Pagination Logic

### `/client/getPropertyList`

Source:

- `pageOptions()`: `clientController.js:2485`
- route usage: `clientController.js:902`

Behavior:

- Default page: 1.
- Default limit: `DEFAULT_PAGE_LIMIT` or 24.
- Limit clamp: 1 to 100.
- Uses `skip` and `limit`.
- Returns `meta: { page, limit, total, pages }`.

### `/properties` frontend

Source:

- `PropertiesPage.jsx:178`
- `propertyApi.js:138`

Behavior:

- Calls public list API with `limit=100`, `allPages=true`.
- Fetches all backend pages before local filtering.
- Renders all filtered matches; no visible pagination on the result grid.

### `/bangalore` frontend

Source: `LocalityPage.jsx:24`

Behavior:

- Backend request is still paginated by default because it uses `propertyApi.list()` without `allPages`.
- LocalityPage then paginates only the already-returned page by slicing 6 at a time.
- If backend total exceeds the default page limit, LocalityPage will never show later backend pages.

### Legacy city/area APIs

Source:

- `clientController.js:943`
- `clientController.js:956`

Behavior:

- No pagination, no `pageOptions()`, no `meta`.

### Admin properties

Source: `clientController.js:3509`

Behavior:

- Uses `pageOptions()`.
- Returns `page`, `limit`, `total`, and `pages` inside `data`.

## Root Causes

### Why `Bangalore` != `bangalore`

The newer list filters canonicalize city names and use case-insensitive regex:

- `canonicalLocationName()` maps `bangalore` or `bengaluru` to `Bangalore`.
- `buildPropertyFilters()` applies `new RegExp(..., 'i')`.

But the legacy city/area endpoints do exact equality:

- `getPropertyByCity`: `{ cityName: req.body.cityName, ...publicPropertyQuery }`
- `getPropertyByArea`: `{ areaName: req.body.areaName, ...publicPropertyQuery }`

So `cityName: 'bangalore'` will not match stored `cityName: 'Bangalore'` on legacy paths. The public `/client/getPropertyList?cityName=bangalore` path should match because it uses canonicalization and regex.

There is also a second consistency issue: the public list fallback uses `/bangalore|bengaluru/i`, but `includeAllCities=true` bypasses that default. That makes `/properties` broader than pages that request only Bangalore.

### Why PG name search is missing

There are two different answers depending on the page/API path:

- On `/properties`, PG-name search is implemented. `propertyName` is normalized to `name`, and `item.name` is included in the client haystack and relevance sort.
- On `/bangalore` and `/bangalore/:localitySlug`, there is no PG-name search UI. The page only filters loaded properties by gender/category and sort.
- On legacy city/area APIs, there is no `propertyName` search. They only filter by exact `cityName` or exact `areaName`.
- If a feature is using `getPropertyByCity` or `getPropertyByArea` for "explore" results, PG names will appear to be missing because the backend prefilters by city/area only and ignores `propertyName`.

The backend search-capable routes already include `propertyName` in `buildPropertyFilters()`, admin property search, and admin quick search.

### Why Explore stays differs

Explore-style result counts can differ because different pages ask different questions:

- Home featured stays calls `fetchPopularProperties()`, which is just the first page of `/client/getPropertyList`.
- `/properties` calls `/client/getPropertyList` with `includeAllCities=true`, `limit=100`, and `allPages=true`, then applies broad client-side filtering.
- `/bangalore` calls `/client/getPropertyList?cityName=Bangalore` without `allPages`, so it only receives the backend default page, then slices that page locally.
- Legacy city/area APIs use exact city/area equality and may return different results from regex-based list search.
- Public city gating can hide non-live cities, hide dummy data unless demo-visible, or return no cities if governance has active city records but none are public.
- `/client/getAllPropertyList` does not apply `publicPropertyQuery` or `publicCityGate`, so dashboard/all-data views can differ from public explore/search.

Net effect: "Explore stays" is not a single source of truth. It can vary by route, city casing, city launch state, dummy visibility, backend pagination, and whether the page fetches all backend pages.

## High-Risk Inconsistencies

- Legacy exact-match city/area endpoints conflict with canonical regex-based list endpoints.
- LocalityPage combines backend pagination with frontend "load more", so it can silently cap results at the first backend page.
- `/properties` fetches all pages client-side and filters locally; this will become expensive as inventory grows.
- Public and dashboard routes expose different datasets because public gates are not uniformly applied.
- Direct `new RegExp(q, 'i')` in admin quick search and admin property query is less safe/consistent than `escapeRegex()`.

## Suggested Fix Direction

This audit does not change code, but the clean direction is:

- Make one public search endpoint the source of truth.
- Deprecate or update `getPropertyByCity` and `getPropertyByArea` to use `buildPropertyFilters()`, canonical city normalization, case-insensitive exact regex, pagination, and `propertyName` search where relevant.
- Move `/properties` filtering to the backend once inventory grows, while keeping frontend filters as URL state.
- Ensure LocalityPage uses `allPages=true` or real server pagination, not both partial backend paging and frontend slicing.
- Apply public visibility/governance rules consistently to all public-facing listing routes.
