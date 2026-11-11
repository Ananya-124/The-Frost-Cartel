-- Team-scoped round progression. round_progress remains the single source of
-- truth for round state; eligibility is distinct from an authorized unlock.
ALTER TABLE round_progress
  ADD COLUMN eligible_at timestamptz;

ALTER TABLE round_progress
  ADD CONSTRAINT round_progress_status_check
  CHECK (status IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED'));

CREATE TABLE team_hunt_progress (
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  hunt_id smallint NOT NULL CHECK (hunt_id BETWEEN 1 AND 3),
  status text NOT NULL DEFAULT 'LOCKED'
    CHECK (status IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED')),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, hunt_id)
);

CREATE TABLE progression_audit_history (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_type text NOT NULL CHECK (actor_type IN ('ADMIN', 'SYSTEM')),
  admin_id text REFERENCES admins(id) ON DELETE RESTRICT,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('ROUND', 'HUNT')),
  entity_id smallint NOT NULL,
  previous_state text,
  new_state text NOT NULL,
  action_performed text NOT NULL
    CHECK (action_performed IN ('UNLOCK', 'LOCK', 'ADVANCE', 'COMPLETE', 'RESET', 'MARK_ELIGIBLE', 'START')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT progression_audit_actor_check CHECK (
    (actor_type = 'ADMIN' AND admin_id IS NOT NULL) OR
    (actor_type = 'SYSTEM' AND admin_id IS NULL)
  )
);

CREATE INDEX idx_round_progress_team_status ON round_progress(team_id, status);
CREATE INDEX idx_round_progress_eligible ON round_progress(team_id, eligible_at) WHERE eligible_at IS NOT NULL;
CREATE INDEX idx_team_hunt_progress_status ON team_hunt_progress(team_id, status);
CREATE INDEX idx_progression_audit_team_time ON progression_audit_history(team_id, created_at DESC);
CREATE INDEX idx_progression_audit_admin_time ON progression_audit_history(admin_id, created_at DESC) WHERE admin_id IS NOT NULL;

-- New teams start with Round 1 available and later rounds locked.
CREATE FUNCTION initialize_team_progression() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO round_progress (id, team_id, round_id, status, max_score)
  SELECT 'progress-' || NEW.id || '-' || r.round_id, NEW.id, r.round_id,
         CASE WHEN r.round_id = 1 THEN 'AVAILABLE' ELSE 'LOCKED' END, 0
  FROM rounds r
  ON CONFLICT (team_id, round_id) DO NOTHING;

  INSERT INTO team_hunt_progress (team_id, hunt_id, status)
  VALUES (NEW.id, 1, 'LOCKED'), (NEW.id, 2, 'LOCKED'), (NEW.id, 3, 'LOCKED')
  ON CONFLICT (team_id, hunt_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_initialize_progression
AFTER INSERT ON teams FOR EACH ROW EXECUTE FUNCTION initialize_team_progression();

-- Backfill teams already present when this migration is applied.
INSERT INTO round_progress (id, team_id, round_id, status, max_score)
SELECT 'progress-' || t.id || '-' || r.round_id, t.id, r.round_id,
       CASE WHEN r.round_id = 1 THEN 'AVAILABLE' ELSE 'LOCKED' END, 0
FROM teams t CROSS JOIN rounds r
ON CONFLICT (team_id, round_id) DO NOTHING;

INSERT INTO team_hunt_progress (team_id, hunt_id, status)
SELECT t.id, h.hunt_id, 'LOCKED'
FROM teams t CROSS JOIN (VALUES (1::smallint), (2::smallint), (3::smallint)) h(hunt_id)
ON CONFLICT (team_id, hunt_id) DO NOTHING;
