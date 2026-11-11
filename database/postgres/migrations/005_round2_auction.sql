-- Round 2 schema only. Application access remains disabled until its server-side
-- authorization, wallet and ownership flows are implemented and verified.

CREATE TABLE round2_auction_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  starting_credits integer NOT NULL DEFAULT 500 CHECK (starting_credits >= 0),
  default_bid_seconds integer NOT NULL DEFAULT 0 CHECK (default_bid_seconds >= 0),
  snipe_seconds integer NOT NULL DEFAULT 0 CHECK (snipe_seconds >= 0),
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO round2_auction_config(id, enabled) VALUES (1, false) ON CONFLICT (id) DO NOTHING;

CREATE TABLE round2_auction_lots (
  id text PRIMARY KEY,
  sequence_number integer NOT NULL UNIQUE CHECK (sequence_number > 0),
  power_card_id text NOT NULL REFERENCES power_cards(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'ACTIVE', 'SETTLED', 'CANCELLED')),
  starting_bid integer NOT NULL DEFAULT 0 CHECK (starting_bid >= 0),
  active_at timestamptz,
  ends_at timestamptz,
  settled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id, power_card_id),
  CHECK (ends_at IS NULL OR active_at IS NULL OR ends_at >= active_at)
);
CREATE UNIQUE INDEX idx_round2_one_active_lot ON round2_auction_lots(status) WHERE status = 'ACTIVE';

CREATE TABLE round2_bids (
  id text PRIMARY KEY,
  lot_id text NOT NULL REFERENCES round2_auction_lots(id) ON DELETE CASCADE,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  amount integer NOT NULL CHECK (amount > 0),
  placed_at timestamptz NOT NULL DEFAULT now(),
  request_id text NOT NULL,
  UNIQUE(team_id, request_id),
  UNIQUE(id, lot_id, team_id)
);
CREATE INDEX idx_round2_bids_lot_order ON round2_bids(lot_id, amount DESC, placed_at ASC);
CREATE INDEX idx_round2_bids_team_time ON round2_bids(team_id, placed_at DESC);

-- An auction lot can settle once. Ownership is stored in the existing common
-- team_power_cards table; the settlement points to that durable ownership row.
ALTER TABLE team_power_cards ADD COLUMN auction_lot_id text REFERENCES round2_auction_lots(id) ON DELETE RESTRICT;
ALTER TABLE team_power_cards ADD CONSTRAINT team_power_cards_id_team_card_lot_unique
  UNIQUE(id, team_id, power_card_id, auction_lot_id);
ALTER TABLE team_power_cards ADD CONSTRAINT team_power_cards_id_team_card_unique
  UNIQUE(id, team_id, power_card_id);
ALTER TABLE team_power_cards ADD CONSTRAINT team_power_cards_lot_card_fk
  FOREIGN KEY(auction_lot_id, power_card_id)
  REFERENCES round2_auction_lots(id, power_card_id) ON DELETE RESTRICT;
ALTER TABLE team_power_cards ADD CONSTRAINT team_power_cards_auction_source_check
  CHECK ((source = 'auction' AND auction_lot_id IS NOT NULL)
      OR (source <> 'auction' AND auction_lot_id IS NULL));
CREATE UNIQUE INDEX idx_team_power_cards_auction_lot ON team_power_cards(auction_lot_id)
  WHERE auction_lot_id IS NOT NULL;

CREATE TABLE round2_settlements (
  id text PRIMARY KEY,
  lot_id text NOT NULL UNIQUE,
  power_card_id text NOT NULL,
  team_id text NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  winning_bid_id text NOT NULL UNIQUE,
  ownership_id text NOT NULL UNIQUE,
  settled_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(lot_id, power_card_id)
    REFERENCES round2_auction_lots(id, power_card_id) ON DELETE RESTRICT,
  FOREIGN KEY(winning_bid_id, lot_id, team_id)
    REFERENCES round2_bids(id, lot_id, team_id) ON DELETE RESTRICT,
  FOREIGN KEY(ownership_id, team_id, power_card_id, lot_id)
    REFERENCES team_power_cards(id, team_id, power_card_id, auction_lot_id) ON DELETE RESTRICT
);
CREATE INDEX idx_round2_settlements_team ON round2_settlements(team_id, settled_at);
