-- Add new contact columns. `phone` is required by the schema, but we add it
-- as nullable first so we can backfill existing rows before tightening the
-- constraint at the end.

ALTER TABLE "User"
  ADD COLUMN "phone"    VARCHAR(30),
  ADD COLUMN "linkedin" VARCHAR(200),
  ADD COLUMN "github"   VARCHAR(200),
  ADD COLUMN "telegram" VARCHAR(80);

-- Dummy backfill for the seeded users so the NOT NULL switch can succeed.
-- New users registering through the API must supply a real phone.
UPDATE "User" SET phone = '+91 9876543210', linkedin = 'https://linkedin.com/in/alice-fe',     github = 'https://github.com/alice-fe',     telegram = '@alice_fe'      WHERE email = 'alice@test.dev';
UPDATE "User" SET phone = '+91 9876543211', linkedin = 'https://linkedin.com/in/shikhar-be',   github = 'https://github.com/shikhar-be',   telegram = '@shikhar_be'    WHERE email = 'shikhar@gmail.com';
UPDATE "User" SET phone = '+91 9876543212', linkedin = 'https://linkedin.com/in/sameet-droid',  github = 'https://github.com/sameet-droid',  telegram = '@sameet_droid'  WHERE email = 'sameet@gmail.com';
UPDATE "User" SET phone = '+91 9876543213', linkedin = 'https://linkedin.com/in/joydeep-fe',   github = 'https://github.com/joydeep-fe',   telegram = '@joydeep_fe'    WHERE email = 'joydeep@gmail.com';
UPDATE "User" SET phone = '+91 9876543214', linkedin = 'https://linkedin.com/in/harsh-ml',     github = 'https://github.com/harsh-ml',     telegram = '@harsh_ml'      WHERE email = 'harsh@gmail.com';

-- Catch-all for any other rows (e.g. test users from earlier sessions).
UPDATE "User" SET phone = '+91 9999999999' WHERE phone IS NULL;

-- Now safe to enforce NOT NULL.
ALTER TABLE "User" ALTER COLUMN "phone" SET NOT NULL;
