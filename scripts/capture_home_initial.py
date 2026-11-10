import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        # Clear storage and load home page with round=1 query or logged in
        await page.goto('http://localhost:5173/?round=1')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='current_homepage_with_session.png')
        
        # Also plain home page (no round=1)
        await page.goto('http://localhost:5173/')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='current_homepage_clean.png')
        print('Captured screenshots.')
        await browser.close()

asyncio.run(run())

