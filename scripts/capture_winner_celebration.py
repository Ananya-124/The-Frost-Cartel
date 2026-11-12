import asyncio
import os
import shutil
from playwright.async_api import async_playwright

VIEWPORTS = [
    ('1920x1080', 1920, 1080),
    ('1600x900', 1600, 900),
    ('1440x900', 1440, 900),
    ('1366x768', 1366, 768),
    ('1280x720', 1280, 720),
    ('tablet_768x1024', 768, 1024),
    ('mobile_375x667', 375, 667),
]

ARTIFACT_DIR = r'C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe'
DOCS_DIR = r'docs\round-04\screenshots'

async def capture_all():
    os.makedirs(DOCS_DIR, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for name, width, height in VIEWPORTS:
            context = await browser.new_context(viewport={'width': width, 'height': height})
            page = await context.new_page()
            
            url = f'http://localhost:5173/?round=4&introState=COLLEGE_READY&celebration=1&teamName=Team+AI'
            await page.goto(url, wait_until='domcontentloaded')
            
            # Wait for celebration animation and reveal sequence
            await page.wait_for_timeout(2500)
            
            shot_path = f'{DOCS_DIR}/winner_celebration_{name}.png'
            await page.screenshot(path=shot_path)
            print(f'Captured {shot_path} ({width}x{height})')
            
            # Copy to brain artifact directory for inspection
            art_path = os.path.join(ARTIFACT_DIR, f'winner_celebration_{name}.png')
            shutil.copyfile(shot_path, art_path)
            
            await context.close()
            
        await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_all())
