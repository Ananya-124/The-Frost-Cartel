# Frost Cartel Round 04 — Eight-Floor Asset Pack

## Contents
- `college_building_base.png`: source artwork, 1629×965.
- `floor-cutouts/`: eight full-canvas transparent PNG layers, one per floor.
- `svg/college-floor-overlays.svg`: preliminary SVG hover/click overlay, with an identical viewBox.
- `svg/floor-paths.json`: path manifest and coordinate system.
- `previews/floor_mapping_preview.png`: colour-coded overlay preview.

## Floor labels (top to bottom)
1. Seventh Floor
2. Sixth Floor
3. Fifth Floor
4. Fourth Floor
5. Third Floor
6. Second Floor
7. First Floor
8. Ground Floor

## Integration
Render the base image and SVG in the same positioned wrapper. Keep both at the same aspect ratio and apply transforms to their shared parent only. Do not independently scale or crop the SVG.

The PNG cutouts are transparent layers aligned to the original full canvas; use them for visual masking/animation, not as replacements for the source image.

## IMPORTANT CALIBRATION NOTE
These are preliminary visual cutouts based on the generated Ghibli-style illustration. They are not surveyed architectural floor outlines. Before production:
1. Open the overlay with the exact base image in the browser.
2. Calibrate each boundary against visible floor slabs/window bands.
3. Verify all 8 hover regions, pointer hit areas, and window target coordinates.
4. Record an individual window target for each floor.
5. Test at all responsive sizes.

The generated illustration is artwork, not a measured architectural elevation. Do not treat these preliminary paths as exact real-building plans.
