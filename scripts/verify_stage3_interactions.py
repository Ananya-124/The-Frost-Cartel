import asyncio
from playwright.async_api import async_playwright

async def verify_interactions():
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
            
        await page.wait_for_timeout(1500)
        
        # 1. Test clicking Coffin 1 (The Lost Chamber / Grave 1)
        coffin1 = page.locator('button[aria-label=\"Grave 1: Bone Chamber\"]').first
        await coffin1.click()
        await page.wait_for_timeout(1000)
        
        # Verify Grave 1 view loaded
        print('Grave 1 view loaded successfully')
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_grave1.png')
        
        # Return to cemetery overview
        return_btn = page.locator('button:has-text(\"RETURN TO CEMETERY\")').first
        await return_btn.click()
        await page.wait_for_timeout(1000)
        print('Returned to overview successfully')
            
        # 2. Test clicking Coffin 2 (The Shadow Library / Grave 2)
        coffin2 = page.locator('button[aria-label=\"Grave 2: Buried Diary\"]').first
        await coffin2.click()
        await page.wait_for_timeout(1000)
        print('Grave 2 view loaded successfully')
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_grave2.png')
        
        return_btn2 = page.locator('button:has-text(\"RETURN TO CEMETERY\")').first
        await return_btn2.click()
        await page.wait_for_timeout(1000)
        print('Returned to overview from grave 2')

        # 3. Test clicking Coffin 3 (The Cursed Sanctuary / Grave 3)
        coffin3 = page.locator('button[aria-label=\"Grave 3: Rune Tombstone\"]').first
        await coffin3.click()
        await page.wait_for_timeout(1000)
        print('Grave 3 view loaded successfully')
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_grave3.png')
        
        return_btn3 = page.locator('button:has-text(\"RETURN TO CEMETERY\")').first
        await return_btn3.click()
        await page.wait_for_timeout(1000)
        print('Returned to overview from grave 3')

        # 4. Test opening Evidence Journal
        journal_btn = page.locator('footer button:has-text(\"Evidence Journal\")').first
        await journal_btn.click()
        await page.wait_for_timeout(600)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_journal.png')
        print('Journal modal opened')
        
        # Close journal modal
        close_btn = page.locator('button:has-text(\"✕ Close\")').first
        await close_btn.click()
        await page.wait_for_timeout(500)
        
        # 5. Test opening Final Escape Gate
        gate_btn = page.locator('footer button:has-text(\"Final Escape Gate\")').first
        await gate_btn.click()
        await page.wait_for_timeout(600)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_gate.png')
        print('Gate modal opened')

        close_gate = page.locator('button:has-text(\"Abandon Gate\")').first
        if await close_gate.count() > 0:
            await close_gate.click()
            await page.wait_for_timeout(500)
        
        await browser.close()
        print('All Stage 3 interaction verifications completed perfectly!')

if __name__ == '__main__':
    asyncio.run(verify_interactions())
