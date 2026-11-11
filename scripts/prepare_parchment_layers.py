import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

src_path = r'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/.user_uploaded/media_1794422537695_c9ef3087.jpg'
out_dir = r'public/assets/round-4'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert('RGB')
w, h = img.size
arr = np.array(img, dtype=np.float32) / 255.0

# 1. Detect background (dark charcoal outside the scroll)
# Scroll paper is warm yellow/brown: r > 0.35, g > 0.25, b > 0.15
# Or distance from near-black
darkness = np.mean(arr, axis=2)
# Background is dark < 0.18, paper is > 0.22
# Top roll starts around y = 20, ends around y = 135
# Bottom edge ends around y = 715

# Let's create an alpha mask for the scroll
# Compute color difference from dark background
is_paper = (arr[:, :, 0] > 0.25) | (arr[:, :, 1] > 0.18) | (arr[:, :, 2] > 0.12)
# For the wax seal and ribbon (deep red): r > 0.35, g < 0.15, b < 0.15
is_red = (arr[:, :, 0] > 0.3) & (arr[:, :, 1] < 0.2)
is_scroll = is_paper | is_red

# Clean up mask with binary closing / opening
is_scroll = ndimage.binary_fill_holes(is_scroll)
is_scroll = ndimage.binary_closing(is_scroll, structure=np.ones((5, 5)))
is_scroll = ndimage.binary_opening(is_scroll, structure=np.ones((3, 3)))

# Soften the alpha boundary
alpha_mask = is_scroll.astype(np.float32)
alpha_mask = ndimage.gaussian_filter(alpha_mask, sigma=1.0)
alpha_mask = np.clip(alpha_mask, 0.0, 1.0)

# 2. Inpaint text and button
# Text regions:
# Y 125 to 515, X 120 to 480: text is significantly darker than surrounding parchment
# Let's detect text pixels by comparing pixel brightness to local median brightness
paper_gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
local_med = ndimage.median_filter(paper_gray, size=25)

# Text is notably darker than local median
is_text = (paper_gray < local_med - 0.09) & is_scroll
# Exclude top roll (y < 125) and bottom curl (y > 630) from text mask
is_text[:125, :] = False
is_text[630:, :] = False
is_text[:, :80] = False
is_text[:, 520:] = False

# Also mask the button area: y from 525 to 615, x from 135 to 465
is_button = np.zeros((h, w), dtype=bool)
is_button[520:618, 130:470] = True
is_button = is_button & is_scroll

# Also mask the reddish parchment strip behind the italic text: y from 450 to 515, x from 100 to 500
is_banner = np.zeros((h, w), dtype=bool)
is_banner[452:512, 105:495] = True
is_banner = is_banner & is_scroll

inpaint_mask = is_text | is_button | is_banner
# Dilate inpaint mask slightly
inpaint_mask = ndimage.binary_dilation(inpaint_mask, structure=np.ones((5, 5)))

print(f'Total pixels to inpaint: {np.sum(inpaint_mask)}')

from skimage.restoration import inpaint_biharmonic

# Inpaint the RGB channels
inpainted = inpaint_biharmonic(arr, inpaint_mask, channel_axis=-1)
inpainted = np.clip(inpainted, 0.0, 1.0)

# Add back natural subtle parchment grain to inpainted regions
rng = np.random.default_rng()
noise = rng.normal(0, 0.015, arr.shape)
inpainted_with_grain = np.clip(inpainted + noise * inpaint_mask[:, :, None], 0.0, 1.0)

# Convert to uint8 RGBA
clean_rgba = np.zeros((h, w, 4), dtype=np.uint8)
clean_rgba[:, :, :3] = (inpainted_with_grain * 255).astype(np.uint8)
clean_rgba[:, :, 3] = (alpha_mask * 255).astype(np.uint8)

clean_img = Image.fromarray(clean_rgba, 'RGBA')
clean_path = os.path.join(out_dir, 'ancient_parchment_dawn_relic.png')
clean_img.save(clean_path)
print(f'Saved clean parchment to: {clean_path}')

# Now let's extract the modular layers for the physical GSAP unrolling animation:
# 1. Top Roll: y 0 to 140
top_roll_rgba = clean_rgba.copy()
top_roll_rgba[140:, :, 3] = 0
top_roll_img = Image.fromarray(top_roll_rgba[:140, :, :], 'RGBA')
top_roll_path = os.path.join(out_dir, 'parchment_top_roll.png')
top_roll_img.save(top_roll_path)
print(f'Saved top roll to: {top_roll_path}')

# 2. Bottom Curl: y 620 to h
bottom_curl_rgba = clean_rgba.copy()
bottom_curl_img = Image.fromarray(bottom_curl_rgba[615:, :, :], 'RGBA')
bottom_curl_path = os.path.join(out_dir, 'parchment_bottom_curl.png')
bottom_curl_img.save(bottom_curl_path)
print(f'Saved bottom curl to: {bottom_curl_path}')

# 3. Body Parchment: y 120 to 630
body_rgba = clean_rgba[115:635, :, :]
body_img = Image.fromarray(body_rgba, 'RGBA')
body_path = os.path.join(out_dir, 'parchment_body.png')
body_img.save(body_path)
print(f'Saved parchment body to: {body_path}')

