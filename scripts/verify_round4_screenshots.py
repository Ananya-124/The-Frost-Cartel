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
        
        # 1. Homepage with 4 Circular Portals and clean top-right nav (no separate Round 04 button)
        await page.goto('http://127.0.0.1:5173/')
        await page.wait_for_timeout(1500)
        homepage_path = 'public/assets/round-4/verify_homepage_4portals.png'
        await page.screenshot(path=homepage_path)
        print(f"Captured {homepage_path}")

        # 2. Click the Round 4 portal (THE RADIANT TREASURE HUNT)
        await page.click('button:has-text("ENTER ROUND 04")')
        await page.wait_for_timeout(3200) # Dove flight & letter landing
        
        arrival_path = 'public/assets/round-4/verify_round4_arrival.png'
        await page.screenshot(path=arrival_path)
        print(f"Captured {arrival_path}")
        
        # 3. Click the sealed letter to open ancient parchment
        await page.click('button[aria-label="OPEN THE ANCIENT LETTER"]')
        await page.wait_for_timeout(800)
        
        parchment_path = 'public/assets/round-4/verify_round4_parchment.png'
        await page.screenshot(path=parchment_path)
        print(f"Captured {parchment_path}")
        
        # 4. Click 'BEGIN THE HUNT' button
        await page.click('button[aria-label="Begin the hunt through time and space"]')
        await page.wait_for_timeout(6000) # wait for time portal transition
        
        destination_path = 'public/assets/round-4/verify_round4_destination.png'
        await page.screenshot(path=destination_path)
        print(f"Captured {destination_path}")
        
        await browser.close()
        
        # Copy to artifact directory for user review
        for fn in ['verify_homepage_4portals.png', 'verify_round4_arrival.png', 'verify_round4_parchment.png', 'verify_round4_destination.png']:
            src = os.path.join('public/assets/round-4', fn)
            dst = os.path.join(ARTIFACT_DIR, fn)
            if os.path.exists(src):
                shutil.copyfile(src, dst)
                print(f"Copied {fn} to artifact directory")

if __name__ == '__main__':
    asyncio.run(run())
