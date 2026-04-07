INSERT INTO "public"."users" ("id", "name", "email", "password", "created_at", "updated_at")
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Test User',
  'test@example.com',
  '$2b$10$pyVN9Q.HTQwiu6W4USew.u1QPVFhm2twnAgmpIv3Db9e4wW03r29G',
  now(),
  now()
) ON CONFLICT ("email") DO NOTHING;
