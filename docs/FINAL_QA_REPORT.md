# StayJi Stabilization QA Report

## Passed

- Frontend production build passes with Vite.
- Backend syntax checks pass for the updated controller and models.
- Public city/state options endpoint returns Bangalore, Mumbai, Pune, and Hyderabad fallback options when no managed records exist.
- Admin login returns a JWT for dashboard API access.
- Property list endpoint responds from the running backend.

## Fixed

- Super Admin and Admin user edit payload now preserves editable identity, contact, city/state, assigned scope, verification, owner, and status fields.
- User status update now returns success even when values are saved but MongoDB reports no modified count.
- Admin dashboard filters now include owner and date filters, and analytics receives the active filter set.
- Dynamic amenities and custom amenities are supported in the owner property form.
- Dynamic sharing blocks can be added and deleted, with occupancy, bathroom, balcony, AC, furnishing, food, and pricing fields.
- Owner signup uses backend-controlled city/state options instead of only hard-coded UI data.
- Demo properties expose display badges for transparency.
- Move-in reward approval now requires owner confirmation.
- Payment Requests now has backend aliases over the verified move-in reward queue.
- User dashboard now shows StayJi Coins, approved rewards, pending rewards, and reward rows.
- Reviews can be added or edited, trigger rating recalculation, support owner replies, and support admin moderation.
- Super Admin city table now exposes selected-row dummy/live bulk actions.

## Remaining Risks

- Full browser click-through across every modal and route was not completed in this pass.
- Date filtering uses existing `addedOn` values, which are mixed string/date fields in parts of the database; a future migration should normalize them to Date.
- Existing seeded owners still use `Vendor` in some records. Compatibility is preserved, but a cleanup migration should normalize them to `Owner`.
- Payment screenshot storage remains filename/path based; production should move proof uploads to managed object storage with signed URLs.
- Reward redemption payout is modeled as history-ready data, but payout execution and accounting export still need finance integration.

## Security Notes

- Admin reward approval is blocked until owner confirmation.
- Super Admin protected governance routes still require JWT role checks.
- Password reset remains routed through secure OTP/admin-supervised paths.

## Performance Notes

- Admin analytics aggregates multiple collections and should be cached per city/filter window for high traffic.
- Property list payloads are large because seeded property documents include recommendation blocks; API projection should be tightened before launch.
