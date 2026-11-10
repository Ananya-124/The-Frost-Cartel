import asyncio
import os
from playwright.async_api import async_playwright

VIEWPORTS = [
    {"name": "1280x720", "width": 1280, "height": 720},
    {"name": "1366x768", "width": 1366, "height": 768},
    {"name": "1440x900", "width": 1440, "height": 900},
    {"name": "1920x1080", "width": 1920, "height": 1080},
]

async def run_verification():
    os.makedirs("docs/screenshots/stage2", exist_ok=True)
    
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        
        for vp in VIEWPORTS:
            print(f"\n==========================================")
            print(f"Testing Apothecary Potion at: {vp['name']} ({vp['width']}x{vp['height']})")
            print(f"==========================================")
            
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
            # Navigate to the app with query params to land on round 1 stage 2
            await page.goto("http://localhost:5173/?round=1&stage=2", wait_until="domcontentloaded")
            await page.wait_for_timeout(1000)
            
            # If landed on Home or Round 1, navigate to Stage 2
            apothecary_card = page.locator("text=The Alchemist's Crypt").first
            if not await apothecary_card.is_visible():
                enter_r1 = page.locator("button:has-text('ENTER ROUND 01')").first
                if await enter_r1.is_visible():
                    await enter_r1.click()
                    await page.wait_for_timeout(500)
                
                stage2_btn = page.locator("text=THE HAUNTED IMAGE HUNT").first
                if await stage2_btn.is_visible():
                    await stage2_btn.click()
                    await page.wait_for_timeout(500)
            
            # Click on "The Alchemist's Crypt" photograph card
            print("1. Opening 'The Alchemist\\'s Crypt' photo...")
            apothecary_photo = page.locator("text=The Alchemist's Crypt").first
            await apothecary_photo.click()
            await page.wait_for_timeout(800)
            
            # Verify Inspection Viewer is open
            viewer_title = page.locator("text=INSPECTION VIEWER • The Alchemist's Crypt")
            assert await viewer_title.is_visible(), "Inspection Viewer title not visible!"
            print("✓ Inspection Viewer is open.")
            
            # Check image source and natural dimensions inside dialog
            img_elem = page.locator("dialog img[alt=\"The Alchemist's Crypt\"]")
            assert await img_elem.is_visible(), "Image element not visible!"
            src = await img_elem.get_attribute("src")
            print(f"✓ Image src: {src}")
            assert "apothecary-hidden-potion-master.webp" in src or "alchemists-crypt.jpg" in src, f"Unexpected image source: {src}"
            
            natural_size = await img_elem.evaluate("el => ({ width: el.naturalWidth, height: el.naturalHeight })")
            print(f"✓ Natural Image Dimensions: {natural_size['width']} x {natural_size['height']}")
            assert natural_size["width"] == 1024, f"Expected natural width 1024, got {natural_size['width']}"
            assert natural_size["height"] == 561, f"Expected natural height 561, got {natural_size['height']}"
            
            # Verify SVG viewBox matches image natural dimensions
            svg_elem = page.locator("dialog svg[viewBox='0 0 1024 561']")
            assert await svg_elem.is_visible(), "SVG overlay viewBox 0 0 1024 561 not found!"
            print("✓ SVG overlay viewBox matches exact 1024 x 561 dimensions.")
            
            # Check that hit path is present but completely invisible (0 opacity)
            hit_potion = page.locator("#hit_hs_potion")
            assert await hit_potion.is_visible(), "Hit path #hit_hs_potion not present!"
            opacity = await hit_potion.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"✓ Hit path pre-discovery opacity: {opacity} (must be 0)")
            assert float(opacity) == 0.0, "Potion bottle must have 0 opacity before discovery!"
            
            # Verify no golden outline exists before discovery
            gold_paths_before = await page.locator("dialog svg path[stroke='#fbbf24']").count()
            assert gold_paths_before == 0, f"Expected 0 golden outlines before discovery, found {gold_paths_before}"
            print("✓ 0 golden outlines before discovery verified.")
            
            # Take pre-discovery screenshot
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/apothecary_pre_discovery.png")
                print("✓ Saved pre-discovery screenshot.")
            
            # Test missed click: click neighboring dark bottle (x: ~320, y: ~270 in SVG space)
            print("2. Testing missed click on neighboring bottle/desk...")
            svg_box = await svg_elem.bounding_box()
            assert svg_box is not None, "SVG bounding box not found!"
            
            # Click near far right (x: 80% width, y: 50% height)
            await page.mouse.click(svg_box["x"] + svg_box["width"] * 0.8, svg_box["y"] + svg_box["height"] * 0.5)
            await page.wait_for_timeout(300)
            
            # Visual path should still NOT be present
            visual_potion = page.locator("#visual_hs_potion")
            assert not await visual_potion.is_visible(), "Visual outline showed up on missed click!"
            print("✓ Missed click on background correctly ignored.")
            
            # Test Zoom In (1.5x -> 2x)
            print("3. Testing Zoom Controls...")
            zoom_in_btn = page.locator("button[aria-label='Zoom In']")
            await zoom_in_btn.click() # 1.5x
            await page.wait_for_timeout(300)
            await zoom_in_btn.click() # 2x
            await page.wait_for_timeout(300)
            
            zoom_text = await page.locator("span.font-mono:has-text('%')").inner_text()
            print(f"✓ Zoom level: {zoom_text}")
            assert "200%" in zoom_text or "150%" in zoom_text, f"Unexpected zoom: {zoom_text}"
            
            # Click the Potion bottle hit area while zoomed
            print("4. Clicking Potion Bottle hit area to discover...")
            await hit_potion.click(force=True)
            await page.wait_for_timeout(1000)
            
            # Visual outline and checkmark badge must now be visible!
            assert await visual_potion.is_visible(), "Visual golden outline #visual_hs_potion NOT visible after click!"
            print("✓ Golden visual outline is visible!")
            
            stroke = await visual_potion.get_attribute("stroke")
            print(f"✓ Outline stroke: {stroke}")
            assert stroke == "#fbbf24", f"Expected antique gold stroke, got {stroke}"
            
            filter_attr = await visual_potion.get_attribute("filter")
            print(f"✓ Outline filter: {filter_attr}")
            assert "gold-glow" in str(filter_attr), f"Expected gold-glow filter, got {filter_attr}"
            
            # Checkmark badge
            checkmark = page.locator("text=✓").first
            assert await checkmark.is_visible(), "Checkmark badge NOT visible after discovery!"
            print("✓ Checkmark badge visible!")
            
            # Take post-discovery screenshots
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/apothecary_discovered_zoom.png")
                
                # Reset zoom
                reset_btn = page.locator("button[aria-label='Reset Zoom']")
                await reset_btn.click()
                await page.wait_for_timeout(500)
                await page.screenshot(path="docs/screenshots/stage2/apothecary_discovered_normal.png")
                print("✓ Saved post-discovery screenshots.")
            
            # Close inspector
            back_btn = page.locator("button:has-text('Back to Evidence Table')")
            await back_btn.click()
            await page.wait_for_timeout(500)
            
            # Verify found counter updated
            found_count = page.locator("text=/\\b[1-9][0-9]*\\s*\\/\\s*12/").first
            assert await found_count.is_visible(), "Found counter not visible on evidence table!"
            count_text = await found_count.inner_text()
            print(f"✓ Relic checklist updated on evidence table: {count_text}")
            
            await context.close()
            print(f"✓ Viewport {vp['name']} PASSED 100%!")
        
        await browser.close()
    print("\nALL 4 VIEWPORTS & APOTHECARY INTERACTION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(run_verification())
