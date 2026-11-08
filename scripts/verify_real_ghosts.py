import asyncio
from playwright.async_api import async_playwright
from PIL import Image

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1500)
        
        # Navigate to Stage 3
        stage3_btn = page.locator('text=STAGE 3').first
        if await stage3_btn.count() > 0:
            await stage3_btn.click()
        else:
            await page.click('text=THE FORGOTTEN GRAVEYARD')
        await page.wait_for_timeout(2000)
        
        # Capture full viewport screenshot showing the new real gothic ghosts
        screenshot_path = 'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_real_ghosts.png'
        await page.screenshot(path=screenshot_path)
        print('Captured stage3_real_ghosts.png')
        
        # Crop left ghost area (x: 0-350, y: 150-600)
        im = Image.open(screenshot_path)
        w, h = im.size
        crop_left = im.crop((0, int(h * 0.15), int(w * 0.28), int(h * 0.65)))
        crop_left.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crop_verified_left_ghost.png')
        print('Saved crop_verified_left_ghost.png')
        
        # Crop right ghost area (x: w*0.72-w, y: 100-550)
        crop_right = im.crop((int(w * 0.72), int(h * 0.10), w, int(h * 0.60)))
        crop_right.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crop_verified_right_ghost.png')
        print('Saved crop_verified_right_ghost.png')
        
        # Also check Round 1 portal selection screen
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1500)
        portal_path = 'C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/portal_screen_real_ghosts.png'
        await page.screenshot(path=portal_path)
        print('Captured portal_screen_real_ghosts.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())

