from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg').convert('RGB')
arr = np.array(im)

# Pumpkin area: X: 160..360, Y: 520..680
sub = arr[520:680, 160:360]
r, g, b = sub[:,:,0], sub[:,:,1], sub[:,:,2]

# Pumpkin flesh is bright orange/yellow: R > 120, G > 50, B < 80, R > G + 30
# Pumpkin stem is greenish/brown at the top
pumpkin_mask = ((r > 120) & (g > 50) & (b < 100) & (r > g + 20)) | ((r > 90) & (g > 70) & (b < 60) & (sub[:,:,0] < 140)) # stem
ys, xs = np.where(pumpkin_mask)
print(f"Pumpkin exact pixel bounds in img_01: X: {160+xs.min()}..{160+xs.max()} (width {xs.max()-xs.min()}), Y: {520+ys.min()}..{520+ys.max()} (height {ys.max()-ys.min()})")

