INSERT INTO "public"."users" ("uuid", "name", "email", "created_at")
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Test User',
  'test@example.com',
  now()
) ON CONFLICT ("email") DO NOTHING;
