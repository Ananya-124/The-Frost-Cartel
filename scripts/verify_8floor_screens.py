import asyncio
from playwright.async_api import async_playwright
import shutil
import os

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        # 1. Direct navigate to college building with calibration query or through normal flow
        print("Navigating to Homepage...")
        await page.goto('http://127.0.0.1:5173/')
        await page.wait_for_timeout(1000)
        
        # Click Round 04 portal
        await page.click('button:has-text("ENTER ROUND 04")')
        await page.wait_for_timeout(3200)
        
        # Open letter
        await page.click('button[aria-label="OPEN THE ANCIENT LETTER"]')
        await page.wait_for_timeout(600)
        
        # Click BEGIN THE HUNT
        await page.click('button[aria-label="Begin the hunt through time and space"]')
        await page.wait_for_timeout(3500) # wait for blur crossfade into college
        
        # Capture 1: College Building 8-Floor View (1440x900)
        path1 = 'public/assets/round-4/verify_8floor_college_1440.png'
        await page.screenshot(path=path1)
        print(f"Captured {path1}")
        
        # Capture 2: Hover Seventh Floor (07)
        seventh = page.locator('g[data-floor-id="floor-7"]')
        await seventh.hover()
        await page.wait_for_timeout(400)
        path2 = 'public/assets/round-4/verify_8floor_hover_floor7.png'
        await page.screenshot(path=path2)
        print(f"Captured {path2}")
        
        # Capture 3: Hover Fourth Floor (04)
        fourth = page.locator('g[data-floor-id="floor-4"]')
        await fourth.hover()
        await page.wait_for_timeout(400)
        path3 = 'public/assets/round-4/verify_8floor_hover_floor4.png'
        await page.screenshot(path=path3)
        print(f"Captured {path3}")

        # Capture 4: Hover Ground Floor (G)
        ground = page.locator('g[data-floor-id="floor-G"]')
        await ground.hover()
        await page.wait_for_timeout(400)
        path4 = 'public/assets/round-4/verify_8floor_hover_ground.png'
        await page.screenshot(path=path4)
        print(f"Captured {path4}")

        # Click Seventh Floor to trigger Drone Approach and Window Transition
        await seventh.click()
        await page.wait_for_timeout(1200) # During drone zoom
        path5 = 'public/assets/round-4/verify_8floor_drone_zoom.png'
        await page.screenshot(path=path5)
        print(f"Captured {path5}")
        
        await page.wait_for_timeout(1200) # Window opening
        path6 = 'public/assets/round-4/verify_8floor_window_open.png'
        await page.screenshot(path=path6)
        print(f"Captured {path6}")
        
        await page.wait_for_timeout(2000) # Interior reveal
        path7 = 'public/assets/round-4/verify_8floor_interior_ancient_map.png'
        await page.screenshot(path=path7)
        print(f"Captured {path7}")
        
        # Return to exterior
        await page.click('button:has-text("Return to Exterior")')
        await page.wait_for_timeout(600)
        
        # Open calibration tool with query param
        await page.goto('http://127.0.0.1:5173/?calibrate=true')
        await page.wait_for_timeout(1000)
        # Click enter round 4 -> open letter -> begin hunt with calibrate mode
        await page.click('button:has-text("ENTER ROUND 04")')
        await page.wait_for_timeout(3200)
        await page.click('button[aria-label="OPEN THE ANCIENT LETTER"]')
        await page.wait_for_timeout(600)
        await page.click('button[aria-label="Begin the hunt through time and space"]')
        await page.wait_for_timeout(3500)
        
        path8 = 'public/assets/round-4/verify_8floor_calibration_tool.png'
        await page.screenshot(path=path8)
        print(f"Captured {path8}")
        
        # Responsive check at 1280x720
        await page.set_viewport_size({'width': 1280, 'height': 720})
        await page.wait_for_timeout(500)
        path9 = 'public/assets/round-4/verify_8floor_college_1280.png'
        await page.screenshot(path=path9)
        print(f"Captured {path9}")

        await browser.close()
        
        # Copy to artifact directory
        all_files = [
            'verify_8floor_college_1440.png',
            'verify_8floor_hover_floor7.png',
            'verify_8floor_hover_floor4.png',
            'verify_8floor_hover_ground.png',
            'verify_8floor_drone_zoom.png',
            'verify_8floor_window_open.png',
            'verify_8floor_interior_ancient_map.png',
            'verify_8floor_calibration_tool.png',
            'verify_8floor_college_1280.png'
        ]
        for fn in all_files:
            src = os.path.join('public/assets/round-4', fn)
            dst = os.path.join(ARTIFACT_DIR, fn)
            if os.path.exists(src):
                shutil.copyfile(src, dst)
                print(f"Copied {fn} to artifact directory")

if __name__ == '__main__':
    asyncio.run(run())
