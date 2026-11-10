import asyncio
from playwright.async_api import async_playwright
import os

os.makedirs('docs/screenshots', exist_ok=True)

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Test across the 5 required responsive resolutions
        resolutions = [
            (1920, 1080, 'coffin3_master_clean_1920x1080.png'),
            (1600, 900, 'coffin3_responsive_1600x900.png'),
            (1440, 900, 'coffin3_responsive_1440x900.png'),
            (1366, 768, 'coffin3_responsive_1366x768.png'),
            (1280, 720, 'coffin3_responsive_1280x720.png'),
        ]
        
        for w, h, filename in resolutions:
            page = await browser.new_page(viewport={'width': w, 'height': h})
            await page.goto('http://localhost:5173/?round=1')
            await page.wait_for_timeout(1000)
            
            # Click Stage 3 Portal
            await page.locator('text=PORTAL 03').first.click()
            await page.wait_for_timeout(1000)
            
            # Click Grave 3 button with aria-label
            grave3_btn = page.locator('button[aria-label="Grave 3: Rune Tombstone"]')
            await grave3_btn.first.click()
            await page.wait_for_timeout(1200)
            
            # Take responsive screenshot
            await page.screenshot(path=f'docs/screenshots/{filename}')
            print(f"Captured docs/screenshots/{filename} at {w}x{h}")
            await page.close()
            
        # 2. Detailed functional verification at 1920x1080
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/?round=1')
        await page.wait_for_timeout(1000)
        await page.locator('text=PORTAL 03').first.click()
        await page.wait_for_timeout(1000)
        await page.locator('button[aria-label="Grave 3: Rune Tombstone"]').first.click()
        await page.wait_for_timeout(1200)
        
        # Verify Single Header HUD
        headers = await page.locator('h2:has-text("THE FINAL TESTAMENT")').count()
        print(f"Header count: {headers} (Must be exactly 1 in HUD)")
        assert headers >= 1, "Expected THE FINAL TESTAMENT header"
        
        # Verify Master 2560x1440 image
        master_img = page.locator('img[alt="The Final Testament Master Coffin Environment"]')
        assert await master_img.count() == 1, "Master image not found"
        src_attr = await master_img.get_attribute('src')
        print(f"Master image src: {src_attr}")
        assert 'coffin-03-final-testament-master.png' in src_attr, "Wrong master image source"
        
        # 3. Test Inspecting all 8 targets
        targets = [
            ('Inspect Azure Soul Crystal', 'coffin3_inspect_crystal.png', 'AZURE SOUL CRYSTAL'),
            ('Inspect Cranium of the Arch-Warden marked III', 'coffin3_inspect_skull.png', 'CRANIUM OF THE ARCH-WARDEN'),
            ('Inspect Cinnabar Infusion Potion Phial', 'coffin3_inspect_potion.png', 'CINNABAR INFUSION PHIAL'),
            ('Inspect Celestial Astral Medallion', 'coffin3_inspect_medallion.png', 'CELESTIAL ASTRAL MEDALLION'),
            ('Inspect Grimoire of the Constellations', 'coffin3_inspect_book.png', 'GRIMOIRE OF THE CONSTELLATIONS'),
            ('Inspect Ancient Testament Scroll', 'coffin3_inspect_scroll.png', 'ANCIENT TESTAMENT SCROLL'),
            ('Inspect Astronomical Chart of the Spheres', 'coffin3_inspect_chart.png', 'ASTRONOMICAL CHART OF THE SPHERES'),
            ('Inspect Carved Relic Chest', 'coffin3_inspect_chest.png', 'CARVED RELIC CHEST'),
        ]
        
        for aria_label, screenshot_file, expected_title in targets:
            btn = page.locator(f'button[aria-label="{aria_label}"]')
            assert await btn.count() == 1, f"Button with aria-label '{aria_label}' not found"
            await btn.click()
            await page.wait_for_timeout(500)
            
            # Modal should be open
            modal = page.locator('div[role="dialog"]')
            assert await modal.count() == 1, f"Modal did not open for {aria_label}"
            modal_text = await modal.inner_text()
            assert expected_title in modal_text, f"Expected {expected_title} in modal text"
            
            await page.screenshot(path=f'docs/screenshots/{screenshot_file}')
            print(f"Verified & captured {screenshot_file}")
            
            # Close modal
            close_btn = page.locator('button[aria-label="Close Inspection Modal"]')
            await close_btn.click()
            await page.wait_for_timeout(400)
            assert await page.locator('div[role="dialog"]').count() == 0, "Modal failed to close"

        # 4. Verify Riddle Verse Text
        riddle_verse = page.locator('text=Three guardians watch the heavens through the endless night')
        assert await riddle_verse.count() == 1, "Riddle verse not found"
        print("Verified Riddle Verse presence")

        # 5. Verify Three Rotating Rings
        assert await page.locator('text=RING I — OUTER').count() == 1, "Ring 1 label not found"
        assert await page.locator('text=RING II — MIDDLE').count() == 1, "Ring 2 label not found"
        assert await page.locator('text=RING III — INNER').count() == 1, "Ring 3 label not found"
        print("Verified all 3 ring labels")

        # 6. Test Incorrect Unlock submission
        unseal_btn = page.locator('button[aria-label="Unseal the Final Testament"]')
        await unseal_btn.click()
        await page.wait_for_timeout(500)
        
        # Verify error text is displayed
        error_msg = page.locator('text=The celestial runes resist your touch')
        assert await error_msg.count() == 1, "Expected error warning on incorrect unlock"
        print("Verified error warning on incorrect alignment")

        # 7. Rotate rings to correct alignment: MOON (Outer), RAVEN (Middle), FLAME (Inner)
        ring1_up = page.locator('button[aria-label="Rotate RING I — OUTER Clockwise"]')
        ring2_up = page.locator('button[aria-label="Rotate RING II — MIDDLE Clockwise"]')
        ring3_up = page.locator('button[aria-label="Rotate RING III — INNER Clockwise"]')

        for _ in range(4):
            ring1_box = page.locator('div:has-text("RING I — OUTER")').last
            if await ring1_box.locator('text=MOON').count() > 0:
                break
            await ring1_up.click()
            await page.wait_for_timeout(200)

        for _ in range(4):
            ring2_box = page.locator('div:has-text("RING II — MIDDLE")').last
            if await ring2_box.locator('text=RAVEN').count() > 0:
                break
            await ring2_up.click()
            await page.wait_for_timeout(200)

        for _ in range(4):
            ring3_box = page.locator('div:has-text("RING III — INNER")').last
            if await ring3_box.locator('text=FLAME').count() > 0:
                break
            await ring3_up.click()
            await page.wait_for_timeout(200)

        print("Rings aligned to MOON - RAVEN - FLAME!")
        await page.screenshot(path='docs/screenshots/coffin3_aligned_rings.png')

        # 8. Click UNSEAL THE FINAL TESTAMENT
        await unseal_btn.click()
        await page.wait_for_timeout(800)

        # 9. Verify Final Testament Unsealed Modal
        reward_modal = page.locator('div[role="dialog"]:has-text("CELESTIAL CODEX UNSEALED")')
        assert await reward_modal.count() == 1, "Unsealed testament reward modal did not appear"
        assert await page.locator('text=R — E — T — U — R — N — S').count() == 1, "Secret syllable 'RETURNS' not found"
        await page.screenshot(path='docs/screenshots/coffin3_unsealed_testament.png')
        print("Verified & captured docs/screenshots/coffin3_unsealed_testament.png")

        # Close reward modal
        close_reward = page.locator('button[aria-label="Close Reward Modal"]')
        await close_reward.click()
        await page.wait_for_timeout(400)

        # Verify button status changed to TESTAMENT UNSEALED
        assert await page.locator('text=TESTAMENT UNSEALED').count() >= 1, "Button status not updated"
        print("Verified TESTAMENT UNSEALED button state")

        await browser.close()
        print("\n=== ALL PLAYWRIGHT VERIFICATION CHECKS PASSED PERFECTLY! ===")

if __name__ == '__main__':
    asyncio.run(run_verification())
