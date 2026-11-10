import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:4173/?round=1')
        await page.wait_for_timeout(2000)
        stage3_btn = page.locator('button:has-text("The Forgotten Graveyard")')
        await stage3_btn.first.click()
        await page.wait_for_timeout(1500)
        btns = await page.locator('button').all_inner_texts()
        print('Stage 3 buttons count:', len(btns))
        for b in btns:
            if b.strip():
                print('  -', repr(b.strip()))
        await browser.close()

asyncio.run(check())

