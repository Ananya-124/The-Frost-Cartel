from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/forest-bridge.jpg').convert('RGB')
arr = np.array(im)

# Key in crop X: 780..930, Y: 1280..1370
sub = arr[1280:1370, 780:930]
r = sub[:,:,0].astype(float)
g = sub[:,:,1].astype(float)
b = sub[:,:,2].astype(float)

# Bridge stone is mossy grey/green (G > R, or desaturated).
# Key is brass/metallic (golden/brown metallic highlight).
# Let's print ASCII representation of key:
for y in range(0, 90, 3):
    line = ""
    for x in range(0, 150, 2):
        pixel = sub[y, x]
        # Check if metallic or edge
        br = np.mean(pixel)
        if br > 140 and pixel[0] > pixel[2] + 20: # warm bright metal
            line += "##"
        elif br > 100 and pixel[0] > pixel[2] + 15:
            line += "++"
        elif br < 40: # dark shadow around key
            line += ".."
        else:
            line += "  "
    print(f"{1280+y:4d} " + line)

