slabs = [
    # (y_l, y_m, y_r, x_l, x_r)
    (158.0,  96.0, 156.0,  75.0, 1545.0), # 0: F7 top
    (238.0, 186.0, 238.0,  70.0, 1545.0), # 1: F7/F6
    (330.0, 286.0, 332.0,  68.0, 1545.0), # 2: F6/F5
    (424.0, 383.0, 426.0,  65.0, 1545.0), # 3: F5/F4
    (518.0, 480.0, 518.0,  65.0, 1545.0), # 4: F4/F3
    (610.0, 575.0, 610.0,  65.0, 1545.0), # 5: F3/F2
    (702.0, 670.0, 702.0,  68.0, 1542.0), # 6: F2/F1
    (792.0, 762.0, 792.0,  72.0, 1540.0), # 7: F1/FG
    (882.0, 860.0, 885.0,  75.0, 1538.0), # 8: FG base
]

def make_floor_svg_path(top_s, bot_s, x_center=814.0):
    y_tl, y_tc, y_tr, x_tl, x_tr = top_s
    y_bl, y_bc, y_br, x_bl, x_br = bot_s
    
    x_l = (x_tl + x_bl) / 2.0
    x_r = (x_tr + x_br) / 2.0
    
    dx_l = x_center - x_l
    dx_r = x_r - x_center
    
    # Top curve left -> center
    cp1_tl = (x_l + dx_l * 0.40, y_tl - (y_tl - y_tc) * 0.50)
    cp2_tc = (x_center - dx_l * 0.35, y_tc)
    
    # Top curve center -> right
    cp1_tc = (x_center + dx_r * 0.35, y_tc)
    cp2_tr = (x_r - dx_r * 0.40, y_tr - (y_tr - y_tc) * 0.50)
    
    # Bottom curve right -> center
    cp1_br = (x_r - dx_r * 0.40, y_br - (y_br - y_bc) * 0.50)
    cp2_bc = (x_center + dx_r * 0.35, y_bc)
    
    # Bottom curve center -> left
    cp1_bc = (x_center - dx_l * 0.35, y_bc)
    cp2_bl = (x_l + dx_l * 0.40, y_bl - (y_bl - y_bc) * 0.50)
    
    d = (
        f'M {x_l:.1f},{y_tl:.1f} '
        f'C {cp1_tl[0]:.1f},{cp1_tl[1]:.1f} {cp2_tc[0]:.1f},{cp2_tc[1]:.1f} {x_center:.1f},{y_tc:.1f} '
        f'C {cp1_tc[0]:.1f},{cp1_tc[1]:.1f} {cp2_tr[0]:.1f},{cp2_tr[1]:.1f} {x_r:.1f},{y_tr:.1f} '
        f'L {x_r:.1f},{y_br:.1f} '
        f'C {cp1_br[0]:.1f},{cp1_br[1]:.1f} {cp2_bc[0]:.1f},{cp2_bc[1]:.1f} {x_center:.1f},{y_bc:.1f} '
        f'C {cp1_bc[0]:.1f},{cp1_bc[1]:.1f} {cp2_bl[0]:.1f},{cp2_bl[1]:.1f} {x_l:.1f},{y_bl:.1f} '
        f'Z'
    )
    return d

floor_ids = ['floor-7', 'floor-6', 'floor-5', 'floor-4', 'floor-3', 'floor-2', 'floor-1', 'floor-G']
for i in range(8):
    p = make_floor_svg_path(slabs[i], slabs[i+1])
    print(f'{floor_ids[i]}: \"{p}\"')
