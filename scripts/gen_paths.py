slabs = [
    (145.0, 105.0, 150.0), # 0: Roof
    (230.0, 188.0, 235.0), # 1: F7/F6
    (328.0, 286.0, 333.0), # 2: F6/F5
    (422.0, 381.0, 426.0), # 3: F5/F4
    (515.0, 475.0, 518.0), # 4: F4/F3
    (608.0, 569.0, 610.0), # 5: F3/F2
    (698.0, 661.0, 700.0), # 6: F2/F1
    (788.0, 753.0, 790.0), # 7: F1/FG
    (880.0, 855.0, 880.0), # 8: FG base
]

def make_floor_path(top_slab, bot_slab, x_left=85.0, x_center=814.0, x_right=1540.0):
    y_tl, y_tc, y_tr = top_slab
    y_bl, y_bc, y_br = bot_slab
    
    dx_l = x_center - x_left
    dx_r = x_right - x_center
    
    # Top curve left -> center
    arc_tl = y_tl - y_tc
    cp1_tl = (x_left + dx_l * 0.45, y_tl - arc_tl * 0.65)
    cp2_tc = (x_center - dx_l * 0.35, y_tc)
    
    # Top curve center -> right
    arc_tr = y_tr - y_tc
    cp1_tc = (x_center + dx_r * 0.35, y_tc)
    cp2_tr = (x_right - dx_r * 0.45, y_tr - arc_tr * 0.65)
    
    # Bottom curve right -> center
    arc_br = y_br - y_bc
    cp1_br = (x_right - dx_r * 0.45, y_br - arc_br * 0.65)
    cp2_bc = (x_center + dx_r * 0.35, y_bc)
    
    # Bottom curve center -> left
    arc_bl = y_bl - y_bc
    cp1_bc = (x_center - dx_l * 0.35, y_bc)
    cp2_bl = (x_left + dx_l * 0.45, y_bl - arc_bl * 0.65)
    
    d = (
        f"M {x_left:.1f},{y_tl:.1f} "
        f"C {cp1_tl[0]:.1f},{cp1_tl[1]:.1f} {cp2_tc[0]:.1f},{cp2_tc[1]:.1f} {x_center:.1f},{y_tc:.1f} "
        f"C {cp1_tc[0]:.1f},{cp1_tc[1]:.1f} {cp2_tr[0]:.1f},{cp2_tr[1]:.1f} {x_right:.1f},{y_tr:.1f} "
        f"L {x_right:.1f},{y_br:.1f} "
        f"C {cp1_br[0]:.1f},{cp1_br[1]:.1f} {cp2_bc[0]:.1f},{cp2_bc[1]:.1f} {x_center:.1f},{y_bc:.1f} "
        f"C {cp1_bc[0]:.1f},{cp1_bc[1]:.1f} {cp2_bl[0]:.1f},{cp2_bl[1]:.1f} {x_left:.1f},{y_bl:.1f} "
        f"Z"
    )
    return d

for i in range(8):
    p = make_floor_path(slabs[i], slabs[i+1])
    print(f"floor_{7-i} = '{p}'")
