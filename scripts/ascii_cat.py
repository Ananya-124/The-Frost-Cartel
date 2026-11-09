from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/haunted-village.jpg').convert('RGB')
arr = np.array(im)

# In crop X: 640..740, Y: 610..760
sub = arr[610:760, 640:740]
# Cat is dark silhouette
# Let's see an ASCII art of the cat!
for y in range(0, 150, 4):
    line = ""
    for x in range(0, 100, 2):
        pixel = sub[y, x]
        brightness = np.mean(pixel)
        if brightness < 20:
            line += "##"
        elif brightness < 35:
            line += "**"
        elif brightness < 50:
            line += ".."
        else:
            line += "  "
    print(f"{610+y:3d} " + line)

