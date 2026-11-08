import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_selector('text=ROUND 01')
        
        # Click on Stage 2 portal
        stage2_btn = await page.query_selector('[aria-label*="Stage 2"]')
        print(f"Found Stage 2 button: {stage2_btn is not None}")
        if stage2_btn:
            await stage2_btn.click()
        
        await page.wait_for_timeout(1000)
        await page.screenshot(path='artifacts_stage2_720p_current.png')
        
        # Check elements inside Stage 2
        header = await page.query_selector('header')
        header_box = await header.bounding_box() if header else None
        print('Header box:', header_box)
        
        main_el = await page.query_selector('main')
        main_box = await main_el.bounding_box() if main_el else None
        print('Main box:', main_box)
        
        hint_btn = await page.query_selector('button:has-text("HINT")')
        if hint_btn:
            btn_box = await hint_btn.bounding_box()
            print('HINT button box:', btn_box)
            if btn_box and btn_box['y'] + btn_box['height'] > 720:
                print('ALERT: HINT button is clipped below viewport! Y + Height =', btn_box['y'] + btn_box['height'])
            else:
                print('HINT button is visible inside viewport')
        else:
            print('HINT button not found')
            
        # Also check all 8 photos
        photos = await page.query_selector_all('[aria-label*="Inspect Evidence Photograph"]')
        print(f"Found {len(photos)} photos")
        for i, ph in enumerate(photos):
            pbox = await ph.bounding_box()
            print(f"Photo {i+1} box: {pbox}")
            
        await browser.close()

asyncio.run(main())
