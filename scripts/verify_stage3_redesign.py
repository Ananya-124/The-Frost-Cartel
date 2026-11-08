import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Click on Stage 3 portal card
        stage3_btn = page.locator('text=STAGE 3').first
        if await stage3_btn.count() > 0:
            await stage3_btn.click()
        else:
            await page.click('text=THE FORGOTTEN GRAVEYARD')
            
        await page.wait_for_timeout(2000)
        
        # Take full overview screenshot
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_overview_redesign.png')
        print('Captured verify_stage3_overview_redesign.png')
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify())

