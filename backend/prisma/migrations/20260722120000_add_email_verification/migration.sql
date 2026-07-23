ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

-- Existing accounts predate email verification and must retain access.
UPDATE "User" SET "emailVerifiedAt" = CURRENT_TIMESTAMP;
