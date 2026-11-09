import re
import numpy as np
from verify_calibrated_silhouettes import calibrated_paths, bezier_path_to_points, image_files
from PIL import Image

image_dims = {
    'img_01': (1280, 857),
    'img_02': (1280, 853),
    'img_03': (1280, 987),
    'img_04': (1280, 1920),
    'img_05': (1200, 896),
    'img_06': (1200, 896),
    'img_07': (1280, 853),
    'img_08': (1280, 1707),
}

for tid, path_str in calibrated_paths.items():
    img_id, _ = image_files[tid]
    img_w, img_h = image_dims[img_id]
    pts = bezier_path_to_points(path_str)
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    
    # Add a small 2-3px padding for the bounding box
    min_x = max(0, np.floor(min(xs) - 2))
    max_x = min(img_w, np.ceil(max(xs) + 2))
    min_y = max(0, np.floor(min(ys) - 2))
    max_y = min(img_h, np.ceil(max(ys) + 2))
    
    w = max_x - min_x
    h = max_y - min_y
    
    x_pct = round((min_x / img_w) * 100, 2)
    y_pct = round((min_y / img_h) * 100, 2)
    w_pct = round((w / img_w) * 100, 2)
    h_pct = round((h / img_h) * 100, 2)
    
    print(f"'{tid}': {{ x: {int(min_x)}, y: {int(min_y)}, width: {int(w)}, height: {int(h)}, xPercent: {x_pct}, yPercent: {y_pct}, widthPercent: {w_pct}, heightPercent: {h_pct} }},")

