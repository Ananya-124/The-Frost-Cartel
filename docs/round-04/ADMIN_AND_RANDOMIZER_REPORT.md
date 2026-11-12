# FROST CARTEL — ROUND 04: THE RADIANT TREASURE HUNT
## ADMIN PORTAL AND SECURE ROUTE RANDOMIZER REPORT

**Author:** Database Architect, Security & Cryptography Engineer, Full-Stack QA Lead  
**Document Revision:** 1.0.0  

---

### 1. Executive Summary

This report specifies the administrative infrastructure, qualification engine, cryptographically secure Fisher-Yates route assignment, and real-time monitoring suite for Round 04: The Radiant Treasure Hunt.

---

### 2. Top-5 Qualification Architecture

Per event rules, exactly five squads qualify for the Grand Final from Round 03:
- **Leaderboard Integration:** The qualification endpoint queries the authoritative leaderboard ordered by `totalCredits DESC, solved_at ASC`.
- **Tie Resolution:** If two squads are tied at the 5th qualification slot, the tie is exposed to the Admin Portal for explicit manual adjudication before release.
- **Transactional Persistence:** Squad qualifications are inserted into `round4_qualified_teams` inside a database transaction (`BEGIN IMMEDIATE; ... COMMIT;`).

---

### 3. Cryptographically Secure Fisher-Yates Route Randomizer

#### 3.1 Algorithm Specification
The assignment uses Node.js `crypto.randomBytes()` rather than `Math.random()` to guarantee unbiased, cryptographically unpredictable route permutations:

```ts
function secureShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const randomBuffer = crypto.randomBytes(4);
    const randomUint32 = randomBuffer.readUInt32BE(0);
    const j = Math.floor((randomUint32 / 0xffffffff) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

#### 3.2 Assignment Constraints
- **Exact Bijection:** Exactly 5 qualified teams are mapped $1:1$ to Routes `route-1` through `route-5`.
- **No Duplicates:** Uniqueness constraints on `team_id` and `route_id` prevent double assignment.
- **Immutability:** Once any team starts moving or scans a checkpoint, assignments become strictly immutable to prevent mid-tournament manipulation.

---

### 4. Admin Portal Features & Control Suite

The Admin Portal at `/admin` (Tab: "Round 04 Master Suite") provides:
1. **Live Monitoring:** Real-time table showing current clue ($1 \dots 5$), map discovery status, common room arrival, and victory badges for all 5 squads.
2. **Qualification & Randomizer Control:**
   - One-click `🎲 Qualify Top 5 & Randomize` button.
   - Manual overrides for squad substitutions prior to tournament start.
3. **Visual Clue Editor:** Allows organizers to tune clue riddles, location hints, and accepted answer aliases across all 25 checkpoints.
4. **Physical QR Checkpoint Registry & Print Sheet:**
   - Full list of all 20 route checkpoints + 1 shared final challenge.
   - Physical placement description and safety alerts.
   - Opaque cryptographic tokens with one-click regeneration.
   - Editable Halloween answer words with live database synchronization.
   - Installation verification toggle.
   - Print-ready deployment sheet.

