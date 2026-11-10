import os

svg_path = (
    'M 388 126 '
    'C 388 123.5 392 122.5 396.5 122.5 '
    'C 401 122.5 405 123.5 405 126 '
    'L 405 144 '
    'C 406 145 407 147 406.5 149 '
    'C 406 151 405 152 404.5 155 '
    'C 404 165 403.5 180 403 195 '
    'C 403 205 407 215 413 223 '
    'C 418 229 423 234 424 242 '
    'C 424.5 255 424.5 275 424 295 '
    'C 423.5 305 422 314 420 319 '
    'C 415 322 405 324 396.5 324 '
    'C 388 324 378 322 374 319 '
    'C 372.5 314 371.5 305 371 295 '
    'C 370.5 275 370.5 255 371 242 '
    'C 372 234 376 229 381 223 '
    'C 386.5 215 388 205 388 195 '
    'C 387.5 180 387 165 386.5 155 '
    'C 386 152 385 151 384.5 149 '
    'C 384 147 385 145 386 144 '
    'L 387 126 '
    'Z'
)

html = f"""<!DOCTYPE html>
<html>
<head>
<style>
  body {{ margin: 0; background: #0a0a0f; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; font-family: sans-serif; color: #fff; }}
  .container {{ position: relative; width: 1024px; height: 561px; border: 1px solid #333; }}
  img {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; }}
  svg {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; }}
  path {{ fill: rgba(251, 191, 36, 0.25); stroke: #fbbf24; stroke-width: 2px; filter: drop-shadow(0 0 6px rgba(251, 191, 36, 0.9)); }}
  .zoom-box {{ position: relative; width: 400px; height: 400px; overflow: hidden; border: 2px solid #fbbf24; margin-top: 20px; }}
  .zoom-inner {{ position: absolute; width: 3072px; height: 1683px; left: -1080px; top: -300px; }}
</style>
</head>
<body>
  <h2>Stage 2 - Potion Bottle Silhouette Verification (1024 x 561)</h2>
  <div class="container">
    <img src="test_crop_29_590.png" />
    <svg viewBox="0 0 1024 561">
      <path d="{svg_path}" />
    </svg>
  </div>
  <h3>3x Zoom View on Bottle:</h3>
  <div class="zoom-box">
    <div class="zoom-inner">
      <img src="test_crop_29_590.png" style="width: 100%; height: 100%;" />
      <svg viewBox="0 0 1024 561" style="width: 100%; height: 100%;">
        <path d="{svg_path}" />
      </svg>
    </div>
  </div>
</body>
</html>"""

with open('preview_bottle_overlay.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('Saved preview_bottle_overlay.html')
