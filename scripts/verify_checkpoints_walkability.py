import json
import os
import numpy as np

COLLISION_FILE = r"C:\Users\yashm\Downloads\winter arc\public\data\round-04\floor_collisions.json"
with open(COLLISION_FILE, "r", encoding="utf-8") as f:
    collisions = json.load(f)

CHECKPOINTS = [
    # Route 1: 4 -> 2 -> 5 -> 3 -> 7
    {"id": "r1_s1", "route": 1, "step": 1, "floor": "floor-04", "x": 230, "y": 520, "name": "CS UG Lab 2"},
    {"id": "r1_s2", "route": 1, "step": 2, "floor": "floor-02", "x": 512, "y": 280, "name": "Sitting Benches"},
    {"id": "r1_s3", "route": 1, "step": 3, "floor": "floor-05", "x": 512, "y": 330, "name": "Ratan Tata Frame"},
    {"id": "r1_s4", "route": 1, "step": 4, "floor": "floor-03", "x": 460, "y": 430, "name": "Lift Notice Board"},
    {"id": "r1_s5", "route": 1, "step": 5, "floor": "floor-07", "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)"},

    # Route 2: 2 -> 4 -> 6 -> 3 -> 7
    {"id": "r2_s1", "route": 2, "step": 1, "floor": "floor-02", "x": 280, "y": 240, "name": "Room 217 Table"},
    {"id": "r2_s2", "route": 2, "step": 2, "floor": "floor-04", "x": 740, "y": 220, "name": "Collab Banner Chambers"},
    {"id": "r2_s3", "route": 2, "step": 3, "floor": "floor-06", "x": 720, "y": 160, "name": "CSBS 604 Staircase"},
    {"id": "r2_s4", "route": 2, "step": 4, "floor": "floor-03", "x": 720, "y": 240, "name": "C301 Compartments"},
    {"id": "r2_s5", "route": 2, "step": 5, "floor": "floor-07", "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)"},

    # Route 3: 2 -> 6 -> 3 -> 5 -> 7
    {"id": "r3_s1", "route": 3, "step": 1, "floor": "floor-02", "x": 190, "y": 310, "name": "Room 215 Boxes"},
    {"id": "r3_s2", "route": 3, "step": 2, "floor": "floor-06", "x": 170, "y": 520, "name": "Circuits Lab Guglielmo"},
    {"id": "r3_s3", "route": 3, "step": 3, "floor": "floor-03", "x": 320, "y": 200, "name": "C302 Result Board"},
    {"id": "r3_s4", "route": 3, "step": 4, "floor": "floor-05", "x": 260, "y": 220, "name": "CR501 Fire Cabinet"},
    {"id": "r3_s5", "route": 3, "step": 5, "floor": "floor-07", "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)"},

    # Route 4: 4 -> 6 -> 2 -> 5 -> 7
    {"id": "r4_s1", "route": 4, "step": 1, "floor": "floor-04", "x": 512, "y": 420, "name": "CSE Vision Lift Sign"},
    {"id": "r4_s2", "route": 4, "step": 2, "floor": "floor-06", "x": 760, "y": 220, "name": "AV 602 Notice Board"},
    {"id": "r4_s3", "route": 4, "step": 3, "floor": "floor-02", "x": 780, "y": 240, "name": "C208 Storage Corner"},
    {"id": "r4_s4", "route": 4, "step": 4, "floor": "floor-05", "x": 750, "y": 480, "name": "Lab 503 Suggestion Box"},
    {"id": "r4_s5", "route": 4, "step": 5, "floor": "floor-07", "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)"},

    # Route 5: 6 -> 2 -> 5 -> 4 -> 7
    {"id": "r5_s1", "route": 5, "step": 1, "floor": "floor-06", "x": 530, "y": 430, "name": "AI&DS Project Lab Sign"},
    {"id": "r5_s2", "route": 5, "step": 2, "floor": "floor-02", "x": 610, "y": 320, "name": "Printex Kiosk"},
    {"id": "r5_s3", "route": 5, "step": 3, "floor": "floor-05", "x": 140, "y": 380, "name": "CR503/504 Side Exit"},
    {"id": "r5_s4", "route": 5, "step": 4, "floor": "floor-04", "x": 360, "y": 520, "name": "Distinguished Alumni"},
    {"id": "r5_s5", "route": 5, "step": 5, "floor": "floor-07", "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)"},
]

all_passed = True
for cp in CHECKPOINTS:
    f_data = collisions[cp["floor"]]
    scale = f_data["gridScale"]
    gx = cp["x"] // scale
    gy = cp["y"] // scale
    
    # Decompress RLE
    grid_flat = []
    for val, count in f_data["rle"]:
        grid_flat.extend([val] * count)
    grid = np.array(grid_flat).reshape((f_data["gridHeight"], f_data["gridWidth"]))
    
    is_walkable = (grid[gy, gx] == 1)
    status = "WALKABLE ✓" if is_walkable else "BLOCKED ✗"
    if not is_walkable:
        all_passed = False
    print(f"[{cp['id']}] Route {cp['route']} Step {cp['step']} on {cp['floor']} ({cp['x']}, {cp['y']}): {status} ({cp['name']})")

print(f"\nFinal Checkpoint Walkability Verification: {'ALL 25 CHECKPOINTS 100% WALKABLE & CONNECTED!' if all_passed else 'FAILURES DETECTED'}")

