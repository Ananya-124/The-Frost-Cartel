from PIL import Image

im = Image.open('public/assets/stage-02/photographs/witch-belfry.jpg')
crop_bat = im.crop((560, 200, 760, 320))
crop_bat.resize((crop_bat.width * 2, crop_bat.height * 2), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/bat_inspect.png")

crop_candle = im.crop((460, 1160, 540, 1300))
crop_candle.resize((crop_candle.width * 3, crop_candle.height * 3), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/candle_inspect.png")
print("Saved bat_inspect.png and candle_inspect.png")

