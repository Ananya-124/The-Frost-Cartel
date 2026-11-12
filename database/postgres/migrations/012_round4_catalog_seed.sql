-- Seed the Round 4 route/clue catalog from database/db.ts seedRound4Data().
-- Deliberately does not release the round or create qualifications, progress, or a winner.

INSERT INTO round4_routes (id, route_number, roman_numeral, route_name, route_subtitle)
VALUES
  ('route-1', 1, 'I', 'Route I', 'Meridian Path (4 → 2 → 5 → 3 → 7)'),
  ('route-2', 2, 'II', 'Route II', 'Alchemist''s Arc (2 → 4 → 6 → 3 → 7)'),
  ('route-3', 3, 'III', 'Route III', 'Cartographer''s Traverse (2 → 6 → 3 → 5 → 7)'),
  ('route-4', 4, 'IV', 'Route IV', 'Shadow Traverse (4 → 6 → 2 → 5 → 7)'),
  ('route-5', 5, 'V', 'Route V', 'Phantom Meridian (6 → 2 → 5 → 4 → 7)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO round4_steps (
  id, route_id, clue_index, floor_id, location_name, target_x, target_y,
  trigger_radius, riddle_text, field_location_hint, accepted_answers,
  is_case_sensitive, is_common_final
)
VALUES
  -- === ROUTE 1: 4 -> 2 -> 5 -> 3 -> 7 ===
  ('r1_s1', 'route-1', 1, 'floor-04', 'Near CS UG Lab 2 — Wooden Table', 230, 520, 36,
   'Four floors above, your next trail awaits,' || E'\n' || 'Near CS UG Lab 2 lie the secrets of fate.' || E'\n' || 'Where curious minds work and mysteries grow,' || E'\n' || 'A wooden guardian hides what you need to know.' || E'\n' || 'Don''t search its surface or look around,' || E'\n' || 'The secret lies beneath, close to the ground.',
   '4th Floor • Near CS UG Lab 2 • Underneath the wooden table', '["WRAITH", "fc_qr_r1_s1_w47a"]'::jsonb, false, false),
  ('r1_s2', 'route-1', 2, 'floor-02', 'Student Sitting Benches — Wall Overhead', 512, 280, 36,
   'Make your way to the second floor,' || E'\n' || 'Where tired souls pause before exploring more.' || E'\n' || 'A place where footsteps slow their pace,' || E'\n' || 'And weary travellers find a resting space.' || E'\n' || 'The secret isn''t where they sit below,' || E'\n' || 'But above their heads, where shadows grow.',
   '2nd Floor • Wall above the sitting benches', '["CANDLE", "fc_qr_r1_s2_c92b"]'::jsonb, false, false),
  ('r1_s3', 'route-1', 3, 'floor-05', 'Ratan Tata Portrait Frame', 512, 330, 36,
   'Five floors above, a wise face meets your sight,' || E'\n' || 'A man who turned challenges into the light.' || E'\n' || 'He taught the world that success is hard to claim,' || E'\n' || 'Find the one whose wisdom speaks through his name.' || E'\n' || 'His words are in front, but his secret stays behind.',
   '5th Floor • Behind the Ratan Tata frame', '["RAVEN", "fc_qr_r1_s3_r18c"]'::jsonb, false, false),
  ('r1_s4', 'route-1', 4, 'floor-03', 'Notice Boards Near Lift', 460, 430, 36,
   'On floor number three, your trail takes flight,' || E'\n' || 'Near the lift stands a keeper of information in sight.' || E'\n' || 'It holds announcements, posters and more,' || E'\n' || 'Like whispers from souls who''ve passed before.' || E'\n' || 'Search where these silent stories stay,' || E'\n' || 'Your next secret is hidden along the way.',
   '3rd Floor • Notice boards near the lift', '["HEX", "fc_qr_r1_s4_h34d"]'::jsonb, false, false),
  ('r1_s5', 'route-1', 5, 'floor-07', 'Main Event Venue — Anchor Ceiling Fan Bay', 800, 510, 42,
   'Standing at the pinnacle on floor number seven,' || E'\n' || 'Underneath the tiled expanse of the room''s white heaven.' || E'\n' || 'Find the white spinners anchored high overhead,' || E'\n' || 'Whose three wide arms rest while the final steps are tread.' || E'\n' || 'Reach above the still blade hovering over the crowd,' || E'\n' || 'To pull down the victory and claim your title proud.',
   '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay', '["ANCHOR", "CEILING FAN", "WHITE SPINNERS", "PINNACLE", "fc_qr_final_7th_relic"]'::jsonb, false, true),

  -- === ROUTE 2: 2 -> 4 -> 6 -> 3 -> 7 ===
  ('r2_s1', 'route-2', 1, 'floor-02', 'Near Room 217 — Wooden Table', 280, 240, 36,
   'Two floors above, your next mystery awaits,' || E'\n' || 'Near room 217 lie the secrets of fate.' || E'\n' || 'A lonely wooden keeper stands nearby,' || E'\n' || 'Holding its secrets away from the eye.',
   '2nd Floor • Near Room 217 • Underneath the wooden table', '["GHOUL", "fc_qr_r2_s1_g51a"]'::jsonb, false, false),
  ('r2_s2', 'route-2', 2, 'floor-04', 'Industry–Academia Banner (Anusha & Bhavana Chambers)', 740, 220, 36,
   'Four floors above, your next trail begins,' || E'\n' || 'Where knowledge meets the world of innovations.' || E'\n' || 'Near the chambers of Anusha and Bhavana,' || E'\n' || 'A banner speaks of a technological era.' || E'\n' || 'It welcomes minds to a future untold,' || E'\n' || 'Look around its presence for a secret to unfold.',
   '4th Floor • Industry–Academia Collaboration banner', '["COVEN", "fc_qr_r2_s2_c73b"]'::jsonb, false, false),
  ('r2_s3', 'route-2', 3, 'floor-06', 'Near CSBS 604 Staircase — Fire Extinguisher Bracket', 720, 160, 36,
   'Six floors above, your next mystery lies,' || E'\n' || 'Near CSBS 604, where the staircase climbs.' || E'\n' || 'A silent guardian stands against the wall,' || E'\n' || 'Ready to fight what threatens all.' || E'\n' || 'Though flames may awaken in the dead of night,' || E'\n' || 'Look near the keeper who puts them out of sight.',
   '6th Floor • Near CSBS 604 staircase • Fire extinguisher area', '["PHANTOM", "fc_qr_r2_s3_p29c"]'::jsonb, false, false),
  ('r2_s4', 'route-2', 4, 'floor-03', 'In Front of C301 — Compartments / Boxes', 720, 240, 36,
   'On floor number three, your hunt takes flight,' || E'\n' || 'Seek the door marked C301 in sight.' || E'\n' || 'Before it stands a keeper of many spaces,' || E'\n' || 'With countless little doors and hidden places.' || E'\n' || 'The spirits have left something behind,' || E'\n' || 'Search among the compartments to find.',
   '3rd Floor • In front of C301 • Among the boxes/compartments', '["GRIMOIRE", "fc_qr_r2_s4_g84d"]'::jsonb, false, false),
  ('r2_s5', 'route-2', 5, 'floor-07', 'Main Event Venue — Anchor Ceiling Fan Bay', 800, 510, 42,
   'Standing at the pinnacle on floor number seven,' || E'\n' || 'Underneath the tiled expanse of the room''s white heaven.' || E'\n' || 'Find the white spinners anchored high overhead,' || E'\n' || 'Whose three wide arms rest while the final steps are tread.' || E'\n' || 'Reach above the still blade hovering over the crowd,' || E'\n' || 'To pull down the victory and claim your title proud.',
   '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay', '["ANCHOR", "CEILING FAN", "WHITE SPINNERS", "PINNACLE", "fc_qr_final_7th_relic"]'::jsonb, false, true),

  -- === ROUTE 3: 2 -> 6 -> 3 -> 5 -> 7 ===
  ('r3_s1', 'route-3', 1, 'floor-02', 'Near Room 215 — Archive Boxes', 190, 310, 36,
   'Two floors above where journeys begin,' || E'\n' || 'A quiet corner holds secrets within.' || E'\n' || 'Near two-one-five, a row of doors,' || E'\n' || 'Stands guarding secrets behind its shores.' || E'\n' || 'They hold no keys to kingdoms unknown,' || E'\n' || 'Yet one hides a secret of its own.' || E'\n' || 'Look where the silent keepers stand,' || E'\n' || 'Your next discovery is close at hand.',
   '2nd Floor • Near Room 215 • Among the boxes', '["SPECTER", "fc_qr_r3_s1_s62a"]'::jsonb, false, false),
  ('r3_s2', 'route-3', 2, 'floor-06', 'Electronics Circuits Lab — Guglielmo Board Corner', 170, 520, 36,
   'Six floors above the ground,' || E'\n' || 'Where electric thoughts are carefully planned.' || E'\n' || 'A lab of circuits, connections and flow,' || E'\n' || 'Holds a secret that few would know.' || E'\n' || 'Find the board that carries a pioneer''s name,' || E'\n' || 'Where two walls meet, you''ll continue the game.' || E'\n' || 'Don''t follow the wires or search the floor,' || E'\n' || 'The corner beside it hides something more.',
   '6th Floor • Electronics Circuit Lab • Guglielmo Board corner', '["TALISMAN", "fc_qr_r3_s2_t15b"]'::jsonb, false, false),
  ('r3_s3', 'route-3', 3, 'floor-03', 'Near Room C302 — Result Analysis Display Board', 320, 200, 36,
   'Three floors above,' || E'\n' || 'A wall of achievements holds secrets within.' || E'\n' || 'Where numbers and graphs tell stories of pride,' || E'\n' || 'A board of results stands waiting nearby.' || E'\n' || 'Near C302, take a careful view,' || E'\n' || 'Among the records, a secret waits for you.' || E'\n' || 'Look where achievements are proudly displayed,' || E'\n' || 'Your next hidden clue will soon be revealed!',
   '3rd Floor • Near Room C302 • Result Analysis Display Board', '["WITCH", "fc_qr_r3_s3_w93c"]'::jsonb, false, false),
  ('r3_s4', 'route-3', 4, 'floor-05', 'Near CR501 — Red Fire Cabinet Wall', 260, 220, 36,
   'Ascend five levels to the top-tier space,' || E'\n' || 'Find CR501 to locate the place.' || E'\n' || 'A bright red cabinet stands upon the wall,' || E'\n' || 'Keeping watch along the silent hall.' || E'\n' || 'Lift up your eyes above the crimson steel,' || E'\n' || 'High on the ceiling tile, your reward reveal.',
   '5th Floor • Near CR501 • Wall beside fire cabinet', '["BANSHEE", "fc_qr_r3_s4_b46d"]'::jsonb, false, false),
  ('r3_s5', 'route-3', 5, 'floor-07', 'Main Event Venue — Anchor Ceiling Fan Bay', 800, 510, 42,
   'Standing at the pinnacle on floor number seven,' || E'\n' || 'Underneath the tiled expanse of the room''s white heaven.' || E'\n' || 'Find the white spinners anchored high overhead,' || E'\n' || 'Whose three wide arms rest while the final steps are tread.' || E'\n' || 'Reach above the still blade hovering over the crowd,' || E'\n' || 'To pull down the victory and claim your title proud.',
   '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay', '["ANCHOR", "CEILING FAN", "WHITE SPINNERS", "PINNACLE", "fc_qr_final_7th_relic"]'::jsonb, false, true),

  -- === ROUTE 4: 4 -> 6 -> 2 -> 5 -> 7 ===
  ('r4_s1', 'route-4', 1, 'floor-04', 'In Front of CSE Vision Board — Elevator Floor Signage', 512, 420, 36,
   'Make your way up to the fourth level space,' || E'\n' || 'Where CSE''s Vision and Mission take their place.' || E'\n' || 'Stand before the steel doors that lift and convey,' || E'\n' || 'Though this elevator skips four along its way.' || E'\n' || 'Look just above the metal frame where numbers rest,' || E'\n' || 'Behind the floor sign lies your hidden quest.',
   '4th Floor • In front of CSE Vision & Mission board • Elevator floor signage', '["CAULDRON", "fc_qr_r4_s1_c38a"]'::jsonb, false, false),
  ('r4_s2', 'route-4', 2, 'floor-06', 'Beside AV 602 — AI & DS Notice Board', 760, 220, 36,
   'Ascend to floor six to continue your quest,' || E'\n' || 'Where data and intelligence are put to the test.' || E'\n' || 'Locate the dark pinboard beneath the department sign,' || E'\n' || 'Right beside classroom six-zero-two in line.' || E'\n' || 'Don''t read the posters pinned out front in plain view,' || E'\n' || 'Behind the dark frame, your passage calls to you.',
   '6th Floor • Beside AV 602 Class Room • Behind Department of AI & DS notice board', '["NIGHTFALL", "fc_qr_r4_s2_n72b"]'::jsonb, false, false),
  ('r4_s3', 'route-4', 3, 'floor-02', 'Near C208 — Recessed Storage Corner', 780, 240, 36,
   'Head down to floor two where the quiet hallway bends,' || E'\n' || 'Beside room C208, the open path ends.' || E'\n' || 'Look into the recessed corner tucked out of sight,' || E'\n' || 'Where flat brown boxes rest away from the light.',
   '2nd Floor • Near C208 • Inner wall corner behind stacked storage boxes', '["COBWEB", "fc_qr_r4_s3_c19c"]'::jsonb, false, false),
  ('r4_s4', 'route-4', 4, 'floor-05', 'Near Lab 503 — Blue Suggestion Container', 750, 480, 36,
   'Head to the fifth floor and follow the hall,' || E'\n' || 'Find Lab 503 and look at the wall.' || E'\n' || 'Above the long wooden shelf standing nearby,' || E'\n' || 'A bright blue container catches your eye.' || E'\n' || 'Where students drop feedback through a slot at the top,' || E'\n' || 'Search inside the chamber where reflections stop.',
   '5th Floor • Near Lab 503 • Blue suggestion container above wooden cabinet', '["LANTERN", "fc_qr_r4_s4_l85d"]'::jsonb, false, false),
  ('r4_s5', 'route-4', 5, 'floor-07', 'Main Event Venue — Anchor Ceiling Fan Bay', 800, 510, 42,
   'Standing at the pinnacle on floor number seven,' || E'\n' || 'Underneath the tiled expanse of the room''s white heaven.' || E'\n' || 'Find the white spinners anchored high overhead,' || E'\n' || 'Whose three wide arms rest while the final steps are tread.' || E'\n' || 'Reach above the still blade hovering over the crowd,' || E'\n' || 'To pull down the victory and claim your title proud.',
   '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay', '["ANCHOR", "CEILING FAN", "WHITE SPINNERS", "PINNACLE", "fc_qr_final_7th_relic"]'::jsonb, false, true),

  -- === ROUTE 5: 6 -> 2 -> 5 -> 4 -> 7 ===
  ('r5_s1', 'route-5', 1, 'floor-06', 'Near Lift — AI & DS Project Lab Overhead Sign', 530, 430, 36,
   'Ascend to floor six where the elevators wait,' || E'\n' || 'Right beside the lift doors, locate the lab gate.' || E'\n' || '''Department of AI & Data Science Project Lab'' reads high,' || E'\n' || 'Reach right behind the main sign hanging over the door.',
   '6th Floor • Near the lift • Overhead AI & DS Project Lab sign board', '["VAMPIRE", "fc_qr_r5_s1_v44a"]'::jsonb, false, false),
  ('r5_s2', 'route-5', 2, 'floor-02', 'Near Sitting Area — Wooden PRINTEX Kiosk Cabinet', 610, 320, 36,
   'Ascend or descend to floor two''s relaxing space,' || E'\n' || 'Where student benches line the floor, step up to the place.' || E'\n' || 'Spot the tall wooden station built by ECE,' || E'\n' || 'Where quick digital prints are made easily.' || E'\n' || 'Don''t scan the print code displayed upon the front,' || E'\n' || 'Search behind the cabinet structure for your hunt.',
   '2nd Floor • Near sitting area • Underneath wooden PRINTEX kiosk cabinet', '["MIDNIGHT", "fc_qr_r5_s2_m81b"]'::jsonb, false, false),
  ('r5_s3', 'route-5', 3, 'floor-05', 'Near UG CR 503 & 504 — Side Staircase Exit Door', 140, 380, 36,
   'Climb up to the fifth level where classrooms line the way,' || E'\n' || 'Near CR503 and 504 where students spend their day.' || E'\n' || 'Locate the side staircase door that swings to open wide,' || E'\n' || 'Marked with a green ''FIFTH FLOOR'' sign mounted just inside.' || E'\n' || 'Hidden by the heavy door, you''ll advance the game.',
   '5th Floor • Near UG CR 503 & 504 side staircase • Back panel of heavy exit door', '["CRYPT", "fc_qr_r5_s3_c27c"]'::jsonb, false, false),
  ('r5_s4', 'route-5', 4, 'floor-04', 'Near UG Lab 1 & BS Narayan Lab — Distinguished Alumni Poster', 360, 520, 36,
   'Ascend four levels where computing labs reside,' || E'\n' || 'Near UG Lab 1 and BS Narayan side by side.' || E'\n' || 'Find where the CSE department honors its own,' || E'\n' || 'A Distinguished Alumni poster proudly shown. (IN PURPLE)' || E'\n' || 'Do not look at the text or the portrait''s frame,' || E'\n' || 'Behind the banner lies the secret of the game.',
   '4th Floor • Near UG Lab 1 & BS Narayan Lab • Behind purple Distinguished Alumni poster', '["OMEN", "fc_qr_r5_s4_o63d"]'::jsonb, false, false),
  ('r5_s5', 'route-5', 5, 'floor-07', 'Main Event Venue — Anchor Ceiling Fan Bay', 800, 510, 42,
   'Standing at the pinnacle on floor number seven,' || E'\n' || 'Underneath the tiled expanse of the room''s white heaven.' || E'\n' || 'Find the white spinners anchored high overhead,' || E'\n' || 'Whose three wide arms rest while the final steps are tread.' || E'\n' || 'Reach above the still blade hovering over the crowd,' || E'\n' || 'To pull down the victory and claim your title proud.',
   '7th Floor • Main Event Hall • 3-Blade Anchor Ceiling Fan Bay', '["ANCHOR", "CEILING FAN", "WHITE SPINNERS", "PINNACLE", "fc_qr_final_7th_relic"]'::jsonb, false, true)
ON CONFLICT (id) DO NOTHING;
