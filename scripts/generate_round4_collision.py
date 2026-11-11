import json
import os
import numpy as np
from collections import deque
from PIL import Image, ImageDraw

CANONICAL_W = 1024
CANONICAL_H = 774

# Define universal architectural walkable corridors, foyers, and doorways for Platinum Jubilee Academic Block
# All units in 1024 x 774 space

COMMON_WALKABLE_CORRIDORS = [
    # 1. Central North-South Spine Corridor & Lift Foyer
    {"name": "Central Spine Corridor", "x": 465, "y": 140, "w": 95, "h": 360},
    {"name": "Elevator Lobby & Spawn Foyer", "x": 440, "y": 415, "w": 145, "h": 75},
    {"name": "South Foyer Connector", "x": 450, "y": 480, "w": 125, "h": 50},

    # 2. North Cross Corridor (East-West Highway)
    {"name": "North Cross Corridor (Main)", "x": 195, "y": 140, "w": 635, "h": 45},
    {"name": "North Cross Corridor (Upper)", "x": 220, "y": 125, "w": 585, "h": 25},

    # 3. West Wing Corridors & Passages
    {"name": "West Main Hallway", "x": 195, "y": 175, "w": 45, "h": 275},
    {"name": "West Stair Landing", "x": 240, "y": 125, "w": 55, "h": 55},
    {"name": "West Mid Corridor Connector", "x": 235, "y": 300, "w": 120, "h": 40},
    {"name": "West South Corridor (Lab Access)", "x": 185, "y": 435, "w": 260, "h": 45},

    # 4. East Wing Corridors & Passages
    {"name": "East Main Hallway", "x": 670, "y": 175, "w": 50, "h": 275},
    {"name": "East Stair Landing", "x": 730, "y": 125, "w": 60, "h": 55},
    {"name": "East Mid Corridor Connector", "x": 555, "y": 300, "w": 120, "h": 40},
    {"name": "East South Corridor", "x": 580, "y": 435, "w": 265, "h": 45},
]

# Floor-specific accessible rooms and doorways corresponding to riddles
FLOOR_ACCESSIBLE_ROOMS = {
    "floor-02": [
        # Room 217 (NW classroom) + Doorway
        {"name": "Room 217 Interior", "x": 240, "y": 195, "w": 115, "h": 70},
        {"name": "Room 217 Doorway", "x": 230, "y": 215, "w": 25, "h": 30},
        # Room 215 (West mid) + Doorway
        {"name": "Room 215 Interior", "x": 105, "y": 270, "w": 95, "h": 85},
        {"name": "Room 215 Doorway", "x": 190, "y": 295, "w": 20, "h": 30},
        # Sitting Benches Area (Central)
        {"name": "Central Sitting Benches Area", "x": 485, "y": 250, "w": 65, "h": 65},
        # Printex Kiosk Sitting Area (East Central)
        {"name": "Printex Kiosk Area", "x": 570, "y": 290, "w": 75, "h": 65},
        # C208 Storage Corner (East) + Doorway
        {"name": "C208 Interior Corner", "x": 730, "y": 200, "w": 105, "h": 75},
        {"name": "C208 Doorway", "x": 710, "y": 220, "w": 30, "h": 30},
    ],
    "floor-03": [
        # C302 Result Board Area (North-West) + Doorway
        {"name": "C302 Display Board Interior", "x": 260, "y": 185, "w": 115, "h": 55},
        {"name": "C302 Doorway", "x": 240, "y": 165, "w": 35, "h": 35},
        # Notice boards near Lift
        {"name": "Lift Notice Board Alcove", "x": 445, "y": 410, "w": 40, "h": 45},
        # C301 Compartments (East wing) + Doorway
        {"name": "C301 Compartments Interior", "x": 680, "y": 205, "w": 105, "h": 65},
        {"name": "C301 Doorway", "x": 670, "y": 215, "w": 25, "h": 30},
    ],
    "floor-04": [
        # CS UG Lab 2 (South-West) + Doorway
        {"name": "CS UG Lab 2 Interior", "x": 105, "y": 475, "w": 185, "h": 80},
        {"name": "CS UG Lab 2 Doorway", "x": 210, "y": 465, "w": 35, "h": 25},
        # CSE Vision & Mission Lift Lobby
        {"name": "CSE Vision Lift Lobby", "x": 470, "y": 395, "w": 85, "h": 55},
        # Industry-Academia Banner (Anusha/Bhavana Chambers) + Doorway
        {"name": "Anusha & Bhavana Chambers Interior", "x": 710, "y": 195, "w": 95, "h": 65},
        {"name": "Chambers Doorway", "x": 695, "y": 205, "w": 25, "h": 30},
        # BS Narayan Lab & Distinguished Alumni Poster (South Lab Area)
        {"name": "BS Narayan Lab Corridor Alcove", "x": 310, "y": 485, "w": 105, "h": 65},
        {"name": "BS Narayan Doorway", "x": 330, "y": 465, "w": 40, "h": 30},
    ],
    "floor-05": [
        # Ratan Tata Portrait Frame (Central Foyer)
        {"name": "Ratan Tata Central Frame Foyer", "x": 485, "y": 300, "w": 65, "h": 65},
        # CR503/504 Side Staircase Exit Door (West)
        {"name": "CR503/504 Exit Stairwell", "x": 105, "y": 350, "w": 100, "h": 60},
        {"name": "CR503/504 Exit Doorway", "x": 195, "y": 365, "w": 25, "h": 30},
        # CR501 Fire Cabinet Area (North-West) + Doorway
        {"name": "CR501 Fire Cabinet Alcove", "x": 235, "y": 195, "w": 75, "h": 55},
        {"name": "CR501 Doorway", "x": 220, "y": 175, "w": 30, "h": 30},
        # Lab 503 Blue Suggestion Box (East South) + Doorway
        {"name": "Lab 503 Interior", "x": 705, "y": 455, "w": 105, "h": 65},
        {"name": "Lab 503 Doorway", "x": 690, "y": 460, "w": 25, "h": 30},
    ],
    "floor-06": [
        # AI & DS Project Lab Sign (Near Lift)
        {"name": "AI&DS Project Lab Lift Foyer", "x": 490, "y": 400, "w": 75, "h": 60},
        # Electronics Circuits Lab (Guglielmo Board, SW) + Doorway
        {"name": "Electronics Circuits Lab Interior", "x": 95, "y": 480, "w": 145, "h": 75},
        {"name": "Circuits Lab Doorway", "x": 185, "y": 465, "w": 30, "h": 25},
        # AV 602 Notice Board (East Hall) + Doorway
        {"name": "AV 602 Notice Board Alcove", "x": 715, "y": 195, "w": 95, "h": 55},
        {"name": "AV 602 Doorway", "x": 700, "y": 185, "w": 25, "h": 30},
        # CSBS 604 Staircase
        {"name": "CSBS 604 Staircase Landing", "x": 700, "y": 135, "w": 65, "h": 45},
    ],
    "floor-07": [
        # Main Event Venue (Large Curved Hall with Ceiling Fan)
        {"name": "Main Event Hall Foyer", "x": 680, "y": 440, "w": 95, "h": 55},
        {"name": "Main Event Hall (Anchor Fan)", "x": 750, "y": 460, "w": 145, "h": 95},
        {"name": "Main Event Hall Entrance Portal", "x": 670, "y": 455, "w": 35, "h": 35},
    ],
}

def generate_collision_data():
    output_dir = r"C:\Users\yashm\Downloads\winter arc\src\data\round4"
    public_dir = r"C:\Users\yashm\Downloads\winter arc\public\data\round-04"
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(public_dir, exist_ok=True)
    
    collision_registry = {}
    
    for floor_id, rooms in FLOOR_ACCESSIBLE_ROOMS.items():
        all_walkable = COMMON_WALKABLE_CORRIDORS + rooms
        
        # Build 1024 x 774 binary grid (downsampled 4x for ultra-efficient fast lookup: 256 x 194)
        GRID_SCALE = 4
        GW = CANONICAL_W // GRID_SCALE  # 256
        GH = CANONICAL_H // GRID_SCALE  # 193
        
        grid = np.zeros((GH, GW), dtype=np.uint8)
        
        for region in all_walkable:
            gx1 = max(0, region["x"] // GRID_SCALE)
            gy1 = max(0, region["y"] // GRID_SCALE)
            gx2 = min(GW, (region["x"] + region["w"] + GRID_SCALE - 1) // GRID_SCALE)
            gy2 = min(GH, (region["y"] + region["h"] + GRID_SCALE - 1) // GRID_SCALE)
            grid[gy1:gy2, gx1:gx2] = 1
            
        # Verify BFS connectivity from spawn point (512, 450)
        spawn_gx = 512 // GRID_SCALE
        spawn_gy = 450 // GRID_SCALE
        
        visited = np.zeros_like(grid, dtype=bool)
        queue = deque([(spawn_gx, spawn_gy)])
        visited[spawn_gy, spawn_gx] = True
        
        while queue:
            cx, cy = queue.popleft()
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < GW and 0 <= ny < GH and grid[ny, nx] == 1 and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((nx, ny))
                    
        walkable_total = int(np.sum(grid))
        connected_total = int(np.sum(visited))
        
        print(f"[{floor_id}] Walkable cells: {walkable_total}, Connected from spawn: {connected_total} (Ratio: {connected_total/walkable_total*100:.1f}%)")
        
        # Convert binary grid to RLE (Run Length Encoded) string for compact storage
        flat = grid.flatten().tolist()
        rle = []
        cur_val = flat[0]
        cur_count = 0
        for val in flat:
            if val == cur_val:
                cur_count += 1
            else:
                rle.append([cur_val, cur_count])
                cur_val = val
                cur_count = 1
        rle.append([cur_val, cur_count])
        
        collision_registry[floor_id] = {
            "floorId": floor_id,
            "canonicalWidth": CANONICAL_W,
            "canonicalHeight": CANONICAL_H,
            "gridWidth": GW,
            "gridHeight": GH,
            "gridScale": GRID_SCALE,
            "spawnPoint": {"x": 512, "y": 450},
            "walkableRegions": all_walkable,
            "rle": rle
        }
        
        # Render a visual debug mask image
        debug_mask = Image.new("RGBA", (CANONICAL_W, CANONICAL_H), (0, 0, 0, 180))
        draw = ImageDraw.Draw(debug_mask)
        for r in all_walkable:
            draw.rectangle([r["x"], r["y"], r["x"] + r["w"], r["y"] + r["h"]], fill=(0, 255, 120, 140))
        debug_mask.save(os.path.join(r"C:\Users\yashm\Downloads\winter arc\docs\round-04\debug_checkpoints", f"collision_mask_{floor_id}.png"))
        
    out_json = os.path.join(public_dir, "floor_collisions.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(collision_registry, f, indent=2)
    print(f"\nWrote collision registry to {out_json}")
    
    # Also write TypeScript module
    ts_content = f"// Authoritative Round 4 Floor Collision Definitions\nexport const ROUND4_COLLISION_DATA = {json.dumps(collision_registry, indent=2)};\n"
    ts_out = os.path.join(output_dir, "round4CollisionData.ts")
    with open(ts_out, "w", encoding="utf-8") as f:
        f.write(ts_content)
    print(f"Wrote TypeScript collision module to {ts_out}")

if __name__ == "__main__":
    generate_collision_data()

