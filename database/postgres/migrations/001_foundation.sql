-- PostgreSQL foundation for the Frost Cartel tournament.
-- Existing SQLite gameplay remains the active application store until the
-- repositories and services are migrated in a later phase.
CREATE TABLE IF NOT EXISTS admins (
  id text PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  salt text NOT NULL,
  role text NOT NULL DEFAULT 'admin',
  must_change_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teams (
  id text PRIMARY KEY,
  team_name text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  salt text NOT NULL,
  is_paused boolean NOT NULL DEFAULT false,
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_credits integer NOT NULL DEFAULT 500 CHECK (max_credits >= 0),
  total_credits integer NOT NULL DEFAULT 500 CHECK (total_credits >= 0),
  login_count integer NOT NULL DEFAULT 0 CHECK (login_count >= 0),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_sessions (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  player_number smallint NOT NULL DEFAULT 1 CHECK (player_number IN (1,2)),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admin_sessions (
  id text PRIMARY KEY,
  admin_id text NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rounds (
  round_id smallint PRIMARY KEY CHECK (round_id BETWEEN 1 AND 4),
  round_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  duration_seconds integer NOT NULL DEFAULT 1320 CHECK (duration_seconds >= 0),
  start_time timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS round_progress (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id smallint NOT NULL REFERENCES rounds(round_id),
  status text NOT NULL DEFAULT 'LOCKED',
  score integer NOT NULL DEFAULT 0 CHECK (score >= 0),
  max_score integer NOT NULL DEFAULT 0 CHECK (max_score >= 0),
  time_spent_seconds integer NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, round_id)
);
CREATE TABLE IF NOT EXISTS score_transactions (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id smallint NOT NULL REFERENCES rounds(round_id),
  delta integer NOT NULL,
  new_score integer NOT NULL CHECK (new_score >= 0),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS credit_transactions (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  round_id smallint REFERENCES rounds(round_id),
  delta integer NOT NULL,
  balance_after integer NOT NULL CHECK (balance_after >= 0),
  transaction_type text NOT NULL,
  reference_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS power_cards (
  id text PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  round_id smallint NOT NULL DEFAULT 2 REFERENCES rounds(round_id),
  base_price integer NOT NULL DEFAULT 0 CHECK (base_price >= 0),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS team_power_cards (
  id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  power_card_id text NOT NULL REFERENCES power_cards(id),
  purchased_round_id smallint NOT NULL DEFAULT 2 REFERENCES rounds(round_id),
  source text NOT NULL DEFAULT 'auction',
  purchase_price integer NOT NULL CHECK (purchase_price >= 0),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS idx_team_power_cards_team ON team_power_cards(team_id, purchased_at);
CREATE INDEX IF NOT EXISTS idx_round_progress_round_status ON round_progress(round_id, status);
CREATE INDEX IF NOT EXISTS idx_score_transactions_team ON score_transactions(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_team ON credit_transactions(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_team_sessions_expiry ON team_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expiry ON admin_sessions(expires_at);

CREATE OR REPLACE VIEW leaderboard AS
  SELECT t.id AS team_id, t.team_name, t.score,
         rank() OVER (ORDER BY t.score DESC, t.team_name ASC) AS rank,
         t.updated_at
  FROM teams t;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
