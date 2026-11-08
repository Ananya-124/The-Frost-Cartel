import asyncio
from playwright.async_api import async_playwright
from PIL import Image

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1500)
        
        stage3_btn = page.locator('text=STAGE 3').first
        if await stage3_btn.count() > 0:
            await stage3_btn.click()
        else:
            await page.click('text=THE FORGOTTEN GRAVEYARD')
        await page.wait_for_timeout(1500)
        
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_no_hover.png')
        print('Captured stage3_no_hover.png')
        
        # Coffin 1
        coffin1 = page.locator('button[aria-label="Grave 1: Bone Chamber"]').first
        await coffin1.hover()
        await page.wait_for_timeout(600)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_coffin1_hovered.png')
        print('Captured stage3_coffin1_hovered.png')
        
        im = Image.open('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_coffin1_hovered.png')
        w, h = im.size
        # Coffin 1 bottom area
        crop_c1 = im.crop((int(w * 0.15), int(h * 0.50), int(w * 0.40), int(h * 0.88)))
        crop_c1.save('C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/crop_c1_hovered_clean.png')
        print('Saved crop_c1_hovered_clean.png')
        
        # Coffin 2
        coffin2 = page.locator('button[aria-label="Grave 2: Buried Diary"]').first
        await coffin2.hover()
        await page.wait_for_timeout(600)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_coffin2_hovered.png')
        print('Captured stage3_coffin2_hovered.png')

        # Coffin 3
        coffin3 = page.locator('button[aria-label="Grave 3: Rune Tombstone"]').first
        await coffin3.hover()
        await page.wait_for_timeout(600)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/stage3_coffin3_hovered.png')
        print('Captured stage3_coffin3_hovered.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
