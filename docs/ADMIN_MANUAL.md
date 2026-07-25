# StayJi Admin Manual

## City Scope

City Admins only see their assigned city: users, owners, properties, leads, analytics, move-ins, reviews, payouts, and notifications. For example, a Bangalore Admin only manages Bangalore records.

The assigned city/state appears below the Admin name on the dashboard. The Admin ID is also visible for support tracking.

## Dashboard

The dashboard is dynamic and clickable. Cards for users, owners, live listings, leads, vacancies, occupancy, conversion, revenue, demo properties, pending review, and hidden listings filter the property table and analytics.

## Property Governance

Admins can Mark LIVE, Mark DEMO, Hide Publicly, Archive, Unarchive, Verify, Suspend, Approve, Reject, Unhide, and Hide properties inside their assigned city. Bulk actions show a confirmation before changing selected records and write audit logs.

Owner edits to protected fields such as photos, name, address, location, locality, city, state, and coordinates enter the Property Update Approval queue. Approving applies the change. Rejecting keeps the live listing unchanged.

Hidden listings remain available in admin operations but do not appear publicly. Use Unhide or Mark LIVE to restore visibility. Archived listings can be returned to active operations with Unarchive.

## Leads And Chat Monitoring

Admins monitor visit leads, inquiry leads, callback leads, contact-share leads, suspicious chats, spam, and fraud signals. Phone sharing, callback intent, visit booking, contact reveal, and direct message engagement all create lead events.

For support calls, use Manage Users search with name, email, phone, MongoDB ObjectId, or displayed StayJi ID. User and owner detail panels show wishlists, leads, bookings, city, contact, and property counts so admins can quickly answer what the person searched, which properties they contacted, and what options exist near a filtered locality.

## Move-In Verification

Approve rewards only after proof is checked, the property is valid, owner confirmation is present, and the move-in is genuine. Verified move-ins create cashback eligibility for users and commission due for owners.

## Finance

The finance panel shows pending payouts, approved payouts, paid payouts, owner commission due, referral amount, lead amount, conversion amount, and payment status. Payouts should move from Pending to Approved to Paid only after verification.

## Reviews, Notifications, And Audit

Admins moderate reviews, manage fake reviews, reply through operational workflows, and use notifications to jump to the affected property, user, owner, lead, payout, or move-in. Audit logs store who changed what, previous state, new state, timestamp, and scope.

## Approval Mix

Approval mix is the dashboard chart that compares Pending, Live, and Inactive/Hidden listings. It helps the Admin understand how much review work is waiting, how much inventory is public, and how much supply is hidden or inactive.

## Password Security

Passwords are stored as bcrypt hashes in `userMaster.userPassword`. They cannot be decrypted. Admins reset passwords by replacing the hash with a new hashed password and forcing the user to log in again.
## City Admin Operating Rules

- Admin accounts are created by trusted launch operators for Bangalore operations.
- City Admin dashboards are scoped to assigned city users, owners, properties, leads, move-ins, payouts, and protected update requests.
- Bulk property workflows support Mark LIVE, Mark DEMO, Hide Publicly, Archive, Unarchive, Verify, and Suspend. Hidden properties can be made visible again with Unhide, Unarchive, or Mark LIVE.
- Move-in rewards require owner confirmation first, then admin approval. Approved move-ins create cashback and commission records.
- Protected owner edits show previous values and requested values before approval.
- Manage Users filters are intended for owners and users in Bangalore; admin account changes should stay restricted to trusted Admin users.
- Password updates for the logged-in admin are available from Dashboard -> Profile. See `docs/SECURITY_AND_PASSWORDS.md`.
