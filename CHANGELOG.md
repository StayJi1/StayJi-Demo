# Changelog

## 2026-06-20 - Bangalore MVP hardening pass

### Changed

- Added backend property filters for budget, gender, and sharing type before pagination.
- Added a paged frontend property API path and connected `/properties` to backend pagination metadata.
- Added page size, previous, and next controls to the Bangalore listings page.
- Reset listing pagination when search/filter criteria change.
- Preserved listing scroll position when opening a property and returning.
- Wired the existing fullscreen/swipe gallery into property details.
- Wired user-owner messaging routes:
  - `/dashboard/user/messages`
  - `/dashboard/owner/messages`
- Added dashboard sidebar links for user and owner messages.
- Redirected Super Admin login/dashboard routes away from the MVP launch path.
- Refreshed launch docs to reflect the current Bangalore-only MVP state.

### Verified

- `npm run lint` in `pgfinder-frontend`.
- `npm run build` in `pgfinder-frontend`.
- `node --check pgfinder-backend/controllers/clientController.js`.
- `node --check pgfinder-backend/controllers/adminController.js`.

### Not Verified

- Full manual user, owner, and admin QA.
- Google login with provider credentials.
- Live MongoDB search results.
- Real image upload.
- Real user-owner message exchange.
- Real visit request accept/reject flow.
