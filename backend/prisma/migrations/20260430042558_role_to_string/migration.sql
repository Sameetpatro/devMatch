-- Convert User.role from enum -> varchar in place, preserving data.
-- The USING clause casts existing enum values to text so no rows are lost.

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE VARCHAR(60) USING "role"::text;

-- The Role enum is no longer referenced; safe to drop.
DROP TYPE "Role";

-- Recreate the index on role (Prisma drops/re-adds it during type change).
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
