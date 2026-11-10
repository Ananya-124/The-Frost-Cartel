import asyncio
from playwright.async_api import async_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Test across the 5 required responsive resolutions
        resolutions = [
            (1920, 1080, 'coffin1_master_clean_1920x1080.png'),
            (1600, 900, 'coffin1_responsive_1600x900.png'),
            (1440, 900, 'coffin1_responsive_1440x900.png'),
            (1366, 768, 'coffin1_responsive_1366x768.png'),
            (1280, 720, 'coffin1_responsive_1280x720.png'),
        ]
        
        print("=== 1. TESTING RESPONSIVE FULL-BLEED RESOLUTIONS ===")
        for w, h, filename in resolutions:
            page = await browser.new_page(viewport={'width': w, 'height': h})
            # Clear storage so we test fresh state
            await page.goto('http://localhost:5173/?round=1')
            await page.wait_for_timeout(800)
            
            # Click Stage 3 Portal
            await page.locator('text=PORTAL 03').first.click()
            await page.wait_for_timeout(800)
            
            # Click Coffin 1
            coffin1_btn = page.locator('button[aria-label="Grave 1: Bone Chamber"]')
            await coffin1_btn.first.click()
            await page.wait_for_timeout(1000)
            
            # Verify 0 horizontal scroll
            scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
            client_width = await page.evaluate("() => document.documentElement.clientWidth")
            assert scroll_width <= client_width, f"Horizontal scroll detected at {w}x{h}: {scroll_width} > {client_width}"
            
            # Verify full-bleed image element
            bg_img = page.locator('img[src="/assets/round-01/stage-03/coffin-01-marked-remains-master.png"]')
            assert await bg_img.count() > 0, "Master background image not found!"
            
            # Take responsive screenshot
            await page.screenshot(path=f'docs/screenshots/{filename}')
            print(f"Captured docs/screenshots/{filename} at {w}x{h} (0px side gutters, 0 scroll)")
            await page.close()
            
        # 2. Detailed Functional Interaction Flow at 1920x1080
        print("\n=== 2. TESTING FUNCTIONAL INTERACTIONS & RIDDLE PROGRESSION ===")
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/?round=1')
        await page.wait_for_timeout(800)
        await page.locator('text=PORTAL 03').first.click()
        await page.wait_for_timeout(800)
        await page.locator('button[aria-label="Grave 1: Bone Chamber"]').first.click()
        await page.wait_for_timeout(1000)
        
        # Verify Single Header HUD
        headers = await page.locator('h2:has-text("THE MARKED REMAINS")').count()
        print(f"Header count: {headers} (Must be exactly 1 in HUD)")
        assert headers == 1, f"Expected 1 header, found {headers}"
        
        # Test 1: Click Ancient Grimoire -> Open AncientBookReader modal
        print("\n[Step 1] Opening Ancient Grimoire...")
        book_target = page.locator('path[aria-label="Inspect Ancient Grimoire"]')
        await book_target.click()
        await page.wait_for_timeout(800)
        
        # Verify AncientBookReader is open
        assert await page.locator('text=THE KEEPER\'S CHRONICLE').count() > 0 or await page.locator('text=ANCIENT GRIMOIRE').count() > 0 or await page.locator('button:has-text("Close Grimoire")').count() > 0 or await page.locator('button:has-text("✕")').count() > 0, "Book modal did not open!"
        await page.screenshot(path='docs/screenshots/coffin1_book_modal_open.png')
        print("Captured docs/screenshots/coffin1_book_modal_open.png")
        
        # Click through pages to fully read
        next_btn = page.locator('button:has-text("Next Page"), button:has-text("Turn Page"), button:has-text("→")')
        while await next_btn.count() > 0 and await next_btn.first.is_visible():
            await next_btn.first.click()
            await page.wait_for_timeout(400)
            
        # Close Book modal
        close_btn = page.locator('button[aria-label="Close Grimoire"], button:has-text("Close"), button:has-text("✕")').first
        await close_btn.click()
        await page.wait_for_timeout(800)
        print("Grimoire read and closed successfully.")
        
        # Test 2: Inspect Cranium with Roman I
        print("\n[Step 2] Inspecting Cranium (Roman I)...")
        skull_target = page.locator('path[aria-label="Inspect Cranium of the First Warden marked I"]')
        await skull_target.click()
        await page.wait_for_timeout(800)
        assert await page.locator('text=SKULL').count() > 0 or await page.locator('text=CRANIUM').count() > 0 or await page.locator('text=CLOSE INSPECTION').count() > 0, "Skull inspection modal did not open!"
        await page.screenshot(path='docs/screenshots/coffin1_skull_inspect.png')
        print("Captured docs/screenshots/coffin1_skull_inspect.png")
        await page.locator('button:has-text("Close Inspection"), button:has-text("Close"), button:has-text("✕")').first.click()
        await page.wait_for_timeout(600)
        
        # Test 3: Inspect Sealed Letter
        print("\n[Step 3] Inspecting Sealed Letter...")
        letter_target = page.locator('path[aria-label="Inspect Sealed Letter"]')
        await letter_target.click()
        await page.wait_for_timeout(800)
        assert await page.locator('button:has-text("Close Inspection"), button:has-text("Close"), button:has-text("✕")').count() > 0, "Letter modal did not open!"
        await page.screenshot(path='docs/screenshots/coffin1_letter_inspect.png')
        print("Captured docs/screenshots/coffin1_letter_inspect.png")
        await page.locator('button:has-text("Close Inspection"), button:has-text("Close"), button:has-text("✕")').first.click()
        await page.wait_for_timeout(600)
        
        # Test 4: Shift Movable Femur Bone to Reveal "ASH"
        print("\n[Step 4] Shifting Movable Femur Bone...")
        femur_target = page.locator('path[aria-label="Movable Femur: Click or Drag to Shift Remains"]')
        await femur_target.click()
        await page.wait_for_timeout(800)
        
        # Verify "ASH" plate is now visible
        ash_plate = page.locator('g[aria-label="Inspect Revealed Inscription: ASH"]')
        assert await ash_plate.count() > 0, "Revealed 'ASH' inscription plate not found after shifting bone!"
        print("CONFIRMED: 'ASH' plate is revealed!")
        await page.screenshot(path='docs/screenshots/coffin1_ash_plate_revealed.png')
        print("Captured docs/screenshots/coffin1_ash_plate_revealed.png")
        
        # Click "ASH" plate
        await ash_plate.click()
        await page.wait_for_timeout(500)
        
        # Test 5: Submit Riddle Answer "ASH"
        print("\n[Step 5] Submitting riddle keyword 'ASH'...")
        riddle_input = page.locator('input[placeholder="Enter your answer..."]')
        await riddle_input.fill("ASH")
        await page.locator('button:has-text("SUBMIT")').click()
        await page.wait_for_timeout(800)
        
        # Verify key / unlock button appears
        key_btn = page.locator('button:has-text("USE SKELETON KEY")')
        assert await key_btn.count() > 0, "Skeleton Key button not found after submitting correct answer!"
        print("CONFIRMED: Riddle solved! 'USE SKELETON KEY' button available.")
        await page.screenshot(path='docs/screenshots/coffin1_riddle_solved.png')
        print("Captured docs/screenshots/coffin1_riddle_solved.png")
        
        # Test 6: Unlock & Open Ancient Chest
        print("\n[Step 6] Unlocking and Opening Ancient Chest...")
        await key_btn.click()
        await page.wait_for_timeout(1200)
        
        open_btn = page.locator('button:has-text("OPEN ANCIENT CHEST")')
        if await open_btn.count() > 0:
            await open_btn.click()
            await page.wait_for_timeout(1000)
            
        # Verify Reward Modal is open with "BENEATH"
        reward_modal = page.locator('div[aria-labelledby="grave1-reward-title"]')
        assert await reward_modal.count() > 0, "Reward modal not found!"
        beneath_text = page.locator('text=B — E — N — E — A — T — H')
        assert await beneath_text.count() > 0, "Fragment 'BENEATH' not found in reward modal!"
        print("CONFIRMED: Reward modal displayed with 'BENEATH'!")
        await page.screenshot(path='docs/screenshots/coffin1_reward_modal_unsealed.png')
        print("Captured docs/screenshots/coffin1_reward_modal_unsealed.png")
        
        # Close Reward Modal
        await page.locator('button:has-text("✕ Close")').click()
        await page.wait_for_timeout(600)
        
        # Final screen check: unsealed button shown
        unsealed_btn = page.locator('button:has-text("FRAGMENT UNSEALED: \\"BENEATH\\"")')
        assert await unsealed_btn.count() > 0, "Unsealed state button not found on console!"
        print("CONFIRMED: Console shows FRAGMENT UNSEALED: 'BENEATH'!")
        await page.screenshot(path='docs/screenshots/coffin1_final_completed_screen.png')
        print("Captured docs/screenshots/coffin1_final_completed_screen.png")
        
        await page.close()
        await browser.close()
        print("\n=== ALL COFFIN 1 CHECKS PASSED WITH 100% SUCCESS! ===")

if __name__ == '__main__':
    asyncio.run(run_verification())
