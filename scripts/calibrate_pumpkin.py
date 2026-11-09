from PIL import Image, ImageDraw
import numpy as np
from scipy import ndimage
from trace_silhouettes import find_boundary, douglas_peucker, points_to_cubic_bezier

im = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg').convert('RGB')
arr = np.array(im)

# Let's crop X: 170..350, Y: 530..675
sub = arr[530:675, 170:350]
r, g, b = sub[:,:,0].astype(float), sub[:,:,1].astype(float), sub[:,:,2].astype(float)

# Pumpkin outer silhouette has orange color:
is_orange = (r > 120) & (g > 50) & (r > b + 30) & (r > g + 15)
# Eyes, nose, mouth are dark carved holes inside the pumpkin:
is_carved = (r < 75) & (g < 60) & (b < 60)
# Stem is at the top center:
is_stem = (r > 60) & (g > 55) & (b < 65) & (r < 130)

pumpkin_all = is_orange | is_carved | is_stem
# Fill interior holes (e.g. eyes/mouth) so we get the solid outer silhouette!
filled = ndimage.binary_fill_holes(pumpkin_all)

# Keep only the largest connected component (the pumpkin itself)
labeled, num_features = ndimage.label(filled)
sizes = ndimage.sum(filled, labeled, range(num_features + 1))
largest_label = np.argmax(sizes[1:]) + 1
clean_mask = (labeled == largest_label)

# Trace boundary
raw_b = find_boundary(clean_mask)
simplified = douglas_peucker(raw_b, epsilon=2.5)

# Offset to absolute image coords
abs_pts = simplified + np.array([170, 530])
svg_path = points_to_cubic_bezier(abs_pts)

min_x, max_x = abs_pts[:, 0].min(), abs_pts[:, 0].max()
min_y, max_y = abs_pts[:, 1].min(), abs_pts[:, 1].max()

print(f"Pumpkin silhouette bounds: X: {min_x:.1f}..{max_x:.1f} (W={max_x-min_x:.1f}), Y: {min_y:.1f}..{max_y:.1f} (H={max_y-min_y:.1f})")
print(f"Num vertices: {len(simplified)}")
print("Pumpkin SVG Path:\n", svg_path)

# Verify by drawing on crop
vis = im.crop((150, 510, 370, 690)).copy()
draw = ImageDraw.Draw(vis)
pts = [(p[0]-150, p[1]-510) for p in abs_pts]
draw.line(pts + [pts[0]], fill=(255, 215, 0), width=3)
vis.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_pumpkin.png")

