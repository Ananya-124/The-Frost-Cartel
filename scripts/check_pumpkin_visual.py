from PIL import Image
import numpy as np

im = Image.open('public/assets/stage-02/photographs/ancestral-study.jpg')
# Let's inspect a wider area: X: 140..370, Y: 510..700
crop = im.crop((140, 510, 370, 700))
crop.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/pumpkin_crop_inspect.png")
print("Saved pumpkin_crop_inspect.png")

