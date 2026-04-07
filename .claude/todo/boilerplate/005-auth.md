# Task: Auth Setup

## Original Requirement
See my another project ../svelte-todo-kanban/ and how I have set up there authentication with auth.js. Analys how it is done there, think how it could be done more clenly, simply and easily for this template. Plan at this stagein this file how to implement. 

Email and password send is easy but not very handy. Google auth is good but needs Cloud setup. Maybe possible Windows hello and Mac aquivalent? Fingerprint, face, pattern whatever user has set up? 

Username/password also option.

---

## Analysis

### Reference project (svelte-todo-kanban) review

**What works well:**
- `HasuraAdapter` + JWT strategy combo
- `/api/auth/token` endpoint generating Hasura-compatible JWTs
- Zod validation schemas in `src/lib/schemas/auth.ts`
- Security handle in hooks for route guards
- Conditional test provider in non-production

**What to improve for the boilerplate:**
- Inline GraphQL strings inside `hooks.server.ts` → use `serverRequest` from `server-client.ts`
- All providers hardcoded active → make Google & Nodemailer conditional on env vars
- Missing **WebAuthn/Passkeys** (Windows Hello, Touch ID, FaceID) — the answer to the "Windows Hello / Mac equivalent" question
- `console.log` debug calls left in production callbacks
- Token refresh logic is Google-specific but runs for all providers

### WebAuthn / Passkeys answer
`@auth/sveltekit/providers/webauthn` is already installed (visible in `node_modules`). It enables **passwordless login using device biometrics** — Windows Hello, Touch ID, Face ID, fingerprint scanner — with zero cloud setup. Requires an `authenticators` table in the DB and HTTPS in production (localhost works in dev).

### Auth providers to implement
| Provider | Always on? | Requirement |
|---|---|---|
| **Passkeys (WebAuthn)** | ✅ Yes | `authenticators` DB table |
| **Google OAuth** | ❌ Optional | `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` env vars |
| **Email + Password** | ✅ Yes | bcrypt, `password` column on users |
| **Magic Link (Nodemailer)** | ❌ Optional | `EMAIL_SERVER_HOST` etc env vars |

### DB schema: what changes
Current boilerplate users table (`uuid`, `name`, `email`, `created_at`) is incompatible with `@auth/hasura-adapter` which requires `id`, `emailVerified`, `image`. Strategy: **replace** the current migration with a clean auth schema migration.

### Packages to add
- `jsonwebtoken` + `@types/jsonwebtoken` — JWT token endpoint
- `bcryptjs` + `@types/bcryptjs` — password hashing

---

## Affected files

- `hasura/migrations/default/` — replace or extend users migration; new auth schema migration
- `hasura/metadata/databases/default/tables/` — public_users, public_accounts, public_verification_tokens, public_authenticators yamls
- `src/hooks.server.ts` — create (doesn't exist yet)
- `src/app.d.ts` — add session/locals type augmentations
- `src/lib/server/password.ts` — create
- `src/lib/schemas/auth.ts` — create
- `src/routes/api/auth/token/+server.ts` — create
- `src/routes/signin/+page.svelte` — create
- `src/routes/signout/+server.ts` — create
- `src/lib/components/auth/LoginForm.svelte` — create
- `src/routes/+layout.server.ts` — create (expose session)
- `.env.example` — add auth vars

---

## Implementation Plan

### 1. Install missing packages
```bash
npm install jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs
```

### 2. Hasura: replace users migration + add auth schema

**Replace** `hasura/migrations/default/1775168886272_create_users_table/up.sql` with:
```sql
-- Drop old table first
DROP TABLE IF EXISTS "public"."users";

-- Auth.js compatible users table
CREATE TABLE "public"."users" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text,
  "email" text UNIQUE,
  "emailVerified" timestamptz,
  "image" text,
  "password" text,              -- nullable: null for OAuth-only users
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

-- OAuth linked accounts
CREATE TABLE "public"."accounts" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" bigint,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  "userId" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("provider", "providerAccountId")
);

-- Magic link / email verification tokens
CREATE TABLE "public"."verification_tokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamptz NOT NULL,
  PRIMARY KEY ("identifier", "token")
);

-- WebAuthn passkey credentials (Windows Hello, Touch ID, etc.)
CREATE TABLE "public"."authenticators" (
  "credentialID" text NOT NULL PRIMARY KEY,
  "userId" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "providerAccountId" text NOT NULL,
  "credentialPublicKey" text NOT NULL,
  "counter" integer NOT NULL DEFAULT 0,
  "credentialDeviceType" text NOT NULL,
  "credentialBackedUp" boolean NOT NULL DEFAULT false,
  "transports" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
```

Update corresponding `down.sql`:
```sql
DROP TABLE IF EXISTS "public"."authenticators";
DROP TABLE IF EXISTS "public"."verification_tokens";
DROP TABLE IF EXISTS "public"."accounts";
DROP TABLE IF EXISTS "public"."users";
```

### 3. Hasura: metadata permissions

**`hasura/metadata/databases/default/tables/public_users.yaml`** — replace with:
```yaml
table:
  name: users
  schema: public
array_relationships:
  - name: accounts
    using:
      foreign_key_constraint_on:
        column: userId
        table:
          name: accounts
          schema: public
  - name: authenticators
    using:
      foreign_key_constraint_on:
        column: userId
        table:
          name: authenticators
          schema: public
insert_permissions:
  - role: user
    permission:
      check: {}
      columns: [id, name, email, emailVerified, image, created_at, updated_at]
select_permissions:
  - role: anonymous
    permission:
      columns: [id, name, image]
      filter: {}
  - role: user
    permission:
      columns: [id, name, email, emailVerified, image, created_at, updated_at]
      filter: {}
update_permissions:
  - role: user
    permission:
      columns: [name, email, image, updated_at]
      filter: {}
      check:
        id:
          _eq: X-Hasura-User-Id
delete_permissions:
  - role: user
    permission:
      filter:
        id:
          _eq: X-Hasura-User-Id
```

**`hasura/metadata/databases/default/tables/public_accounts.yaml`** — create:
```yaml
table:
  name: accounts
  schema: public
object_relationships:
  - name: user
    using:
      foreign_key_constraint_on: userId
insert_permissions:
  - role: user
    permission:
      check:
        userId:
          _eq: X-Hasura-User-Id
      columns: [id, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, userId, created_at, updated_at]
select_permissions:
  - role: user
    permission:
      columns: [id, type, provider, providerAccountId, expires_at, scope, created_at, updated_at, userId]
      filter:
        userId:
          _eq: X-Hasura-User-Id
delete_permissions:
  - role: user
    permission:
      filter:
        userId:
          _eq: X-Hasura-User-Id
```

**`hasura/metadata/databases/default/tables/public_verification_tokens.yaml`** — create:
```yaml
table:
  name: verification_tokens
  schema: public
```

**`hasura/metadata/databases/default/tables/public_authenticators.yaml`** — create:
```yaml
table:
  name: authenticators
  schema: public
object_relationships:
  - name: user
    using:
      foreign_key_constraint_on: userId
select_permissions:
  - role: user
    permission:
      columns: [credentialID, userId, credentialDeviceType, credentialBackedUp, created_at]
      filter:
        userId:
          _eq: X-Hasura-User-Id
delete_permissions:
  - role: user
    permission:
      filter:
        userId:
          _eq: X-Hasura-User-Id
```

**`hasura/metadata/databases/default/tables/tables.yaml`** — add the new tables:
```yaml
- "!include public_accounts.yaml"
- "!include public_authenticators.yaml"
- "!include public_users.yaml"
- "!include public_verification_tokens.yaml"
```

Apply with: `cd hasura && hasura metadata apply && hasura migrate apply --all-databases`

### 4. Environment variables

Update `.env.example`:
```env
# Public environment variables (exposed to client)
PUBLIC_API_ENV="development"
PUBLIC_API_ENDPOINT="https://your-hasura.example.com/v1/graphql"
PUBLIC_API_ENDPOINT_DEV="http://localhost:3001/v1/graphql"

# Server-side only
API_ENDPOINT="https://your-hasura.example.com/v1/graphql"
API_ENDPOINT_DEV="http://localhost:3001/v1/graphql"
HASURA_ADMIN_SECRET="your_secure_password_here"

# Auth.js — generate with: openssl rand -base64 32
AUTH_SECRET="your_auth_secret_here"
AUTH_URL="http://localhost:5173"  # your app URL (required for Passkeys)

# Optional: Google OAuth (leave blank to disable)
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# Optional: Magic Link via email (leave blank to disable)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""
```

### 5. Password utility

Create `src/lib/server/password.ts`:
```typescript
/** @file src/lib/server/password.ts */
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### 6. Zod schemas

Create `src/lib/schemas/auth.ts`:
```typescript
/** @file src/lib/schemas/auth.ts */
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8)
  .max(100)
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number');

export const signupSchema = z
  .object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    password: passwordSchema,
    confirmPassword: z.string()
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type SignupData = z.infer<typeof signupSchema>;
export type LoginData = z.infer<typeof loginSchema>;
```

### 7. App type augmentations

Update `src/app.d.ts`:
```typescript
import '@auth/sveltekit';

declare global {
  namespace App {
    interface Locals {
      auth: import('@auth/sveltekit').SvelteKitAuthConfig['callbacks'] extends { session: infer S } ? S : never;
    }
  }
}

declare module '@auth/core/types' {
  interface Session {
    hasuraRole?: string;
  }
}

export {};
```

### 8. Main auth config — hooks.server.ts

Create `src/hooks.server.ts`:

Key design decisions vs kanban reference:
- No inline GraphQL strings — use `serverRequest` from `server-client.ts`
- Google and Nodemailer providers only added when env vars present (no hard import errors)
- No Google token refresh logic (credentials/passkeys don't need it)
- Security handle redirects unauthenticated users from protected routes to `/signin`

```typescript
/** @file src/hooks.server.ts */
import { SvelteKitAuth } from '@auth/sveltekit';
import { HasuraAdapter } from '@auth/hasura-adapter';
import Credentials from '@auth/sveltekit/providers/credentials';
import Passkey from '@auth/sveltekit/providers/passkey';
import { sequence } from '@sveltejs/kit/hooks';
import {
  AUTH_SECRET,
  AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET,
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD,
  EMAIL_FROM,
  API_ENDPOINT,
  API_ENDPOINT_DEV,
  HASURA_ADMIN_SECRET
} from '$env/static/private';
import { PUBLIC_API_ENV } from '$env/static/public';
import { hashPassword, verifyPassword } from '$lib/server/password';
import { signupSchema, loginSchema } from '$lib/schemas/auth';
import { serverRequest } from '$lib/graphql/server-client';
import type { Handle } from '@sveltejs/kit';
import type { Provider } from '@auth/sveltekit/providers';

const apiEndpoint = PUBLIC_API_ENV === 'production' ? API_ENDPOINT : API_ENDPOINT_DEV;

const providers: Provider[] = [
  // Passkeys: Windows Hello, Touch ID, FaceID, fingerprint — no cloud setup needed
  Passkey,

  // Email + Password (always on)
  Credentials({
    id: 'credentials',
    name: 'Email and Password',
    credentials: {
      email: { type: 'email' },
      password: { type: 'password' },
      mode: { type: 'text' },   // 'login' | 'signup'
      name: { type: 'text' }    // signup only
    },
    async authorize(credentials) {
      const { email, password, mode, name } = credentials as Record<string, string>;
      if (!email || !password) return null;

      if (mode === 'signup') {
        const parsed = signupSchema.safeParse({ email, password, confirmPassword: password, name });
        if (!parsed.success) return null;

        // Check existing user via server-side GraphQL
        const existing = await serverRequest<{ users: { id: string }[] }>(
          `query CheckEmail($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id } }`,
          { email }
        );
        if (existing.users.length > 0) return null;

        const hashed = await hashPassword(password);
        const created = await serverRequest<{ insert_users_one: { id: string; name: string; email: string; image: string | null } }>(
          `mutation CreateUser($email: String!, $name: String!, $password: String!) {
            insert_users_one(object: { email: $email, name: $name, password: $password }) {
              id name email image
            }
          }`,
          { email, name, password: hashed }
        );
        const u = created.insert_users_one;
        return { id: u.id, name: u.name, email: u.email, image: u.image };
      }

      // Login
      const loginParsed = loginSchema.safeParse({ email, password });
      if (!loginParsed.success) return null;

      const found = await serverRequest<{ users: { id: string; name: string; email: string; image: string | null; password: string | null }[] }>(
        `query GetUser($email: String!) { users(where: { email: { _eq: $email } }, limit: 1) { id name email image password } }`,
        { email }
      );
      const user = found.users[0];
      if (!user?.password) return null;
      if (!await verifyPassword(password, user.password)) return null;

      return { id: user.id, name: user.name, email: user.email, image: user.image };
    }
  })
];

// Optional: Google OAuth (only added when env vars provided)
if (AUTH_GOOGLE_ID && AUTH_GOOGLE_SECRET) {
  const { default: Google } = await import('@auth/sveltekit/providers/google');
  providers.push(Google({ clientId: AUTH_GOOGLE_ID, clientSecret: AUTH_GOOGLE_SECRET }));
}

// Optional: Magic link via email
if (EMAIL_SERVER_HOST) {
  const { default: Nodemailer } = await import('@auth/sveltekit/providers/nodemailer');
  providers.push(Nodemailer({
    server: {
      host: EMAIL_SERVER_HOST,
      port: Number(EMAIL_SERVER_PORT),
      auth: { user: EMAIL_SERVER_USER, pass: EMAIL_SERVER_PASSWORD }
    },
    from: EMAIL_FROM
  }));
}

export const { handle: authHandle } = SvelteKitAuth({
  adapter: HasuraAdapter({ endpoint: apiEndpoint, adminSecret: HASURA_ADMIN_SECRET }),
  providers,
  secret: AUTH_SECRET,
  trustHost: true,
  experimental: { enableWebAuthn: true },
  session: { strategy: 'jwt', maxAge: 90 * 24 * 60 * 60 },
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.userId = user.id;
        token.hasuraRole = 'user';
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.userId) {
        session.user.id = token.userId as string;
        session.hasuraRole = token.hasuraRole as string;
      }
      return session;
    }
  }
});

// Route guard: redirect unauthenticated users from protected routes
const securityHandle: Handle = async ({ event, resolve }) => {
  const session = await event.locals.auth();
  const path = event.url.pathname;
  const isPublic = path === '/' || path.startsWith('/signin') || path.startsWith('/api') || path.startsWith('/auth');

  if (!session && !isPublic) {
    return new Response(null, { status: 302, headers: { Location: '/signin' } });
  }

  return resolve(event);
};

export const handle = sequence(authHandle, securityHandle);
```

> **Note:** The inline query strings in Credentials.authorize are intentional — these run only server-side and are not part of the client GraphQL schema. Alternatively, add `GET_USER_BY_EMAIL`, `CHECK_EMAIL`, `CREATE_USER` to `documents.ts` and use `serverRequest` with the generated constants. For a boilerplate, inline strings keep the auth file self-contained.

### 9. JWT token endpoint

Create `src/routes/api/auth/token/+server.ts`:
```typescript
/** @file src/routes/api/auth/token/+server.ts */
import { AUTH_SECRET } from '$env/static/private';
import { json } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
  const session = await locals.auth();

  if (!session?.user?.id) {
    return json({ error: 'Not authenticated' }, { status: 401 });
  }

  const token = jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-default-role': 'user',
        'x-hasura-user-id': session.user.id
      },
      sub: session.user.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24
    },
    AUTH_SECRET,
    { algorithm: 'HS256' }
  );

  return json({ token }, {
    headers: { 'Cache-Control': 'private, max-age=3300' }
  });
};
```

### 10. Sign in page

Create `src/routes/signin/+page.svelte` (simple wrapper):
```svelte
<script>
  import LoginForm from '$lib/components/auth/LoginForm.svelte';
</script>

<svelte:head><title>Sign In</title></svelte:head>
<div class="container flex h-screen w-screen items-center justify-center">
  <LoginForm />
</div>
```

Create `src/lib/components/auth/LoginForm.svelte`:
- **Passkeys button** (primary, always shown)
- **Google button** (shown when `PUBLIC_HAS_GOOGLE_AUTH` env var is truthy)
- **Email/Password form** with login/signup toggle
- **Magic link option** (shown when `PUBLIC_HAS_EMAIL_AUTH` env var is truthy)
- Two new public env vars: `PUBLIC_HAS_GOOGLE_AUTH=true` and `PUBLIC_HAS_EMAIL_AUTH=true` to control UI visibility

### 11. Sign out route

Create `src/routes/signout/+server.ts`:
```typescript
import { signOut } from '@auth/sveltekit/client';
// Or use the server-side approach:
import { redirect } from '@sveltejs/kit';
export async function POST({ locals }) {
  await locals.auth.signOut();
  throw redirect(302, '/signin');
}
```

### 12. Layout server load

Create `src/routes/+layout.server.ts`:
```typescript
/** @file src/routes/+layout.server.ts */
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return { session: await locals.auth() };
};
```

### 13. Tests

Create `tests/e2e/auth.setup.ts`:
- Log in with credentials provider (test user)
- Save auth state to `playwright/.auth/user.json`

Create `tests/e2e/auth.spec.ts`:
- Unauthenticated → redirected to /signin
- Sign in with email/password → lands on /
- Sign out → redirected to /signin

---

## Changes Summary

| File | Action |
|------|--------|
| `hasura/migrations/default/1775168886272_create_users_table/up.sql` | Replace |
| `hasura/migrations/default/1775168886272_create_users_table/down.sql` | Replace |
| `hasura/metadata/databases/default/tables/public_users.yaml` | Replace |
| `hasura/metadata/databases/default/tables/public_accounts.yaml` | Create |
| `hasura/metadata/databases/default/tables/public_verification_tokens.yaml` | Create |
| `hasura/metadata/databases/default/tables/public_authenticators.yaml` | Create |
| `hasura/metadata/databases/default/tables/tables.yaml` | Update |
| `.env.example` | Update |
| `src/hooks.server.ts` | Create |
| `src/app.d.ts` | Update |
| `src/lib/server/password.ts` | Create |
| `src/lib/schemas/auth.ts` | Create |
| `src/routes/api/auth/token/+server.ts` | Create |
| `src/routes/signin/+page.svelte` | Create |
| `src/routes/signout/+server.ts` | Create |
| `src/lib/components/auth/LoginForm.svelte` | Create |
| `src/routes/+layout.server.ts` | Create |
| `tests/e2e/auth.setup.ts` | Create |
| `tests/e2e/auth.spec.ts` | Create |

---

## Open Questions / Blockers

1. **WebAuthn requires `AUTH_URL`** env var set to the app's full URL (e.g. `http://localhost:5173`). Must be documented in `.env.example`.
2. **`experimental: { enableWebAuthn: true }`** flag — Auth.js v1.x treats Passkeys as experimental. Verify the exact API for the installed `@auth/sveltekit` version before implementing.
3. **`password` column not exposed via GraphQL** — the `password` column should NOT be in select permissions for `user` role to prevent it being fetched by client queries. Only server-side admin queries should access it. This is handled by omitting it from the metadata permissions above.
4. **existing data** — boilerplate has no real data so dropping and recreating the `users` table is safe. Confirm the Hasura migration ordering (the existing migration timestamp `1775168886272` will be reused).
5. **sign-out UX** — Auth.js v1 with SvelteKit uses a POST form action for sign-out on the client. Decide: server route vs form action vs client-side `signOut()` call.

---

## Verification

- [ ] `hasura migrate apply` succeeds with new schema
- [ ] `hasura metadata apply` succeeds
- [ ] `npm run check` passes
- [ ] Passkeys prompt appears on sign-in page in browser
- [ ] Email/password login and signup work
- [ ] Google button hidden when `PUBLIC_HAS_GOOGLE_AUTH` is falsy
- [ ] Unauthenticated user gets redirected to /signin
- [ ] `/api/auth/token` returns valid Hasura JWT after login
- [ ] `npm test` passes
