import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_selector('text=ROUND 01')
        
        # Click on Stage 3 portal
        stage3_btn = await page.query_selector('[aria-label*="Stage 3"]')
        print(f"Found Stage 3 button: {stage3_btn is not None}")
        if stage3_btn:
            await stage3_btn.click()
        
        await page.wait_for_timeout(1000)
        await page.screenshot(path='artifacts_stage3_720p_current.png')
        
        # Check elements inside Stage 3
        header = await page.query_selector('header')
        header_box = await header.bounding_box() if header else None
        print('Header box:', header_box)
        
        # Check heading
        heading = await page.query_selector('h1')
        heading_box = await heading.bounding_box() if heading else None
        print('Heading box:', heading_box)
        
        # Check all 3 coffins
        coffins = await page.query_selector_all('[aria-label*="Grave"]')
        print(f"Found {len(coffins)} coffins")
        for i, c in enumerate(coffins):
            cbox = await c.bounding_box()
            print(f"Coffin {i+1} box: {cbox}")
            
        # Check footer buttons
        journal_btn = await page.query_selector('button:has-text("EVIDENCE JOURNAL")')
        gate_btn = await page.query_selector('button:has-text("ESCAPE GATE"), button:has-text("FINAL ESCAPE GATE")')
        dashboard_btn = await page.query_selector('button:has-text("ROUND DASHBOARD")')
        
        if journal_btn:
            jbox = await journal_btn.bounding_box()
            print('Journal button box:', jbox)
        if gate_btn:
            gbox = await gate_btn.bounding_box()
            print('Gate button box:', gbox)
        if dashboard_btn:
            dbox = await dashboard_btn.bounding_box()
            print('Dashboard button box:', dbox)
            if dbox and dbox['y'] + dbox['height'] > 720:
                print('ALERT: Dashboard button is clipped! Y + Height =', dbox['y'] + dbox['height'])
            else:
                print('Dashboard button is visible inside viewport')
                
        await browser.close()

asyncio.run(main())
