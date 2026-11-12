# FROST CARTEL — ROUND 04: THE RADIANT TREASURE HUNT
## FINAL WINNER VALIDATION AND ATOMICITY REPORT

**Author:** Principal Game Architect, Database Architect, Backend Security Lead  
**Document Revision:** 1.0.0  

---

### 1. Executive Summary

All five qualified squads converge on the Seventh Floor Main Event Venue for the shared Grand Final challenge. This report documents the single-winner atomic locking protocol, database concurrency guarantees, and event broadcast mechanisms.

---

### 2. The Final Challenge Specification

- **Floor:** Seventh Floor (`floor-07.png`).
- **Location:** Main Event Venue (Anchor 3-blade ceiling fan bay).
- **Physical Safety Protocol:** The physical clue and station are located on an eye-level, stationary floor pedestal directly underneath the Anchor ceiling fan bay. Players are strictly warned and monitored by event marshals: **NEVER reach for, touch, or tamper with rotating ceiling fans or electrical fixtures.**
- **Convergence:** All 5 secret routes culminate at this identical final coordinate $(800, 510)$.

---

### 3. Atomic Single-Winner Commitment

#### 3.1 Database Isolation & Immediate Locking
To prevent race conditions when two or more squads submit the final answer within milliseconds of each other:
1. The submission endpoint initiates an immediate exclusive transaction: `BEGIN IMMEDIATE;`.
2. It queries `round4_winner` for an existing committed record:
   - If an existing winner is present, the transaction rolls back, and the submitting team receives `raceClosed: true`, acknowledging their completion without granting the championship.
   - If no winner exists, the winning record is atomically committed:
     ```sql
     INSERT INTO round4_winner (id, team_id, team_name, route_id, solved_at)
     VALUES (?, ?, ?, ?, ?);
     ```
3. The squad's progress is updated:
   ```sql
   UPDATE round4_team_progress
   SET is_finished = 1, finished_at = ?, updated_at = ?
   WHERE team_id = ?;
   ```
4. The transaction executes `COMMIT;`.

#### 3.2 Real-Time Server-Sent Events (SSE)
Upon successful commitment, an event is broadcast over SSE:
```json
{
  "event": "ROUND4_WINNER_DECLARED",
  "winner": {
    "teamId": "team_alpha",
    "teamName": "Frost Wardens",
    "routeId": "route-1",
    "solvedAt": "2026-11-11T13:45:00.000Z"
  }
}
```
All connected clients instantly update:
- The winning squad sees the `WinnerCelebrationModal` with gold particle animation and champion title.
- All competing squads receive the `NonWinnerModal` acknowledging their valiant completion and cataloguing their final placement.

