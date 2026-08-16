# StayJi User Manual

## Dashboard

Your dashboard is your personal operations page. It shows wishlisted stays, visit bookings, inquiry history, comparison history, recently viewed properties, saved searches, rental history, notifications, chats, and StayJi Coins.

Every card is clickable. Click a dashboard card to open the related section, view the property, open comparison, rerun a saved search, or check a notification.

## Visits

Visit bookings show pending, approved, rejected, cancelled, completed, and upcoming visits. Each visit stores property details, scheduled date and time, move-in preference, owner confirmation state, and admin tracking state.

You can cancel or reschedule a visit from the dashboard. Choose a new date/time and click Reschedule; click Cancel to move the booking to Cancelled. If you request the same property more than once, StayJi keeps the latest active visit in your dashboard so the list does not repeat the same PG again and again.

## Inquiries And Chat

When you message an owner or request a callback, StayJi stores the inquiry and chat in the database. The owner is notified, admins can monitor the lead, and your inquiry history shows replies, follow-up status, and the related property.

If a phone number, WhatsApp/contact request, callback request, visit booking, or contact reveal happens, StayJi marks it as a generated lead.

Message owner privately creates a private StayJi chat record for the owner and a trackable lead event. Phone numbers remain hidden until the lead is verified through StayJi workflows.

## Comparisons, Views, And Searches

Use Compare to save properties for side-by-side review. Recently viewed properties are stored with timestamp, city, locality, and visit interest. Saved searches store city, locality, budget, sharing type, nearby preferences, and active filters. You can save a search from the property search page, then rerun or delete it from the dashboard.

## StayJi Coins And Payouts

Coins are added only after all three conditions are complete: admin verification, owner confirmation, and successful move-in. After coins are approved, submit a payout request using your UPI ID, optional UPI QR, or optional bank details.

Payouts move through Pending, Approved, Paid, or Rejected states. Admins review payout requests before payment.

## Rental History And Reviews

After move-in approval, your rental history stores the joined property, owner confirmation, admin approval, cashback status, reward history, and review eligibility. You can rate and review properties after a visit or move-in using the live 1-to-5 star selector. Property pages show star ratings and helpful positive reviews first, with only a small number of negative reviews surfaced when present.

Amenities on property pages show the owner-selected amenities, custom features, meals, parking, AC, and matching icons/emoji so users can quickly scan what is actually available.

## Support

The Support card includes clickable email, phone, and WhatsApp options. Click `hello.stayji@gmail.com` to open a mail app, click `+91 79677 292` to start a phone call on supported devices, or click WhatsApp support to open a message to `9179677292`.

## Password Security

Passwords are stored in the database as bcrypt hashes, never as readable text. StayJi cannot decrypt a password. If you forget it, use the reset flow; the old password is replaced with a new bcrypt hash.

There is no safe "decrypt password" feature. Admins can reset a password, but they cannot read the previous password from the database.
## Dashboard Workflows

- Click Visit bookings, Inquiry history, Viewed properties, Saved searches, Rental history, Notifications, and Comparison history cards to jump to the correct live section.
- Message owner sends a private StayJi chat record to the owner and creates a trackable lead for admin dashboards.
- Request callback creates a callback lead for the property owner and admin tracking.
- Book visit saves the preferred visit date/time and move-in preference.
- After moving in, submit proof from the property page. Cashback coins are approved only after owner confirmation and admin verification.
- In StayJi Coins wallet, add UPI ID, optional bank details, and optional UPI QR image before requesting payout.
- Reviews can be submitted from the property detail page. The rating updates property ranking data used by admins.
- Password updates are available from Dashboard -> Profile. See `docs/SECURITY_AND_PASSWORDS.md`.
