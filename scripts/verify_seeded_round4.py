import sqlite3

con = sqlite3.connect('database/frost_cartel.db')
cur = con.cursor()

# Check routes
routes = cur.execute('SELECT id, route_number, roman_numeral, route_name, route_subtitle FROM round4_routes ORDER BY route_number ASC').fetchall()
print(f"Total Routes in DB: {len(routes)}")
for r in routes:
    print(f"  {r[0]}: {r[3]} ({r[4]})")

# Check steps
steps = cur.execute('SELECT id, route_id, clue_index, floor_id, location_name, qr_token, validation_word FROM round4_steps ORDER BY route_id ASC, clue_index ASC').fetchall()
print(f"\nTotal Steps in DB: {len(steps)}")
for s in steps:
    print(f"  {s[0]} ({s[1]} Step {s[2]} on {s[3]}): {s[4]} -> QR: {s[5]}, Word: {s[6]}")

# Check settings
settings = cur.execute('SELECT common_final_floor_id, common_final_room_name, common_final_x, common_final_y, final_qr_token FROM round4_settings').fetchall()
print(f"\nSettings: {settings}")

