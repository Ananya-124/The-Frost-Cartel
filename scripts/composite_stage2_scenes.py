import os
import json
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from skimage import measure

os.makedirs('public/assets/stage-02/photographs', exist_ok=True)
os.makedirs('public/assets/stage-2/photographs', exist_ok=True)
os.makedirs('public/assets/stage-02/manifest', exist_ok=True)

def path_from_mask(mask, tolerance=1.5):
    contours = measure.find_contours(mask.astype(float), 0.5)
    if not contours:
        return ""
    # pick largest contour by length
    c = max(contours, key=lambda x: len(x))
    approx = measure.approximate_polygon(c, tolerance=tolerance)
    if len(approx) < 3:
        approx = c[::2]
    # SVG coordinates: x is col (approx[:, 1]), y is row (approx[:, 0])
    pts = [f"{pt[1]:.1f},{pt[0]:.1f}" for pt in approx]
    return "M " + " L ".join(pts) + " Z"

def paste_with_shadow(base_img, cutout, pos, shadow_offset=(4, 6), shadow_blur=4, shadow_alpha=120):
    bw, bh = base_img.size
    cw, ch = cutout.size
    px, py = pos

    # Create shadow
    shadow_mask = cutout.split()[3] if cutout.mode == 'RGBA' else Image.new('L', (cw, ch), 255)
    shadow = Image.new('RGBA', (cw, ch), (0, 0, 0, shadow_alpha))
    shadow.putalpha(shadow_mask)
    shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))

    # Paste shadow
    sx, sy = px + shadow_offset[0], py + shadow_offset[1]
    base_img.paste(shadow, (sx, sy), shadow)

    # Paste cutout
    base_img.paste(cutout, (px, py), cutout if cutout.mode == 'RGBA' else None)

targets_manifest = []

# ==========================================
# 1. THE ANCESTRAL STUDY (ancestral-study.jpg)
# Target: pumpkin
# ==========================================
im1 = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg').convert('RGBA')
w1, h1 = im1.size
pumpkin = Image.open('public/assets/pumpkin_left.png').convert('RGBA')
pumpkin = pumpkin.resize((150, 105), Image.Resampling.LANCZOS)
# Tone pumpkin to match dark dusty floor room
enhancer = ImageEnhance.Color(pumpkin)
pumpkin = enhancer.enhance(0.9)
# Position near desk leg in foreground/midground: x: 190, y: 560
p1_pos = (190, 560)
paste_with_shadow(im1, pumpkin, p1_pos, shadow_offset=(8, 12), shadow_blur=6, shadow_alpha=160)

# Generate pumpkin SVG path
p_mask = np.zeros((h1, w1), dtype=bool)
p_arr = np.array(pumpkin)[:, :, 3] > 60
p_mask[p1_pos[1]:p1_pos[1]+105, p1_pos[0]:p1_pos[0]+150] = p_arr
pumpkin_svg = path_from_mask(p_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'pumpkin',
    'aliases': ['pumpkin', 'jack-o-lantern', 'jack o lantern'],
    'name': 'Carved Jack-o\'-Lantern',
    'shortName': 'Pumpkin',
    'imageId': 'img_01',
    'imageTitle': 'The Ancestral Study',
    'x': p1_pos[0],
    'y': p1_pos[1],
    'width': 150,
    'height': 105,
    'xPercent': round((p1_pos[0] / w1) * 100, 2),
    'yPercent': round((p1_pos[1] / h1) * 100, 2),
    'widthPercent': round((150 / w1) * 100, 2),
    'heightPercent': round((105 / h1) * 100, 2),
    'svgPath': pumpkin_svg
})
im1.convert('RGB').save('public/assets/stage-02/photographs/ancestral-study.jpg', quality=92)
im1.convert('RGB').save('public/assets/stage-2/photographs/ancestral-study.jpg', quality=92)
print("1. Ancestral Study composited")

# ==========================================
# 2. THE ALCHEMIST'S CRYPT (alchemists-crypt.jpg)
# Target: potion_bottle
# ==========================================
im2 = Image.open('public/assets/stage-02/photographs/alchemists-crypt.jpg').convert('RGBA')
w2, h2 = im2.size
# In alchemists-crypt (1280x853), the tall amber glass bottle with glass stopper
# is at x: 420 to 520, y: 30 to 450
pot_mask = np.zeros((h2, w2), dtype=bool)
# Bottle silhouette: neck from 30 to 180 (x: 440 to 495), body from 180 to 450 (x: 410 to 525)
y, x = np.indices((h2, w2))
neck = (y >= 30) & (y < 190) & (x >= 435) & (x <= 500)
body = (y >= 190) & (y <= 460) & (x >= 405) & (x <= 530)
pot_mask = neck | body
potion_svg = path_from_mask(pot_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'potion_bottle',
    'aliases': ['potion_bottle', 'potion bottle', 'potion vial', 'potion'],
    'name': 'Venom Potion Bottle',
    'shortName': 'Potion Bottle',
    'imageId': 'img_02',
    'imageTitle': 'The Alchemist\'s Crypt',
    'x': 405,
    'y': 30,
    'width': 125,
    'height': 430,
    'xPercent': round((405 / w2) * 100, 2),
    'yPercent': round((30 / h2) * 100, 2),
    'widthPercent': round((125 / w2) * 100, 2),
    'heightPercent': round((430 / h2) * 100, 2),
    'svgPath': potion_svg
})
im2.convert('RGB').save('public/assets/stage-02/photographs/alchemists-crypt.jpg', quality=92)
im2.convert('RGB').save('public/assets/stage-2/photographs/alchemists-crypt.jpg', quality=92)
print("2. Alchemist Crypt composited")

# ==========================================
# 3. THE MAUSOLEUM VAULT (mausoleum-vault.jpg)
# Targets: coffin, skull
# ==========================================
im3 = Image.open('public/assets/stage-02/photographs/mausoleum-vault.jpg').convert('RGBA')
w3, h3 = im3.size
# Coffin is the central stone sarcophagus: x: 460 to 860, y: 550 to 820
coffin_mask = np.zeros((h3, w3), dtype=bool)
y, x = np.indices((h3, w3))
coffin_area = (x >= 460) & (x <= 860) & (y >= 550) & (y <= 820)
coffin_mask = coffin_area
coffin_svg = path_from_mask(coffin_mask, tolerance=2.5)

targets_manifest.append({
    'targetId': 'coffin',
    'aliases': ['coffin', 'casket', 'sarcophagus'],
    'name': 'Stone Sarcophagus Coffin',
    'shortName': 'Coffin',
    'imageId': 'img_03',
    'imageTitle': 'The Mausoleum Vault',
    'x': 460,
    'y': 550,
    'width': 400,
    'height': 270,
    'xPercent': round((460 / w3) * 100, 2),
    'yPercent': round((550 / h3) * 100, 2),
    'widthPercent': round((400 / w3) * 100, 2),
    'heightPercent': round((270 / h3) * 100, 2),
    'svgPath': coffin_svg
})

# Composite Ancestral Skull on the lower-left stone tier of the sarcophagus
skull_cut = Image.open('public/assets/stage-02/targets/skull_cutout.png').convert('RGBA')
skull_cut = skull_cut.resize((70, 95), Image.Resampling.LANCZOS)
# Tone skull to match warm stone lighting
sk_pos = (485, 715)
paste_with_shadow(im3, skull_cut, sk_pos, shadow_offset=(4, 6), shadow_blur=4, shadow_alpha=180)

sk_mask = np.zeros((h3, w3), dtype=bool)
sk_arr = np.array(skull_cut)[:, :, 3] > 60
sk_mask[sk_pos[1]:sk_pos[1]+95, sk_pos[0]:sk_pos[0]+70] = sk_arr
skull_svg = path_from_mask(sk_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'skull',
    'aliases': ['skull', 'ancestral skull'],
    'name': 'Ancestral Skull',
    'shortName': 'Skull',
    'imageId': 'img_03',
    'imageTitle': 'The Mausoleum Vault',
    'x': sk_pos[0],
    'y': sk_pos[1],
    'width': 70,
    'height': 95,
    'xPercent': round((sk_pos[0] / w3) * 100, 2),
    'yPercent': round((sk_pos[1] / h3) * 100, 2),
    'widthPercent': round((70 / w3) * 100, 2),
    'heightPercent': round((95 / h3) * 100, 2),
    'svgPath': skull_svg
})
im3.convert('RGB').save('public/assets/stage-02/photographs/mausoleum-vault.jpg', quality=92)
im3.convert('RGB').save('public/assets/stage-2/photographs/mausoleum-vault.jpg', quality=92)
print("3. Mausoleum Vault composited")

# ==========================================
# 4. THE WITCH'S BELFRY (witch-belfry.jpg)
# Targets: bat, candle
# ==========================================
im4 = Image.open('public/assets/stage-02/photographs/witch-belfry.jpg').convert('RGBA')
w4, h4 = im4.size

# 1. Vampire bat in upper gothic arch rafters (x: 580, y: 220)
bat = Image.open('public/assets/real_vampire_bat.png').convert('RGBA')
bat = bat.resize((160, 80), Image.Resampling.LANCZOS)
bat_pos = (580, 220)
paste_with_shadow(im4, bat, bat_pos, shadow_offset=(3, 5), shadow_blur=5, shadow_alpha=160)

bat_mask = np.zeros((h4, w4), dtype=bool)
bat_arr = np.array(bat)[:, :, 3] > 50
bat_mask[bat_pos[1]:bat_pos[1]+80, bat_pos[0]:bat_pos[0]+160] = bat_arr
bat_svg = path_from_mask(bat_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'bat',
    'aliases': ['bat', 'vampire bat', 'nocturnal bat'],
    'name': 'Nocturnal Bat',
    'shortName': 'Bat',
    'imageId': 'img_04',
    'imageTitle': 'The Witch\'s Belfry',
    'x': bat_pos[0],
    'y': bat_pos[1],
    'width': 160,
    'height': 80,
    'xPercent': round((bat_pos[0] / w4) * 100, 2),
    'yPercent': round((bat_pos[1] / h4) * 100, 2),
    'widthPercent': round((160 / w4) * 100, 2),
    'heightPercent': round((80 / h4) * 100, 2),
    'svgPath': bat_svg
})

# 2. Candle on lower stone arch ledge (x: 480, y: 1180)
candle = Image.open('public/assets/stage-02/targets/candle_cutout.png').convert('RGBA')
candle = candle.resize((50, 100), Image.Resampling.LANCZOS)
c_pos = (480, 1180)
paste_with_shadow(im4, candle, c_pos, shadow_offset=(3, 5), shadow_blur=4, shadow_alpha=140)

c_mask = np.zeros((h4, w4), dtype=bool)
c_arr = np.array(candle)[:, :, 3] > 50
c_mask[c_pos[1]:c_pos[1]+100, c_pos[0]:c_pos[0]+50] = c_arr
candle_svg = path_from_mask(c_mask, tolerance=1.5)

targets_manifest.append({
    'targetId': 'candle',
    'aliases': ['candle', 'altar candle', 'ritual candle'],
    'name': 'Altar Candle',
    'shortName': 'Candle',
    'imageId': 'img_04',
    'imageTitle': 'The Witch\'s Belfry',
    'x': c_pos[0],
    'y': c_pos[1],
    'width': 50,
    'height': 100,
    'xPercent': round((c_pos[0] / w4) * 100, 2),
    'yPercent': round((c_pos[1] / h4) * 100, 2),
    'widthPercent': round((50 / w4) * 100, 2),
    'heightPercent': round((100 / h4) * 100, 2),
    'svgPath': candle_svg
})
im4.convert('RGB').save('public/assets/stage-02/photographs/witch-belfry.jpg', quality=92)
im4.convert('RGB').save('public/assets/stage-2/photographs/witch-belfry.jpg', quality=92)
print("4. Witch Belfry composited")

# ==========================================
# 5. THE HAUNTED MANSION (haunted-mansion.jpg)
# Targets: ghost, spider_web
# ==========================================
im5 = Image.open('public/assets/stage-02/photographs/haunted-mansion.jpg').convert('RGBA')
w5, h5 = im5.size

# 1. Translucent Ghost Apparition near upper staircase balustrade (x: 420, y: 340)
ghost = Image.open('public/assets/ghost_apparition.png').convert('RGBA')
ghost = ghost.resize((140, 130), Image.Resampling.LANCZOS)
# Make ethereal/translucent (alpha 0.75)
g_arr = np.array(ghost)
g_arr[:, :, 3] = (g_arr[:, :, 3].astype(float) * 0.75).astype(np.uint8)
ghost = Image.fromarray(g_arr)
g_pos = (420, 340)
im5.paste(ghost, g_pos, ghost)

g_mask = np.zeros((h5, w5), dtype=bool)
g_arr_mask = np.array(ghost)[:, :, 3] > 40
g_mask[g_pos[1]:g_pos[1]+130, g_pos[0]:g_pos[0]+140] = g_arr_mask
ghost_svg = path_from_mask(g_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'ghost',
    'aliases': ['ghost', 'spirit', 'apparition', 'spectral ghost'],
    'name': 'Spectral Ghost Apparition',
    'shortName': 'Ghost',
    'imageId': 'img_05',
    'imageTitle': 'The Haunted Mansion',
    'x': g_pos[0],
    'y': g_pos[1],
    'width': 140,
    'height': 130,
    'xPercent': round((g_pos[0] / w5) * 100, 2),
    'yPercent': round((g_pos[1] / h5) * 100, 2),
    'widthPercent': round((140 / w5) * 100, 2),
    'heightPercent': round((130 / h5) * 100, 2),
    'svgPath': ghost_svg
})

# 2. Spider Web in top corner molding (x: 980, y: 20)
web = Image.open('public/assets/stage-02/targets/spider_web_cutout.png').convert('RGBA')
web = web.resize((150, 150), Image.Resampling.LANCZOS)
web_pos = (980, 20)
im5.paste(web, web_pos, web)

web_mask = np.zeros((h5, w5), dtype=bool)
web_mask[web_pos[1]:web_pos[1]+150, web_pos[0]:web_pos[0]+150] = True
web_svg = path_from_mask(web_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'spider_web',
    'aliases': ['spider_web', 'spider web', 'spiderweb', 'cobweb'],
    'name': 'Woven Cobweb',
    'shortName': 'Spider Web',
    'imageId': 'img_05',
    'imageTitle': 'The Haunted Mansion',
    'x': web_pos[0],
    'y': web_pos[1],
    'width': 150,
    'height': 150,
    'xPercent': round((web_pos[0] / w5) * 100, 2),
    'yPercent': round((web_pos[1] / h5) * 100, 2),
    'widthPercent': round((150 / w5) * 100, 2),
    'heightPercent': round((150 / h5) * 100, 2),
    'svgPath': web_svg
})
im5.convert('RGB').save('public/assets/stage-02/photographs/haunted-mansion.jpg', quality=92)
im5.convert('RGB').save('public/assets/stage-2/photographs/haunted-mansion.jpg', quality=92)
print("5. Haunted Mansion composited")

# ==========================================
# 6. THE CURSED ATTIC (cursed-attic.jpg)
# Targets: witch_hat, spider
# ==========================================
im6 = Image.open('public/assets/stage-02/photographs/cursed-attic.jpg').convert('RGBA')
w6, h6 = im6.size

# 1. Pointed Witch Hat on lower attic steps (x: 325, y: 620)
what = Image.open('public/assets/stage-02/targets/witch_hat_cutout.png').convert('RGBA')
what = what.resize((110, 95), Image.Resampling.LANCZOS)
what_pos = (325, 620)
paste_with_shadow(im6, what, what_pos, shadow_offset=(4, 6), shadow_blur=4, shadow_alpha=160)

what_mask = np.zeros((h6, w6), dtype=bool)
what_arr = np.array(what)[:, :, 3] > 60
what_mask[what_pos[1]:what_pos[1]+95, what_pos[0]:what_pos[0]+110] = what_arr
what_svg = path_from_mask(what_mask, tolerance=2.0)

targets_manifest.append({
    'targetId': 'witch_hat',
    'aliases': ['witch_hat', 'witch hat', 'witches hat'],
    'name': 'Pointed Witch Hat',
    'shortName': 'Witch Hat',
    'imageId': 'img_06',
    'imageTitle': 'The Cursed Attic',
    'x': what_pos[0],
    'y': what_pos[1],
    'width': 110,
    'height': 95,
    'xPercent': round((what_pos[0] / w6) * 100, 2),
    'yPercent': round((what_pos[1] / h6) * 100, 2),
    'widthPercent': round((110 / w6) * 100, 2),
    'heightPercent': round((95 / h6) * 100, 2),
    'svgPath': what_svg
})

# 2. Crawling Spider on roof timber beam (x: 520, y: 210)
spid = Image.open('public/assets/stage-02/targets/spider_cutout.png').convert('RGBA')
spid = spid.resize((65, 65), Image.Resampling.LANCZOS)
spid_pos = (520, 210)
paste_with_shadow(im6, spid, spid_pos, shadow_offset=(2, 3), shadow_blur=2, shadow_alpha=140)

spid_mask = np.zeros((h6, w6), dtype=bool)
spid_arr = np.array(spid)[:, :, 3] > 60
spid_mask[spid_pos[1]:spid_pos[1]+65, spid_pos[0]:spid_pos[0]+65] = spid_arr
spider_svg = path_from_mask(spid_mask, tolerance=1.5)

targets_manifest.append({
    'targetId': 'spider',
    'aliases': ['spider', 'crawling spider', 'arachnid'],
    'name': 'Crawling Spider',
    'shortName': 'Spider',
    'imageId': 'img_06',
    'imageTitle': 'The Cursed Attic',
    'x': spid_pos[0],
    'y': spid_pos[1],
    'width': 65,
    'height': 65,
    'xPercent': round((spid_pos[0] / w6) * 100, 2),
    'yPercent': round((spid_pos[1] / h6) * 100, 2),
    'widthPercent': round((65 / w6) * 100, 2),
    'heightPercent': round((65 / h6) * 100, 2),
    'svgPath': spider_svg
})
im6.convert('RGB').save('public/assets/stage-02/photographs/cursed-attic.jpg', quality=92)
im6.convert('RGB').save('public/assets/stage-2/photographs/cursed-attic.jpg', quality=92)
print("6. Cursed Attic composited")

# ==========================================
# 7. THE HAUNTED VILLAGE (haunted-village.jpg)
# Target: black_cat
# ==========================================
im7 = Image.open('public/assets/stage-02/photographs/haunted-village.jpg').convert('RGBA')
w7, h7 = im7.size

cat = Image.open('public/assets/stage-02/targets/black_cat_isolated.png').convert('RGBA')
# Cat dimensions: 95 x 140
# Position on wet cobblestones near tree base in amber lamp glow (x: 640, y: 610)
cat_pos = (640, 610)
paste_with_shadow(im7, cat, cat_pos, shadow_offset=(6, 10), shadow_blur=5, shadow_alpha=180)

cat_mask = np.zeros((h7, w7), dtype=bool)
cat_arr = np.array(cat)[:, :, 3] > 50
cat_mask[cat_pos[1]:cat_pos[1]+140, cat_pos[0]:cat_pos[0]+95] = cat_arr
cat_svg = path_from_mask(cat_mask, tolerance=1.8)

targets_manifest.append({
    'targetId': 'black_cat',
    'aliases': ['black_cat', 'black cat', 'cat'],
    'name': 'Obsidian Black Cat',
    'shortName': 'Black Cat',
    'imageId': 'img_07',
    'imageTitle': 'The Haunted Village',
    'x': cat_pos[0],
    'y': cat_pos[1],
    'width': 95,
    'height': 140,
    'xPercent': round((cat_pos[0] / w7) * 100, 2),
    'yPercent': round((cat_pos[1] / h7) * 100, 2),
    'widthPercent': round((95 / w7) * 100, 2),
    'heightPercent': round((140 / h7) * 100, 2),
    'svgPath': cat_svg
})
im7.convert('RGB').save('public/assets/stage-02/photographs/haunted-village.jpg', quality=92)
im7.convert('RGB').save('public/assets/stage-2/photographs/haunted-village.jpg', quality=92)
print("7. Haunted Village composited with Black Cat at exact coordinates!")

# ==========================================
# 8. THE FOREST BRIDGE (forest-bridge.jpg)
# Target: skeleton_key
# ==========================================
im8 = Image.open('public/assets/stage-02/photographs/forest-bridge.jpg').convert('RGBA')
w8, h8 = im8.size

key = Image.open('public/assets/stage-02/decorations/desk_brass_key.png').convert('RGBA')
key = key.resize((120, 60), Image.Resampling.LANCZOS)
# Position on stone bridge masonry parapet: x: 800, y: 1300
key_pos = (800, 1300)
paste_with_shadow(im8, key, key_pos, shadow_offset=(3, 5), shadow_blur=4, shadow_alpha=160)

key_mask = np.zeros((h8, w8), dtype=bool)
key_arr = np.array(key)[:, :, 3] > 60
key_mask[key_pos[1]:key_pos[1]+60, key_pos[0]:key_pos[0]+120] = key_arr
key_svg = path_from_mask(key_mask, tolerance=1.5)

targets_manifest.append({
    'targetId': 'skeleton_key',
    'aliases': ['skeleton_key', 'skeleton key', 'antique key', 'key'],
    'name': 'Ornate Skeleton Key',
    'shortName': 'Skeleton Key',
    'imageId': 'img_08',
    'imageTitle': 'The Forest Bridge',
    'x': key_pos[0],
    'y': key_pos[1],
    'width': 120,
    'height': 60,
    'xPercent': round((key_pos[0] / w8) * 100, 2),
    'yPercent': round((key_pos[1] / h8) * 100, 2),
    'widthPercent': round((120 / w8) * 100, 2),
    'heightPercent': round((60 / h8) * 100, 2),
    'svgPath': key_svg
})
im8.convert('RGB').save('public/assets/stage-02/photographs/forest-bridge.jpg', quality=92)
im8.convert('RGB').save('public/assets/stage-2/photographs/forest-bridge.jpg', quality=92)
print("8. Forest Bridge composited")

# Write target manifest JSON
with open('public/assets/stage-02/manifest/target-manifest.json', 'w') as f:
    json.dump(targets_manifest, f, indent=2)
print("Target manifest JSON written successfully with all 12 targets!")

