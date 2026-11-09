import os
import re
from PIL import Image, ImageDraw

# Parse STAGE2_TARGET_DEFINITIONS from stage2TargetsConfig.ts
content = open("src/components/game/stage2/stage2TargetsConfig.ts", encoding="utf-8").read()

# Helper to parse SVG path commands (M, L, C, Z) into polygon points for drawing
def parse_svg_path(path_str):
    # Split by commands
    commands = re.findall(r'([MLCZ])\s*([^MLCZ]*)', path_str)
    points = []
    curr = (0, 0)
    for cmd, args in commands:
        nums = [float(x) for x in re.findall(r'[-+]?\d*\.?\d+', args)]
        if cmd == 'M' and len(nums) >= 2:
            curr = (nums[0], nums[1])
            points.append(curr)
        elif cmd == 'L':
            for i in range(0, len(nums), 2):
                if i+1 < len(nums):
                    curr = (nums[i], nums[i+1])
                    points.append(curr)
        elif cmd == 'C':
            for i in range(0, len(nums), 6):
                if i+5 < len(nums):
                    # end point of cubic bezier
                    curr = (nums[i+4], nums[i+5])
                    points.append(curr)
        elif cmd == 'Z':
            if points:
                points.append(points[0])
    return points

# Map image IDs to file paths
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

# Extract targets
pattern = r"targetId:\s*'(.*?)'.*?name:\s*[\"'](.*?)[\"'].*?imageId:\s*'(.*?)'.*?x:\s*(\d+).*?y:\s*(\d+).*?width:\s*(\d+).*?height:\s*(\d+).*?svgPath:\s*'(.*?)'"
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} target definitions.")

out_dir = r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage2_audit"
os.makedirs(out_dir, exist_ok=True)

for tid, name, img_id, x, y, w, h, path_str in matches:
    img_path = image_files.get(img_id)
    if not img_path or not os.path.exists(img_path):
        print(f"Skipping {tid}: {img_path} not found")
        continue
    
    im = Image.open(img_path).convert('RGB')
    x, y, w, h = int(x), int(y), int(w), int(h)
    
    # Draw on a copy of the image
    overlay = im.copy()
    draw = ImageDraw.Draw(overlay)
    
    # Draw bounding box in dashed or green
    draw.rectangle([x, y, x + w, y + h], outline=(0, 255, 0), width=3)
    
    # Parse path and draw in red/amber
    pts = parse_svg_path(path_str)
    if len(pts) > 1:
        draw.line(pts, fill=(255, 200, 0), width=3)
    
    # Crop around the object with 80px margin
    cx1 = max(0, x - 80)
    cy1 = max(0, y - 80)
    cx2 = min(im.width, x + w + 80)
    cy2 = min(im.height, y + h + 80)
    
    crop = overlay.crop((cx1, cy1, cx2, cy2))
    crop_name = f"{tid}_{img_id}.png"
    crop.save(os.path.join(out_dir, crop_name))
    print(f"Saved audit crop for {tid} ({name}) in {img_id}: box ({x},{y},{w},{h}), crop size {crop.size}")

print("All audit crops generated!")

