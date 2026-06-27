# StayJi Bangalore MVP QA Report

Date: 2026-06-28

## Scope

Final pre-launch audit and stabilization pass for the Bangalore-only StayJi MVP across active frontend/backend launch paths: authentication, routing, role access, search/listing, property categories, compare, notifications, visits, messaging, owner property forms, and startup/build checks.

## Executive Summary

The active source now uses three live roles only: User, Owner, and Admin. No active Super Admin routes, guards, dashboard imports, or source-level role checks were found in `pgfinder-frontend/src`, `pgfinder-backend/controllers`, `pgfinder-backend/models`, `app.js`, or `server.js`.

This pass fixed four launch-impacting issues:

- Compare was implemented but unreachable because `/compare` redirected to listings.
- Listing cards had no compare action, so the compare list could not be built from browsing.
- Notification APIs were publicly query-scoped and could expose or mark another account's notifications.
- Login/signup form state was lost when users opened Terms or Privacy during entry.

## Findings And Fixes

| Area | Finding | Fix | Status |
| --- | --- | --- | --- |
| Compare | `/compare` redirected to `/properties`. | Restored the route to `ComparePage`. | Fixed |
| Compare | No listing-card control populated `stayjiCompare`. | Added 3-property compare selection, persistent local storage, visible selected count, and link to Compare. | Fixed |
| Compare | Compare table did not explicitly include Property Type and used Occupancy wording. | Added Property Type and Availability rows. | Fixed |
| Notifications | `/client/notifications` and `/api/notifications` accepted arbitrary `userId`/`role` query params. | Added JWT auth and account-bound filtering on list/read/mark-read. | Fixed |
| User dashboard notifications | Overview mixed user-role/global notifications into every user history. | Restricted overview notifications to the logged-in user. | Fixed |
| Registration/Login | Terms/Privacy navigation unmounted form pages and lost typed state. | Added session-scoped form state persistence until successful submission. | Fixed |
| Owner categories | Owner property form only exposed PG, Hostel, Co-living. | Added PG, Hostel, Flat, House, Apartment, Villa, Co-living. | Fixed |
| Sharing options | Owner defaults stopped at Four sharing. | Added Five sharing, Dormitory, and Other rows while preserving custom sharing rows. | Fixed |
| Search filters | Listing filters did not expose all launch categories/sharing options. | Added category and sharing filters and forwarded them to backend filtering before pagination. | Fixed |

## Verification

- `node --check pgfinder-backend/controllers/clientController.js` passed.
- `npm run lint` in `pgfinder-frontend` passed.
- `npm run build` in `pgfinder-frontend` passed.
- `git diff --check` passed.
- Frontend startup verified with Vite at `http://127.0.0.1:5173/`.
- Backend startup outside sandbox connected to MongoDB, but the attempted process could not bind because port `3000` was already in use by local `node` process PID `4804`.

## Remaining Manual QA

These require browser sessions with seeded User, Owner, and Admin accounts:

- User: register, login, search, open property, gallery, save, compare, message owner, book visit, dashboard, logout.
- Owner: login, dashboard counts, add/edit property, images, categories, sharing rows, leads, visits, messages, logout.
- Admin: login, dashboard cards, users, owners, properties, approvals, reject/restore/edit/delete, messages, visits, analytics.
- Notifications: confirm User, Owner, and Admin only see their own account notifications.
- Responsive: desktop, laptop, tablet, and mobile visual pass for listing cards, compare table, auth forms, owner forms, dashboards, and notification menu.

## Launch Readiness Score

Source/build readiness: 87/100.

The score is held below 90 because full role-by-role manual browser QA and backend port ownership validation still need to be completed on the actual launch machine.
