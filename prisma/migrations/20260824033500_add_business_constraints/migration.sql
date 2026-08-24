-- Constraints that Prisma schema cannot express directly.
ALTER TABLE "jobs"
ADD CONSTRAINT "jobs_monthly_rate_min_non_negative"
CHECK ("monthly_rate_min_yen" IS NULL OR "monthly_rate_min_yen" >= 0),
ADD CONSTRAINT "jobs_monthly_rate_max_non_negative"
CHECK ("monthly_rate_max_yen" IS NULL OR "monthly_rate_max_yen" >= 0),
ADD CONSTRAINT "jobs_monthly_rate_range_valid"
CHECK (
  "monthly_rate_min_yen" IS NULL
  OR "monthly_rate_max_yen" IS NULL
  OR "monthly_rate_min_yen" <= "monthly_rate_max_yen"
),
ADD CONSTRAINT "jobs_utilization_percent_range_valid"
CHECK (
  "utilization_percent" IS NULL
  OR "utilization_percent" BETWEEN 0 AND 100
);

ALTER TABLE "application_status_histories"
ADD CONSTRAINT "application_status_histories_status_changed"
CHECK ("previous_status" <> "new_status");

-- DESIGN-07 requires status histories to be append-only, including protection
-- against accidental writes that bypass the application repository layer.
CREATE FUNCTION prevent_application_status_history_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'application status histories are append-only'
    USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER application_status_histories_append_only
BEFORE UPDATE OR DELETE ON "application_status_histories"
FOR EACH ROW
EXECUTE FUNCTION prevent_application_status_history_mutation();
