# StayJi Super Admin Manual

## Scope

Super Admin has global governance over cities, admins, owners, users, properties, leads, payouts, commissions, reviews, moderation, dummy inventory, launch readiness, audit logs, and analytics.

## City Governance Tree

City rows are clickable. Selecting a city filters the global property table and exposes that city’s admins, properties, users, leads, analytics, finance, demo ratio, hidden listings, and launch readiness.

## Dummy-To-Real Transition

Show Demo makes sample listings visible for pre-launch discovery. Hide Demo removes demo inventory from public search. Launch City marks the city publicly live and keeps the local admin's property-level decisions intact. Reject/Pause City keeps admin operations available but removes that city from live user search until Super Admin launches it again.

## Property Control

Super Admin can Mark LIVE, Mark DEMO, Hide Publicly, Unhide, Archive, Unarchive, Verify, Suspend, Assign City, and Assign Admin. Hidden properties stay in operations but do not appear publicly.

## Governance Analytics

LIVE properties, real properties, demo properties, hidden properties, pending properties, and dummy ratio are dynamic clickable cards. Clicking a card filters the global listing workflow.

## Admin Account Factory

Super Admin creates Admin, Owner, and User accounts with permissions, city, state, verification state, and governance scope. Admin accounts get city-scoped permissions. Owner accounts start pending until verified.

Assign Admin attaches selected properties or city scope to an Admin account and records the operation in audit logs. Super Admin can move a city or properties to another Admin when responsibility changes.

## Finance And Rewards

Super Admin can review payout queues, commission due, referral amounts, lead charges, conversion charges, cashback, and payment status globally. Coins are approved only after admin verification, owner confirmation, and successful move-in.

## Audit Logs

Each audit log records the actor, action, entity, previous state, new state, city/state scope, timestamp, and metadata. Use audit logs to trace property launches, dummy transitions, account creation, password resets, and moderation actions.

## Password Security

Passwords are never decryptable. They are stored as bcrypt hashes in the user database. Resetting a password creates a new hash and invalidates old sessions. No admin should ask for or store a user’s plain-text password.
## Super Admin Governance Workflows

- City launch status rows are clickable. Selecting a city filters global listing workflow to that city.
- Launch City marks the city live for public users. Demo hiding can be controlled separately with Show demo/Hide demo workflows.
- Reject/Pause City stops the selected city from appearing in public user search while preserving admin-side work.
- Show demo in selected makes selected city demo listings visible again.
- Hide demo in selected archives demo listings for the selected city.
- Hidden properties can be restored through Unhide, Unarchive, Mark LIVE, or verified status workflows.
- Audit log actions are clickable and open full previous/updated value details.
- Super Admin can create regional Admin accounts and assign their city/state scope.
- Super Admin can monitor Admin work, reassign Admin responsibility, edit city scope, and override local decisions when needed.
- Password updates for the logged-in super admin are available from Dashboard -> Profile. See `docs/SECURITY_AND_PASSWORDS.md`.
