import asyncio
from playwright.async_api import async_playwright

async def verify_dashboard():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # In mock mode, we can directly set localStorage teamSession to mark stage-2 completed:
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
        
        # Screenshot of the Round 1 Dashboard showing Stage 2 completed
        await page.screenshot(path='C:/Users/yashm/.gemini/antigravity/brain/8f13d18b-3772-4740-bcdd-d4869ff605fe/verify_dashboard_stage2_completed.png')
        print('verify_dashboard_stage2_completed.png captured!')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(verify_dashboard())
