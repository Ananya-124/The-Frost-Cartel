-- FROST CARTEL Authoritative Database Schema
-- Compatible with SQLite (default) and PostgreSQL

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  team_name TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  raw_password TEXT,
  is_paused INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  max_credits INTEGER NOT NULL DEFAULT 500,
  total_credits INTEGER NOT NULL DEFAULT 500,
  login_count INTEGER NOT NULL DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stages_progress (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'LOCKED',
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 150,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  fragment_unlocked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(team_id, stage_id)
);

CREATE TABLE IF NOT EXISTS score_transactions (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  new_score INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS activity_history (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS global_round_state (
  id TEXT PRIMARY KEY,
  round_id INTEGER NOT NULL UNIQUE,
  round_name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  duration_seconds INTEGER NOT NULL DEFAULT 1320,
  start_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS team_sessions (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  player_number INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_stages_team ON stages_progress(team_id);
CREATE INDEX IF NOT EXISTS idx_transactions_team ON score_transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_team_sessions_token ON team_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(token);

-- ROUND 04: THE CAMPUS EXPEDITION — 7 TEAMS, 7 ROUTES, 1 COMMON TREASURE
CREATE TABLE IF NOT EXISTS round4_settings (
  id TEXT PRIMARY KEY,
  is_released INTEGER NOT NULL DEFAULT 1,
  common_final_location_id TEXT NOT NULL DEFAULT 'room-final-700',
  common_final_floor_id TEXT NOT NULL DEFAULT 'floor-7',
  common_final_room_name TEXT NOT NULL DEFAULT 'The Celestial Archives & Observatory Vault',
  common_final_x REAL NOT NULL DEFAULT 280,
  common_final_y REAL NOT NULL DEFAULT 125,
  common_final_radius REAL NOT NULL DEFAULT 36,
  physical_entry_instructions TEXT NOT NULL DEFAULT 'Level 07 • North Archway • Final Chamber Doors',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS round4_routes (
  id TEXT PRIMARY KEY, -- 'route-1' through 'route-7'
  route_number INTEGER NOT NULL UNIQUE, -- 1 through 7
  roman_numeral TEXT NOT NULL UNIQUE, -- 'I' through 'VII'
  route_name TEXT NOT NULL,
  route_subtitle TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS round4_steps (
  id TEXT PRIMARY KEY, -- e.g. 'r1_s1'
  route_id TEXT NOT NULL REFERENCES round4_routes(id) ON DELETE CASCADE,
  clue_index INTEGER NOT NULL, -- 1 to 5
  floor_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  target_x REAL NOT NULL,
  target_y REAL NOT NULL,
  trigger_radius REAL NOT NULL DEFAULT 36,
  riddle_text TEXT NOT NULL,
  field_location_hint TEXT NOT NULL,
  accepted_answers_json TEXT NOT NULL, -- JSON array of valid answer variants
  is_case_sensitive INTEGER NOT NULL DEFAULT 0,
  is_common_final INTEGER NOT NULL DEFAULT 0, -- 1 for step 5
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(route_id, clue_index)
);

CREATE TABLE IF NOT EXISTS round4_qualified_teams (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL UNIQUE REFERENCES round4_routes(id) ON DELETE CASCADE,
  qualified_at TEXT NOT NULL,
  assigned_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS round4_team_progress (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  route_id TEXT NOT NULL REFERENCES round4_routes(id) ON DELETE CASCADE,
  current_step_index INTEGER NOT NULL DEFAULT 0, -- 0 to 4 (step 1 to 5)
  target_discovered INTEGER NOT NULL DEFAULT 0,
  solved_steps_json TEXT NOT NULL DEFAULT '[]', -- JSON array of solved stepIds
  common_room_arrived INTEGER NOT NULL DEFAULT 0,
  is_finished INTEGER NOT NULL DEFAULT 0,
  finished_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS round4_winner (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL UNIQUE REFERENCES teams(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  route_id TEXT NOT NULL REFERENCES round4_routes(id),
  final_answer TEXT NOT NULL,
  solved_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_r4_steps_route ON round4_steps(route_id);
CREATE INDEX IF NOT EXISTS idx_r4_prog_team ON round4_team_progress(team_id);


