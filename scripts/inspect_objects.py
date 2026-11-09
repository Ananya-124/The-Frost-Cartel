import os
from PIL import Image
import numpy as np

# Let's inspect each raw crop and report color distributions, brightest/darkest regions, and object centers
crops = [
    ('pumpkin', 'raw_pumpkin_img_01.png', (120, 475)),
    ('potion_bottle', 'raw_potion_bottle_img_02.png', (352, 95)),
    ('coffin', 'raw_coffin_img_03.png', (400, 490)),
    ('skull', 'raw_skull_img_03.png', (425, 655)),
    ('bat', 'raw_bat_img_04.png', (520, 160)),
    ('candle', 'raw_candle_img_04.png', (420, 1120)),
    ('ghost', 'raw_ghost_img_05.png', (360, 275)),
    ('spider_web', 'raw_spider_web_img_05.png', (920, 0)),
    ('witch_hat', 'raw_witch_hat_img_06.png', (265, 560)),
    ('spider', 'raw_spider_img_06.png', (450, 145)),
    ('black_cat', 'raw_black_cat_img_07.png', (580, 550)),
    ('skeleton_key', 'raw_skeleton_key_img_08.png', (740, 1240)),
]

base_dir = r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/raw_targets"

for name, fname, offset in crops:
    path = os.path.join(base_dir, fname)
    im = Image.open(path).convert('RGB')
    arr = np.array(im)
    off_x, off_y = offset
    
    # Summary of image channels
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    
    # Specific object color checks
    if name == 'pumpkin':
        # Orange has high R, moderate G, low B (R > 120, G > 60, B < 60, R > G + 40)
        mask = (r > 100) & (g > 40) & (r > b + 50) & (r > g + 20)
    elif name == 'ghost':
        # Ghost is whitish/cyan spectral glow (high R, G, B or high brightness)
        mask = (r > 150) & (g > 150) & (b > 150)
    elif name == 'black_cat':
        # Cat is dark (low R, G, B) with bright glowing eyes
        mask = (r < 50) & (g < 50) & (b < 50)
        eyes_mask = (r > 160) & (g > 160) & (b < 80)
        ey, ex = np.where(eyes_mask)
        if len(ey) > 0:
            print(f"Cat eyes detected at abs ({off_x + np.mean(ex):.1f}, {off_y + np.mean(ey):.1f})")
    elif name == 'spider':
        # Spider is dark spider on lighter wood rafter
        mask = (r < 70) & (g < 60) & (b < 50)
    elif name == 'candle':
        # Flame is bright yellow/orange
        mask = (r > 200) & (g > 150) & (b < 100)
    elif name == 'skull':
        # Bone white/beige
        mask = (r > 140) & (g > 130) & (b > 110)
    elif name == 'witch_hat':
        # Black hat
        mask = (r < 50) & (g < 50) & (b < 50)
    elif name == 'bat':
        # Dark silhouette
        mask = (r < 60) & (g < 60) & (b < 60)
    elif name == 'skeleton_key':
        # Metallic / brass key
        mask = (r > 100) & (g > 80) & (b < 80)
    elif name == 'potion_bottle':
        # Bottle glass/fluid
        mask = (g > r + 20) | (r > 120)
    elif name == 'spider_web':
        # White cobweb strands
        mask = (r > 120) & (g > 120) & (b > 120)
    elif name == 'coffin':
        # Coffin stone
        mask = (r > 60) & (g > 60) & (b > 60)
    
    ys, xs = np.where(mask)
    if len(ys) > 0:
        min_x, max_x = off_x + xs.min(), off_x + xs.max()
        min_y, max_y = off_y + ys.min(), off_y + ys.max()
        cx, cy = off_x + np.mean(xs), off_y + np.mean(ys)
        print(f"{name:<15}: bounds X[{min_x}..{max_x}], Y[{min_y}..{max_y}], center ({cx:.1f}, {cy:.1f}), matching pixels: {len(ys)}")
    else:
        print(f"{name:<15}: no matching pixels with initial threshold")

