import os
from PIL import Image, ImageDraw
import numpy as np
import re
from trace_silhouettes import find_boundary, douglas_peucker, points_to_cubic_bezier

# Load img_01
im = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg').convert('RGB')
arr = np.array(im)

# Pumpkin in img_01: X: 175..345, Y: 530..670
# Let's create an accurate mask of the pumpkin:
# - Orange outer lobes
# - Carved facial features (eyes, nose, mouth)
# - Stem at top
sub = arr[520:680, 160:360]
r = sub[:, :, 0].astype(float)
g = sub[:, :, 1].astype(float)
b = sub[:, :, 2].astype(float)

# Pumpkin orange body:
is_orange = (r > 115) & (g > 45) & (r > b + 35) & (r > g + 15)
# Carved facial features (dark or glowing):
is_carved = (r < 60) & (g < 40) & (b < 40)
# Stem (brown/green at top):
is_stem = (r > 70) & (g > 55) & (b < 60) & (r < 140)

# The entire pumpkin silhouette
# In morphological terms, close gaps between orange and carved features
mask = is_orange | (is_carved & (r > 20)) | is_stem

# Let's perform simple binary dilation & erosion (closing) using numpy
from scipy.ndimage import binary_closing, binary_fill_holes
# Since scipy might not be installed, let's check or do custom dilation
# Let's check if scipy is installed:
try:
    import scipy.ndimage
    mask = scipy.ndimage.binary_fill_holes(mask)
    print("Scipy fill holes succeeded")
except ImportError:
    print("Scipy not installed, using manual flood fill")

# Find boundary
boundary = find_boundary(mask)
print(f"Pumpkin raw boundary points: {len(boundary)}")

# Simplify
simplified = douglas_peucker(boundary, epsilon=3.5)
print(f"Pumpkin simplified vertices: {len(simplified)}")

# Offset vertices back to image coordinates (x + 160, y + 520)
abs_pts = simplified + np.array([160, 520])

# Generate smooth cubic Bézier SVG path
svg_bezier = points_to_cubic_bezier(abs_pts)
print(f"SVG Cubic Bézier path length: {len(svg_bezier)}")
print("Sample path:", svg_bezier[:120])

# Visualize over crop
crop = im.crop((140, 500, 380, 700)).copy()
draw = ImageDraw.Draw(crop)
# Draw simplified points
poly = [(p[0] - 140, p[1] - 500) for p in abs_pts]
draw.line(poly + [poly[0]], fill=(255, 215, 0), width=3)
crop.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/pumpkin_bezier_test.png")
print("Saved pumpkin_bezier_test.png")

