CREATE TABLE "public"."users" (
  "uuid" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("uuid"),
  UNIQUE ("email")
);
