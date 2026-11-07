INSERT INTO rounds (round_id, round_name, is_active, duration_seconds) VALUES
  (1, 'The Graveyard Escape', true, 1320),
  (2, 'The Haunted Auction', false, 0),
  (3, 'Paradox Hunt', false, 0),
  (4, 'The Campus Expedition', false, 0)
ON CONFLICT (round_id) DO UPDATE SET round_name = EXCLUDED.round_name;

INSERT INTO power_cards (id, name, description, round_id, base_price, metadata) VALUES
  ('r2-card-1', 'Vampire Shield', 'Blocks one penalty in Round 3.', 2, 100, '{"auctionCardId":1}'::jsonb),
  ('r2-card-2', 'Witch Hex', 'Curse a rival squad in Round 3.', 2, 100, '{"auctionCardId":2}'::jsonb),
  ('r2-card-3', 'Ghost Pass', 'Skip one obstacle in Round 3.', 2, 150, '{"auctionCardId":3}'::jsonb),
  ('r2-card-4', 'Zombie Revive', 'Revive once after failing.', 2, 150, '{"auctionCardId":4}'::jsonb),
  ('r2-card-5', 'Pumpkin Bomb', 'Explosive advantage in Round 3.', 2, 200, '{"auctionCardId":5}'::jsonb),
  ('r2-card-6', 'Reaper Strike', 'A decisive final-round strike.', 2, 200, '{"auctionCardId":6}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  base_price = EXCLUDED.base_price, metadata = EXCLUDED.metadata;
