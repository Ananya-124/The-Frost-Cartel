import asyncio
from playwright.async_api import async_playwright
import shutil
import os

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # 1. Capture primary states at 1440x900
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        print("Navigating to Homepage...")
        await page.goto('http://127.0.0.1:5173/')
        await page.wait_for_timeout(1000)
        
        # Enter Round 04
        await page.click('button:has-text("ENTER ROUND 04")')
        await page.wait_for_timeout(3200)
        
        # Open ancient letter
        await page.click('button[aria-label="OPEN THE ANCIENT LETTER"]')
        await page.wait_for_timeout(600)
        
        # Click BEGIN THE HUNT
        await page.click('button[aria-label="Begin the hunt through time and space"]')
        await page.wait_for_timeout(3600) # wait for blur crossfade into college
        
        # Move mouse out of building area to ensure resting state
        await page.mouse.move(10, 10)
        await page.wait_for_timeout(600)

        # Capture 0: Resting state showing clean pristine building without any white debug overlays
        p_resting = 'public/assets/round-04/verify_resting_white_layers.png'
        p_final_idle = 'public/assets/round-04/verify_final_redesign_idle.png'
        await page.screenshot(path=p_resting)
        await page.screenshot(path=p_final_idle)
        print(f"Captured {p_resting} and {p_final_idle}")

        # Capture 1: Floor 7 hovered state
        floor7 = page.locator('g[data-floor-id="floor-7"]')
        await floor7.hover()
        await page.wait_for_timeout(500)
        p_f7 = 'public/assets/round-04/verify_floor7_hovered.png'
        await page.screenshot(path=p_f7)
        print(f"Captured {p_f7}")

        # Capture 2: Fifth Floor hovered state showing the exact curved floor region highlight
        floor5 = page.locator('g[data-floor-id="floor-5"]')
        await floor5.hover()
        await page.wait_for_timeout(500)
        p_f5 = 'public/assets/round-04/verify_floor5_hovered.png'
        await page.screenshot(path=p_f5)
        print(f"Captured {p_f5}")
        
        # Capture 2: Third Floor hovered state showing its curved highlight
        floor3 = page.locator('g[data-floor-id="floor-3"]')
        await floor3.hover()
        await page.wait_for_timeout(500)
        p_f3 = 'public/assets/round-04/verify_floor3_hovered.png'
        await page.screenshot(path=p_f3)
        print(f"Captured {p_f3}")
        
        # Capture 3: Ground Floor hovered state showing its curved highlight
        floorG = page.locator('g[data-floor-id="floor-G"]')
        await floorG.hover()
        await page.wait_for_timeout(500)
        p_fg = 'public/assets/round-04/verify_ground_hovered.png'
        await page.screenshot(path=p_fg)
        print(f"Captured {p_fg}")
        
        # Capture 4: Floor clicked state during cinematic camera zoom (clicking Fifth Floor)
        await floor5.hover()
        await page.wait_for_timeout(300)
        await floor5.click()
        await page.wait_for_timeout(1100) # in the middle of drone camera approach
        p_click = 'public/assets/round-04/verify_floor5_camera_zoom.png'
        await page.screenshot(path=p_click)
        print(f"Captured {p_click}")
        
        await context.close()
        
        # 2. Capture responsive alignment across the 4 specified viewports
        viewports = [
            (1280, 720, '1280x720'),
            (1366, 768, '1366x768'),
            (1440, 900, '1440x900'),
            (1920, 1080, '1920x1080'),
        ]
        
        resp_paths = []
        for w, h, label in viewports:
            ctx = await browser.new_context(viewport={'width': w, 'height': h})
            pg = await ctx.new_page()
            await pg.goto('http://127.0.0.1:5173/')
            await pg.wait_for_timeout(800)
            await pg.click('button:has-text("ENTER ROUND 04")')
            await pg.wait_for_timeout(3000)
            await pg.click('button[aria-label="OPEN THE ANCIENT LETTER"]')
            await pg.wait_for_timeout(500)
            await pg.click('button[aria-label="Begin the hunt through time and space"]')
            await pg.wait_for_timeout(3500)
            
            # Hover Floor 5 to show exact overlay alignment at this viewport
            f5 = pg.locator('g[data-floor-id="floor-5"]')
            await f5.hover()
            await pg.wait_for_timeout(400)
            
            p_vp = f'public/assets/round-04/verify_viewport_{label}.png'
            await pg.screenshot(path=p_vp)
            resp_paths.append(p_vp)
            print(f"Captured {p_vp}")
            await ctx.close()
            
        # Copy all captures to artifact dir
        all_imgs = [p_resting, p_final_idle, p_f7, p_f5, p_f3, p_fg, p_click] + resp_paths
        for img in all_imgs:
            fname = os.path.basename(img)
            shutil.copy(img, os.path.join(ARTIFACT_DIR, fname))
            
        await browser.close()
        print("All verification screenshots successfully captured and copied to artifact dir.")

if __name__ == '__main__':
    asyncio.run(run())

