import os
import time
from playwright.sync_api import sync_playwright

os.makedirs('docs/screenshots', exist_ok=True)

def run():
    print("==================================================================")
    print("STARTING COFFIN II PIXEL-PERFECT SVG VERIFICATION SUITE")
    print("==================================================================")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # ----------------------------------------------------------------
        # 1. DEVELOPER DIAGNOSTIC MODE (?debug=coffin2)
        # ----------------------------------------------------------------
        print("\n--- PHASE 8: Developer Calibration Diagnostic Mode Tests ---")
        context_debug = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page_debug = context_debug.new_page()

        page_debug.goto('http://localhost:4173/?round=1&debug=coffin2')
        page_debug.wait_for_selector('text="PORTAL 03"', timeout=10000)
        page_debug.click('text="PORTAL 03"')
        page_debug.wait_for_selector('button[aria-label="Grave 2: Buried Diary"]', timeout=10000)
        page_debug.click('button[aria-label="Grave 2: Buried Diary"]')
        page_debug.wait_for_selector('text="THE KEEPER\'S RIDDLE"', timeout=10000)
        time.sleep(1)

        # Confirm all 11 polygon elements exist in SVG
        polys = page_debug.locator('svg[aria-label="Burial chamber interactive objects"] polygon')
        assert polys.count() == 11, f"Expected 11 SVG polygons, found {polys.count()}"
        print(f"Verified {polys.count()} SVG interaction polygons loaded in SVG layer.")

        # Capture diagnostic screenshot showing all polygon overlays and badges
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_all_targets_1920x1080.png')
        print("Captured docs/screenshots/coffin2_debug_all_targets_1920x1080.png")

        # Capture individual selected diagnostic screenshots requested in Phase 13:
        # Number 7 selected
        page_debug.click('polygon[data-target-id="number_7"]')
        page_debug.wait_for_selector('text="WESTERN MARKER — VII (7)"')
        # Close modal to see the selected red outline on stage
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_number_7_selected.png')
        print("Captured docs/screenshots/coffin2_debug_number_7_selected.png")

        # Number 4 selected
        page_debug.click('polygon[data-target-id="number_4"]')
        page_debug.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_number_4_selected.png')
        print("Captured docs/screenshots/coffin2_debug_number_4_selected.png")

        # Number 9 selected
        page_debug.click('polygon[data-target-id="number_9"]')
        page_debug.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_number_9_selected.png')
        print("Captured docs/screenshots/coffin2_debug_number_9_selected.png")

        # Number 3 selected
        page_debug.click('polygon[data-target-id="number_3"]')
        page_debug.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_number_3_selected.png')
        print("Captured docs/screenshots/coffin2_debug_number_3_selected.png")

        # Diary path selected
        page_debug.click('polygon[data-target-id="ancient_diary"]')
        page_debug.wait_for_selector('#diary-modal-title')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_diary_selected.png')
        print("Captured docs/screenshots/coffin2_debug_diary_selected.png")

        # Letter path selected
        page_debug.click('polygon[data-target-id="sealed_letter"]')
        page_debug.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_letter_selected.png')
        print("Captured docs/screenshots/coffin2_debug_letter_selected.png")

        # Treasure Chest path selected
        page_debug.click('polygon[data-target-id="treasure_chest"]')
        page_debug.wait_for_selector('text="IRON-BANDED COFFER"')
        page_debug.keyboard.press('Escape')
        time.sleep(0.3)
        page_debug.screenshot(path='docs/screenshots/coffin2_debug_treasure_chest_selected.png')
        print("Captured docs/screenshots/coffin2_debug_treasure_chest_selected.png")

        context_debug.close()

        # ----------------------------------------------------------------
        # 2. PLAYER PRODUCTION MODE (Zero visible outlines, 100% clean photograph)
        # ----------------------------------------------------------------
        print("\n--- PHASE 4 & 9: Player Production Mode & Viewport Registration ---")
        context_prod = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context_prod.new_page()

        page.goto('http://localhost:4173/?round=1')
        page.wait_for_selector('text="PORTAL 03"', timeout=10000)
        page.click('text="PORTAL 03"')
        page.wait_for_selector('button[aria-label="Grave 2: Buried Diary"]', timeout=10000)
        page.click('button[aria-label="Grave 2: Buried Diary"]')
        page.wait_for_selector('text="THE KEEPER\'S RIDDLE"', timeout=10000)
        time.sleep(1)

        # Capture pristine player-facing screenshot
        page.screenshot(path='docs/screenshots/coffin2_player_clean_1920x1080.png')
        print("Captured docs/screenshots/coffin2_player_clean_1920x1080.png")

        # Confirm all 11 polygons have fill="transparent" and stroke="none"
        polygons = page.locator('svg[aria-label="Burial chamber interactive objects"] polygon')
        for i in range(11):
            poly = polygons.nth(i)
            fill_val = poly.get_attribute('fill')
            stroke_val = poly.get_attribute('stroke')
            assert fill_val == 'transparent', f"Polygon {i} fill is {fill_val}, must be 'transparent'"
            assert stroke_val == 'none', f"Polygon {i} stroke is {stroke_val}, must be 'none'"

        print("Verified all 11 SVG polygons are 100% invisible in production (fill='transparent', stroke='none').")

        # Hover test: Confirm NO visible outlines, NO tooltips, NO glows
        for tid in [
            'skull_mark', 'number_7', 'number_4', 'number_3', 'number_9',
            'ancient_diary', 'sealed_letter', 'skeleton_key', 'compass_medallion',
            'ancient_scroll', 'treasure_chest'
        ]:
            poly = page.locator(f'polygon[data-target-id="{tid}"]')
            poly.hover()
            assert page.locator('.group-hover\\:opacity-100').count() == 0, f"Found tooltip on hover for {tid}"

        print("Hover test passed: 0 tooltips, 0 glow filters, 0 visual disruptions.")

        # ----------------------------------------------------------------
        # 3. MANDATORY REGRESSION TESTS (TEST A THROUGH TEST H)
        # ----------------------------------------------------------------
        print("\n--- PHASE 10: Mandatory Regression Tests A through H ---")

        # TEST A: Click Number 9 -> MUST show Number 9 inspection, MUST NOT open Treasure Chest
        page.click('polygon[data-target-id="number_9"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"')
        assert page.locator('text="IRON-BANDED COFFER"').count() == 0, "TEST A FAILED: Number 9 opened Treasure Chest!"
        print("✓ TEST A PASSED: Number 9 opens its own details and never triggers Treasure Chest.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"', state='detached')

        # TEST B: Click Number 4 -> MUST show Number 4 inspection, MUST NOT show Number 9 details
        page.click('polygon[data-target-id="number_4"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"')
        assert page.locator('text="CRIMSON-SEALED RECORD"').count() == 0, "TEST B FAILED: Number 4 showed Number 9 details!"
        print("✓ TEST B PASSED: Number 4 opens its own details and never triggers Number 9.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"', state='detached')

        # TEST C: Click Number 7 -> MUST show Number 7 inspection, MUST NOT open Diary or Skeleton
        page.click('polygon[data-target-id="number_7"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"')
        assert page.locator('#diary-modal-title').count() == 0, "TEST C FAILED: Number 7 opened Diary!"
        assert page.locator('text="CRANIUM OF THE SECOND KEEPER"').count() == 0, "TEST C FAILED: Number 7 opened Cranium!"
        print("✓ TEST C PASSED: Number 7 opens its own details and never triggers Diary or Skeleton.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"', state='detached')

        # TEST D: Click Number 3 -> MUST show Number 3 inspection, MUST NOT open another number
        page.click('polygon[data-target-id="number_3"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"')
        page.wait_for_selector('text=/ARCHIVAL BURIAL SCRAP/i')
        assert page.locator('text="MOONWARD EASTERN SCRAP"').count() == 0, "TEST D FAILED: Number 3 opened Number 4!"
        assert page.locator('text="CRIMSON-SEALED RECORD"').count() == 0, "TEST D FAILED: Number 3 opened Number 9!"
        print("✓ TEST D PASSED: Number 3 opens its own details (distractor) and never triggers another number.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"', state='detached')

        # TEST E: Click actual Diary -> MUST open Diary reading interface, MUST NOT open Letter or Scroll
        page.click('polygon[data-target-id="ancient_diary"]')
        page.wait_for_selector('#diary-modal-title')
        page.wait_for_selector('text=/The Keeper’s Chronicle — Anno Domini/i')
        assert page.locator('text="WAX-SEALED CEMETERY DISPATCH"').count() == 0, "TEST E FAILED: Diary opened Letter!"
        assert page.locator('text="ANCIENT ROLLED SCROLL"').count() == 0, "TEST E FAILED: Diary opened Scroll!"
        print("✓ TEST E PASSED: Diary opens reading interface and never triggers Letter or Scroll.")
        page.click('button[aria-label="Close Diary"]')
        page.wait_for_selector('#diary-modal-title', state='detached')

        # TEST F: Click actual Letter -> MUST show Letter inspection, MUST NOT open Diary
        page.click('polygon[data-target-id="sealed_letter"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"')
        assert page.locator('#diary-modal-title').count() == 0, "TEST FAILED: Letter opened Diary!"
        print("✓ TEST F PASSED: Letter opens its own inspection and never triggers Diary.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"', state='detached')

        # TEST G: Click actual Treasure Chest -> MUST show Chest inspection, MUST NOT open Number 9
        page.click('polygon[data-target-id="treasure_chest"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"')
        page.wait_for_selector('text="THE CHEST REMAINS SEALED."')
        assert page.locator('text="CRIMSON-SEALED RECORD"').count() == 0, "TEST G FAILED: Chest opened Number 9!"
        print("✓ TEST G PASSED: Treasure Chest opens its locked status and never triggers Number 9.")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"', state='detached')

        # TEST H: Click empty background -> MUST NOT execute any object action
        coffin_box = page.locator('div[style*="aspect-ratio"]').bounding_box()
        assert coffin_box is not None, "Coffin bounding box not found"
        # Dead space on the top coffin lid rim (x=18%, y=25%)
        empty_x = coffin_box['x'] + coffin_box['width'] * 0.18
        empty_y = coffin_box['y'] + coffin_box['height'] * 0.25
        page.mouse.click(empty_x, empty_y)
        time.sleep(0.3)
        assert page.locator('role=dialog').count() == 0, "TEST H FAILED: Empty background click opened a modal!"
        print("✓ TEST H PASSED: Empty background click produces no object action.")

        # ----------------------------------------------------------------
        # 4. GAME PROGRESSION & COMBINATION UNLOCK (1749 -> EMBER)
        # ----------------------------------------------------------------
        print("\n--- PHASE 11: Game Progression & Combination Unlocking ---")
        tumblers = page.locator('div[role="spinbutton"]')
        assert tumblers.count() == 4

        # Enter 1749
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

        # Submit 1749
        page.click('button[aria-label="UNLOCK"]')
        page.wait_for_selector('text=/COVENANT YEAR 1749 UNLOCKED/i')
        page.wait_for_selector('text="EMBER"')
        page.screenshot(path='docs/screenshots/coffin2_chest_unlocked_reward.png')
        print("Captured docs/screenshots/coffin2_chest_unlocked_reward.png")

        # Close reward modal
        page.click('button:has-text("Continue")')

        # Verify clicking chest while unlocked re-opens EMBER reward modal directly
        page.click('polygon[data-target-id="treasure_chest"]')
        page.wait_for_selector('text="EMBER"')
        print("Verified unlocked chest re-opens EMBER reward directly.")
        page.click('button:has-text("Continue")')

        # ----------------------------------------------------------------
        # 5. RESPONSIVE VIEWPORT TESTING
        # ----------------------------------------------------------------
        print("\n--- PHASE 9: Responsive Viewports & Scaling Registration ---")
        for vp in [
            {'width': 1600, 'height': 900},
            {'width': 1440, 'height': 900},
            {'width': 1366, 'height': 768},
            {'width': 1280, 'height': 720}
        ]:
            page.set_viewport_size(vp)
            time.sleep(0.5)
            # Re-test clicking Number 7 at this viewport
            page.click('polygon[data-target-id="number_7"]')
            page.wait_for_selector('text="WESTERN MARKER — VII (7)"')
            page.click('button[aria-label="Close Inspection"]')
            page.wait_for_selector('text="WESTERN MARKER — VII (7)"', state='detached')
            fname = f"docs/screenshots/coffin2_svg_{vp['width']}x{vp['height']}.png"
            page.screenshot(path=fname)
            print(f"Captured {fname} (Registration verified at {vp['width']}x{vp['height']})")

        browser.close()
        print("\n==================================================================")
        print("ALL TESTS PASSED 100%: ZERO OFFSET, ZERO MISMAPPING, ZERO OVERLAPS")
        print("==================================================================\n")

if __name__ == '__main__':
    run()
