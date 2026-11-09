import os
import json
import numpy as np
from calibrate_all_12_silhouettes import calibrated_paths
from generate_target_meta import image_dims

# Metadata for each target
target_info = [
    {
        'targetId': 'pumpkin',
        'aliases': '["pumpkin", "jack-o-lantern", "jack o lantern"]',
        'name': "Carved Jack-o'-Lantern",
        'shortName': 'Pumpkin',
        'imageId': 'img_01',
        'imageTitle': "The Ancestral Study",
        'difficulty': 'EASY',
    },
    {
        'targetId': 'potion_bottle',
        'aliases': '["potion_bottle", "potion bottle", "potion vial", "potion"]',
        'name': "Venom Potion Bottle",
        'shortName': 'Potion Bottle',
        'imageId': 'img_02',
        'imageTitle': "The Alchemist's Crypt",
        'difficulty': 'EASY',
    },
    {
        'targetId': 'coffin',
        'aliases': '["coffin", "casket", "sarcophagus"]',
        'name': "Stone Sarcophagus Coffin",
        'shortName': 'Coffin',
        'imageId': 'img_03',
        'imageTitle': "The Mausoleum Vault",
        'difficulty': 'EASY',
    },
    {
        'targetId': 'skull',
        'aliases': '["skull", "ancestral skull"]',
        'name': "Ancestral Skull",
        'shortName': 'Skull',
        'imageId': 'img_03',
        'imageTitle': "The Mausoleum Vault",
        'difficulty': 'EASY',
    },
    {
        'targetId': 'bat',
        'aliases': '["bat", "vampire bat", "nocturnal bat"]',
        'name': "Nocturnal Bat",
        'shortName': 'Bat',
        'imageId': 'img_04',
        'imageTitle': "The Witch's Belfry",
        'difficulty': 'HARD',
    },
    {
        'targetId': 'candle',
        'aliases': '["candle", "altar candle", "ritual candle"]',
        'name': "Altar Candle",
        'shortName': 'Candle',
        'imageId': 'img_04',
        'imageTitle': "The Witch's Belfry",
        'difficulty': 'MEDIUM',
    },
    {
        'targetId': 'ghost',
        'aliases': '["ghost", "spirit", "apparition", "spectral ghost"]',
        'name': "Spectral Ghost Apparition",
        'shortName': 'Ghost',
        'imageId': 'img_05',
        'imageTitle': "The Haunted Mansion",
        'difficulty': 'MEDIUM',
    },
    {
        'targetId': 'spider_web',
        'aliases': '["spider_web", "spider web", "cobweb", "web"]',
        'name': "Woven Cobweb",
        'shortName': 'Spider Web',
        'imageId': 'img_05',
        'imageTitle': "The Haunted Mansion",
        'difficulty': 'HARD',
    },
    {
        'targetId': 'witch_hat',
        'aliases': '["witch_hat", "witch hat", "pointed hat", "hat"]',
        'name': "Pointed Witch Hat",
        'shortName': 'Witch Hat',
        'imageId': 'img_06',
        'imageTitle': "The Cursed Attic",
        'difficulty': 'MEDIUM',
    },
    {
        'targetId': 'spider',
        'aliases': '["spider", "arachnid", "crawling spider"]',
        'name': "Crawling Spider",
        'shortName': 'Spider',
        'imageId': 'img_06',
        'imageTitle': "The Cursed Attic",
        'difficulty': 'HARD',
    },
    {
        'targetId': 'black_cat',
        'aliases': '["black_cat", "black cat", "cat", "feline"]',
        'name': "Obsidian Black Cat",
        'shortName': 'Black Cat',
        'imageId': 'img_07',
        'imageTitle': "The Haunted Village",
        'difficulty': 'MEDIUM',
    },
    {
        'targetId': 'skeleton_key',
        'aliases': '["skeleton_key", "skeleton key", "antique key", "key"]',
        'name': "Ornate Skeleton Key",
        'shortName': 'Skeleton Key',
        'imageId': 'img_08',
        'imageTitle': "The Forest Bridge",
        'difficulty': 'HARD',
    },
]

from verify_calibrated_silhouettes import bezier_path_to_points

computed_defs = []
for info in target_info:
    tid = info['targetId']
    img_id = info['imageId']
    img_w, img_h = image_dims[img_id]
    path_str = calibrated_paths[tid]
    pts = bezier_path_to_points(path_str)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    
    min_x = max(0, int(np.floor(min(xs) - 2)))
    max_x = min(img_w, int(np.ceil(max(xs) + 2)))
    min_y = max(0, int(np.floor(min(ys) - 2)))
    max_y = min(img_h, int(np.ceil(max(ys) + 2)))
    w = max_x - min_x
    h = max_y - min_y
    
    x_pct = round((min_x / img_w) * 100, 2)
    y_pct = round((min_y / img_h) * 100, 2)
    w_pct = round((w / img_w) * 100, 2)
    h_pct = round((h / img_h) * 100, 2)
    
    computed_defs.append({
        **info,
        'x': min_x,
        'y': min_y,
        'width': w,
        'height': h,
        'xPercent': x_pct,
        'yPercent': y_pct,
        'widthPercent': w_pct,
        'heightPercent': h_pct,
        'svgPath': path_str,
    })

print("Computed 12 defs.")
