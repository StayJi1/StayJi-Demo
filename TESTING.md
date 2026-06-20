# StayJi Bangalore MVP Testing

## Automated Checks Run

These checks passed on 2026-06-20:

```bash
cd pgfinder-frontend
npm run lint
npm run build
```

```bash
node --check pgfinder-backend/controllers/clientController.js
node --check pgfinder-backend/controllers/adminController.js
```

Known note: shell startup prints a local `.zprofile` MySQL permission warning, but the commands completed successfully.

## Manual QA Required Before Launch

User:

- Register.
- Login.
- Logout.
- Google login.
- Edit profile.
- Search `Bangalore`, `bangalore`, `BANGALORE`, and `Bengaluru`.
- Search by PG name, locality, budget, gender, and sharing type.
- Use current location and verify nearby sorting.
- Open property details.
- Verify owner-uploaded photos, gallery, fullscreen viewer, swipe navigation, amenities, rent, occupancy, food, rules, address, map, and owner information.
- Save property.
- Remove saved property.
- Message owner.
- Request visit.
- View inquiry, visit, saved search, viewed property, and message history.

Owner:

- Register.
- Login.
- Add property.
- Upload multiple images.
- Edit property.
- Delete/archive property.
- Manage availability.
- Confirm dashboard only shows own properties.
- View inquiries.
- View messages.
- View visit requests.
- Accept and reject visit requests.

Admin:

- Login from `/admin-login`.
- Confirm Bangalore-only data scope.
- Approve listings.
- Reject listings.
- Hide listings.
- Edit listings.
- Manage users.
- Manage owners.
- Confirm Super Admin routes are not part of the MVP navigation.

Responsive UI:

- Test mobile, tablet, and desktop widths.
- Check navigation, dashboard tables, property cards, gallery modal, map panels, and forms for overflow.

Performance:

- Confirm backend pagination works with a large property dataset.
- Confirm images lazy-load on listing cards.
- Confirm property search does not fetch all pages for normal listing results.

## Not Yet Manually Verified

This workspace run did not start the backend server, connect to MongoDB, seed data, upload files, or exercise browser flows with real accounts. Treat launch readiness as incomplete until the manual QA checklist above is completed.
