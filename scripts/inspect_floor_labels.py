import os
from PIL import Image

FLOOR_DIR = r"C:\Users\yashm\Downloads\winter arc\public\images\round-04\floors"

for fname in sorted(os.listdir(FLOOR_DIR)):
    if fname.endswith(".png"):
        fpath = os.path.join(FLOOR_DIR, fname)
        with Image.open(fpath) as img:
            print(f"{fname}: size {img.size}")

