# TODO - Vendor delivery + synchronized admin/vendor details

- [x] Add backend endpoint: POST /client/admin/searchProperty (property search -> property + owner + visits + inquiries)
- [x] Add backend endpoint: POST /client/admin/getVendorFullProfile (vendor -> vendor + properties + linked leads)

- [x] Add backend endpoint: POST /client/vendor/getVendorFullProfile (vendor -> same shape as admin)

- [x] Add frontend API methods in pgfinder-frontend/src/api/dashboardApi.js (or new api file)

- [ ] Implement admin search UI wiring to new endpoint (property name search)

- [ ] Implement vendor selection UI wiring to new endpoint

- [ ] Validate synchronization: admin search shows full details and vendor selection shows matching leads/properties
- [ ] Smoke test endpoints with simple axios/postman requests

