import sqlite3
import json
import datetime
import urllib.request
import urllib.parse
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'frost_cartel.db')
DB_PATH = os.path.abspath(DB_PATH)

print(f"Connecting to database at: {DB_PATH}")
conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# 1. Locate TEAM AI
cursor.execute("SELECT id, team_name, raw_password FROM teams WHERE LOWER(team_name) = LOWER('team ai')")
team = cursor.fetchone()

if not team:
    print("ERROR: Squad 'TEAM AI' not found in database.")
    exit(1)

team_id, team_name, raw_password = team
print(f"Found Squad: '{team_name}' (ID: {team_id})")

now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

# 2. Reset the teams table row
cursor.execute("""
    UPDATE teams
    SET score = 0,
        total_credits = 500,
        max_credits = 500,
        is_paused = 0,
        login_count = 0,
        last_login_at = NULL,
        updated_at = ?
    WHERE id = ?
""", (now_iso, team_id))
print("Reset 'teams' table record.")

# 3. Reset stages_progress (Stage 1 AVAILABLE, Stage 2 AVAILABLE, Stage 3 LOCKED)
stage_configs = [
    (1, 'The Pumpkin Shuffle', 'AVAILABLE', 0, 100),
    (2, 'The Haunted Image Hunt', 'AVAILABLE', 0, 150),
    (3, 'The Forgotten Graveyard', 'LOCKED', 0, 250),
]

for stage_id, name, status, score, max_score in stage_configs:
    # Check if record exists
    cursor.execute("SELECT id FROM stages_progress WHERE team_id = ? AND stage_id = ?", (team_id, stage_id))
    existing = cursor.fetchone()
    if existing:
        cursor.execute("""
            UPDATE stages_progress
            SET stage_name = ?,
                status = ?,
                score = ?,
                max_score = ?,
                time_spent_seconds = 0,
                completed_at = NULL,
                fragment_unlocked = 0,
                updated_at = ?
            WHERE team_id = ? AND stage_id = ?
        """, (name, status, score, max_score, now_iso, team_id, stage_id))
    else:
        cursor.execute("""
            INSERT INTO stages_progress (
                id, team_id, stage_id, stage_name, status, score, max_score,
                time_spent_seconds, completed_at, fragment_unlocked, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 0, ?, ?)
        """, (f"stg-{team_id}-{stage_id}", team_id, stage_id, name, status, score, max_score, now_iso, now_iso))

print("Reset 'stages_progress' records (Stage 1: AVAILABLE, Stage 2: AVAILABLE, Stage 3: LOCKED).")

# 4. Clear transactional tables
tables_to_clear = [
    'score_transactions',
    'activity_history',
    'team_sessions',
    'round3_sessions',
    'round3_hunt1_sessions',
    'round3_hunt2_sessions',
    'round3_hunt3_sessions',
    'round3_runs',
    'round3_inventory',
    'round3_card_usage',
    'round3_cooperation_ledger',
    'round4_qualified_teams',
    'round4_team_progress',
    'round4_winner',
]

for t in tables_to_clear:
    try:
        cursor.execute(f"DELETE FROM {t} WHERE team_id = ?", (team_id,))
        count = cursor.rowcount
        if count > 0:
            print(f"Cleared {count} rows from '{t}'")
    except sqlite3.OperationalError as e:
        # Table might not exist or might not have team_id column
        pass

# 5. Clean from round2_state JSON if present
try:
    cursor.execute("SELECT json FROM round2_state WHERE id = 1")
    row = cursor.fetchone()
    if row:
        r2_state = json.loads(row[0])
        teams_dict = r2_state.get('teams', {})
        modified = False
        for k in list(teams_dict.keys()):
            if k.lower() in ['team ai', team_id.lower()]:
                del teams_dict[k]
                modified = True
        if modified:
            cursor.execute("UPDATE round2_state SET json = ? WHERE id = 1", (json.dumps(r2_state),))
            print("Purged TEAM AI from round2_state JSON.")
except Exception as e:
    print(f"Notice on round2_state: {e}")

conn.commit()
print("Committed all changes to database.")

# 6. Verify database state
print("\n--- DATABASE VERIFICATION ---")
cursor.execute("SELECT id, team_name, score, is_paused, total_credits, max_credits FROM teams WHERE id = ?", (team_id,))
print("Teams record:", cursor.fetchone())

cursor.execute("SELECT stage_id, stage_name, status, score, max_score, completed_at FROM stages_progress WHERE team_id = ? ORDER BY stage_id", (team_id,))
for row in cursor.fetchall():
    print(f"  Stage {row[0]}: {row[1]} | Status: {row[2]} | Score: {row[3]}/{row[4]} | CompletedAt: {row[5]}")

conn.close()

# 7. Test API Authentication & Round 1 State through Backend
print("\n--- BACKEND API VERIFICATION ---")
try:
    login_data = json.dumps({"teamName": "TEAM AI", "password": raw_password}).encode('utf-8')
    req = urllib.request.Request(
        "http://127.0.0.1:3001/api/auth/team-login",
        data=login_data,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        login_res = json.loads(resp.read().decode('utf-8'))
        token = login_res.get('token')
        print(f"Login successful! Player: {login_res.get('playerNumber')}, Token: {token[:12]}...")

    state_req = urllib.request.Request(
        "http://127.0.0.1:3001/api/round1/state",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(state_req) as resp:
        state_res = json.loads(resp.read().decode('utf-8'))
        team_state = state_res.get('team', {})
        stages_state = state_res.get('stages', [])
        print(f"API Team Score: {team_state.get('score')}")
        print(f"API Team Credits: {team_state.get('totalCredits')} / {team_state.get('maxCredits')}")
        for s in stages_state:
            print(f"  API Stage {s.get('stage_id')}: {s.get('stage_name')} | Status: {s.get('status')} | Score: {s.get('score')}")

    print("\nAPI successfully confirmed clean fresh progress for TEAM AI.")
except Exception as e:
    print(f"Backend API check warning (is server running on 3001?): {e}")

print("\nTEAM AI PROGRESS RESET COMPLETE!")
