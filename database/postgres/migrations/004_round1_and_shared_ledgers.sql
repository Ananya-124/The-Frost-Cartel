-- Persistent Round 1 stage state and shared audit/idempotency support.
-- Existing rounds, teams and score/credit ledgers remain the shared parents.

CREATE TABLE round1_stage_progress (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id integer NOT NULL CHECK (stage_id > 0),
  stage_name text NOT NULL,
  status text NOT NULL DEFAULT 'LOCKED'
    CHECK (status IN ('LOCKED', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED')),
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score integer NOT NULL DEFAULT 150 CHECK (max_score >= 0),
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  completed_at timestamptz,
  fragment_unlocked boolean NOT NULL DEFAULT false,
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, stage_id),
  CHECK (score <= max_score OR max_score = 0)
);
CREATE INDEX idx_round1_stage_team_status ON round1_stage_progress(team_id, status);

CREATE FUNCTION initialize_round1_stages() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO round1_stage_progress
    (id, team_id, stage_id, stage_name, status, max_score)
  VALUES
    ('stage-' || NEW.id || '-1', NEW.id, 1, 'The Pumpkin Shuffle', 'AVAILABLE', 100),
    ('stage-' || NEW.id || '-2', NEW.id, 2, 'The Haunted Image Hunt', 'AVAILABLE', 150),
    ('stage-' || NEW.id || '-3', NEW.id, 3, 'The Forgotten Graveyard', 'LOCKED', 250)
  ON CONFLICT (team_id, stage_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER teams_initialize_round1_stages
  AFTER INSERT ON teams FOR EACH ROW EXECUTE FUNCTION initialize_round1_stages();

INSERT INTO round1_stage_progress(id, team_id, stage_id, stage_name, status, max_score)
SELECT 'stage-' || t.id || '-' || s.stage_id, t.id, s.stage_id, s.stage_name, s.status, s.max_score
FROM teams t
CROSS JOIN (VALUES
  (1, 'The Pumpkin Shuffle', 'AVAILABLE', 100),
  (2, 'The Haunted Image Hunt', 'AVAILABLE', 150),
  (3, 'The Forgotten Graveyard', 'LOCKED', 250)
) AS s(stage_id, stage_name, status, max_score)
ON CONFLICT (team_id, stage_id) DO NOTHING;

-- stage_id is the source SQLite recorded; round_id is retained for the common ledger.
ALTER TABLE score_transactions ADD COLUMN stage_id integer;
ALTER TABLE score_transactions ADD COLUMN source_event_id text;
ALTER TABLE score_transactions ADD COLUMN details jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX idx_score_transactions_source_event
  ON score_transactions(team_id, round_id, source_event_id) WHERE source_event_id IS NOT NULL;

CREATE TABLE activity_history (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_event_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, source_event_id)
);
CREATE INDEX idx_activity_history_team_time ON activity_history(team_id, created_at DESC);

-- Operational round settings extend rounds rather than creating a duplicate global-round table.
ALTER TABLE rounds ADD COLUMN settings jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE rounds ADD COLUMN started_at timestamptz;

-- Credit changes are append-only and retry-safe when a caller supplies a stable reference.
CREATE UNIQUE INDEX idx_credit_transactions_reference
  ON credit_transactions(team_id, transaction_type, reference_id)
  WHERE reference_id IS NOT NULL;
