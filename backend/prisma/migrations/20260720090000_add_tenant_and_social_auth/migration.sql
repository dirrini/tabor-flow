CREATE TABLE "Tenant" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
INSERT INTO "Tenant" ("name", "slug") VALUES ('ProjectPulse', 'projectpulse');
ALTER TABLE "User" ADD COLUMN "tenantId" INTEGER;
ALTER TABLE "User" ADD COLUMN "googleSubject" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "Project" ADD COLUMN "tenantId" INTEGER;
UPDATE "User" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'projectpulse');
UPDATE "Project" SET "tenantId" = (SELECT "id" FROM "Tenant" WHERE "slug" = 'projectpulse');
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Project" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX "User_googleSubject_key" ON "User"("googleSubject");
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX "Project_tenantId_idx" ON "Project"("tenantId");
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "User_tenantId_email_key" ON "User"("tenantId", "email");
