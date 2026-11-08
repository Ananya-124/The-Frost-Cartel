import json
import re
from PIL import Image, ImageDraw

with open('public/assets/stage-02/manifest/target-manifest.json') as f:
    manifest = json.load(f)

img_map = {
    'img_01': 'ancestral-study.jpg',
    'img_02': 'alchemists-crypt.jpg',
    'img_03': 'mausoleum-vault.jpg',
    'img_04': 'witch-belfry.jpg',
    'img_05': 'haunted-mansion.jpg',
    'img_06': 'cursed-attic.jpg',
    'img_07': 'haunted-village.jpg',
    'img_08': 'forest-bridge.jpg'
}

for t in manifest:
    img_path = 'public/assets/stage-02/photographs/' + img_map[t['imageId']]
    im = Image.open(img_path).convert('RGB')
    
    # Parse SVG path points
    pts_str = re.findall(r'(\d+\.?\d*),(\d+\.?\d*)', t['svgPath'])
    pts = [(float(x), float(y)) for x, y in pts_str]
    
    # Draw outline
    draw = ImageDraw.Draw(im)
    if len(pts) > 2:
        draw.polygon(pts, outline=(255, 215, 0), width=3)
    
    # Crop around target with padding
    pad = 40
    bx0 = max(0, int(t['x'] - pad))
    by0 = max(0, int(t['y'] - pad))
    bx1 = min(im.width, int(t['x'] + t['width'] + pad))
    by1 = min(im.height, int(t['y'] + t['height'] + pad))
    crop = im.crop((bx0, by0, bx1, by1))
    
    tid = t['targetId']
    out_path = f'public/assets/stage-02/previews/preview_{tid}.png'
    crop.save(out_path)
    print(f"Saved preview: {out_path} ({crop.size})")

print("All 12 previews generated successfully!")

