import asyncio
from playwright.async_api import async_playwright

async def verify_screens():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Enter Stage 2
        await page.click('text=THE HAUNTED IMAGE HUNT')
        await page.wait_for_timeout(1000)
        
        # 1. Screenshot of the new horror evidence table & relic bar
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_horror_evidence_table.png')
        print('1. Captured verify_horror_evidence_table.png')
        
        # 2. Open The Alchemist's Crypt
        await page.click("text=The Alchemist's Crypt")
        await page.wait_for_timeout(800)
        
        # Click potion bottle to discover and verify yellow/gold outline
        potion = page.locator('path[aria-label="Select Venom Potion Bottle"]')
        await potion.click(force=True)
        await page.wait_for_timeout(500)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_potion_bottle_aligned.png')
        print('2. Captured verify_potion_bottle_aligned.png')
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        # 3. Open The Cursed Attic
        await page.click('text=The Cursed Attic')
        await page.wait_for_timeout(800)
        
        # Click witch hat & spider
        what = page.locator('path[aria-label="Select Pointed Witch Hat"]')
        await what.click(force=True)
        await page.wait_for_timeout(300)
        spider = page.locator('path[aria-label="Select Crawling Spider"]')
        await spider.click(force=True)
        await page.wait_for_timeout(500)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_attic_aligned.png')
        print('3. Captured verify_attic_aligned.png')
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        # 4. Open The Haunted Mansion
        await page.click('text=The Haunted Mansion')
        await page.wait_for_timeout(800)
        
        # Click ghost & spider web
        ghost = page.locator('path[aria-label="Select Spectral Ghost Apparition"]')
        await ghost.click(force=True)
        await page.wait_for_timeout(300)
        web = page.locator('path[aria-label="Select Woven Cobweb"]')
        await web.click(force=True)
        await page.wait_for_timeout(500)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_mansion_aligned.png')
        print('4. Captured verify_mansion_aligned.png')
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(500)
        
        # 5. Final Evidence Table showing the awakened crimson/gold discovered relics in the checklist
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_evidence_table_with_discovered_relics.png')
        print('5. Captured verify_evidence_table_with_discovered_relics.png')
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify_screens())

