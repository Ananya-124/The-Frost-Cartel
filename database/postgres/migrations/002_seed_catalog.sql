INSERT INTO rounds (round_id, round_name, is_active, duration_seconds) VALUES
  (1, 'The Graveyard Escape', true, 1320),
  (2, 'The Haunted Auction', false, 0),
  (3, 'Paradox Hunt', false, 0),
  (4, 'The Campus Expedition', false, 0)
ON CONFLICT (round_id) DO UPDATE SET round_name = EXCLUDED.round_name;

INSERT INTO power_cards (id, name, description, round_id, base_price, metadata) VALUES
  ('r2-card-1', 'Chrono Freeze', 'Freeze the active task countdown for 10 seconds. Your team can continue moving, interacting and solving puzzles while time stands still.', 2, 100, '{"auctionCardId":1}'::jsonb),
  ('r2-card-2', 'Witching Hour', 'Gain an additional 5 seconds during a timed synchronization challenge. Use this advantage when every second counts.', 2, 100, '{"auctionCardId":2}'::jsonb),
  ('r2-card-3', 'Spectral Sight', 'Reveal one hidden clue or receive an additional hint for your current task. See what others might miss.', 2, 100, '{"auctionCardId":3}'::jsonb),
  ('r2-card-4', 'Witch''s Lens', 'Highlight one important interactable object in your current room. Let the supernatural guide your investigation.', 2, 100, '{"auctionCardId":4}'::jsonb),
  ('r2-card-5', 'Hexbreaker', 'Eliminate one incorrect option or reveal one wrong connection in an active puzzle. Break through the curse of uncertainty.', 2, 100, '{"auctionCardId":5}'::jsonb),
  ('r2-card-6', 'Mechanic''s Curse', 'Automatically validate one correctly configured stage of a multi-stage mechanism. Skip the final confirmation and move forward.', 2, 100, '{"auctionCardId":6}'::jsonb),
  ('r2-card-7', 'Witch''s Elixir', 'Forgive one incorrect input that would normally trigger a mistake penalty. Every team deserves a second chance.', 2, 100, '{"auctionCardId":7}'::jsonb),
  ('r2-card-8', 'Raven''s Messenger', 'Reveal the location of the next relevant interactable object in your timeline. Let the raven lead the way.', 2, 100, '{"auctionCardId":8}'::jsonb),
  ('r2-card-9', 'Phantom Shield', 'Protect your team from one failed synchronization penalty or one failed timed-control attempt. The spirits grant you one layer of protection.', 2, 100, '{"auctionCardId":9}'::jsonb),
  ('r2-card-10', 'Soul Surge', 'Instantly complete one correctly configured stage of a multi-stage mechanism without performing its final activation interaction. Unleash the power of the soul.', 2, 100, '{"auctionCardId":10}'::jsonb),
  ('r2-card-11', 'The Warden''s Decree — Master Card', 'Choose one competing team and order a 2-minute gameplay pause. Present this card to the event coordinators, who will enforce the pause manually. Even time itself must obey the Warden.', 2, 100, '{"auctionCardId":11}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description,
  base_price = EXCLUDED.base_price, metadata = EXCLUDED.metadata;
