# Admin Bootstrap — Security Note

**MavunoTrust Admin Account Creation**

## Rules

1. `POST /api/auth/register` CANNOT create an ADMIN account.
   The endpoint enforces `role !== ADMIN` at the service layer.

2. A normal user CANNOT elevate their role to ADMIN by sending
   `role: "ADMIN"` in any API request body.

3. Admin accounts must be created via a secure, controlled server-side
   process that is NOT exposed as a public API endpoint.

## How to bootstrap the first admin (future implementation)

Option A — Secure CLI script (recommended for production):
```
node scripts/createAdmin.js --email admin@yourdomain.com --name "Admin Name"
```
This script must:
- Run only with direct server access (not via HTTP)
- Require strong password
- Log the action to AuditLog
- Never expose the password in output

Option B — Direct MongoDB seed script (development only):
```
node scripts/seedAdmin.js  # dev/staging only, never production
```

Option C — Admin promotion by existing admin:
- Once one admin exists, they can promote other users via
  a secure admin-only endpoint (future: PATCH /api/admin/users/:id/role)
- Only ADMIN role can access this endpoint
- All role changes are logged in AuditLog

## Current Status
No admin accounts exist. This is correct for the initial foundation.
Implement admin bootstrap script in a future step when admin functionality is built.
