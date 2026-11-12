import os
from PIL import Image, ImageDraw, ImageFont

FLOOR_DIR = r"C:\Users\yashm\Downloads\winter arc\public\images\round-04\floors"
DEBUG_DIR = r"C:\Users\yashm\Downloads\winter arc\docs\round-04\debug_checkpoints"
os.makedirs(DEBUG_DIR, exist_ok=True)

CHECKPOINTS = {
    "floor-02": [
        {"id": "r2_s1", "route": 2, "step": 1, "x": 280, "y": 240, "name": "Room 217 Table", "token": "GHOUL"},
        {"id": "r3_s1", "route": 3, "step": 1, "x": 190, "y": 310, "name": "Room 215 Boxes", "token": "SPECTER"},
        {"id": "r1_s2", "route": 1, "step": 2, "x": 512, "y": 280, "name": "Sitting Benches", "token": "CANDLE"},
        {"id": "r5_s2", "route": 5, "step": 2, "x": 610, "y": 320, "name": "Printex Kiosk", "token": "MIDNIGHT"},
        {"id": "r4_s3", "route": 4, "step": 3, "x": 780, "y": 240, "name": "C208 Storage Corner", "token": "COBWEB"},
    ],
    "floor-03": [
        {"id": "r3_s3", "route": 3, "step": 3, "x": 320, "y": 200, "name": "C302 Result Board", "token": "WITCH"},
        {"id": "r1_s4", "route": 1, "step": 4, "x": 460, "y": 430, "name": "Lift Notice Board", "token": "HEX"},
        {"id": "r2_s4", "route": 2, "step": 4, "x": 720, "y": 240, "name": "C301 Compartments", "token": "GRIMOIRE"},
    ],
    "floor-04": [
        {"id": "r1_s1", "route": 1, "step": 1, "x": 230, "y": 520, "name": "CS UG Lab 2 Table", "token": "WRAITH"},
        {"id": "r4_s1", "route": 4, "step": 1, "x": 512, "y": 420, "name": "CSE Vision Lift Sign", "token": "CAULDRON"},
        {"id": "r2_s2", "route": 2, "step": 2, "x": 740, "y": 220, "name": "Collab Banner Chambers", "token": "COVEN"},
        {"id": "r5_s4", "route": 5, "step": 4, "x": 360, "y": 520, "name": "Distinguished Alumni", "token": "OMEN"},
    ],
    "floor-05": [
        {"id": "r1_s3", "route": 1, "step": 3, "x": 512, "y": 330, "name": "Ratan Tata Frame", "token": "RAVEN"},
        {"id": "r5_s3", "route": 5, "step": 3, "x": 140, "y": 380, "name": "CR503/504 Side Exit", "token": "CRYPT"},
        {"id": "r3_s4", "route": 3, "step": 4, "x": 260, "y": 220, "name": "CR501 Fire Cabinet", "token": "BANSHEE"},
        {"id": "r4_s4", "route": 4, "step": 4, "x": 750, "y": 480, "name": "Lab 503 Suggestion Box", "token": "LANTERN"},
    ],
    "floor-06": [
        {"id": "r5_s1", "route": 5, "step": 1, "x": 530, "y": 430, "name": "AI&DS Project Lab Sign", "token": "VAMPIRE"},
        {"id": "r3_s2", "route": 3, "step": 2, "x": 170, "y": 520, "name": "Circuits Lab Guglielmo", "token": "TALISMAN"},
        {"id": "r4_s2", "route": 4, "step": 2, "x": 760, "y": 220, "name": "AV 602 Notice Board", "token": "NIGHTFALL"},
        {"id": "r2_s3", "route": 2, "step": 3, "x": 720, "y": 160, "name": "CSBS 604 Staircase", "token": "PHANTOM"},
    ],
    "floor-07": [
        {"id": "final_s5", "route": 0, "step": 5, "x": 800, "y": 510, "name": "Main Event Venue (Anchor Fan)", "token": "ANCHOR"},
    ],
}

for floor_key, cps in CHECKPOINTS.items():
    img_path = os.path.join(FLOOR_DIR, f"{floor_key}.png")
    with Image.open(img_path) as orig:
        scaled = orig.resize((1024, 774), Image.Resampling.LANCZOS)
        draw = ImageDraw.Draw(scaled)
        
        # Draw spawn point
        draw.ellipse([502, 440, 522, 460], fill=(0, 200, 255), outline=(0, 100, 200), width=2)
        draw.text((525, 442), "SPAWN", fill=(0, 50, 150))
        
        for cp in cps:
            cx, cy = cp["x"], cp["y"]
            r = 18
            # Draw golden radiant marker
            draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 158, 11, 180), outline=(217, 119, 6), width=3)
            draw.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=(255, 255, 255))
            label = f"R{cp['route']}-S{cp['step']}: {cp['name']} [{cp['token']}]" if cp['route'] > 0 else f"FINAL: {cp['name']}"
            draw.text((cx + 22, cy - 8), label, fill=(180, 83, 9))
            
        out_debug = os.path.join(DEBUG_DIR, f"verify_{floor_key}.png")
        scaled.save(out_debug)
        print(f"Generated verification preview: {out_debug}")

