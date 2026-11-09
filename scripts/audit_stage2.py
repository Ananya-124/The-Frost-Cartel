import os
import re
from PIL import Image

content = open("src/components/game/stage2/stage2TargetsConfig.ts", encoding="utf-8").read()

# Match each HuntImage block
pattern = r"{\s*id:\s*'(img_\d+)',\s*title:\s*'(.*?)',\s*imageUrl:\s*'(.*?)'.*?width:\s*(\d+),\s*height:\s*(\d+),\s*}"
matches = re.findall(pattern, content, re.DOTALL)

print(f"{'Image ID':<8} {'Title':<25} {'Config Size':<15} {'Actual File Size':<18} {'Match?'}")
print("-" * 75)
for img_id, title, img_url, w, h in matches:
    file_path = os.path.join("public", img_url.lstrip("/"))
    actual_size = "MISSING"
    match_str = "NO"
    if os.path.exists(file_path):
        im = Image.open(file_path)
        actual_size = f"{im.width}x{im.height}"
        match_str = "YES" if (int(w) == im.width and int(h) == im.height) else f"DIFF ({im.width-int(w)}, {im.height-int(h)})"
    print(f"{img_id:<8} {title:<25} {w+'x'+h:<15} {actual_size:<18} {match_str}")

