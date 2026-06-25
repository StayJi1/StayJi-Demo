# SEARCH_FIX.md — Admin Search (Property Name) Regex Search Audit Fix Plan

## Scope (per request)
Fix only Search logic used by Admin search property by name.

## Evidence from existing codebase (observed)
- Frontend uses (from `pgfinder-frontend/src/api/dashboardApi.js`):
  - `POST /client/admin/searchProperty` with body `{ q, limit }`
- Backend implements admin search inside `pgfinder-backend/controllers/clientController.js`.

## Core issue to address
“Property name search must work” with examples:
- `Green Nest PG` should find the PG
- `Green` should find items that match “Green”
- `Nest` should find items that match “Nest”
- `Whitefield` should find items that match “Whitefield”
- `Flat`, `Hostel` should match category/segment and relevant properties

## 1) Verify the backend uses regex search BEFORE pagination
### What to check in backend
In `clientController.js` for `/admin/searchProperty`:
- Ensure the code builds a Mongo filter that:
  - uses `$regex` (or equivalent) on `propertyName`, `description`, `address`, `cityName`, `areaName`, `propertyCategory`, `aminityFeatures`, etc.
  - uses tokenization for multi-word queries (`Green Nest PG` => tokens: `green`, `nest`, `pg`)
- Ensure the filter is applied to a `Property.find(...)` with `.limit(limit)` only at the end.

### Why current results can fail
Common failures:
- Pagination (`.limit`) applied before filter refinement
- Regex filter not covering `areaName`/`cityName`/`propertyCategory` that the examples rely on
- Tokenization ignores some terms (ex: stripping `PG` may be fine, but only if other fields still match)

## 2) Ensure query normalization doesn’t break matching
The backend uses a normalization helper `canonicalLocationName` and `normalizedRegex`.

Verify:
- `canonicalLocationName` only changes “Bangalore/Bengaluru” and doesn’t affect other tokens.
- Regex builder escapes special characters correctly.

## 3) Ensure pagination doesn’t change semantics between single-token and multi-token queries
Backend search often has two branches:
- single token => direct `$or` across fields
- multi token => `$and` of token clauses

Verify the multi-token branch:
- for `Green Nest PG`, should require all tokens OR allow partial match.
- It should not require tokens to match *only one field* if the intent is “any field matches per token”.

## 4) Ensure it matches category keywords: Flat/Hostel
Examples include `Flat`, `Hostel`.

Verify backend search also includes:
- `propertyCategory` (or `propertySegment` if that’s stored)
- `propertyTypeIDFK.typeName` if applicable
- `status`/`approvalStatus` constraints do not hide live results

If category is stored as `propertyCategory`, searching it via regex must be included.

## 5) Frontend mapping must read returned data
Frontend admin search uses:
- `axiosClient.post('/client/admin/searchProperty', { q, limit })`
- `.then((res) => res.data?.data || { properties: [] })`

Verify backend returns:
- `res.json({ result:'success', data: { properties: [...] } })`

If backend returns `data: [...]` instead, frontend will treat it as `{ properties: [] }` and appear broken.

## 6) Acceptance tests (manual)
After applying fixes (if any), run these cases:
- Query `Green Nest PG` returns ≥ 1 property
- Query `Green` returns ≥ 1 property
- Query `Nest` returns ≥ 1 property
- Query `Whitefield` returns ≥ 1 property
- Query `Flat` returns ≥ 1 property where propertyCategory/segment matches
- Query `Hostel` returns ≥ 1 property where propertyCategory/segment matches

## 7) Deliverable
- Backend filter updated to properly regex-match across fields and tokens.
- Ensure response shape matches `dashboardApi` expectations.

