import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

def build_pills(draw_text, fill_color, border_color, glow_color, is_crown=False):
    # Returns 300x90 transparent image with centered pill
    canvas = Image.new('RGBA', (300, 90), (0, 0, 0, 0))
    x0, y0, x1, y1 = 40, 22, 260, 68
    radius = 23

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
    draw.rounded_rectangle([x0 + 1, y0 + 1, x1 - 1, y0 + 12], radius=radius, fill=(255, 255, 255, 30))

    if is_crown:
        crown = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crown_clean.png')
        crown_arr = np.array(crown).copy()
        gray = np.mean(crown_arr[:, :, :3], axis=2)
        for c_idx, val in enumerate([251, 191, 36]):
            crown_arr[:, :, c_idx] = np.clip(gray * (val / 160.0), 0, 255).astype(np.uint8)
        gold_crown = Image.fromarray(crown_arr).resize((24, 18), Image.Resampling.LANCZOS)

        font = ImageFont.truetype('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/Cinzel.ttf', 18)
        tb = draw.textbbox((0, 0), draw_text, font=font)
        tw = tb[2] - tb[0]
        th = tb[3] - tb[1]

        total_w = 24 + 8 + tw
        start_x = (300 - total_w) // 2

        crown_x = start_x
        crown_y = y0 + (46 - 18) // 2
        text_x = start_x + 24 + 8
        text_y = y0 + (46 - th) // 2 - 2

        canvas.paste(gold_crown, (crown_x, crown_y), gold_crown)
        draw.text((text_x + 1, text_y + 1), draw_text, font=font, fill=(0, 0, 0, 230))
        draw.text((text_x, text_y), draw_text, font=font, fill=(254, 243, 199, 255))
    else:
        font = ImageFont.truetype('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/Cinzel.ttf', 16)
        tb = draw.textbbox((0, 0), draw_text, font=font)
        tw = tb[2] - tb[0]
        th = tb[3] - tb[1]
        text_x = (300 - tw) // 2
        text_y = y0 + (46 - th) // 2 - 2
        draw.text((text_x + 1, text_y + 1), draw_text, font=font, fill=(0, 0, 0, 240))
        draw.text((text_x, text_y), draw_text, font=font, fill=(254, 243, 199, 255))

    return canvas

def composite_relic(is_completed=False):
    # 1. Base frame
    fr = Image.open('public/assets/halloween/portals/relic_frame_stage1.png').copy()
    ps = Image.open('public/assets/halloween/portals/portal_stage1_pumpkin_shuffle.jpg')

    # 2. Prepare pumpkin artwork for window with generous bleed behind the stone frame
    # Window opening is X: 90..410, Y: 213..507.
    # By sizing artwork to 360 x 330 and positioning it at X=70, Y=195,
    # the artwork extends 20px beneath the solid carved stone frame on all sides.
    # The stone frame naturally and organically overlaps the artwork with authentic bevel shadows,
    # eliminating any artificial cutout border, polygon stroke, or outline effect.
    target_w, target_h = 360, 330
    ps_w, ps_h = ps.size
    aspect = target_w / target_h
    new_h = int(ps_w / aspect)
    crop_top = int((ps_h - new_h) * 0.40)
    ps_cropped = ps.crop((0, crop_top, ps_w, crop_top + new_h))
    ps_scaled = ps_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas_bg = Image.new('RGBA', (500, 857), (0, 0, 0, 0))
    canvas_bg.paste(ps_scaled, (70, 195))

    # Composite stone frame on top of artwork window
    combined = Image.alpha_composite(canvas_bg, fr)

    # 3. Overwrite Title Plaque (X: 100..400, Y: 565..660)
    draw = ImageDraw.Draw(combined)
    # Fill inner black plaque area (X: 120..380, Y: 575..650) to erase 'THE UNKNOWN CHALLENGE'
    draw.rectangle([120, 574, 380, 650], fill=(10, 6, 5, 255))

    font_title = ImageFont.truetype('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/Cinzel.ttf', 20)
    text1 = 'THE PUMPKIN'
    text2 = 'SHUFFLE'

    tb1 = draw.textbbox((0, 0), text1, font=font_title)
    w1 = tb1[2] - tb1[0]
    tb2 = draw.textbbox((0, 0), text2, font=font_title)
    w2 = tb2[2] - tb2[0]

    # Center is at X = 250
    x1 = (500 - w1) // 2
    x2 = (500 - w2) // 2
    y1 = 582
    y2 = 612

    # Draw drop shadow
    draw.text((x1 + 1, y1 + 1), text1, font=font_title, fill=(0, 0, 0, 230))
    draw.text((x2 + 1, y2 + 1), text2, font=font_title, fill=(0, 0, 0, 230))

    # Draw ivory lettering
    draw.text((x1, y1), text1, font=font_title, fill=(247, 244, 238, 255))
    draw.text((x2, y2), text2, font=font_title, fill=(247, 244, 238, 255))

    # 4. Overwrite Bottom Button Slot (X: 100..400, Y: 680..770) to completely erase '🔒 NOT CONFIGURED'
    # Fill button background with dark gradient matching relic base
    draw.rectangle([115, 684, 385, 755], fill=(12, 7, 5, 255))

    # Generate pill
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

    # Paste pill at X=100, Y=678 (pill inside is centered at X=150, Y=45 => in full image center is X=250, Y=723)
    combined.paste(pill, (100, 678), pill)

    return combined

if __name__ == '__main__':
    active_stage1 = composite_relic(is_completed=False)
    active_stage1.save('public/assets/halloween/portals/relic_full_stage1.png')
    active_stage1.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/relic_full_stage1_verified.png')

    comp_stage1 = composite_relic(is_completed=True)
    comp_stage1.save('public/assets/halloween/portals/relic_full_stage1_completed.png')
    comp_stage1.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/relic_full_stage1_completed_verified.png')

    print('Successfully rebuilt relic_full_stage1.png and relic_full_stage1_completed.png!')

