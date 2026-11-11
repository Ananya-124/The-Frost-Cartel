-- Authenticated administrative actions over the Round 2 auction need an
-- immutable history independent of any particular team or progression row.
CREATE TABLE round2_auction_admin_audit (
  id text PRIMARY KEY,
  admin_id text NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('START', 'END', 'RESET', 'REMOVE_TEAM')),
  outcome text NOT NULL CHECK (outcome IN ('APPLIED', 'REJECTED')),
  lot_id text REFERENCES round2_auction_lots(id) ON DELETE RESTRICT,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  previous_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_round2_auction_admin_audit_time
  ON round2_auction_admin_audit(created_at DESC);
CREATE INDEX idx_round2_auction_admin_audit_admin_time
  ON round2_auction_admin_audit(admin_id, created_at DESC);
