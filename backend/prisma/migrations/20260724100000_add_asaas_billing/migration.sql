ALTER TABLE "Tenant"
ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'INACTIVE';

CREATE TABLE "BillingCheckout" (
  "id" SERIAL NOT NULL,
  "tenantId" INTEGER NOT NULL,
  "asaasCheckoutId" TEXT NOT NULL,
  "externalReference" TEXT NOT NULL,
  "billingCycle" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "checkoutUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BillingCheckout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingWebhookEvent" (
  "id" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BillingWebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingCheckout_asaasCheckoutId_key"
ON "BillingCheckout"("asaasCheckoutId");

CREATE UNIQUE INDEX "BillingCheckout_externalReference_key"
ON "BillingCheckout"("externalReference");

CREATE INDEX "BillingCheckout_tenantId_status_idx"
ON "BillingCheckout"("tenantId", "status");

ALTER TABLE "BillingCheckout"
ADD CONSTRAINT "BillingCheckout_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
