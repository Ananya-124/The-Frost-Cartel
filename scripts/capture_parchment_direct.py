import asyncio
from playwright.async_api import async_playwright
import os
import shutil

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"
RESOLUTIONS = [
    (1920, 1080),
    (1600, 900),
    (1440, 900),
    (1366, 768),
    (1280, 720),
]

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for w, h in RESOLUTIONS:
            context = await browser.new_context(viewport={'width': w, 'height': h})
            page = await context.new_page()
            
            # Navigate directly to Round 4 Letter Revealed state
            await page.goto('http://127.0.0.1:5173/?round=4&introState=LETTER_REVEALED#/round-4')
            await page.wait_for_timeout(2000) # Wait for render and GSAP unroll
            
            out_name = f'verify_parchment_{w}x{h}.png'
            out_path = os.path.join('docs/round-04', out_name)
            await page.screenshot(path=out_path)
            print(f'Captured {out_name}')
            
            # Copy to artifact directory
            shutil.copyfile(out_path, os.path.join(ARTIFACT_DIR, out_name))
            
            await context.close()
            
        await browser.close()
        print('All direct letter captures complete.')

if __name__ == '__main__':
    asyncio.run(run())

