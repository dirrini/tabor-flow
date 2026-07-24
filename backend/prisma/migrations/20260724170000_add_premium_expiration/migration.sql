ALTER TABLE "Tenant"
ADD COLUMN "premiumExpiresAt" TIMESTAMP(3);

UPDATE "Tenant" AS tenant
SET "premiumExpiresAt" =
  CURRENT_TIMESTAMP +
  CASE
    WHEN (
      SELECT checkout."billingCycle"
      FROM "BillingCheckout" AS checkout
      WHERE checkout."tenantId" = tenant.id
        AND checkout.status = 'PAID'
      ORDER BY checkout."updatedAt" DESC
      LIMIT 1
    ) = 'YEARLY'
      THEN INTERVAL '1 year'
    ELSE INTERVAL '1 month'
  END
WHERE tenant.plan = 'PREMIUM'
  AND tenant."premiumExpiresAt" IS NULL;
