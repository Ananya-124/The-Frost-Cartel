-- Durable Round 3 runs, cooperative state and card inventory/consumption.

CREATE TABLE round3_sessions (
  team_id text PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  current_hunt smallint NOT NULL DEFAULT 1 CHECK (current_hunt BETWEEN 1 AND 3),
  player_progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  past_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  future_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  active_timeline text,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE round3_runs (
  team_id text PRIMARY KEY REFERENCES teams(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'running', 'paused', 'completed', 'expired')),
  remaining_ms bigint NOT NULL DEFAULT 0 CHECK (remaining_ms >= 0),
  started_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0)
);

CREATE TABLE round3_card_inventory (
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  card_id text NOT NULL,
  source text NOT NULL CHECK (source IN ('auction', 'development', 'admin')),
  auction_power_card_id text,
  auction_ownership_id text,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(team_id, card_id, source),
  CHECK ((source = 'auction' AND auction_power_card_id IS NOT NULL AND auction_ownership_id IS NOT NULL)
      OR (source <> 'auction' AND auction_power_card_id IS NULL AND auction_ownership_id IS NULL)),
  FOREIGN KEY(auction_ownership_id, team_id, auction_power_card_id)
    REFERENCES team_power_cards(id, team_id, power_card_id) ON DELETE RESTRICT
);

CREATE TABLE round3_card_usage (
  id text PRIMARY KEY,
  team_id text NOT NULL,
  card_id text NOT NULL,
  source text NOT NULL,
  source_event_id text NOT NULL,
  effect_context jsonb NOT NULL DEFAULT '{}'::jsonb,
  used_at timestamptz NOT NULL DEFAULT now(),
  remaining_quantity integer NOT NULL CHECK (remaining_quantity >= 0),
  FOREIGN KEY(team_id, card_id, source)
    REFERENCES round3_card_inventory(team_id, card_id, source) ON DELETE RESTRICT,
  UNIQUE(team_id, source_event_id)
);
CREATE INDEX idx_round3_card_usage_team_time ON round3_card_usage(team_id, used_at DESC);

CREATE TABLE round3_cooperation_ledger (
  event_id text PRIMARY KEY,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  points integer NOT NULL CHECK (points >= 0),
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  awarded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_round3_cooperation_team_time ON round3_cooperation_ledger(team_id, awarded_at);

-- Keep hunt payloads versioned and team-scoped. Row locks/CAS are required in
-- the repository layer when replacing/updating state_json.
CREATE TABLE round3_hunt_state (
  team_id text NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  hunt_id smallint NOT NULL CHECK (hunt_id BETWEEN 1 AND 3),
  state jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_version integer NOT NULL DEFAULT 1 CHECK (model_version > 0),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(team_id, hunt_id)
);
CREATE INDEX idx_round3_hunt_state_updated ON round3_hunt_state(updated_at);

-- No equivalence is inferred from card names. Exact gameplay mappings are
-- reviewed separately; until approved, auction ownership cannot grant inventory.
CREATE TABLE round3_auction_card_mappings (
  auction_power_card_id text PRIMARY KEY REFERENCES power_cards(id) ON DELETE RESTRICT,
  round3_card_id text CHECK (round3_card_id IN (
    'spectral-lens', 'echo-recorder', 'phantom-key', 'temporal-compass',
    'phantom-beacon', 'resonance-decoder', 'temporal-shield', 'memory-seal',
    'emergency-power-cell', 'soul-binding-sigil'
  )),
  mapping_status text NOT NULL DEFAULT 'UNMAPPED' CHECK (mapping_status IN ('UNMAPPED', 'APPROVED')),
  rationale text NOT NULL,
  reviewed_at timestamptz,
  CHECK ((mapping_status = 'UNMAPPED' AND round3_card_id IS NULL)
      OR (mapping_status = 'APPROVED' AND round3_card_id IS NOT NULL AND reviewed_at IS NOT NULL)),
  UNIQUE(auction_power_card_id, round3_card_id),
  UNIQUE(round3_card_id)
);

INSERT INTO round3_auction_card_mappings(auction_power_card_id, mapping_status, rationale)
SELECT id, 'UNMAPPED',
  'No verified one-to-one Round 3 inventory/effect equivalent; requires reviewed mapping before inventory grant.'
FROM power_cards WHERE round_id = 2
ON CONFLICT (auction_power_card_id) DO NOTHING;

ALTER TABLE round3_card_inventory ADD CONSTRAINT round3_inventory_approved_mapping_fk
  FOREIGN KEY(auction_power_card_id, card_id)
  REFERENCES round3_auction_card_mappings(auction_power_card_id, round3_card_id) ON DELETE RESTRICT;

CREATE FUNCTION initialize_round3_state() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO round3_sessions(team_id) VALUES (NEW.id) ON CONFLICT (team_id) DO NOTHING;
  INSERT INTO round3_runs(team_id) VALUES (NEW.id) ON CONFLICT (team_id) DO NOTHING;
  INSERT INTO round3_hunt_state(team_id, hunt_id)
    VALUES (NEW.id, 1), (NEW.id, 2), (NEW.id, 3)
    ON CONFLICT (team_id, hunt_id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER teams_initialize_round3_state
  AFTER INSERT ON teams FOR EACH ROW EXECUTE FUNCTION initialize_round3_state();

INSERT INTO round3_sessions(team_id)
SELECT id FROM teams ON CONFLICT (team_id) DO NOTHING;
INSERT INTO round3_runs(team_id)
SELECT id FROM teams ON CONFLICT (team_id) DO NOTHING;
INSERT INTO round3_hunt_state(team_id, hunt_id)
SELECT t.id, h.hunt_id FROM teams t CROSS JOIN generate_series(1, 3) AS h(hunt_id)
ON CONFLICT (team_id, hunt_id) DO NOTHING;
