import os
from PIL import Image
import numpy as np

os.makedirs('docs/audit_crops', exist_ok=True)
master = Image.open('public/assets/round-01/stage-03/coffin-02-buried-diary-master.png')
w, h = master.size
print(f"Master image size: {w} x {h}")

# Let's inspect the 11 target objects
# We will define candidate bounding boxes in (x1, y1, x2, y2) in 2560x1440 space
candidates = {
    'skull_mark': (1050, 160, 1310, 410),
    'number_7': (660, 420, 920, 660),
    'number_4': (1470, 250, 1720, 460),
    'number_3': (1550, 430, 1800, 630),
    'number_9': (1580, 580, 1780, 760),
    'ancient_diary': (910, 500, 1530, 900),
    'sealed_letter': (710, 790, 1100, 1050),
    'skeleton_key': (1280, 930, 1540, 1100),
    'compass_medallion': (1450, 950, 1660, 1140),
    'ancient_scroll': (1800, 720, 2140, 930),
    'treasure_chest': (1650, 940, 1980, 1140),
}

for name, box in candidates.items():
    crop = master.crop(box)
    crop.save(f'docs/audit_crops/{name}.png')
    x1, y1, x2, y2 = box
    bw = x2 - x1
    bh = y2 - y1
    print(f"{name}: Box=({x1}, {y1}, {x2}, {y2}), Dim={bw}x{bh}, Pct=(left: {x1/w*100:.2f}%, top: {y1/h*100:.2f}%, width: {bw/w*100:.2f}%, height: {bh/h*100:.2f}%)")
