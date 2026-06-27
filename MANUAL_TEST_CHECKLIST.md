# StayJi Bangalore MVP Manual Test Checklist

Date: 2026-06-28

## User

- Register as User.
- Open Terms during signup, return, and confirm typed data remains.
- Open Privacy during signup, return, and confirm typed data remains.
- Login as User.
- Open Terms during login, return, and confirm typed data remains.
- Search by property name, partial name, locality, budget, gender, sharing, food, amenity, availability, and rating.
- Open any property and confirm page starts at the top.
- Open gallery and verify images/fallbacks.
- Save property to wishlist.
- Add 1, 2, and 3 properties to Compare.
- Confirm adding a 4th property is blocked.
- Open `/compare` and verify Rent, Sharing, Food, Amenities, Availability, Distance, Rating, and Property Type.
- Message Owner and confirm no duplicate conversation is created.
- Book visit.
- Reschedule visit.
- Cancel visit.
- Confirm dashboard wishlist, visits, messages, and notifications.
- Logout.

## Owner

- Login as Owner.
- Confirm dashboard counts use database-backed values.
- Add property with each launch category: PG, Hostel, Flat, House, Apartment, Villa, Co-living.
- Add Single, Double, Triple, Four, Five, Dormitory, and custom sharing rows.
- Add, edit, and delete custom amenities.
- Upload images.
- Edit property after rejection/pending state.
- Confirm own properties list.
- Confirm messages list shows user and property context.
- Approve, reject, and reschedule visits where available.
- Logout.

## Admin

- Login as Admin from `/admin-login`.
- Confirm dashboard cards load without `Authentication token is required`.
- Confirm Users table loads.
- Confirm Owners table loads.
- Confirm Properties table loads.
- Search properties by property name and locality.
- Approve property.
- Reject property.
- Restore/reactivate property where available.
- Edit/delete property controls work with authorization.
- Confirm visits, messages, reports, analytics, filters, and pagination.
- Logout.

## Notifications

- Confirm User sees only User account notifications.
- Confirm Owner sees only Owner account notifications.
- Confirm Admin sees only Admin account notifications.
- Mark one notification read.
- Mark all notifications read.
- Confirm read actions do not affect another account.

## Responsive And Navigation

- Test desktop, laptop, tablet, and mobile.
- Confirm no horizontal page scroll.
- Confirm navbar/sidebar are usable on mobile.
- Confirm forms, dashboards, cards, compare table, gallery, and notification menu fit cleanly.
- Confirm route navigation scrolls to top.
- Confirm browser back to listings restores prior scroll position.

## Final Smoke

- No console errors.
- No failed API requests.
- No broken routes.
- No blank tables for valid data.
- Expired/invalid token logs out cleanly.
- Missing/deleted images and properties show friendly fallback states.
