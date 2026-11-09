from PIL import Image

im = Image.open('public/assets/stage-02/photographs/haunted-village.jpg')
# Let's save a wide crop of the lower half of haunted-village.jpg
w, h = im.size
crop1 = im.crop((500, 500, 800, 850))
crop1.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/village_center_crop.png")
print("Saved village_center_crop.png")

