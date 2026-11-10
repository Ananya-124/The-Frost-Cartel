from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    resolutions = [(1920, 1080), (1600, 900), (1440, 900), (1366, 768), (1280, 720)]
    for w, h in resolutions:
        page = browser.new_page(viewport={'width': w, 'height': h})
        page.goto('http://localhost:4173/?round=1')
        page.click('text="PORTAL 03"')
        page.click('button[aria-label="Grave 2: Buried Diary"]')
        page.wait_for_selector('text="THE KEEPER\'S RIDDLE"')
        img_box = page.locator('img[alt*="The Buried Diary"]').bounding_box()
        svg_box = page.locator('svg[aria-label="Burial chamber interactive objects"]').bounding_box()
        print(f'{w}x{h} -> Image Box: {img_box}, SVG Box: {svg_box}')
        assert img_box['x'] == 0 and img_box['y'] == 0, f'Image not at (0,0) on {w}x{h}'
        assert img_box['width'] == w and img_box['height'] == h, f'Image does not fill {w}x{h}'
        assert svg_box['x'] == 0 and svg_box['y'] == 0, f'SVG not at (0,0) on {w}x{h}'
        assert svg_box['width'] == w and svg_box['height'] == h, f'SVG does not fill {w}x{h}'
        
        # Check that there are no horizontal scrollbars on document
        scroll_w = page.evaluate('() => document.documentElement.scrollWidth')
        inner_w = page.evaluate('() => window.innerWidth')
        assert scroll_w <= inner_w, f'Horizontal scroll detected: {scroll_w} > {inner_w}'
        
        page.close()
    browser.close()
    print('ALL RESOLUTIONS CONFIRMED 100% FULL-BLEED (0px side gutters, 0px vertical gaps, 0 horizontal scroll)!')
