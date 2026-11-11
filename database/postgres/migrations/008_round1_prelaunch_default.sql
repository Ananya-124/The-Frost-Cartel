-- Migration 002 historically seeds Round 1 as active. The event has not
-- launched, so a fresh database must await an explicit coordinator release.
-- Restrict this pre-launch default to an empty tournament. Do not alter an
-- already populated database or an event with any assigned start/progress.
UPDATE rounds
SET is_active = false, updated_at = now()
WHERE round_id = 1
  AND is_active = true
  AND start_time IS NULL
  AND NOT EXISTS (SELECT 1 FROM teams);
