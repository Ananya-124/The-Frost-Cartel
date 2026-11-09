from PIL import Image
import numpy as np

im = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/key_crop_clean.png')
arr = np.array(im)

# Let's find edges in the crop
gray = np.mean(arr, axis=2)
gy, gx = np.gradient(gray)
grad_mag = np.sqrt(gx**2 + gy**2)

# Find strongest edges
strong_edges = grad_mag > 25
print("Edge map:")
for y in range(0, arr.shape[0], 4):
    line = "".join(["#" if strong_edges[y, x] else " " for x in range(0, arr.shape[1], 2)])
    print(f"{1290+y:4d} {line}")

