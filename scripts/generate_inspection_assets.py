import os
from PIL import Image

os.makedirs('public/assets/round-01/stage-03/inspection', exist_ok=True)
master = Image.open('public/assets/round-01/stage-03/coffin-02-buried-diary-master.png')
w, h = master.size

boxes = {
    'skull': (1050, 150, 1310, 420),
    'paper_7': (660, 420, 920, 660),
    'paper_4': (1470, 250, 1720, 460),
    'paper_3': (1550, 430, 1800, 630),
    'paper_9': (1630, 580, 1880, 780),
    'diary': (870, 450, 1680, 930),
    'letter': (700, 790, 1110, 1060),
    'key': (1270, 930, 1550, 1110),
    'scroll': (1720, 730, 2110, 1040),
    'chest': (1640, 850, 2050, 1110),
}

print('=== CALIBRATED OBJECT COORDINATES ===')
for name, (x1, y1, x2, y2) in boxes.items():
    crop = master.crop((x1, y1, x2, y2))
    save_path = f'public/assets/round-01/stage-03/inspection/{name}.png'
    crop.save(save_path)
    pct_x = round((x1 / w) * 100, 2)
    pct_y = round((y1 / h) * 100, 2)
    pct_w = round(((x2 - x1) / w) * 100, 2)
    pct_h = round(((y2 - y1) / h) * 100, 2)
    print(f"'{name}': {{ left: '{pct_x}%', top: '{pct_y}%', width: '{pct_w}%', height: '{pct_h}%' }}, // crop: {crop.size}")
