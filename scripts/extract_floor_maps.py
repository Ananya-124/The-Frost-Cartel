import os
import fitz  # PyMuPDF
from PIL import Image

PDF_PATH = r"C:\Users\yashm\Downloads\floors.pdf"
OUTPUT_DIR = r"C:\Users\yashm\Downloads\winter arc\public\images\round-04\floors"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# EXACT PDF PAGE MAPPING from instructions:
# PDF PAGE 1 -> SECOND FLOOR (floor-02.png)
# PDF PAGE 2 -> FOURTH FLOOR (floor-04.png)
# PDF PAGE 3 -> FIFTH FLOOR (floor-05.png)
# PDF PAGE 4 -> SIXTH FLOOR (floor-06.png)
# PDF PAGE 5 -> SEVENTH FLOOR (floor-07.png)
# PDF PAGE 6 -> THIRD FLOOR (floor-03.png)
PAGE_MAPPING = {
    0: ("floor-02.png", "Second Floor", 2),
    1: ("floor-04.png", "Fourth Floor", 4),
    2: ("floor-05.png", "Fifth Floor", 5),
    3: ("floor-06.png", "Sixth Floor", 6),
    4: ("floor-07.png", "Seventh Floor", 7),
    5: ("floor-03.png", "Third Floor", 3),
}

def extract_floors():
    doc = fitz.open(PDF_PATH)
    print(f"Total pages in floors.pdf: {len(doc)}")
    
    # 300 DPI rendering: default is 72 DPI, so zoom = 300 / 72 ≈ 4.16667
    zoom = 300.0 / 72.0
    mat = fitz.Matrix(zoom, zoom)
    
    report = []
    
    for page_idx, (filename, floor_name, floor_num) in PAGE_MAPPING.items():
        if page_idx >= len(doc):
            print(f"Error: Page index {page_idx} not found in PDF!")
            continue
            
        page = doc[page_idx]
        pix = page.get_pixmap(matrix=mat, alpha=False)
        temp_img_path = os.path.join(OUTPUT_DIR, f"temp_{filename}")
        pix.save(temp_img_path)
        
        # Open with PIL for smart margin bounding-box analysis & cropping
        with Image.open(temp_img_path) as img:
            rgb_img = img.convert("RGB")
            width, height = rgb_img.size
            print(f"Rendered Page {page_idx + 1} ({floor_name}): raw size {width}x{height}")
            
            # Find bounding box of non-white content
            # The background is white (255, 255, 255)
            # Find margins where pixels deviate from white
            import numpy as np
            arr = np.array(rgb_img)
            # Find rows and cols that have content significantly darker than white (e.g. < 245)
            mask = np.any(arr < 240, axis=2)
            
            row_indices = np.where(mask.any(axis=1))[0]
            col_indices = np.where(mask.any(axis=0))[0]
            
            if len(row_indices) > 0 and len(col_indices) > 0:
                top, bottom = row_indices[0], row_indices[-1]
                left, right = col_indices[0], col_indices[-1]
                
                # Add safe padding around architectural boundary (e.g. 20px)
                pad = 25
                top = max(0, top - pad)
                bottom = min(height, bottom + pad)
                left = max(0, left - pad)
                right = min(width, right + pad)
                
                cropped = rgb_img.crop((left, top, right, bottom))
                out_path = os.path.join(OUTPUT_DIR, filename)
                cropped.save(out_path, format="PNG", optimize=True)
                crop_w, crop_h = cropped.size
                print(f"Saved {filename} ({floor_name}) -> Cropped size {crop_w}x{crop_h} at {out_path}")
                report.append({
                    "page": page_idx + 1,
                    "filename": filename,
                    "floor": floor_name,
                    "floor_num": floor_num,
                    "raw_dim": f"{width}x{height}",
                    "crop_dim": f"{crop_w}x{crop_h}",
                    "path": out_path
                })
            else:
                out_path = os.path.join(OUTPUT_DIR, filename)
                rgb_img.save(out_path, format="PNG", optimize=True)
                report.append({
                    "page": page_idx + 1,
                    "filename": filename,
                    "floor": floor_name,
                    "floor_num": floor_num,
                    "raw_dim": f"{width}x{height}",
                    "crop_dim": f"{width}x{height}",
                    "path": out_path
                })
                
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
            
    print("\nExtraction summary:")
    for r in report:
        print(f"PDF Page {r['page']} -> {r['floor']} ({r['filename']}): {r['crop_dim']}")

if __name__ == "__main__":
    extract_floors()

