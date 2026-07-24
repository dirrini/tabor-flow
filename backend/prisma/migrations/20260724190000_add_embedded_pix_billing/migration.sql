ALTER TABLE "Tenant"
ADD COLUMN "asaasCustomerId" TEXT;

ALTER TABLE "BillingCheckout"
ADD COLUMN "entitlementAppliedAt" TIMESTAMP(3),
ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'CARD';

UPDATE "BillingCheckout"
SET "entitlementAppliedAt" = "updatedAt"
WHERE status = 'PAID';

CREATE UNIQUE INDEX "Tenant_asaasCustomerId_key"
ON "Tenant"("asaasCustomerId");
