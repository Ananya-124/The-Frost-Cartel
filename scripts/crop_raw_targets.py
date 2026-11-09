import os
from PIL import Image

image_files = {
    'img_01': 'public/assets/stage-02/photographs/ancestral-study.jpg',
    'img_02': 'public/assets/stage-02/photographs/alchemists-crypt.jpg',
    'img_03': 'public/assets/stage-02/photographs/mausoleum-vault.jpg',
    'img_04': 'public/assets/stage-02/photographs/witch-belfry.jpg',
    'img_05': 'public/assets/stage-02/photographs/haunted-mansion.jpg',
    'img_06': 'public/assets/stage-02/photographs/cursed-attic.jpg',
    'img_07': 'public/assets/stage-02/photographs/haunted-village.jpg',
    'img_08': 'public/assets/stage-02/photographs/forest-bridge.jpg',
}

# The 12 targets with their current (x, y, w, h)
targets = [
    ('pumpkin', 'img_01', 180, 535, 160, 135),
    ('potion_bottle', 'img_02', 412, 155, 106, 400),
    ('coffin', 'img_03', 460, 550, 400, 270),
    ('skull', 'img_03', 485, 715, 70, 95),
    ('bat', 'img_04', 580, 220, 160, 80),
    ('candle', 'img_04', 480, 1180, 50, 100),
    ('ghost', 'img_05', 420, 335, 150, 140),
    ('spider_web', 'img_05', 980, 20, 150, 150),
    ('witch_hat', 'img_06', 325, 620, 110, 95),
    ('spider', 'img_06', 510, 205, 88, 88),
    ('black_cat', 'img_07', 640, 610, 95, 140),
    ('skeleton_key', 'img_08', 800, 1300, 120, 60),
]

out_dir = r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/raw_targets"
os.makedirs(out_dir, exist_ok=True)

for tid, img_id, x, y, w, h in targets:
    im = Image.open(image_files[img_id])
    margin = 60
    cx1 = max(0, x - margin)
    cy1 = max(0, y - margin)
    cx2 = min(im.width, x + w + margin)
    cy2 = min(im.height, y + h + margin)
    crop = im.crop((cx1, cy1, cx2, cy2))
    crop.save(os.path.join(out_dir, f"raw_{tid}_{img_id}.png"))
    print(f"Saved raw crop: raw_{tid}_{img_id}.png from ({cx1},{cy1}) to ({cx2},{cy2})")

