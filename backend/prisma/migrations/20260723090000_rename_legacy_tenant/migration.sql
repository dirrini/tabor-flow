UPDATE "Tenant"
SET
  "name" = 'TaborFlow',
  "slug" = 'tabor-flow'
WHERE
  "slug" = 'projectpulse'
  AND NOT EXISTS (
    SELECT 1
    FROM "Tenant"
    WHERE "slug" = 'tabor-flow'
  );
