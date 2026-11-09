w, h = 2560, 1440

tight_boxes = {
    'skull_mark': (1060, 160, 1300, 390),
    'number_7': (670, 430, 890, 640),
    'number_4': (1480, 260, 1720, 430),
    'number_3': (1560, 440, 1780, 590),
    'number_9': (1610, 600, 1795, 750),
    'ancient_diary': (920, 480, 1530, 880),
    'sealed_letter': (660, 980, 1030, 1220),
    'skeleton_key': (1270, 950, 1465, 1130),
    'compass_medallion': (1475, 960, 1650, 1140),
    'ancient_scroll': (1800, 720, 2140, 930),
    'treasure_chest': (1660, 940, 1980, 1140),
}

overlaps = []
names = list(tight_boxes.keys())
for i in range(len(names)):
    for j in range(i + 1, len(names)):
        n1, n2 = names[i], names[j]
        b1, b2 = tight_boxes[n1], tight_boxes[n2]
        inter_x1 = max(b1[0], b2[0])
        inter_y1 = max(b1[1], b2[1])
        inter_x2 = min(b1[2], b2[2])
        inter_y2 = min(b1[3], b2[3])
        if inter_x1 < inter_x2 and inter_y1 < inter_y2:
            overlaps.append((n1, n2, (inter_x1, inter_y1, inter_x2, inter_y2)))

print(f'Total target count: {len(tight_boxes)}')
print(f'Total pairwise overlaps: {len(overlaps)}')
if len(overlaps) == 0:
    print('SUCCESS: ZERO OVERLAPS DETECTED ACROSS ALL 11 TARGETS!')
else:
    for n1, n2, inter in overlaps:
        print(f'OVERLAP between {n1} and {n2}: {inter}')

print('\n=== CANONICAL NORMALIZED COORDINATES (2560x1440) ===')
for name, (x1, y1, x2, y2) in tight_boxes.items():
    bw = x2 - x1
    bh = y2 - y1
    lp = round(x1 / w * 100, 2)
    tp = round(y1 / h * 100, 2)
    wp = round(bw / w * 100, 2)
    hp = round(bh / h * 100, 2)
    print(f"'{name}': {{ x: {x1}, y: {y1}, width: {bw}, height: {bh}, left: '{lp}%', top: '{tp}%', widthPct: '{wp}%', heightPct: '{hp}%' }},")
