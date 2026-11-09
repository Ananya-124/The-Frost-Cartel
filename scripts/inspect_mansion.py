from PIL import Image

im = Image.open('public/assets/stage-02/photographs/haunted-mansion.jpg')
crop_ghost = im.crop((400, 320, 620, 540))
crop_ghost.resize((crop_ghost.width * 2, crop_ghost.height * 2), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/ghost_inspect.png")

crop_web = im.crop((950, 10, 1150, 200))
crop_web.resize((crop_web.width * 2, crop_web.height * 2), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/web_inspect.png")
print("Saved ghost_inspect.png and web_inspect.png")

