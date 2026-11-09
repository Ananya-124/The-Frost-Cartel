from PIL import Image

im = Image.open('public/assets/stage-02/photographs/haunted-village.jpg')
crop = im.crop((640, 605, 740, 760))
zoom = crop.resize((crop.width * 4, crop.height * 4), Image.Resampling.NEAREST)
zoom.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/cat_zoom_4x.png")
print("Saved cat_zoom_4x.png")

