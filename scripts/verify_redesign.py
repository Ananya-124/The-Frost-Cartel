import asyncio
from playwright.async_api import async_playwright
import shutil
import os

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        # Match desktop reference
        context = await browser.new_context(viewport={'width': 1440, 'height': 850})
        page = await context.new_page()
        
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
        await page.wait_for_timeout(3600) # wait for blur crossfade into college
        
        # Capture 1: Redesigned College Floor Selection Screen (Default idle)
        path1 = 'public/assets/round-04/verify_redesign_idle.png'
        await page.screenshot(path=path1)
        print(f"Captured {path1}")
        
        # Capture 2: Hover Fifth Floor (matching reference image)
        floor5 = page.locator('g[data-floor-id="floor-5"]')
        await floor5.hover()
        await page.wait_for_timeout(400)
        path2 = 'public/assets/round-04/verify_redesign_floor5_hover.png'
        await page.screenshot(path=path2)
        print(f"Captured {path2}")
        
        # Capture 3: Hover Seventh Floor
        floor7 = page.locator('g[data-floor-id="floor-7"]')
        await floor7.hover()
        await page.wait_for_timeout(400)
        path3 = 'public/assets/round-04/verify_redesign_floor7_hover.png'
        await page.screenshot(path=path3)
        print(f"Captured {path3}")

        # Capture 4: Hover Ground Floor
        floorG = page.locator('g[data-floor-id="floor-G"]')
        await floorG.hover()
        await page.wait_for_timeout(400)
        path4 = 'public/assets/round-04/verify_redesign_ground_hover.png'
        await page.screenshot(path=path4)
        print(f"Captured {path4}")

        # Click Fifth Floor to test drone approach
        await floor5.click()
        await page.wait_for_timeout(1200)
        path5 = 'public/assets/round-04/verify_redesign_drone_approach.png'
        await page.screenshot(path=path5)
        print(f"Captured {path5}")

        # Copy to artifact directory
        for p_img in [path1, path2, path3, path4, path5]:
            fname = os.path.basename(p_img)
            shutil.copy(p_img, os.path.join(ARTIFACT_DIR, fname))

        await browser.close()
        print("All verification screenshots captured and copied to artifact directory.")

if __name__ == '__main__':
    asyncio.run(run())

