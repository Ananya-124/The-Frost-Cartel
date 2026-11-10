import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

def run():
    fr = Image.open('public/assets/halloween/portals/relic_frame_stage1.png').convert('RGBA')
    ps = Image.open('public/assets/halloween/portals/portal_stage1_pumpkin_shuffle.jpg')
    
    # 1. Scale pumpkin artwork to fit behind the frame cutout
    target_w, target_h = 360, 330
    ps_w, ps_h = ps.size
    aspect = target_w / target_h
    new_h = int(ps_w / aspect)
    crop_top = int((ps_h - new_h) * 0.40)
    ps_cropped = ps.crop((0, crop_top, ps_w, crop_top + new_h))
    ps_scaled = ps_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    canvas_bg = Image.new('RGBA', (500, 857), (0, 0, 0, 0))
    canvas_bg.paste(ps_scaled, (70, 195))

    # Composite frame over background
    base = Image.alpha_composite(canvas_bg, fr)
    arr = np.array(base)
    
    # 2. Inpaint title area: X [115, 385], Y [548, 642]
    arr[548:642, 115:385] = [12, 7, 6, 255]
    
    # 3. Inpaint old wide pill: X [95, 405], Y [672, 742]
    arr[672:742, 95:405] = [12, 7, 6, 255]
    
    base_clean = Image.fromarray(arr)
    draw = ImageDraw.Draw(base_clean)
    
    # 4. Draw 'THE PUMPKIN SHUFFLE' title
    font_path = 'scripts/Cinzel-wght800.ttf'
    if not os.path.exists(font_path):
        font_path = 'scripts/Cinzel.ttf'
    font_title = ImageFont.truetype(font_path, 25)
    top_off = font_title.getbbox('T')[1]

    def draw_tracked(target_draw, text, start_x, start_y, tr):
        curr_x = start_x
        for ch in text:
            target_draw.text((curr_x + 1, start_y - top_off + 1), ch, font=font_title, fill=(0, 0, 0, 240))
            target_draw.text((curr_x, start_y - top_off), ch, font=font_title, fill=(255, 254, 255, 255))
            curr_x += font_title.getlength(ch) + tr

    draw_tracked(draw, 'THE PUMPKIN', 150.5, 569, 0.8)
    draw_tracked(draw, 'SHUFFLE', 183.0, 605, 2.3)
    
    # 5. Extract pill from Stage 2
    s2_orig = Image.open('public/assets/halloween/portals/relic_full_stage2.png').convert('RGBA')
    s2_comp = Image.open('public/assets/halloween/portals/relic_full_stage2_completed.png').convert('RGBA')
    
    crop_x1, crop_y1, crop_x2, crop_y2 = 135, 670, 375, 735
    pill_avail_crop = s2_orig.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    pill_comp_crop = s2_comp.crop((crop_x1, crop_y1, crop_x2, crop_y2))
    
    def process_avail_pill(pill_img):
        arr_p = np.array(pill_img)
        # Erase entire '150 CR' text (x from 80 to 215, y from 15 to 52)
        arr_p[15:53, 80:215] = [12, 4, 15, 255]
        
        # Color shift purple glow to amber
        r, g, b, a = arr_p[:, :, 0], arr_p[:, :, 1], arr_p[:, :, 2], arr_p[:, :, 3]
        purple_mask = (b > g + 5) & (r > 20)
        
        intensity = np.maximum(r, b)
        new_r = r.copy()
        new_g = g.copy()
        new_b = b.copy()
        
        new_r[purple_mask] = np.clip(intensity[purple_mask] * 1.05, 0, 255)
        new_g[purple_mask] = np.clip(intensity[purple_mask] * 0.65, 0, 255)
        new_b[purple_mask] = np.clip(intensity[purple_mask] * 0.08, 0, 255)
        
        # Fade mask
        h, w = a.shape
        cy, cx = h / 2.0, w / 2.0
        fade_mask = np.ones((h, w), dtype=np.float32)
        for y in range(h):
            for x in range(w):
                dx = max(0, abs(x - cx) - 95)
                dy = max(0, abs(y - cy) - 18)
                dist = np.sqrt(dx*dx + dy*dy)
                if dist > 14:
                    fade_mask[y, x] = max(0.0, 1.0 - (dist - 14) / 12.0)
        new_a = (a.astype(np.float32) * fade_mask).astype(np.uint8)
        
        pill_clean = Image.fromarray(np.stack([new_r, new_g, new_b, new_a], axis=2))
        pdraw = ImageDraw.Draw(pill_clean)
        
        # Draw '100 CR' in Cinzel Bold
        font_pill = ImageFont.truetype(font_path, 20)
        pdraw.text((97, 24), '100 CR', font=font_pill, fill=(0, 0, 0, 220))
        pdraw.text((96, 23), '100 CR', font=font_pill, fill=(255, 235, 185, 255))
        return pill_clean

    def process_comp_pill(pill_img):
        arr_p = np.array(pill_img)
        r, g, b, a = arr_p[:, :, 0], arr_p[:, :, 1], arr_p[:, :, 2], arr_p[:, :, 3]
        text_mask = (r > 165) & (g > 155) & (b > 165)
        purple_mask = (b > g + 5) & (r > 20) & (~text_mask)
        
        intensity = np.maximum(r, b)
        new_r = r.copy()
        new_g = g.copy()
        new_b = b.copy()
        
        new_r[purple_mask] = np.clip(intensity[purple_mask] * 1.05, 0, 255)
        new_g[purple_mask] = np.clip(intensity[purple_mask] * 0.65, 0, 255)
        new_b[purple_mask] = np.clip(intensity[purple_mask] * 0.08, 0, 255)
        
        new_r[text_mask] = 255
        new_g[text_mask] = np.clip(g[text_mask] * 1.03, 0, 255)
        new_b[text_mask] = np.clip(b[text_mask] * 0.88, 0, 240)
        
        h, w = a.shape
        cy, cx = h / 2.0, w / 2.0
        fade_mask = np.ones((h, w), dtype=np.float32)
        for y in range(h):
            for x in range(w):
                dx = max(0, abs(x - cx) - 95)
                dy = max(0, abs(y - cy) - 18)
                dist = np.sqrt(dx*dx + dy*dy)
                if dist > 14:
                    fade_mask[y, x] = max(0.0, 1.0 - (dist - 14) / 12.0)
        new_a = (a.astype(np.float32) * fade_mask).astype(np.uint8)
        return Image.fromarray(np.stack([new_r, new_g, new_b, new_a], axis=2))

    amber_avail_pill = process_avail_pill(pill_avail_crop)
    amber_comp_pill = process_comp_pill(pill_comp_crop)
    
    img_avail = base_clean.copy()
    img_avail.alpha_composite(amber_avail_pill, (crop_x1, crop_y1))
    
    img_comp = base_clean.copy()
    img_comp.alpha_composite(amber_comp_pill, (crop_x1, crop_y1))
    
    img_avail.save('public/assets/halloween/portals/relic_full_stage1.png')
    img_comp.save('public/assets/halloween/portals/relic_full_stage1_completed.png')
    print("Rebuilt relic_full_stage1.png and relic_full_stage1_completed.png successfully!")

if __name__ == '__main__':
    run()
