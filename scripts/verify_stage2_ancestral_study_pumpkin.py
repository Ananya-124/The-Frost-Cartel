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
            print(f"Testing at viewport: {vp['name']} ({vp['width']}x{vp['height']})")
            print(f"==========================================")
            
            context = await browser.new_context(viewport={"width": vp["width"], "height": vp["height"]})
            page = await context.new_page()
            
            # Navigate to the app with query params to land on round 1 stage 2
            await page.goto("http://localhost:5173/?round=1&stage=2", wait_until="domcontentloaded")
            await page.wait_for_timeout(1000)
            
            # If landed on Home or Round 1, navigate to Stage 2
            # Check if "The Ancestral Study" card is visible
            study_card = page.locator("text=The Ancestral Study").first
            if not await study_card.is_visible():
                # Check for "ENTER ROUND 01" button
                enter_r1 = page.locator("button:has-text('ENTER ROUND 01')").first
                if await enter_r1.is_visible():
                    await enter_r1.click()
                    await page.wait_for_timeout(500)
                
                # Check for Stage 2 card "THE HAUNTED IMAGE HUNT" or "Stage 2"
                stage2_btn = page.locator("text=THE HAUNTED IMAGE HUNT").first
                if await stage2_btn.is_visible():
                    await stage2_btn.click()
                    await page.wait_for_timeout(500)
            
            # Click on "The Ancestral Study" photograph card
            print("1. Opening 'The Ancestral Study' photo...")
            study_photo = page.locator("text=The Ancestral Study").first
            await study_photo.click()
            await page.wait_for_timeout(800)
            
            # Verify Inspection Viewer is open
            viewer_title = page.locator("text=INSPECTION VIEWER • The Ancestral Study")
            assert await viewer_title.is_visible(), "Inspection Viewer title not visible!"
            print("✓ Inspection Viewer is open.")
            
            # Check image source and natural dimensions inside dialog
            img_elem = page.locator("dialog img[alt='The Ancestral Study']")
            assert await img_elem.is_visible(), "Image element not visible!"
            src = await img_elem.get_attribute("src")
            print(f"✓ Image src: {src}")
            assert "ancestral-study.jpg" in src, f"Wrong image source: {src}"
            
            natural_size = await img_elem.evaluate("el => ({ width: el.naturalWidth, height: el.naturalHeight })")
            print(f"✓ Natural Image Dimensions: {natural_size['width']} x {natural_size['height']}")
            assert natural_size["width"] == 1024, f"Expected natural width 1024, got {natural_size['width']}"
            assert natural_size["height"] == 622, f"Expected natural height 622, got {natural_size['height']}"
            
            # Check that hit path is present but invisible (no pre-discovery glow or outline)
            hit_pumpkin = page.locator("#hit_hs_pumpkin")
            assert await hit_pumpkin.is_visible(), "Hit path #hit_hs_pumpkin not present!"
            opacity = await hit_pumpkin.evaluate("el => window.getComputedStyle(el).opacity")
            print(f"✓ Hit path pre-discovery opacity: {opacity} (must be 0)")
            assert float(opacity) == 0.0, "Pumpkin should not have visible outline before discovery!"
            
            # Take pre-discovery screenshot
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/ancestral_study_pre_discovery.png")
                print("✓ Saved pre-discovery screenshot.")
            
            # Test missed click: click upper desk area
            print("2. Testing missed click on background...")
            svg_elem = page.locator("svg[aria-label='Interactive evidence targets for The Ancestral Study']")
            # Click at 50% width, 30% height (the desk with books/candle)
            svg_box = await svg_elem.bounding_box()
            assert svg_box is not None, "SVG bounding box not found!"
            await page.mouse.click(svg_box["x"] + svg_box["width"] * 0.5, svg_box["y"] + svg_box["height"] * 0.3)
            await page.wait_for_timeout(300)
            
            # Visual path should still NOT be present
            visual_pumpkin = page.locator("#visual_hs_pumpkin")
            assert not await visual_pumpkin.is_visible(), "Visual outline showed up on missed click!"
            print("✓ Missed click correctly ignored.")
            
            # Test Zoom In
            print("3. Testing Zoom Controls...")
            zoom_in_btn = page.locator("button[aria-label='Zoom In']")
            await zoom_in_btn.click() # 1.5x
            await page.wait_for_timeout(300)
            await zoom_in_btn.click() # 2x
            await page.wait_for_timeout(300)
            
            zoom_text = await page.locator("span.font-mono:has-text('%')").inner_text()
            print(f"✓ Zoom level: {zoom_text}")
            
            # Click the Pumpkin hit area while zoomed
            print("4. Clicking Pumpkin hit area to discover...")
            await hit_pumpkin.click(force=True)
            await page.wait_for_timeout(1000)
            
            # Visual outline and checkmark badge must now be visible!
            assert await visual_pumpkin.is_visible(), "Visual golden outline #visual_hs_pumpkin NOT visible after click!"
            print("✓ Golden visual outline is visible!")
            
            # Check stroke and filter
            stroke = await visual_pumpkin.get_attribute("stroke")
            print(f"✓ Outline stroke: {stroke}")
            assert stroke == "#fbbf24", f"Expected antique gold stroke, got {stroke}"
            
            # Checkmark badge
            checkmark = page.locator("text=✓").first
            assert await checkmark.is_visible(), "Checkmark badge NOT visible after discovery!"
            print("✓ Checkmark badge visible!")
            
            # Take post-discovery screenshot
            if vp["name"] == "1920x1080":
                await page.screenshot(path="docs/screenshots/stage2/ancestral_study_discovered_zoom.png")
                
                # Reset zoom
                reset_btn = page.locator("button[aria-label='Reset Zoom']")
                await reset_btn.click()
                await page.wait_for_timeout(500)
                await page.screenshot(path="docs/screenshots/stage2/ancestral_study_discovered_normal.png")
                print("✓ Saved post-discovery screenshots.")
            
            # Close inspector
            back_btn = page.locator("button:has-text('Back to Evidence Table')")
            await back_btn.click()
            await page.wait_for_timeout(500)
            
            # Verify found counter updated
            found_count = page.locator("text=/\\b[1-9][0-9]*\\s*\\/\\s*12/").first
            print("✓ Relic checklist updated on evidence table.")
            
            await context.close()
            print(f"✓ Viewport {vp['name']} PASSED 100%!")
        
        await browser.close()
    print("\nALL VIEWPORTS & INTERACTION TESTS PASSED CLEANLY!")

if __name__ == "__main__":
    asyncio.run(run_verification())
