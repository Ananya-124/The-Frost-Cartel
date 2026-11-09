from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/haunted-village.jpg').convert('RGB')
arr = np.array(im)

# Cat in haunted-village.jpg:
# Alley cobblestone is grey/blue/brown.
# Cat is a black silhouette sitting on the ground with glowing eyes!
# Let's crop around X: 590..750, Y: 560..780
sub = arr[560:780, 590:750]
r = sub[:,:,0].astype(float)
g = sub[:,:,1].astype(float)
b = sub[:,:,2].astype(float)

# Glowing yellow/green eyes:
eyes = (r > 150) & (g > 150) & (b < 100)
ey, ex = np.where(eyes)
if len(ey) > 0:
    print(f"Cat eyes: X={590+np.mean(ex):.1f}, Y={560+np.mean(ey):.1f}")
    print(f"Left eye approx: X={590+ex.min()}, Y={560+ey[ex.argmin()]}")
    print(f"Right eye approx: X={590+ex.max()}, Y={560+ey[ex.argmax()]}")

# The black cat body: R, G, B are dark (< 50)
cat_dark = (r < 55) & (g < 55) & (b < 55)
# Let's label connected components of cat_dark near the eyes
from scipy import ndimage
labeled, num_features = ndimage.label(cat_dark)

# Find the label that contains or is adjacent to the eyes
eye_y, eye_x = int(np.mean(ey)), int(np.mean(ex))
# Check neighborhood of eyes
cat_label = None
for dy in range(-5, 6):
    for dx in range(-5, 6):
        lbl = labeled[eye_y + dy, eye_x + dx]
        if lbl > 0:
            cat_label = lbl
            break
    if cat_label:
        break

if cat_label:
    cat_mask = (labeled == cat_label)
    # Fill holes
    cat_filled = ndimage.binary_fill_holes(cat_mask)
    cys, cxs = np.where(cat_filled)
    print(f"Cat exact body bounds: X: {590+cxs.min()}..{590+cxs.max()} (width {cxs.max()-cxs.min()}), Y: {560+cys.min()}..{560+cys.max()} (height {cys.max()-cys.min()})")
else:
    print("Could not isolate cat label near eyes")

