from PIL import Image
import numpy as np

fb1 = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/frame_btn_1.png')
fb2 = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/frame_btn_2.png')
fb3 = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/frame_btn_3.png')

ft1 = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/frame_title_1.png')
ft2 = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/frame_title_2.png')

# In fb2: what is the text? It says "150 CR" with crown icon.
# In fb1: what is the text? It says "🔒 NOT CONFIGURED".
# In ft1: what is the text? It says "THE UNKNOWN CHALLENGE".
# In ft2: what is the text? It says "THE HAUNTED IMAGE HUNT".

print("Loaded all images successfully")

