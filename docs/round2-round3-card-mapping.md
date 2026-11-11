# Round 2 ownership to Round 3 inventory mapping

## Current decision

No Round 2 auction card is currently approved for automatic conversion into a Round 3 inventory card. PostgreSQL records all eleven Round 2 cards as `UNMAPPED` in `round3_auction_card_mappings`. The Round 3 inventory schema requires an approved ID pair and an ownership row tied to the same team and auction lot before an auction-sourced inventory grant can be inserted.

This is intentional: card names or broad themes are not sufficient evidence of equivalent gameplay effects. In particular, the active Round 3 engine behavior is more specific than some catalog descriptions. For example, its `spectral-lens` inventory effect reveals the true entity, while Round 2 `Spectral Sight` is defined as revealing a hidden clue/hint. That is not an exact behavior match. Similarly, the current Round 3 `temporal-shield` protects against a paradox setback; that does not establish equivalence to Round 2's synchronization/timed-control protection.

## Catalog review

Round 2 IDs are `r2-card-1` through `r2-card-11`: Chrono Freeze, Witching Hour, Spectral Sight, Witch's Lens, Hexbreaker, Mechanic's Curse, Witch's Elixir, Raven's Messenger, Phantom Shield, Soul Surge, and The Warden's Decree.

Round 3 inventory IDs are `spectral-lens`, `echo-recorder`, `phantom-key`, `temporal-compass`, `phantom-beacon`, `resonance-decoder`, `temporal-shield`, `memory-seal`, `emergency-power-cell`, and `soul-binding-sigil`.

After inspecting [round3.cards.ts](../src/constants/round3.cards.ts), [inventoryCards.ts](../src/components/game/round3/runtime/inventoryCards.ts), and [cardEffects.ts](../src/components/game/round3/runtime/engine/cards/cardEffects.ts), no one-to-one mapping can presently be asserted without changing the stated card effect or relying on a name-only match. Therefore all eleven auction IDs remain unmapped. Round 2 remains disabled.

To approve a future mapping, a separate reviewed change must set the Round 2 ID to exactly one existing Round 3 ID, mark it `APPROVED`, provide a rationale/review timestamp, and add a test proving that the awarded ownership, team, lot, and mapped inventory ID all agree. Until then, auction ownership cannot be converted into Round 3 inventory.

When card consumption is implemented, the service must decrement `round3_card_inventory.quantity` only when it is positive and insert `round3_card_usage` in the same PostgreSQL transaction. It should lock the inventory row (or use a conditional `UPDATE ... WHERE quantity > 0`) and rely on the unique `(team_id, source_event_id)` constraint for request idempotency. The schema supports that pattern; no gameplay service is changed in this phase.
