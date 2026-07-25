# StayJi Owner Manual

## Dashboard

The owner dashboard shows properties, leads, inquiries, bookings, conversion rate, commission due, vacancy health, move-in conversions, guest feedback, and private admin messages. Dashboard cards open the related listing, lead, or operations section.

## Leads

My Leads is dynamic. It includes qualified leads, callback leads, visit leads, wishlist leads, interest messages, and move-in conversion leads. A lead is generated when a user messages, requests callback, shares contact details, books a visit, or reveals contact intent in chat.

Owner lead cards show student details allowed for that lead type, property context, preferred visit time, move-in preference, and conversion state. Repeated interest or visit activity from the same student for the same property is shown as the latest record only, so the lead queue stays readable.

## Visit Requests

Visit requests show pending, approved, rejected, completed, and cancelled visits. Approve a visit only when you can host the user at that time. Reject when the slot or property is unavailable. StayJi notifies the user and tracks the timeline.

## Property Management

Owners can update normal operational data such as rent, amenities, availability, vacant beds, occupancy, room availability, sharing availability, available-from date, and vacancy status.

Protected edits do not go live immediately. Property name, images, address, locality, city, state, coordinates, and location-sensitive details are submitted as update requests. Admin approval is required before those changes appear publicly.

Updating an already approved property no longer removes the live approved listing. Normal operational fields update immediately. Only protected fields wait in the admin approval queue. Delete/archive requests also require admin approval.

## Occupancy Quick Update

Use quick occupancy updates for vacant beds, room inventory, sharing availability, and vacancy status. This avoids editing the full listing and keeps public availability fresh.

Use the Quick edit action from My Properties when you only need to update availability, vacant beds, available-from date, or sharing availability. Use the full edit page when changing broader listing data.

## Per-Day Check-In

Per-day price is editable only after Allows per-day check-in is selected. If the checkbox is off, the daily price stays disabled and is not submitted.

## Move-In And Commission

When a user submits move-in proof, confirm Tenant joined successfully only after the tenant actually joins. Admin reward approval is blocked until owner confirmation is complete. Verified move-ins create commission due for the owner account and cashback eligibility for the user.

## Reviews And Feedback

Users can review after visits or move-in. Owners can reply to reviews. Admins can moderate fake, abusive, or suspicious reviews. Reviews influence property rating and ranking.

## Password And Phone Security

Owners can update passwords using the secure reset/change-password workflow. Phone numbers must be valid 10-digit mobile numbers for verification. Passwords are bcrypt hashed and cannot be decrypted.
## Owner Lead And Listing Workflows

- Dashboard stat cards open the related live workflow: properties, leads, commission queue, or vacancy controls.
- My Leads cards jump to visit requests, interest messages, and wishlist analytics.
- Approve or reject visit requests from Owner Leads.
- Mark converted only after genuine student conversion or verified move-in.
- Confirm tenant joined from Move-in conversions so admin can approve cashback and commission.
- Owners do not see user-side shortlist/message/book/compare controls on their own property page. They see owner controls that route to listing updates and leads.
- Protected listing changes such as name, images, address, city, locality, and coordinates go to admin approval before they appear publicly.
- Delete/archive property sends an admin approval request; the live listing is not removed until approval.
- Use property edit or occupancy controls for beds, vacancy status, available-from date, sharing availability, custom amenities, and room inventory.
- Password updates are available from Dashboard -> Profile. See `docs/SECURITY_AND_PASSWORDS.md`.
