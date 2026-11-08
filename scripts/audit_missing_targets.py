import asyncio
from playwright.async_api import async_playwright

async def check():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        await page.click('text=THE HAUNTED IMAGE HUNT')
        await page.wait_for_timeout(1000)
        
        # 1. Open Haunted Mansion (Ghost)
        await page.click('text=The Haunted Mansion')
        await page.wait_for_timeout(1000)
        
        ghost_locator = page.locator('path[aria-label="Select Spectral Ghost Apparition"]')
        ghost_count = await ghost_locator.count()
        print('Ghost path count:', ghost_count)
        
        if ghost_count > 0:
            box = await ghost_locator.bounding_box()
            print('Ghost bounding box on screen:', box)
            # Try to click ghost
            await ghost_locator.click(force=True)
            await page.wait_for_timeout(500)
            
            # Check toast or if discovered
            toast = await page.locator('[role="status"]').text_content() if await page.locator('[role="status"]').count() > 0 else 'None'
            print('Toast after clicking ghost:', toast)
        
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/audit_ghost_screen.png')
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        # 2. Open Cursed Attic (Spider)
        await page.click('text=The Cursed Attic')
        await page.wait_for_timeout(1000)
        
        spider_locator = page.locator('path[aria-label="Select Crawling Spider"]')
        spider_count = await spider_locator.count()
        print('Spider path count:', spider_count)
        
        if spider_count > 0:
            box = await spider_locator.bounding_box()
            print('Spider bounding box on screen:', box)
            await spider_locator.click(force=True)
            await page.wait_for_timeout(500)
            toast = await page.locator('[role="status"]').text_content() if await page.locator('[role="status"]').count() > 0 else 'None'
            print('Toast after clicking spider:', toast)
            
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/audit_spider_screen.png')
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(check())

