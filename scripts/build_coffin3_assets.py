import os
from PIL import Image, ImageFilter
import numpy as np

os.makedirs('public/assets/round-01/stage-03/inspection', exist_ok=True)
os.makedirs('public/assets/stage-3/coffins', exist_ok=True)

# 1. Load source artwork
src_path = 'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/.user_uploaded/media_1794288556836_0396c284.jpg'
src = Image.open(src_path).convert('RGB')
w, h = src.size
print(f'Source artwork loaded: {w}x{h}')

# 2. Extract inspection crops from pristine source
crops = {
    'soul_crystal': (255, 185, 330, 265),
    'skeleton_iii': (275, 75, 405, 205),
    'potion_bottle': (290, 235, 370, 325),
    'celestial_medallion': (395, 170, 475, 250),
    'ancient_book': (345, 240, 485, 360),
    'ancient_scroll': (505, 230, 605, 350),
    'star_chart_parchment': (585, 245, 755, 345),
    'relic_chest': (635, 315, 770, 400),
}

print('=== CROPPING INSPECTION ASSETS ===')
percentages = {}
for name, (x1, y1, x2, y2) in crops.items():
    crop = src.crop((x1, y1, x2, y2))
    # Double size for crisp modal viewing with Lanczos
    crop_hd = crop.resize(((x2 - x1) * 2, (y2 - y1) * 2), Image.Resampling.LANCZOS)
    save_path = f'public/assets/round-01/stage-03/inspection/{name}.png'
    crop_hd.save(save_path)
    pct_x = round((x1 / w) * 100, 2)
    pct_y = round((y1 / h) * 100, 2)
    pct_w = round(((x2 - x1) / w) * 100, 2)
    pct_h = round(((y2 - y1) / h) * 100, 2)
    percentages[name] = {'left': f'{pct_x}%', 'top': f'{pct_y}%', 'width': f'{pct_w}%', 'height': f'{pct_h}%'}
    print(f"{name:22s}: left: '{pct_x}%', top: '{pct_y}%', width: '{pct_w}%', height: '{pct_h}%', crop size: {crop_hd.size}")

# 3. Build pristine master clean artwork without baked-in HUD or console
master = src.copy()

# A. Clean top header strip (y: 0 to 48)
sky = src.crop((0, 48, w, 68)).resize((w, 48), Image.Resampling.BILINEAR)
sky = sky.filter(ImageFilter.GaussianBlur(1.0))
master.paste(sky, (0, 0))
for y in range(48):
    factor = (y / 48.0) ** 1.3
    for x in range(w):
        r, g, b = master.getpixel((x, y))
        master.putpixel((x, y), (int(r * factor), int(g * factor), int(b * factor)))

# B. Clean bottom console area (y: 412 to 576, x: 120 to 900)
wood_strip = src.crop((120, 404, 900, 412)).resize((780, 164), Image.Resampling.BILINEAR)
wood_strip = wood_strip.filter(ImageFilter.GaussianBlur(2.0))
wood_arr = np.array(wood_strip).astype(float)
for y_i in range(164):
    fade = max(0.08, 1.0 - (y_i / 164.0) * 0.85)
    wood_arr[y_i, :] *= fade
wood_clean = Image.fromarray(np.uint8(wood_arr))

mask = Image.new('L', (780, 164), 255)
for x_i in range(30):
    f = x_i / 30.0
    for y_i in range(164):
        mask.putpixel((x_i, y_i), int(255 * f))
        mask.putpixel((779 - x_i, y_i), int(255 * f))
for y_i in range(15):
    f = y_i / 15.0
    for x_i in range(780):
        curr = mask.getpixel((x_i, y_i))
        mask.putpixel((x_i, y_i), int(curr * f))

master.paste(wood_clean, (120, 412), mask)

# C. Global bottom vignette to pure obsidian
for y in range(h - 35, h):
    f = 1.0 - ((y - (h - 35)) / 35.0) * 0.8
    for x in range(w):
        r, g, b = master.getpixel((x, y))
        master.putpixel((x, y), (int(r * f), int(g * f), int(b * f)))

# Save native 1024x576 master
master_1024 = master.copy()
master_1024.save('public/assets/stage-3/coffins/grave3_final_testament.jpg', quality=95)

# Save 2560x1440 HD master with Lanczos for ultra-crisp 16:9 displays
master_2560 = master.resize((2560, 1440), Image.Resampling.LANCZOS)
master_2560.save('public/assets/round-01/stage-03/coffin-03-final-testament-master.png', optimize=True)

print('All assets built successfully!')
print(f'grave3_final_testament.jpg size: {master_1024.size}')
print(f'coffin-03-final-testament-master.png size: {master_2560.size}')
