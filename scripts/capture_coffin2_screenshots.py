import asyncio
from playwright.async_api import async_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # 1920x1080 viewport for authentic desktop experience
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # Navigate to round=1
        await page.goto('http://localhost:4173/?round=1')
        await page.wait_for_timeout(2000)
        
        # 1. Click Stage 3 Portal ("PORTAL 03")
        await page.locator('text=PORTAL 03').first.click()
        await page.wait_for_timeout(1500)
                
        # 2. Enter Grave 2 ("Grave 2: Buried Diary")
        grave2_btn = page.locator('button[aria-label="Grave 2: Buried Diary"]')
        print("Clicking Grave 2 button via aria-label...")
        await grave2_btn.click()
        await page.wait_for_timeout(2000)
            
        # 3. Capture Fullscreen Coffin 2 UI
        await page.screenshot(path='docs/screenshots/coffin2_fullscreen_clean_ui.png')
        print("Captured docs/screenshots/coffin2_fullscreen_clean_ui.png")
        
        # 4. Open Ancient Diary
        diary_btn = page.locator('button[aria-label*="Ancient Diary"]')
        print(f"Found {await diary_btn.count()} diary buttons")
        if await diary_btn.count() > 0:
            print("Clicking Ancient Diary hotspot...")
            await diary_btn.first.click()
            await page.wait_for_timeout(1000)
            await page.screenshot(path='docs/screenshots/coffin2_diary_modal.png')
            print("Captured docs/screenshots/coffin2_diary_modal.png")
            
            # Close Diary
            close_diary = page.locator('button:has-text("Close Diary"), button:has-text("Close & Enter Combination")')
            if await close_diary.count() > 0:
                await close_diary.first.click()
                await page.wait_for_timeout(600)
                
        # 5. Enter Tumbler Combination 1749
        tumblers = page.locator('div[role="spinbutton"]')
        count = await tumblers.count()
        print(f"Found {count} spinbuttons")
        if count == 4:
            await tumblers.nth(0).focus()
            await page.keyboard.press('1')
            await page.wait_for_timeout(150)
            
            await tumblers.nth(1).focus()
            await page.keyboard.press('7')
            await page.wait_for_timeout(150)
            
            await tumblers.nth(2).focus()
            await page.keyboard.press('4')
            await page.wait_for_timeout(150)
            
            await tumblers.nth(3).focus()
            await page.keyboard.press('9')
            await page.wait_for_timeout(300)
            
            # Click UNLOCK button
            unlock_btn = page.locator('button:has-text("UNLOCK")')
            if await unlock_btn.count() > 0:
                print("Clicking UNLOCK button...")
                await unlock_btn.first.click()
                await page.wait_for_timeout(1500)
                
                # Capture Unlocked Reveal (Chest open with EMBER)
                await page.screenshot(path='docs/screenshots/coffin2_unlocked_reveal.png')
                print("Captured docs/screenshots/coffin2_unlocked_reveal.png")

        await browser.close()
        print("Screenshots captured successfully!")

asyncio.run(main())
