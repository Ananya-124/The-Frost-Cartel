refined_boxes = {
    'skeleton_iii': (285, 80, 395, 185),
    'soul_crystal': (255, 190, 298, 245),
    'celestial_medallion': (405, 175, 465, 240),
    'potion_bottle': (302, 248, 355, 320),
    'ancient_book': (360, 248, 480, 350),
    'ancient_scroll': (515, 235, 580, 340),
    'star_chart_parchment': (595, 240, 745, 320),
    'relic_chest': (640, 325, 765, 395),
}

w, h = 1024, 576
names = list(refined_boxes.keys())
overlaps = 0
for i in range(len(names)):
    for j in range(i+1, len(names)):
        n1, n2 = names[i], names[j]
        b1, b2 = refined_boxes[n1], refined_boxes[n2]
        ix1 = max(b1[0], b2[0])
        iy1 = max(b1[1], b2[1])
        ix2 = min(b1[2], b2[2])
        iy2 = min(b1[3], b2[3])
        if ix2 > ix1 and iy2 > iy1:
            area = (ix2 - ix1) * (iy2 - iy1)
            print(f'Overlap between {n1} and {n2}: area={area}')
            overlaps += 1

if overlaps == 0:
    print('SUCCESS! ALL 8 TARGETS HAVE EXACTLY ZERO OVERLAP!')
    print('\nPERCENTAGES:')
    for name, (x1, y1, x2, y2) in refined_boxes.items():
        pct_x = round((x1 / w) * 100, 2)
        pct_y = round((y1 / h) * 100, 2)
        pct_w = round(((x2 - x1) / w) * 100, 2)
        pct_h = round(((y2 - y1) / h) * 100, 2)
        print(f"'{name}': {{ left: '{pct_x}%', top: '{pct_y}%', width: '{pct_w}%', height: '{pct_h}%' }},")
