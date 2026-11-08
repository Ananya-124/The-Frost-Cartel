import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1280, 'height': 720})
        
        # 1. Available state
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_selector('text=ROUND 01')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/portal_hub_available.png')
        
        # Crop stage 1 card from screenshot
        # Stage 1 card is the leftmost portal card
        # Let's locate the card
        card1 = page.locator('[aria-label*="Stage 1"]').first
        if await card1.count() > 0:
            await card1.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/card1_available.png')
            print('Card 1 available screenshot saved')

        # 2. Mark stage 1 completed via localStorage or evaluate
        await page.evaluate('''() => {
            const raw = localStorage.getItem('fc_round1_sessions_v2');
            if (raw) {
                const data = JSON.parse(raw);
                for (const k in data) {
                    if (data[k].stages && data[k].stages['stage-1']) {
                        data[k].stages['stage-1'].status = 'completed';
                    }
                }
                localStorage.setItem('fc_round1_sessions_v2', JSON.stringify(data));
            }
        }''')
        
        await page.reload()
        await page.wait_for_selector('text=ROUND 01')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/portal_hub_completed.png')
        
        card1_comp = page.locator('[aria-label*="Stage 1"]').first
        if await card1_comp.count() > 0:
            await card1_comp.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/card1_completed.png')
            print('Card 1 completed screenshot saved')

        await browser.close()

asyncio.run(main())

