-- Round 3 runs start with the existing 25-minute gameplay duration.
-- Correct rows created under migration 006's zero default, but preserve all
-- running, paused, completed, and expired runs.
ALTER TABLE round3_runs
  ALTER COLUMN remaining_ms SET DEFAULT 1500000;

UPDATE round3_runs
SET remaining_ms = 1500000,
    updated_at = now()
WHERE status = 'not_started'
  AND remaining_ms = 0;
