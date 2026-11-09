from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg').convert('RGB')
arr = np.array(im)

# Look at X from 150 to 360, Y from 520 to 680
sub = arr[520:680, 150:360]
r = sub[:,:,0].astype(float)
g = sub[:,:,1].astype(float)
b = sub[:,:,2].astype(float)

# In ancestral-study.jpg, the pumpkin is sitting on a table/desk.
# The pumpkin is brightly lit orange/yellow.
# Table is dark brown. Wall behind is dark.
# Let's find pixels where orange is strong: R > 130 and G > 50 and R - B > 60 and R - G > 20
orange = (r > 130) & (g > 50) & (r - b > 50) & (r - g > 15)
ys, xs = np.where(orange)
print(f"Strong orange pumpkin body: X: {150+xs.min()}..{150+xs.max()}, Y: {520+ys.min()}..{520+ys.max()}")
print(f"Center: ({150+np.mean(xs):.1f}, {520+np.mean(ys):.1f})")
print(f"Width: {xs.max()-xs.min()}, Height: {ys.max()-ys.min()}")

# Stem at the top:
# Stem is centered horizontally around the top of the pumpkin
top_y = 520 + ys.min()
center_x = 150 + int(np.mean(xs))
stem_area = arr[top_y-30:top_y+10, center_x-30:center_x+30]
print(f"Stem area Y: {top_y-30}..{top_y+10}, X: {center_x-30}..{center_x+30}")

