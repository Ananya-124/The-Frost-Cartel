import os
from PIL import Image
import numpy as np

FLOOR_DIR = r"C:\Users\yashm\Downloads\winter arc\public\images\round-04\floors"

def analyze_floor(floor_filename):
    path = os.path.join(FLOOR_DIR, floor_filename)
    img = Image.open(path).convert("RGB")
    w, h = img.size
    print(f"\n--- Analyzing {floor_filename} ({w}x{h}) ---")
    
    # Resize to canonical 1024 x 774 for game grid
    CANONICAL_W = 1024
    CANONICAL_H = 774
    img_scaled = img.resize((CANONICAL_W, CANONICAL_H), Image.Resampling.LANCZOS)
    arr = np.array(img_scaled)
    
    # In the watercolor floor map:
    # - Foliage / greenery outside is deep green (R low, G high/medium, B low/medium)
    # - Outer background / margins: white or near white (R,G,B > 240)
    # - Walls: dark brown / black lines (R,G,B < 100)
    # - Corridors / walkways: light warm ivory / cream (R ≈ 240-255, G ≈ 235-248, B ≈ 210-230)
    # - Room floors: warm yellow-tan / peach-tan (R ≈ 230-245, G ≈ 200-225, B ≈ 150-185)
    # - Inner courtyard / garden: vibrant green / yellow-green grass
    
    # Let's sample colors across several key coordinate zones
    test_points = [
        ("Top Exterior Foliage", 512, 40),
        ("Floor Label Area", 512, 85),
        ("North Central Corridor", 512, 180),
        ("Central Elevator / Lifts", 475, 460),
        ("Central Spine Corridor", 512, 350),
        ("West Corridor", 230, 350),
        ("East Corridor", 750, 350),
        ("South Exterior Garden", 512, 600),
        ("Left Wing Classroom Interior", 150, 200),
        ("Right Wing Classroom Interior", 880, 200),
        ("Bottom Left Lab Interior", 150, 500),
        ("Bottom Right Hall Interior", 880, 500),
    ]
    
    for label, x, y in test_points:
        r, g, b = arr[y, x]
        print(f"  {label} ({x}, {y}): RGB=({r}, {g}, {b})")

if __name__ == "__main__":
    for f in ["floor-02.png", "floor-04.png", "floor-06.png", "floor-07.png"]:
        analyze_floor(f)

