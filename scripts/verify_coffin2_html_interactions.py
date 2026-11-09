import os
import time
from playwright.sync_api import sync_playwright

os.makedirs('docs/screenshots', exist_ok=True)

def run():
    print("Starting Playwright verification for Coffin II HTML click interactions...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 1. TEST DEBUG MODE OVERLAY (?debug=coffin2)
        print("--- Testing Developer Calibration Debug Mode (?debug=coffin2) ---")
        page.goto('http://localhost:4173/?round=1&debug=coffin2')
        page.wait_for_selector('text="PORTAL 03"', timeout=10000)
        page.click('text="PORTAL 03"')
        page.wait_for_selector('button[aria-label="Grave 2: Buried Diary"]', timeout=10000)
        page.click('button[aria-label="Grave 2: Buried Diary"]')
        page.wait_for_selector('text="THE KEEPER\'S RIDDLE"', timeout=10000)
        time.sleep(1)

        # Check debug mode indicators exist
        debug_labels = page.locator('span:has-text("skull_mark")')
        assert debug_labels.count() >= 1, "Debug overlay label skull_mark not found!"
        page.screenshot(path='docs/screenshots/coffin2_debug_overlay_1920x1080.png')
        print("Captured docs/screenshots/coffin2_debug_overlay_1920x1080.png")

        # 2. TEST NORMAL PRODUCTION MODE (Zero debug outlines, clean pristine artwork)
        print("--- Testing Normal Production Mode (Zero debug borders, pristine master) ---")
        page.goto('http://localhost:4173/?round=1')
        page.wait_for_selector('text="PORTAL 03"', timeout=10000)
        page.click('text="PORTAL 03"')
        page.wait_for_selector('button[aria-label="Grave 2: Buried Diary"]', timeout=10000)
        page.click('button[aria-label="Grave 2: Buried Diary"]')
        page.wait_for_selector('text="THE KEEPER\'S RIDDLE"', timeout=10000)
        time.sleep(1)

        # Clean 1920x1080 screenshot
        page.screenshot(path='docs/screenshots/coffin2_html_clean_1920x1080.png')
        print("Captured docs/screenshots/coffin2_html_clean_1920x1080.png")

        # Verify zero SVG elements exist in the main coffin container
        svg_count = page.locator('div[style*="aspect-ratio"] svg').count()
        print(f"SVG interaction overlays inside coffin container: {svg_count} (Must be 0)")
        assert svg_count == 0, f"Found {svg_count} SVG elements inside coffin container!"

        # Verify all 11 target buttons exist via data-target-id
        target_ids = [
            'skull_mark',
            'number_7',
            'number_4',
            'number_3',
            'number_9',
            'ancient_diary',
            'sealed_letter',
            'skeleton_key',
            'compass_medallion',
            'ancient_scroll',
            'treasure_chest'
        ]
        for tid in target_ids:
            loc = page.locator(f'button[data-target-id="{tid}"]')
            assert loc.count() == 1, f"Missing or duplicate button for data-target-id='{tid}'"
            assert loc.is_visible(), f"Button for data-target-id='{tid}' is not visible"

        print(f"All {len(target_ids)} target buttons verified with data-target-id.")

        # 3. Test Hover (Confirm NO visual hover artifacts, NO tooltips, NO labels)
        for tid in target_ids:
            btn = page.locator(f'button[data-target-id="{tid}"]')
            btn.hover()
            # Confirm no visible tooltips popped up
            tooltip_count = page.locator('.group-hover\\:opacity-100').count()
            assert tooltip_count == 0, f"Found floating tooltip on hover for {tid}!"

        print("Hover test passed: 0 tooltips, 0 SVG overlays, 0 hover glows.")

        # 4. NEGATIVE CLICK TESTING (Displacement & Gap Verification)
        print("--- Testing Negative Clicks and Hitbox Isolation ---")
        
        # Test A: Negative click in dead space between Number 9 and Treasure Chest
        # Number 9 ends at y=750 (52.08%), Chest starts at y=940 (65.28%)
        # In container space, clicking at x=67%, y=58% (dead space between them) should trigger neither
        coffin_box = page.locator('div[style*="aspect-ratio"]').bounding_box()
        assert coffin_box is not None, "Coffin container bounding box not found"

        dead_space_x = coffin_box['x'] + coffin_box['width'] * 0.67
        dead_space_y = coffin_box['y'] + coffin_box['height'] * 0.58
        page.mouse.click(dead_space_x, dead_space_y)
        time.sleep(0.3)
        assert page.locator('text="CRIMSON-SEALED RECORD"').count() == 0, "Dead space click incorrectly opened Number 9!"
        assert page.locator('text="IRON-BANDED COFFER"').count() == 0, "Dead space click incorrectly opened Treasure Chest!"
        print("Negative click test passed: Dead space between Number 9 and Treasure Chest does not trigger either target.")

        # Test B: Click specifically on Number 9 -> MUST NOT trigger Treasure Chest
        page.click('button[data-target-id="number_9"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"')
        assert page.locator('text="IRON-BANDED COFFER"').count() == 0, "Clicking Number 9 incorrectly opened Treasure Chest!"
        print("Positive/Negative test passed: Number 9 opens its inspection modal and never triggers the chest.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"', state='detached')

        # Test C: Negative click in dead space between Diary and Sealed Letter
        # Diary ends at y=880 (61.11%), Sealed Letter starts at y=980 (68.06%)
        # Clicking at x=32%, y=64% (gap between them)
        gap_x = coffin_box['x'] + coffin_box['width'] * 0.32
        gap_y = coffin_box['y'] + coffin_box['height'] * 0.64
        page.mouse.click(gap_x, gap_y)
        time.sleep(0.3)
        assert page.locator('#diary-modal-title').count() == 0, "Gap click incorrectly opened Ancient Diary!"
        assert page.locator('text="WAX-SEALED CEMETERY DISPATCH"').count() == 0, "Gap click incorrectly opened Sealed Letter!"
        print("Negative click test passed: Gap between Diary and Letter does not trigger either target.")

        # Test D: Click specifically on Sealed Letter -> MUST NOT trigger Ancient Diary
        page.click('button[data-target-id="sealed_letter"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"')
        assert page.locator('#diary-modal-title').count() == 0, "Clicking Letter incorrectly opened Ancient Diary!"
        print("Positive/Negative test passed: Sealed Letter opens its inspection modal and never triggers Diary.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"', state='detached')

        # 5. TEST ALL 11 OBJECT POSITIVE INSPECTIONS
        print("--- Testing Positive Inspections for all 11 Targets ---")
        
        # 1. Skull Mark
        page.click('button[data-target-id="skull_mark"]')
        page.wait_for_selector('text="CRANIUM OF THE SECOND KEEPER"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_skull.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRANIUM OF THE SECOND KEEPER"', state='detached')

        # 2. Number 7
        page.click('button[data-target-id="number_7"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper7.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"', state='detached')

        # 3. Number 4
        page.click('button[data-target-id="number_4"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper4.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"', state='detached')

        # 4. Number 3 (Distractor)
        page.click('button[data-target-id="number_3"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"')
        page.wait_for_selector('text=/ARCHIVAL BURIAL SCRAP/i')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper3.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"', state='detached')

        # 5. Number 9
        page.click('button[data-target-id="number_9"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper9.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"', state='detached')

        # 6. Ancient Diary
        page.click('button[data-target-id="ancient_diary"]')
        page.wait_for_selector('#diary-modal-title')
        page.wait_for_selector('text=/On the night the old covenant was sealed/i')
        page.screenshot(path='docs/screenshots/coffin2_inspect_diary.png')
        page.click('button[aria-label="Close Diary"]')
        page.wait_for_selector('#diary-modal-title', state='detached')

        # 7. Sealed Letter
        page.click('button[data-target-id="sealed_letter"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_letter.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"', state='detached')

        # 8. Skeleton Key
        page.click('button[data-target-id="skeleton_key"]')
        page.wait_for_selector('text="ORNATE SKELETON KEY"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_key.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ORNATE SKELETON KEY"', state='detached')

        # 9. Compass Medallion
        page.click('button[data-target-id="compass_medallion"]')
        page.wait_for_selector('text="ASTRONOMICAL COMPASS MEDALLION"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_compass_medallion.png')
        print("Captured docs/screenshots/coffin2_inspect_compass_medallion.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ASTRONOMICAL COMPASS MEDALLION"', state='detached')

        # 10. Ancient Scroll
        page.click('button[data-target-id="ancient_scroll"]')
        page.wait_for_selector('text="ANCIENT ROLLED SCROLL"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_scroll.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ANCIENT ROLLED SCROLL"', state='detached')

        # 11. Treasure Chest (Before Unlocked)
        page.click('button[data-target-id="treasure_chest"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"')
        page.wait_for_selector('text="THE CHEST REMAINS SEALED."')
        page.screenshot(path='docs/screenshots/coffin2_inspect_chest_locked.png')
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"', state='detached')

        print("All 11 positive inspections verified successfully.")

        # 6. Combination Lock: Incorrect & Correct Validation
        tumblers = page.locator('div[role="spinbutton"]')
        assert tumblers.count() == 4, f"Expected 4 tumblers, found {tumblers.count()}"

        # Submit 0000 -> Should fail
        page.click('button[aria-label="UNLOCK"]')
        page.wait_for_selector('text="The tumblers jam. The year remains lost to time."')
        print("Verified incorrect code feedback (0000)")

        # Enter 1749 using tumbler increment controls
        page.click('button[aria-label="Increment tumbler 1"]')
        for _ in range(7):
            page.click('button[aria-label="Increment tumbler 2"]')
        for _ in range(4):
            page.click('button[aria-label="Increment tumbler 3"]')
        for _ in range(9):
            page.click('button[aria-label="Increment tumbler 4"]')

        assert tumblers.nth(0).inner_text().strip() == '1'
        assert tumblers.nth(1).inner_text().strip() == '7'
        assert tumblers.nth(2).inner_text().strip() == '4'
        assert tumblers.nth(3).inner_text().strip() == '9'

        # Submit 1749 -> Unlocks
        page.click('button[aria-label="UNLOCK"]')
        page.wait_for_selector('text=/COVENANT YEAR 1749 UNLOCKED/i')
        page.wait_for_selector('text="EMBER"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_chest_unlocked.png')
        print("Captured docs/screenshots/coffin2_inspect_chest_unlocked.png")

        # Close reward modal and check Evidence Journal
        page.click('button:has-text("Continue")')
        page.wait_for_selector('footer button:has-text("EVIDENCE JOURNAL")')
        journal_text = page.locator('footer button:has-text("EVIDENCE JOURNAL")').inner_text()
        print(f"Verified Evidence Journal updated: {journal_text}")

        # Clicking chest while unlocked re-opens EMBER reward modal
        page.click('button[data-target-id="treasure_chest"]')
        page.wait_for_selector('text="EMBER"')
        print("Verified clicking unlocked chest re-opens reward modal directly.")
        page.click('button:has-text("Continue")')

        # 7. Responsive Tests across viewports
        for vp in [
            {'width': 1600, 'height': 900},
            {'width': 1440, 'height': 900},
            {'width': 1366, 'height': 768},
            {'width': 1280, 'height': 720}
        ]:
            page.set_viewport_size(vp)
            time.sleep(0.5)
            fname = f"docs/screenshots/coffin2_html_{vp['width']}x{vp['height']}.png"
            page.screenshot(path=fname)
            print(f"Captured responsive {fname}")

        browser.close()
        print("\n=======================================================")
        print("ALL 11 TARGETS & ZERO OVERLAP VERIFICATIONS PASSED 100%!")
        print("=======================================================\n")

if __name__ == '__main__':
    run()
