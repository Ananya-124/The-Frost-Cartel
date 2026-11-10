import os
from PIL import Image, ImageFilter
import numpy as np

src_path = 'public/assets/stage-3/coffins/grave1_marked_remains.jpg'
src = Image.open(src_path).convert('RGB')
w, h = src.size
print(f"Loaded source image: {w}x{h}")

clean = src.copy()

# =========================================================================
# 1. TOP TITLE CLEANUP (THE MARKED REMAINS + skull + wings: x=315..715, y=0..92)
# =========================================================================
sky_patch_w = 715 - 315 # 400
sky_patch_h = 92
c1_sky = src.crop((180, 0, 315, 92)).resize((sky_patch_w, sky_patch_h), Image.Resampling.BILINEAR)
c1_sky = c1_sky.filter(ImageFilter.GaussianBlur(1.5))
c1_arr = np.array(c1_sky).astype(float)
for x in range(sky_patch_w):
    factor = 1.0 + (x / float(sky_patch_w)) * 0.18
    c1_arr[:, x, 0] = np.clip(c1_arr[:, x, 0] * (factor * 0.95), 0, 255)
    c1_arr[:, x, 1] = np.clip(c1_arr[:, x, 1] * factor, 0, 255)
    c1_arr[:, x, 2] = np.clip(c1_arr[:, x, 2] * (factor * 1.08), 0, 255)

top_patch = Image.fromarray(c1_arr.astype(np.uint8))
top_mask = Image.new('L', (sky_patch_w, sky_patch_h), 255)
for x in range(sky_patch_w):
    for y in range(sky_patch_h):
        fx = 1.0
        if x < 15:
            fx = x / 15.0
        elif x > sky_patch_w - 16:
            fx = (sky_patch_w - 1 - x) / 15.0
        fy = 1.0
        if y > 84:
            fy = (sky_patch_h - 1 - y) / 7.0
        top_mask.putpixel((x, y), int(255 * fx * fy))

clean.paste(top_patch, (315, 0), top_mask)

# =========================================================================
# 2. BOTTOM CENTER TEXT CLEANUP (x=308..708, y=520..559)
# =========================================================================
wood_left = src.crop((240, 520, 308, 559))
wood_right = src.crop((708, 520, 776, 559))
patch_w = 708 - 308 # 400
patch_h = 39

wl_arr = np.array(wood_left.resize((patch_w, patch_h), Image.Resampling.BILINEAR)).astype(float)
wr_arr = np.array(wood_right.resize((patch_w, patch_h), Image.Resampling.BILINEAR)).astype(float)
wood_arr = np.zeros((patch_h, patch_w, 3), dtype=float)
for x in range(patch_w):
    alpha = x / float(patch_w)
    wood_arr[:, x, :] = (1.0 - alpha) * wl_arr[:, x, :] + alpha * wr_arr[:, x, :]

wood_clean = Image.fromarray(np.clip(wood_arr, 0, 255).astype(np.uint8))
wood_clean = wood_clean.filter(ImageFilter.GaussianBlur(0.6))

wood_mask = Image.new('L', (patch_w, patch_h), 255)
for x in range(patch_w):
    for y in range(patch_h):
        fx = 1.0
        if x < 8:
            fx = x / 8.0
        elif x > patch_w - 9:
            fx = (patch_w - 1 - x) / 8.0
        fy = 1.0
        if y < 3:
            fy = y / 3.0
        elif y > patch_h - 4:
            fy = (patch_h - 1 - y) / 3.0
        wood_mask.putpixel((x, y), int(255 * fx * fy))

clean.paste(wood_clean, (308, 520), wood_mask)

# =========================================================================
# 2B. BOTTOM CENTER FLOURISH CLEANUP (x=490..530, y=562..574)
# =========================================================================
flourish_w = 40
flourish_h = 12
mist_sample = src.crop((440, 562, 480, 574))
f_mask = Image.new('L', (flourish_w, flourish_h), 255)
for x in range(flourish_w):
    for y in range(flourish_h):
        fx = min(1.0, x / 4.0, (flourish_w - 1 - x) / 4.0)
        fy = min(1.0, y / 2.0, (flourish_h - 1 - y) / 2.0)
        f_mask.putpixel((x, y), int(255 * fx * fy))

clean.paste(mist_sample, (490, 562), f_mask)

# =========================================================================
# 3. BOTTOM RIGHT BUTTON CLEANUP (x=800..1024, y=475..560)
# =========================================================================
btn_w = 224
btn_h = 85
ground_src = src.crop((690, 475, 800, 560)).resize((btn_w, btn_h), Image.Resampling.BILINEAR)
ground_src = ground_src.filter(ImageFilter.GaussianBlur(0.8))
g_arr = np.array(ground_src).astype(float)
for y in range(btn_h):
    g_arr[y, :, :] *= (1.0 - (y / float(btn_h)) * 0.15)
ground_clean = Image.fromarray(np.clip(g_arr, 0, 255).astype(np.uint8))

btn_mask = Image.new('L', (btn_w, btn_h), 255)
for x in range(btn_w):
    for y in range(btn_h):
        fx = 1.0
        if x < 10:
            fx = x / 10.0
        fy = 1.0
        if y < 6:
            fy = y / 6.0
        elif y > btn_h - 7:
            fy = (btn_h - 1 - y) / 6.0
        btn_mask.putpixel((x, y), int(255 * fx * fy))

clean.paste(ground_clean, (800, 475), btn_mask)

# =========================================================================
# 4. BOTTOM LEFT OCTAGON BADGE (x=10..85, y=495..560)
# =========================================================================
badge_w = 75
badge_h = 65
mist_src = src.crop((85, 495, 150, 560)).resize((badge_w, badge_h), Image.Resampling.BILINEAR)
mist_src = mist_src.filter(ImageFilter.GaussianBlur(1.0))
badge_mask = Image.new('L', (badge_w, badge_h), 255)
for x in range(badge_w):
    for y in range(badge_h):
        fx = 1.0
        if x < 8:
            fx = x / 8.0
        elif x > badge_w - 9:
            fx = (badge_w - 1 - x) / 8.0
        fy = 1.0
        if y < 5:
            fy = y / 5.0
        elif y > badge_h - 6:
            fy = (badge_h - 1 - y) / 5.0
        badge_mask.putpixel((x, y), int(255 * fx * fy))

clean.paste(mist_src, (10, 495), badge_mask)

# Save native 1024x576
clean.save('public/assets/stage-3/coffins/grave1_marked_remains.jpg', quality=95)

# Save 2560x1440 HD Master with Lanczos
os.makedirs('public/assets/round-01/stage-03', exist_ok=True)
master_2560 = clean.resize((2560, 1440), Image.Resampling.LANCZOS)
master_2560.save('public/assets/round-01/stage-03/coffin-01-marked-remains-master.png', optimize=True)

# Also save full verification screenshot
os.makedirs('docs/screenshots', exist_ok=True)
clean.save('docs/screenshots/coffin1_clean_full_verified.png')

print("Pristine artwork successfully saved to:")
print(" - public/assets/stage-3/coffins/grave1_marked_remains.jpg (1024x576)")
print(" - public/assets/round-01/stage-03/coffin-01-marked-remains-master.png (2560x1440)")
