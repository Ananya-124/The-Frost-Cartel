from PIL import Image
import numpy as np

# Let's inspect where in forest-bridge.jpg the key is lying on the bridge ledge:
im = Image.open('public/assets/stage-02/photographs/forest-bridge.jpg').convert('RGB')
arr = np.array(im)

# Let's look at the region X: 750..950, Y: 1280..1360
# Save a clean crop with a 10px grid so we can see every landmark
crop = im.crop((780, 1290, 930, 1370))
crop.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/key_crop_clean.png")

# An antique skeleton key lying horizontally or at an angle:
# Bow (round/ornate head): usually on the left or right (e.g. X: 800..840)
# Long shaft: connecting the bow to the bit (e.g. X: 830..900)
# Bit / ward teeth: at the other end (e.g. X: 890..920)
print(f"Crop saved: W={crop.width}, H={crop.height}")

