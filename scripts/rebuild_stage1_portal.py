import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

# Font resolution helper
def get_font_path():
    candidates = [
        'scripts/Cinzel.ttf',
        'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/Cinzel.ttf',
        'Cinzel.ttf'
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not find Cinzel.ttf in expected paths.")

# Crown image resolution helper
def get_crown_path():
    candidates = [
        'scripts/crown_clean.png',
        'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crown_clean.png',
        'crown_clean.png'
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    raise FileNotFoundError("Could not find crown_clean.png in expected paths.")

def get_tracked_width(text, tracking, font):
    total = 0
    for i, ch in enumerate(text):
        bb = font.getbbox(ch)
        w = bb[2] - bb[0]
        adv = font.getlength(ch)
        if i == len(text) - 1:
            total += w
        else:
            total += adv + tracking
    return total

def draw_tracked_text(draw, start_x, start_y, text, tracking, font, fill):
    curr_x = start_x
    top_offset = font.getbbox('T')[1]
    y_pos = start_y - top_offset
    for i, ch in enumerate(text):
        draw.text((curr_x, y_pos), ch, font=font, fill=fill)
        adv = font.getlength(ch)
        curr_x += adv + tracking

def build_pills(draw_text, fill_color, border_color, glow_color, is_crown=False):
    canvas = Image.new('RGBA', (300, 90), (0, 0, 0, 0))
    x0, y0, x1, y1 = 35, 20, 265, 70
    radius = 25

    # Outer glow
    glow = Image.new('RGBA', (300, 90), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.rounded_rectangle([x0 - 2, y0 - 2, x1 + 2, y1 + 2], radius=radius + 2, fill=glow_color)
    glow = glow.filter(ImageFilter.GaussianBlur(radius=4))
    canvas = Image.alpha_composite(canvas, glow)
    draw = ImageDraw.Draw(canvas)

    # Pill background and border
    draw.rounded_rectangle([x0, y0, x1, y1], radius=radius, fill=fill_color, outline=border_color, width=2)
    # Top highlight
    draw.rounded_rectangle([x0 + 1, y0 + 1, x1 - 1, y0 + 12], radius=radius, fill=(255, 255, 255, 25))

    font_path = get_font_path()

    if is_crown:
        crown = Image.open(get_crown_path())
        crown_arr = np.array(crown).copy()
        gray = np.mean(crown_arr[:, :, :3], axis=2)
        for c_idx, val in enumerate([251, 191, 36]):
            crown_arr[:, :, c_idx] = np.clip(gray * (val / 160.0), 0, 255).astype(np.uint8)
        gold_crown = Image.fromarray(crown_arr).resize((22, 16), Image.Resampling.LANCZOS)

        font = ImageFont.truetype(font_path, 16)
        tw = get_tracked_width(draw_text, 1.5, font)

        total_w = 22 + 8 + tw
        start_x = (300 - total_w) // 2

        crown_x = start_x
        crown_y = 45 - 8
        text_x = start_x + 22 + 8
        text_y = 45

        canvas.paste(gold_crown, (int(crown_x), int(crown_y)), gold_crown)
        draw_tracked_text(draw, text_x + 1, text_y - 6 + 1, draw_text, 1.5, font, (0, 0, 0, 230))
        draw_tracked_text(draw, text_x, text_y - 6, draw_text, 1.5, font, (254, 243, 199, 255))
    else:
        font = ImageFont.truetype(font_path, 15)
        tw = get_tracked_width(draw_text, 2.0, font)
        text_x = (300 - tw) // 2
        text_y = 45

        draw_tracked_text(draw, text_x + 1, text_y - 6 + 1, draw_text, 2.0, font, (0, 0, 0, 240))
        draw_tracked_text(draw, text_x, text_y - 6, draw_text, 2.0, font, (254, 243, 199, 255))

    return canvas

def composite_relic(is_completed=False):
    # 1. Base frame and artwork
    fr = Image.open('public/assets/halloween/portals/relic_frame_stage1.png').copy()
    ps = Image.open('public/assets/halloween/portals/portal_stage1_pumpkin_shuffle.jpg')

    # 2. Window artwork with 20px bleed beneath carved stone frame
    target_w, target_h = 360, 330
    ps_w, ps_h = ps.size
    aspect = target_w / target_h
    new_h = int(ps_w / aspect)
    crop_top = int((ps_h - new_h) * 0.40)
    ps_cropped = ps.crop((0, crop_top, ps_w, crop_top + new_h))
    ps_scaled = ps_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas_bg = Image.new('RGBA', (500, 857), (0, 0, 0, 0))
    canvas_bg.paste(ps_scaled, (70, 195))

    # Composite stone frame over artwork
    combined = Image.alpha_composite(canvas_bg, fr)
    draw = ImageDraw.Draw(combined)

    # 3. Completely erase original Title Plaque (550..645, 110..390) - 100% elimination of 'THE UNKNOWN CHALLENGE'
    draw.rectangle([110, 550, 390, 645], fill=(10, 6, 5, 255))

    # 4. Render THE PUMPKIN SHUFFLE with identical Cinzel 25 font, tracking, ivory color, and drop shadow
    font_path = get_font_path()
    font_title = ImageFont.truetype(font_path, 25)
    text1 = 'THE PUMPKIN'
    text2 = 'SHUFFLE'

    w1 = get_tracked_width(text1, 2.5, font_title)
    w2 = get_tracked_width(text2, 4.5, font_title)

    # Center is at X = 250
    x1 = (500 - w1) // 2
    x2 = (500 - w2) // 2
    y1 = 569
    y2 = 605

    # Draw drop shadow
    draw_tracked_text(draw, x1 + 1, y1 + 1, text1, 2.5, font_title, (0, 0, 0, 220))
    draw_tracked_text(draw, x2 + 1, y2 + 1, text2, 4.5, font_title, (0, 0, 0, 220))

    # Draw ivory lettering (255, 254, 255) matching Stage 2 & Stage 3
    draw_tracked_text(draw, x1, y1, text1, 2.5, font_title, (255, 254, 255, 255))
    draw_tracked_text(draw, x2, y2, text2, 4.5, font_title, (255, 254, 255, 255))

    # 5. Completely erase bottom button area (80..420, 675..765) - 100% elimination of candle icon, lock, and residual text
    draw.rectangle([80, 675, 420, 765], fill=(12, 7, 5, 255))

    # 6. Generate and paste pill centered at X=250, Y=708 (matching Stage 2 & Stage 3 buttons to the exact pixel)
    if is_completed:
        pill = build_pills(
            'COMPLETED ✓',
            fill_color=(28, 11, 4, 245),
            border_color=(245, 158, 11, 230),
            glow_color=(245, 158, 11, 120),
            is_crown=False
        )
    else:
        pill = build_pills(
            '100 CR',
            fill_color=(24, 11, 4, 245),
            border_color=(245, 158, 11, 230),
            glow_color=(245, 158, 11, 120),
            is_crown=True
        )

    combined.paste(pill, (100, 663), pill)
    return combined

if __name__ == '__main__':
    active_stage1 = composite_relic(is_completed=False)
    active_stage1.save('public/assets/halloween/portals/relic_full_stage1.png')
    active_stage1.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/relic_full_stage1_verified.png')

    comp_stage1 = composite_relic(is_completed=True)
    comp_stage1.save('public/assets/halloween/portals/relic_full_stage1_completed.png')
    comp_stage1.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/relic_full_stage1_completed_verified.png')

    print('Successfully rebuilt relic_full_stage1.png and relic_full_stage1_completed.png with pixel-perfect typography and clean button pills!')
