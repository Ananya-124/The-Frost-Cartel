-- Durable Round 4 configuration and per-team route progress.

CREATE TABLE round4_settings (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_released boolean NOT NULL DEFAULT false,
  common_final_location_id text NOT NULL DEFAULT 'room-final-700',
  common_final_floor_id text NOT NULL DEFAULT 'floor-7',
  common_final_room_name text NOT NULL DEFAULT 'The Celestial Archives & Observatory Vault',
  common_final_x double precision NOT NULL DEFAULT 280,
  common_final_y double precision NOT NULL DEFAULT 125,
  common_final_radius double precision NOT NULL DEFAULT 36 CHECK (common_final_radius > 0),
  physical_entry_instructions text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO round4_settings(id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE round4_routes (
  id text PRIMARY KEY,
  route_number smallint NOT NULL UNIQUE CHECK (route_number BETWEEN 1 AND 7),
  roman_numeral text NOT NULL UNIQUE,
  route_name text NOT NULL,
  route_subtitle text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE round4_steps (
  id text PRIMARY KEY,
  route_id text NOT NULL REFERENCES round4_routes(id) ON DELETE CASCADE,
  clue_index smallint NOT NULL CHECK (clue_index BETWEEN 1 AND 5),
  floor_id text NOT NULL,
  location_name text NOT NULL,
  target_x double precision NOT NULL,
  target_y double precision NOT NULL,
  trigger_radius double precision NOT NULL DEFAULT 36 CHECK (trigger_radius > 0),
  riddle_text text NOT NULL,
  field_location_hint text NOT NULL,
  accepted_answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(accepted_answers) = 'array'),
  is_case_sensitive boolean NOT NULL DEFAULT false,
  is_common_final boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(route_id, clue_index)
);

CREATE TABLE round4_qualified_teams (
  id text PRIMARY KEY,
  team_id text NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  route_id text NOT NULL UNIQUE REFERENCES round4_routes(id) ON DELETE RESTRICT,
  qualified_at timestamptz NOT NULL DEFAULT now(),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, route_id)
);

CREATE TABLE round4_team_progress (
  id text PRIMARY KEY,
  team_id text NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  route_id text NOT NULL REFERENCES round4_routes(id) ON DELETE RESTRICT,
  -- Zero-based active clue index: 0..4 while playing; 5 is the completed sentinel.
  current_step_index smallint NOT NULL DEFAULT 0 CHECK (current_step_index BETWEEN 0 AND 5),
  target_discovered boolean NOT NULL DEFAULT false,
  solved_steps jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(solved_steps) = 'array'),
  common_room_arrived boolean NOT NULL DEFAULT false,
  is_finished boolean NOT NULL DEFAULT false,
  finished_at timestamptz,
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(team_id, route_id) REFERENCES round4_qualified_teams(team_id, route_id)
    DEFERRABLE INITIALLY DEFERRED,
  CHECK (NOT is_finished OR (current_step_index = 5 AND finished_at IS NOT NULL))
);

CREATE TABLE round4_winner (
  singleton_id smallint PRIMARY KEY DEFAULT 1 CHECK (singleton_id = 1),
  team_id text NOT NULL UNIQUE REFERENCES teams(id) ON DELETE RESTRICT,
  team_name text NOT NULL,
  route_id text NOT NULL REFERENCES round4_routes(id) ON DELETE RESTRICT,
  final_answer text NOT NULL,
  solved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(team_id, route_id)
    REFERENCES round4_qualified_teams(team_id, route_id) ON DELETE RESTRICT
);

CREATE FUNCTION require_completed_round4_winner() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  progress_is_finished boolean;
  progress_step_index smallint;
  progress_finished_at timestamptz;
BEGIN
  SELECT is_finished, current_step_index, finished_at
    INTO progress_is_finished, progress_step_index, progress_finished_at
  FROM round4_team_progress
  WHERE team_id = NEW.team_id AND route_id = NEW.route_id;

  IF NOT FOUND OR progress_is_finished IS DISTINCT FROM true
     OR progress_step_index IS DISTINCT FROM 5 OR progress_finished_at IS NULL THEN
    RAISE EXCEPTION 'Round 4 winner requires completed progress for the qualified team and route.'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER round4_winner_requires_completed_progress
  BEFORE INSERT OR UPDATE ON round4_winner
  FOR EACH ROW EXECUTE FUNCTION require_completed_round4_winner();

CREATE INDEX idx_round4_steps_route ON round4_steps(route_id, clue_index);
CREATE INDEX idx_round4_progress_route ON round4_team_progress(route_id, current_step_index);
CREATE INDEX idx_round4_qualification_route ON round4_qualified_teams(route_id);
