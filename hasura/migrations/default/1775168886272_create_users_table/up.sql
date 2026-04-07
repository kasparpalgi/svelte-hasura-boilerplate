-- Drop old table first (boilerplate reset)
DROP TABLE IF EXISTS "public"."users";

-- Auth.js compatible users table
CREATE TABLE "public"."users" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  "name" text,
  "email" text UNIQUE,
  "emailVerified" timestamptz,
  "image" text,
  "password" text,
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

-- WebAuthn passkey credentials (Windows Hello, Touch ID, FaceID, fingerprint)
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
