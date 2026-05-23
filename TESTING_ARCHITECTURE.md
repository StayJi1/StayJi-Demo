# StayJi Production QA Architecture

## Release Gate

StayJi should be considered production-ready only when these flows pass together:

- User discovery: locality pages, search, filters, compare, wishlist, inquiry, callback, visit booking, notifications, and move-in confirmation.
- Vendor operations: listing create/edit, occupancy correction, lead quality, visit requests, conversion marking, admin messages, analytics, and notifications.
- Admin control: user/vendor search by ObjectId/email/phone/name/status, property moderation, user suspension, vendor verification, move-in verification, cashback/commission review, private messaging, and SEO content moderation.
- Privacy: wishlist analytics must not reveal private contact details; qualified leads should form only from callback approval, visit booking, chat engagement, or contact reveal.
- SEO: locality pages, FAQ details, blog details, recommendation details, schema markup, breadcrumbs, internal links, canonical URLs, sitemap, and robots.txt.
- MongoDB integrity: ObjectId search, active/inactive status, verification status, lead counts, visit counts, wishlist counts, occupancy fields, analytics summaries, created/updated timestamps, and admin-only internal fields.

## Role-Based QA

User testing verifies trust and conversion: property discovery, locality trust, FAQ/blog education, privacy protection, dashboard usefulness, notifications, and understandable move-in verification.

Vendor testing verifies lead value: listing management, occupancy updates, inquiries, visits, conversions, analytics, and admin communication.

Admin testing verifies operational control: moderation, fraud signals, MongoDB-linked profile visibility, bulk table actions, SEO content, user/vendor status changes, lead tracking, and conversion review.

## Marketplace Flow QA

1. User discovers a property through locality/search/SEO.
2. User sends inquiry, callback, visit request, or chat.
3. Contact remains protected until a qualified lead event exists.
4. Vendor receives lead and can respond.
5. Visit scheduling and notifications update.
6. User submits move-in confirmation.
7. Admin verifies or flags conversion.
8. Vendor commission, user cashback, analytics, and dashboards update from the same operational record.

## Admin Table QA

Every admin/vendor table should expose S.No, sorting, local advanced search, filters where applicable, CSV export, row selection, bulk actions, status indicators, pagination, sticky headers, and horizontal overflow protection for mobile/tablet.

## Enterprise Governance QA

Official roles are `User`, `Owner`, `Admin`, and `Super Admin`. Public login must not admit admin accounts; `/admin-login` is restricted to Admin; `/super-admin-login` is restricted to Super Admin and must remain hidden from navbar/sitemap with `noindex,nofollow`.

Owner governance requires signup, pending approval, admin verification, approval/rejection/suspension, agreement acceptance, and property submission unlock. Each property still requires separate approval before public visibility.

Super Admin QA verifies regional admin creation, permission assignment, city/state scope, admin suspension, role conversion, dummy-to-real controls, commission updates, audit log creation, and real/demo/combined analytics separation.

Dummy data must never be hard deleted during transition. Test `isDummy`, `isVerified`, and `status` across users, owners, properties, leads, reviews, analytics, and locality-level visibility controls.

## SEO Content QA

Every FAQ/blog/recommendation/locality card should provide summary preview, expandable preview, Read More navigation, a dedicated detail page, breadcrumbs, schema markup, related properties, related blogs, related FAQs, recommendations, and internal links.
