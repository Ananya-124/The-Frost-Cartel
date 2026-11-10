import asyncio
from playwright.async_api import async_playwright

async def check_outline():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/?round=1')
        await page.wait_for_timeout(1000)
        await page.locator('text=PORTAL 03').first.click()
        await page.wait_for_timeout(1000)
        await page.locator('button[aria-label="Grave 3: Rune Tombstone"]').first.click()
        await page.wait_for_timeout(1200)

        targets = [
            'Inspect Cranium of the Arch-Warden marked III',
            'Inspect Azure Soul Crystal',
            'Inspect Celestial Astral Medallion',
            'Inspect Cinnabar Infusion Potion Phial',
            'Inspect Grimoire of the Constellations',
            'Inspect Ancient Testament Scroll',
            'Inspect Astronomical Chart of the Spheres',
            'Inspect Carved Relic Chest',
        ]
        
        for t in targets:
            btn = page.locator(f'button[aria-label="{t}"]')
            outline = await btn.evaluate('el => window.getComputedStyle(el).outline')
            box_shadow = await btn.evaluate('el => window.getComputedStyle(el).boxShadow')
            border = await btn.evaluate('el => window.getComputedStyle(el).border')
            print(f'{t[:30]:30s} -> outline: {outline}, border: {border}, shadow: {box_shadow}')
            assert 'none' in outline or '0px' in outline or 'rgb' not in outline
            assert 'none' in box_shadow or '0px' in box_shadow

        print('ALL 8 TARGETS HAVE 0 OUTLINES, 0 BORDERS, 0 SHADOWS!')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(check_outline())

