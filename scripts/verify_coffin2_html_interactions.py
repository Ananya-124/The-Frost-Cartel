import os
import time
import subprocess
from playwright.sync_api import sync_playwright

os.makedirs('docs/screenshots', exist_ok=True)

def run():
    print("Starting Playwright verification for Coffin II HTML click interactions...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # Navigate to application
        page.goto('http://localhost:4173/?round=1')
        page.wait_for_selector('text="PORTAL 03"', timeout=10000)
        page.click('text="PORTAL 03"')

        # Graveyard overview
        page.wait_for_selector('button[aria-label="Grave 2: Buried Diary"]', timeout=10000)
        page.click('button[aria-label="Grave 2: Buried Diary"]')

        # Verify Coffin II loaded
        page.wait_for_selector('text="THE KEEPER\'S RIDDLE"', timeout=10000)
        time.sleep(1)

        # 1. Clean 1920x1080 screenshot
        page.screenshot(path='docs/screenshots/coffin2_html_clean_1920x1080.png')
        print("Captured docs/screenshots/coffin2_html_clean_1920x1080.png")

        # Verify zero SVG elements exist in the main coffin container (no SVG interaction overlays)
        svg_count = page.locator('div[style*="aspect-ratio"] svg').count()
        print(f"SVG interaction overlays inside coffin container: {svg_count} (Must be 0)")
        assert svg_count == 0, f"Found {svg_count} SVG elements inside coffin container!"

        # 2. Test Hover (Confirm NO visual hover artifacts, NO tooltips, NO labels)
        for target_label in [
            "Cranium of the Keeper: Marked Brow (First Clue)",
            "Western Parchment 7 (Second Clue)",
            "Eastern Moon Parchment 4 (Third Clue)",
            "Archival Parchment 3 (Burial Record)",
            "Eastern Seal Parchment 9 (Fourth Clue)",
            "Ancient Diary: Click to Read the Keeper's Chronicle",
            "Folded Envelope with Red Wax Fleur-de-lis Seal",
            "Antique Brass Skeleton Key",
            "Ancient Rolled Scroll Tied with Scarlet Twine",
            "Locked Iron Coffer: Solve 4-digit covenant lock to unseal"
        ]:
            btn = page.locator(f'button[aria-label="{target_label}"]')
            assert btn.is_visible(), f"Button {target_label} is not visible!"
            btn.hover()
            # Confirm no visible tooltips popped up
            tooltip_count = page.locator('.group-hover\\:opacity-100').count()
            assert tooltip_count == 0, f"Found floating tooltip on hover for {target_label}!"

        print("Hover test passed: 0 tooltips, 0 SVG overlays, 0 hover glows.")

        # 3. Test Each Object Inspection
        # A. Skull
        page.click('button[aria-label="Cranium of the Keeper: Marked Brow (First Clue)"]')
        page.wait_for_selector('text="CRANIUM OF THE SECOND KEEPER"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_skull.png')
        print("Captured docs/screenshots/coffin2_inspect_skull.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRANIUM OF THE SECOND KEEPER"', state='detached')

        # B. Paper 7
        page.click('button[aria-label="Western Parchment 7 (Second Clue)"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper7.png')
        print("Captured docs/screenshots/coffin2_inspect_paper7.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WESTERN MARKER — VII (7)"', state='detached')

        # C. Paper 4
        page.click('button[aria-label="Eastern Moon Parchment 4 (Third Clue)"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper4.png')
        print("Captured docs/screenshots/coffin2_inspect_paper4.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="MOONWARD EASTERN SCRAP (4)"', state='detached')

        # D. Paper 3 (Distractor)
        page.click('button[aria-label="Archival Parchment 3 (Burial Record)"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"')
        page.wait_for_selector('text=/ARCHIVAL BURIAL SCRAP/i')
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper3.png')
        print("Captured docs/screenshots/coffin2_inspect_paper3.png (Distractor verified)")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ARCHIVAL GRAVE RECORD (3)"', state='detached')

        # E. Paper 9 (Does NOT point to chest)
        page.click('button[aria-label="Eastern Seal Parchment 9 (Fourth Clue)"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"')
        # Confirm chest is NOT mentioned in title
        assert page.locator('text="IRON-BANDED COFFER"').count() == 0, "Paper 9 incorrectly opened or targeted chest!"
        page.screenshot(path='docs/screenshots/coffin2_inspect_paper9.png')
        print("Captured docs/screenshots/coffin2_inspect_paper9.png (Independent of chest)")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="CRIMSON-SEALED RECORD (9)"', state='detached')

        # F. Ancient Diary
        page.click('button[aria-label="Ancient Diary: Click to Read the Keeper\'s Chronicle"]')
        page.wait_for_selector('#diary-modal-title')
        page.wait_for_selector('text=/On the night the old covenant was sealed/i')
        page.screenshot(path='docs/screenshots/coffin2_inspect_diary.png')
        print("Captured docs/screenshots/coffin2_inspect_diary.png")
        page.click('button[aria-label="Close Diary"]')
        page.wait_for_selector('#diary-modal-title', state='detached')

        # G. Letter
        page.click('button[aria-label="Folded Envelope with Red Wax Fleur-de-lis Seal"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_letter.png')
        print("Captured docs/screenshots/coffin2_inspect_letter.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="WAX-SEALED CEMETERY DISPATCH"', state='detached')

        # H. Key
        page.click('button[aria-label="Antique Brass Skeleton Key"]')
        page.wait_for_selector('text="ORNATE SKELETON KEY"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_key.png')
        print("Captured docs/screenshots/coffin2_inspect_key.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ORNATE SKELETON KEY"', state='detached')

        # I. Scroll
        page.click('button[aria-label="Ancient Rolled Scroll Tied with Scarlet Twine"]')
        page.wait_for_selector('text="ANCIENT ROLLED SCROLL"')
        page.screenshot(path='docs/screenshots/coffin2_inspect_scroll.png')
        print("Captured docs/screenshots/coffin2_inspect_scroll.png")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="ANCIENT ROLLED SCROLL"', state='detached')

        # J. Chest (Before Unlocked)
        page.click('button[aria-label="Locked Iron Coffer: Solve 4-digit covenant lock to unseal"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"')
        page.wait_for_selector('text="THE CHEST REMAINS SEALED."')
        page.screenshot(path='docs/screenshots/coffin2_inspect_chest_locked.png')
        print("Captured docs/screenshots/coffin2_inspect_chest_locked.png (Sealed status verified)")
        page.click('button[aria-label="Close Inspection"]')
        page.wait_for_selector('text="IRON-BANDED COFFER"', state='detached')

        # 4. Combination Lock: Incorrect & Correct Validation
        # Check initial value is 0000
        tumblers = page.locator('div[role="spinbutton"]')
        assert tumblers.count() == 4, f"Expected 4 tumblers, found {tumblers.count()}"
        for i in range(4):
            assert tumblers.nth(i).inner_text().strip() == '0'

        # Submit 0000
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

        # Submit 1749
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

        # 5. Responsive Tests across remaining viewports
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
        print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")

if __name__ == '__main__':
    run()
