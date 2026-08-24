-- Better Auth 1.7.1 performs an atomic lookup/update per rate-limit key and
-- its generated Prisma schema requires the key to be unique.
DROP INDEX "rate_limits_key_idx";
CREATE UNIQUE INDEX "rate_limits_key_key" ON "rate_limits"("key");
