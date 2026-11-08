from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# Create 300x90 transparent canvas for the button
canvas = Image.new('RGBA', (300, 90), (0, 0, 0, 0))
draw = ImageDraw.Draw(canvas)

# Capsule coordinates inside 300x90 canvas:
# Center is X=150, Y=45.
# Width = 220, Height = 46.
# x0 = 40, y0 = 22, x1 = 260, y1 = 68.
x0, y0, x1, y1 = 40, 22, 260, 68
radius = 23

# 1. Outer glow layer
glow = Image.new('RGBA', (300, 90), (0, 0, 0, 0))
glow_draw = ImageDraw.Draw(glow)
glow_draw.rounded_rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], radius=radius + 2, fill=(245, 158, 11, 120))
glow = glow.filter(ImageFilter.GaussianBlur(radius=4))
canvas = Image.alpha_composite(canvas, glow)
draw = ImageDraw.Draw(canvas)

# 2. Pill background
draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=(24, 11, 4, 240), outline=(245, 158, 11, 230), width=2)

# 3. Inner subtle top highlight
draw.rounded_rectangle([x0 + 1, y0 + 1, x1 - 1, y0 + 12], radius=radius, fill=(251, 191, 36, 40))

# 4. Gold Crown Icon
crown = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crown_clean.png')
# Recolor crown to gold/amber:
crown_arr = np.array(crown).copy()
gray = np.mean(crown_arr[:, :, :3], axis=2)
# Map gray to gold [251, 191, 36]
for c_idx, val in enumerate([251, 191, 36]):
    crown_arr[:, :, c_idx] = np.clip(gray * (val / 160.0), 0, 255).astype(np.uint8)

gold_crown = Image.fromarray(crown_arr)
# Resize slightly if needed
gold_crown = gold_crown.resize((24, 18), Image.Resampling.LANCZOS)

# Position crown and text
font = ImageFont.truetype('Cinzel.ttf', 18)
text = '100 CR'
tb = draw.textbbox((0, 0), text, font=font)
tw = tb[2] - tb[0]
th = tb[3] - tb[1]

# Total content width = crown_w (24) + gap (8) + tw
total_w = 24 + 8 + tw
start_x = (300 - total_w) // 2

crown_x = start_x
crown_y = y0 + (46 - 18) // 2
text_x = start_x + 24 + 8
text_y = y0 + (46 - th) // 2 - 2

# Paste crown
canvas.paste(gold_crown, (crown_x, crown_y), gold_crown)

# Draw text shadow and text
draw.text((text_x + 1, text_y + 1), text, font=font, fill=(0, 0, 0, 230))
draw.text((text_x, text_y), text, font=font, fill=(254, 243, 199, 255))

canvas.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/test_100_cr_pill.png')
print('test_100_cr_pill saved')

