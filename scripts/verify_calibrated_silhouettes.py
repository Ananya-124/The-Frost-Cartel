import os
import re
from PIL import Image, ImageDraw
import numpy as np

# We can parse the cubic beziers and evaluate them at t in [0..1] to draw continuous lines on the crops
def eval_cubic_bezier(p0, p1, p2, p3, steps=10):
    pts = []
    for s in range(steps + 1):
        t = s / steps
        mt = 1 - t
        pt = (mt**3)*p0 + 3*(mt**2)*t*p1 + 3*mt*(t**2)*p2 + (t**3)*p3
        pts.append((float(pt[0]), float(pt[1])))
    return pts

def bezier_path_to_points(path_str):
    tokens = path_str.split()
    all_pts = []
    curr = None
    i = 0
    while i < len(tokens):
        cmd = tokens[i]
        if cmd == 'M':
            x, y = map(float, tokens[i+1].split(','))
            curr = np.array([x, y])
            all_pts.append((x, y))
            i += 2
        elif cmd == 'C':
            cp1 = np.array(list(map(float, tokens[i+1].split(','))))
            cp2 = np.array(list(map(float, tokens[i+2].split(','))))
            p2 = np.array(list(map(float, tokens[i+3].split(','))))
            curve_pts = eval_cubic_bezier(curr, cp1, cp2, p2, steps=6)
            all_pts.extend(curve_pts[1:])
            curr = p2
            i += 4
        elif cmd == 'Z':
            if all_pts:
                all_pts.append(all_pts[0])
            i += 1
        else:
            i += 1
    return all_pts

# Import calibrated paths
from calibrate_all_12_silhouettes import calibrated_paths

image_files = {
    'pumpkin': ('img_01', 'public/assets/stage-02/photographs/ancestral-study.jpg'),
    'potion_bottle': ('img_02', 'public/assets/stage-02/photographs/alchemists-crypt.jpg'),
    'coffin': ('img_03', 'public/assets/stage-02/photographs/mausoleum-vault.jpg'),
    'skull': ('img_03', 'public/assets/stage-02/photographs/mausoleum-vault.jpg'),
    'bat': ('img_04', 'public/assets/stage-02/photographs/witch-belfry.jpg'),
    'candle': ('img_04', 'public/assets/stage-02/photographs/witch-belfry.jpg'),
    'ghost': ('img_05', 'public/assets/stage-02/photographs/haunted-mansion.jpg'),
    'spider_web': ('img_05', 'public/assets/stage-02/photographs/haunted-mansion.jpg'),
    'witch_hat': ('img_06', 'public/assets/stage-02/photographs/cursed-attic.jpg'),
    'spider': ('img_06', 'public/assets/stage-02/photographs/cursed-attic.jpg'),
    'black_cat': ('img_07', 'public/assets/stage-02/photographs/haunted-village.jpg'),
    'skeleton_key': ('img_08', 'public/assets/stage-02/photographs/forest-bridge.jpg'),
}

out_dir = r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/calibrated_verification"
os.makedirs(out_dir, exist_ok=True)

for tid, path_str in calibrated_paths.items():
    img_id, img_path = image_files[tid]
    im = Image.open(img_path).convert('RGB')
    pts = bezier_path_to_points(path_str)
    
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    
    margin = 40
    crop_x1 = max(0, int(min_x - margin))
    crop_y1 = max(0, int(min_y - margin))
    crop_x2 = min(im.width, int(max_x + margin))
    crop_y2 = min(im.height, int(max_y + margin))
    
    crop = im.crop((crop_x1, crop_y1, crop_x2, crop_y2)).copy()
    draw = ImageDraw.Draw(crop)
    
    local_pts = [(p[0] - crop_x1, p[1] - crop_y1) for p in pts]
    # Draw antique gold curve
    draw.line(local_pts, fill=(251, 191, 36), width=3)
    
    crop_save_path = os.path.join(out_dir, f"calib_{tid}.png")
    crop.save(crop_save_path)
    print(f"Verified {tid:<15}: bounds ({min_x:.1f}, {min_y:.1f}) to ({max_x:.1f}, {max_y:.1f}), size ({max_x-min_x:.1f} x {max_y-min_y:.1f}) -> {crop_save_path}")

print("All 12 verifications saved successfully!")

