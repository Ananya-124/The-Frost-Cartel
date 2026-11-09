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

# Let's inspect each image and print its exact dimensions
for iid, p in image_files.items():
    im = Image.open(p)
    print(f"{iid}: {im.size} (W={im.width}, H={im.height})")

