from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/haunted-village.jpg').convert('RGB')
arr = np.array(im)

# Look at X: 640..740, Y: 610..760 vs X: 600..660, Y: 560..640
# Let's check brightness in 10x10 blocks in X: 550..750, Y: 550..760
print("Brightness grid:")
for y in range(560, 760, 20):
    row = []
    for x in range(600, 750, 20):
        block = arr[y:y+20, x:x+20]
        mean_b = np.mean(block)
        row.append(f"{mean_b:4.0f}")
    print(f"Y={y}: " + " ".join(row))

