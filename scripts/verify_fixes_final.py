import asyncio
from playwright.async_api import async_playwright

async def verify():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        
        # 1. Verify Round 1 Dashboard Stage 2 Completed badge
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Mark stage-2 completed in localStorage
        await page.evaluate('''() => {
            const raw = localStorage.getItem('cartel_mock_team_sessions');
            if (raw) {
                const data = JSON.parse(raw);
                for (const key in data) {
                    if (data[key].stages && data[key].stages['stage-2']) {
                        data[key].stages['stage-2'].status = 'completed';
                    }
                }
                localStorage.setItem('cartel_mock_team_sessions', JSON.stringify(data));
            }
        }''')
        await page.reload()
        await page.wait_for_timeout(1200)
        
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage2_completed_clean.png')
        print('Captured verify_stage2_completed_clean.png')
        
        # 2. Enter Stage 3 to verify single PLAY button and removed center pill
        stage3_btn = page.locator('text=STAGE 3').first
        if await stage3_btn.count() > 0:
            await stage3_btn.click()
        else:
            await page.click('text=THE FORGOTTEN GRAVEYARD')
            
        await page.wait_for_timeout(1500)
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_stage3_clean_play_and_footer.png')
        print('Captured verify_stage3_clean_play_and_footer.png')
        
        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify())
