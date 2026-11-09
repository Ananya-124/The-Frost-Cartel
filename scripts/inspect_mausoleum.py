from PIL import Image

im = Image.open('public/assets/stage-02/photographs/mausoleum-vault.jpg')
crop_coffin = im.crop((440, 530, 880, 840))
crop_coffin.save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/coffin_inspect.png")

crop_skull = im.crop((475, 710, 565, 815))
crop_skull.resize((crop_skull.width * 3, crop_skull.height * 3), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/skull_inspect.png")
print("Saved coffin_inspect.png and skull_inspect.png")

