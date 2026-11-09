import numpy as np

def find_boundary(mask):
    """
    Finds ordered boundary points of the largest connected region in a boolean 2D mask.
    Uses Moore-Neighbor tracing.
    """
    h, w = mask.shape
    # Pad mask with False
    padded = np.pad(mask, 1, mode='constant', constant_values=False)
    
    # Find first True pixel
    ys, xs = np.nonzero(padded)
    if len(ys) == 0:
        return []
    
    start_idx = 0
    start_p = (ys[start_idx], xs[start_idx])
    
    # 8-connected neighbors in clockwise order starting from North
    directions = [
        (-1, 0),  # N
        (-1, 1),  # NE
        (0, 1),   # E
        (1, 1),   # SE
        (1, 0),   # S
        (1, -1),  # SW
        (0, -1),  # W
        (-1, -1)  # NW
    ]
    
    boundary = []
    curr = start_p
    # Backtrack direction (from where we entered)
    back_dir = 6 # Entered from West
    
    max_steps = w * h
    steps = 0
    
    while steps < max_steps:
        boundary.append((curr[1] - 1, curr[0] - 1)) # (x, y) in unpadded
        # Search clockwise starting from back_dir + 1
        found_next = False
        for i in range(1, 9):
            d_idx = (back_dir + i) % 8
            dy, dx = directions[d_idx]
            ny, nx = curr[0] + dy, curr[1] + dx
            if 0 <= ny < h + 2 and 0 <= nx < w + 2 and padded[ny, nx]:
                curr = (ny, nx)
                # Next back_dir is opposite or (d_idx + 4) % 8
                back_dir = (d_idx + 4) % 8
                found_next = True
                break
        
        steps += 1
        if not found_next or (curr == start_p and steps > 2):
            break
            
    return boundary

def douglas_peucker(pts, epsilon):
    if len(pts) <= 2:
        return pts
    pts = np.array(pts, dtype=float)
    # Find point with maximum distance from line between first and last point
    p1 = pts[0]
    p2 = pts[-1]
    
    line_vec = p2 - p1
    line_len = np.linalg.norm(line_vec)
    if line_len < 1e-6:
        dists = np.linalg.norm(pts - p1, axis=1)
    else:
        line_unit = line_vec / line_len
        # Vector from p1 to each point
        v = pts - p1
        # Projection length
        proj = np.dot(v, line_unit)
        # Perpendicular vector
        perp = v - np.outer(proj, line_unit)
        dists = np.linalg.norm(perp, axis=1)
    
    max_idx = np.argmax(dists)
    max_dist = dists[max_idx]
    
    if max_dist > epsilon:
        left = douglas_peucker(pts[:max_idx + 1], epsilon)
        right = douglas_peucker(pts[max_idx:], epsilon)
        return np.vstack([left[:-1], right])
    else:
        return np.array([p1, p2])

def points_to_cubic_bezier(pts):
    """
    Converts a simplified closed polygon into smooth cubic Bézier curves (C commands).
    Uses Catmull-Rom to Bézier conversion:
    cp1 = p1 + (p2 - p0) / 6
    cp2 = p2 - (p3 - p1) / 6
    """
    pts = np.array(pts, dtype=float)
    n = len(pts)
    if n < 3:
        return ""
    
    # Ensure closed
    if np.linalg.norm(pts[0] - pts[-1]) < 1e-3:
        pts = pts[:-1]
        n -= 1
        
    cmds = [f"M {pts[0][0]:.1f},{pts[0][1]:.1f}"]
    
    for i in range(n):
        p0 = pts[(i - 1) % n]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n]
        
        cp1 = p1 + (p2 - p0) / 6.0
        cp2 = p2 - (p3 - p1) / 6.0
        
        cmds.append(f"C {cp1[0]:.1f},{cp1[1]:.1f} {cp2[0]:.1f},{cp2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}")
        
    cmds.append("Z")
    return " ".join(cmds)

print("Boundary and Bezier module ready.")
