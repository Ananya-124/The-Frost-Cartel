from PIL import Image

im = Image.open('public/assets/stage-02/photographs/cursed-attic.jpg')
crop_hat = im.crop((300, 600, 460, 730))
crop_hat.resize((crop_hat.width * 2, crop_hat.height * 2), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/hat_inspect.png")

crop_spider = im.crop((480, 180, 620, 310))
crop_spider.resize((crop_spider.width * 2, crop_spider.height * 2), Image.Resampling.NEAREST).save(r"C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/spider_inspect.png")
print("Saved hat_inspect.png and spider_inspect.png")

