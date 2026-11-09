from PIL import Image

im = Image.open('public/assets/stage-02/photographs/forest-bridge.jpg')
crop = im.crop((750, 1260, 960, 1390))
zoom = crop.resize((crop.width * 3, crop.height * 3), Image.Resampling.NEAREST)
zoom.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/key_zoom_inspect.png")
print("Saved key_zoom_inspect.png")

