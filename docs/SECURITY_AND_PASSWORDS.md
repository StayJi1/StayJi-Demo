# StayJi Security And Password Operations

## Where Passwords Are Saved

User, owner, admin, and super admin passwords are stored in MongoDB in the `usermasters` collection, inside the `userPassword` field.

The application hashes passwords before saving them. The hashing helpers are in:

- `pgfinder-backend/utils/security.js`
- `pgfinder-backend/controllers/clientController.js`

## Can A Password Be Decrypted From MongoDB?

No. StayJi passwords are not meant to be decrypted.

They are saved as one-way hashes. A one-way hash lets the backend check whether a login password is correct, but it does not let anyone recover the original password. This is the correct security design.

If a user, owner, admin, or super admin forgets a password, use a reset flow:

- Logged-in account: Dashboard Profile -> Update login password.
- Forgot password: `requestPasswordReset` and `resetPasswordWithOtp`.
- Super admin reset for another account: Super Admin user management reset password workflow.

Operational answer: you cannot decrypt `userPassword`. To regain access, create a new temporary password through the reset workflow. The backend hashes that new password, saves the new hash, clears reset OTP fields, and forces old sessions to log in again.

## Password Rules

New passwords must be at least 8 characters and include:

- One uppercase letter
- One lowercase letter
- One number

## Admin And Super Admin Accounts

Admin accounts should be created only by Super Admin from the Super Admin account factory. Each Admin must be assigned a city and state.

City Admin scope:

- Can manage users, owners, leads, move-ins, property updates, and listings only for the assigned city.
- Cannot manage other admins or super admins.
- Cannot see data from another assigned city.

Super Admin scope:

- Can see all cities.
- Can create regional admins.
- Can launch cities, hide demo data, manage protected property update approvals, and review global audit logs.

## Password Change Flow

All roles use the same profile password change form:

1. Open Dashboard -> Profile.
2. Enter current password.
3. Enter new password and confirm it.
4. Submit.
5. The session is logged out after password change, so the person logs in again.

## Never Do This

- Do not store plain text passwords.
- Do not email existing passwords.
- Do not ask developers to decrypt `userPassword`.
- Do not manually edit MongoDB passwords unless you are writing a properly hashed value.
