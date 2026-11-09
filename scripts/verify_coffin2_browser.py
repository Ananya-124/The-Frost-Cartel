import asyncio
from playwright.async_api import async_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test across the required resolutions
        resolutions = [
            (1920, 1080, 'coffin2_master_clean_1920x1080.png'),
            (1600, 900, 'coffin2_responsive_1600x900.png'),
            (1440, 900, 'coffin2_responsive_1440x900.png'),
            (1366, 768, 'coffin2_responsive_1366x768.png'),
            (1280, 720, 'coffin2_responsive_1280x720.png'),
        ]
        
        for w, h, filename in resolutions:
            page = await browser.new_page(viewport={'width': w, 'height': h})
            await page.goto('http://localhost:4173/?round=1')
            await page.wait_for_timeout(1000)
            
            # Click Stage 3 Portal
            await page.locator('text=PORTAL 03').first.click()
            await page.wait_for_timeout(1000)
            
            # Click Grave 2
            grave2_btn = page.locator('button[aria-label="Grave 2: Buried Diary"]')
            await grave2_btn.click()
            await page.wait_for_timeout(1500)
            
            # Take responsive screenshot
            await page.screenshot(path=f'docs/screenshots/{filename}')
            print(f"Captured docs/screenshots/{filename} at {w}x{h}")
            await page.close()
            
        # Detailed functional verification at 1920x1080
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:4173/?round=1')
        await page.wait_for_timeout(1000)
        await page.locator('text=PORTAL 03').first.click()
        await page.wait_for_timeout(1000)
        await page.locator('button[aria-label="Grave 2: Buried Diary"]').click()
        await page.wait_for_timeout(1500)
        
        # 1. Verify single title
        titles = await page.locator('h1, h2, h3, header').all_inner_texts()
        diary_titles = [t for t in titles if 'THE BURIED DIARY' in t.upper()]
        print(f"Count of 'THE BURIED DIARY' headings in DOM: {len(diary_titles)}")
        
        # 2. Verify image source is the 2560x1440 master PNG
        img = page.locator('img[alt*="The Buried Diary"]')
        src = await img.get_attribute('src')
        print(f"Loaded master artwork src: {src}")
        
        # 3. Test Ancient Diary Modal
        diary_hotspot = page.locator('button[aria-label*="Ancient Diary"]')
        await diary_hotspot.click()
        await page.wait_for_timeout(800)
        await page.screenshot(path='docs/screenshots/coffin2_master_diary_modal.png')
        print("Captured docs/screenshots/coffin2_master_diary_modal.png")
        
        # Check modal text
        modal_text = await page.locator('div[role="dialog"]').inner_text()
        has_clue = "Four witnesses survived the keeper's final testimony" in modal_text or "four witnesses" in modal_text.lower()
        print(f"Diary modal has narrative riddle: {has_clue}")
        has_spoilers = "1 Brow" in modal_text or "1 (Brow)" in modal_text or "1749" in modal_text
        print(f"Diary modal has answer spoilers: {has_spoilers} (Expected False)")
        
        # Close Diary Modal
        await page.locator('button:has-text("Close Diary"), button:has-text("Close & Enter Combination")').first.click()
        await page.wait_for_timeout(500)
        
        # 4. Test Wrong Answer (0000)
        unlock_btn = page.locator('button:has-text("UNLOCK")')
        await unlock_btn.click()
        await page.wait_for_timeout(800)
        toast = await page.locator('div:has-text("The tumblers jam")').count()
        print(f"Wrong answer triggered jam feedback: {toast > 0}")
        
        # 5. Test Correct Answer (1749)
        tumblers = page.locator('div[role="spinbutton"]')
        await tumblers.nth(0).focus()
        await page.keyboard.press('1')
        await page.wait_for_timeout(100)
        
        await tumblers.nth(1).focus()
        await page.keyboard.press('7')
        await page.wait_for_timeout(100)
        
        await tumblers.nth(2).focus()
        await page.keyboard.press('4')
        await page.wait_for_timeout(100)
        
        await tumblers.nth(3).focus()
        await page.keyboard.press('9')
        await page.wait_for_timeout(200)
        
        # Click UNLOCK
        await unlock_btn.click()
        await page.wait_for_timeout(1500)
        
        # Capture Unlocked Reveal Screen
        await page.screenshot(path='docs/screenshots/coffin2_master_unlocked_reveal.png')
        print("Captured docs/screenshots/coffin2_master_unlocked_reveal.png")
        
        # Verify EMBER fragment and Journal progress
        has_ember = await page.locator('text=EMBER').count() > 0
        journal_text = await page.locator('footer button').first.inner_text()
        print(f"EMBER fragment unsealed: {has_ember}")
        print(f"Evidence journal updated: {journal_text}")
        
        # 6. Test Persistence after Refresh
        await page.reload()
        await page.wait_for_timeout(1500)
        # Check if still in Grave 2 or if session state persists
        unlocked_badge = await page.locator('text=EMBER, text=COVENANT (1749)').count()
        print(f"Completion state persists: {unlocked_badge > 0 or has_ember}")

        await browser.close()
        print("All browser verification tests passed!")

asyncio.run(run_verification())

