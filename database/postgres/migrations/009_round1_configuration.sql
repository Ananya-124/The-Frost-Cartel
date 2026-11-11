-- Trusted shared Round 1 puzzle and timer configuration.
CREATE TABLE round1_configuration (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  configuration jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(configuration) = 'object'),
  updated_by text REFERENCES admins(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO round1_configuration(singleton_id, configuration) VALUES (1, '{}'::jsonb)
ON CONFLICT (singleton_id) DO NOTHING;

-- Round 1's three portals are simultaneously available in the existing game.
-- Migration 004's Stage 3 LOCKED seed contradicted that behavior.
UPDATE round1_stage_progress SET status='AVAILABLE',updated_at=now()
WHERE stage_id=3 AND status='LOCKED';

CREATE OR REPLACE FUNCTION initialize_round1_stages() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO round1_stage_progress(id,team_id,stage_id,stage_name,status,max_score)
  VALUES
    ('stage-'||NEW.id||'-1',NEW.id,1,'The Pumpkin Shuffle','AVAILABLE',100),
    ('stage-'||NEW.id||'-2',NEW.id,2,'The Haunted Image Hunt','AVAILABLE',150),
    ('stage-'||NEW.id||'-3',NEW.id,3,'The Forgotten Graveyard','AVAILABLE',250)
  ON CONFLICT(team_id,stage_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TABLE round1_action_events (
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action_id text NOT NULL,
  action_type text NOT NULL,
  response jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, action_id)
);
CREATE INDEX idx_round1_action_events_created ON round1_action_events(created_at);
