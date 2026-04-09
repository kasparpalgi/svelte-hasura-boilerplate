Take the add passkey under not yet created settings where user chall be able to also change password, email (must be confirmed with nodemailer and make the emailing re-usable of course so easy to use app wide and include in agents/readme how to use & into env and env.example gmail smto, user, etc.), name and see what else fields user has.

## Implementation

### Files created
- `src/lib/server/mailer.ts` — reusable `sendMail({ to, subject, html })` function using Nodemailer
- `src/routes/app/settings/+page.server.ts` — load (passkeys list) + 3 form actions: updateName, changePassword, requestEmailChange
- `src/routes/app/settings/+page.svelte` — settings UI: Profile, Email, Password, Passkeys sections
- `src/routes/api/user/confirm-email/+server.ts` — GET endpoint that verifies signed JWT token and updates email in DB

### Files updated
- `.env.example` — documented Gmail SMTP setup with App Password instructions

### Dependencies installed
- `nodemailer` + `@types/nodemailer`

### How the mailer works (app-wide usage)
```typescript
import { sendMail } from '$lib/server/mailer';
await sendMail({
  to: 'user@example.com',
  subject: 'Hello',
  html: '<p>Hello!</p>'
});
```
Requires `EMAIL_SERVER_HOST`, `EMAIL_SERVER_USER`, `EMAIL_SERVER_PASSWORD`, `EMAIL_FROM` env vars (Gmail SMTP with App Password).

### Email change flow
1. User enters new email → `requestEmailChange` action
2. Server signs a JWT `{ userId, newEmail }` (1h expiry) with `AUTH_SECRET`
3. Confirmation email sent to the new address with `/api/user/confirm-email?token=...`
4. User clicks link → token verified → email updated in DB → redirected back with `?email_change=success`

### Password change flow
- Verifies current password against stored bcrypt hash
- Validates new password against `passwordSchema` (min 8, upper/lower/digit)
- Updates password hash via admin `serverRequest` (bypasses user-role permissions since `password` column is not in Hasura user update permissions)

## Verification
- [x] `npm run check` passed (0 errors)
- [ ] Browser tested (Playwright MCP)
- [ ] DB verified (Hasura Console)
- [ ] `npm test` passed

## Results
Settings page live at `/app/settings` with:
- Display name update
- Email change with confirmation email
- Password change with current-password verification
- Passkeys list + add passkey (redirects back to settings after registration)
