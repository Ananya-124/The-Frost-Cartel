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
            print(f"Testing Mausoleum Vault Skull at: {vp['name']} ({vp['width']}x{vp['height']})")
            print(f"==========================================")
            
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
            # Navigate to the app with query params to land on round 1 stage 2
            await page.goto("http://localhost:5173/?round=1&stage=2", wait_until="domcontentloaded")
            await page.wait_for_timeout(1000)
            
            # If landed on Home or Round 1, navigate to Stage 2
            mausoleum_card = page.locator("text=The Mausoleum Vault").first
            if not await mausoleum_card.is_visible():
                enter_r1 = page.locator("button:has-text('ENTER ROUND 01')").first
                if await enter_r1.is_visible():
                    await enter_r1.click()
                    await page.wait_for_timeout(500)
                
                stage2_btn = page.locator("text=THE HAUNTED IMAGE HUNT").first
                if await stage2_btn.is_visible():
                    await stage2_btn.click()
                    await page.wait_for_timeout(500)
            
            # Click on "The Mausoleum Vault" photograph card
            print("1. Opening 'The Mausoleum Vault' photo...")
            mausoleum_photo = page.locator("text=The Mausoleum Vault").first
            await mausoleum_photo.click()
            await page.wait_for_timeout(800)
            
            # Verify Inspection Viewer is open
            viewer_title = page.locator("text=INSPECTION VIEWER • The Mausoleum Vault")
            assert await viewer_title.is_visible(), "Inspection Viewer title not visible!"
            print("✓ Inspection Viewer is open.")
            
            # Check image source and natural dimensions inside dialog
            img_elem = page.locator("dialog img[alt=\"The Mausoleum Vault\"]")
            assert await img_elem.is_visible(), "Image element not visible!"
            src = await img_elem.get_attribute("src")
            print(f"✓ Image src: {src}")
            assert "mausoleum-vault-master.webp" in src or "mausoleum-vault.jpg" in src, f"Unexpected image source: {src}"
            
            natural_size = await img_elem.evaluate("el => ({ width: el.naturalWidth, height: el.naturalHeight })")
            print(f"✓ Natural Image Dimensions: {natural_size['width']} x {natural_size['height']}")
            assert natural_size["width"] == 1024, f"Expected natural width 1024, got {natural_size['width']}"
            assert natural_size["height"] == 620, f"Expected natural height 620, got {natural_size['height']}"
            
            # Verify SVG viewBox matches image natural dimensions
            svg_elem = page.locator("dialog svg[viewBox='0 0 1024 620']")
            assert await svg_elem.is_visible(), "SVG overlay viewBox 0 0 1024 620 not found!"
            print("✓ SVG overlay viewBox matches exact 1024 x 620 dimensions.")
            
            # Check that skull hit path is present but completely invisible (0 opacity)
            hit_skull = page.locator("#hit_hs_skull")
            assert await hit_skull.is_visible(), "Hit path #hit_hs_skull not present!"
            opacity = await hit_skull.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"✓ Skull hit path pre-discovery opacity: {opacity} (must be 0)")
            assert float(opacity) == 0.0, "Skull must have 0 opacity before discovery!"
            
            # Verify no golden outline exists on skull before discovery
            gold_skull_before = await page.locator("#visual_hs_skull").count()
            assert gold_skull_before == 0, f"Expected 0 golden outline for skull before discovery, found {gold_skull_before}"
            print("✓ 0 golden outlines before discovery verified.")
            
            # Take pre-discovery screenshot
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/mausoleum_vault_pre_discovery.png")
                print("✓ Saved pre-discovery screenshot.")
            
            # Test missed click: click hanging burgundy cloth to the left of the skull (x: ~210, y: ~550 in SVG space)
            print("2. Testing missed click on hanging cloth / background...")
            svg_box = await svg_elem.bounding_box()
            assert svg_box is not None, "SVG bounding box not found!"
            
            # Click hanging cloth at 20% width, 88% height
            await page.mouse.click(svg_box["x"] + svg_box["width"] * 0.20, svg_box["y"] + svg_box["height"] * 0.88)
            await page.wait_for_timeout(300)
            
            # Visual path for skull should still NOT be present
            visual_skull = page.locator("#visual_hs_skull")
            assert not await visual_skull.is_visible(), "Visual skull outline showed up on cloth click!"
            print("✓ Missed click on hanging cloth correctly ignored.")
            
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
            
            # Click the Skull hit area while zoomed
            print("4. Clicking Skull hit area to discover...")
            await hit_skull.click(force=True)
            await page.wait_for_timeout(1000)
            
            # Visual outline and checkmark badge must now be visible!
            assert await visual_skull.is_visible(), "Visual golden outline #visual_hs_skull NOT visible after click!"
            print("✓ Golden visual outline is visible!")
            
            stroke = await visual_skull.get_attribute("stroke")
            print(f"✓ Outline stroke: {stroke}")
            assert stroke == "#fbbf24", f"Expected antique gold stroke, got {stroke}"
            
            filter_attr = await visual_skull.get_attribute("filter")
            print(f"✓ Outline filter: {filter_attr}")
            assert "gold-glow" in str(filter_attr), f"Expected gold-glow filter, got {filter_attr}"
            
            # Checkmark badge
            checkmark = page.locator("text=✓").first
            assert await checkmark.is_visible(), "Checkmark badge NOT visible after discovery!"
            print("✓ Checkmark badge visible!")
            
            # Take post-discovery screenshots
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/mausoleum_vault_discovered_zoom.png")
                
                # Reset zoom
                reset_btn = page.locator("button[aria-label='Reset Zoom']")
                await reset_btn.click()
                await page.wait_for_timeout(500)
                await page.screenshot(path="docs/screenshots/stage2/mausoleum_vault_discovered_normal.png")
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
    print("\nALL 4 VIEWPORTS & MAUSOLEUM SKULL INTERACTION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(run_verification())
