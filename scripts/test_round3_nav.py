import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/')
        await page.evaluate('''() => {
            const session = {
                teamId: 'fc_team_001',
                teamName: 'TEAM AI',
                credits: 250,
                currentRound: 1,
                gameStatus: 'active',
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem('frost_cartel_session', JSON.stringify(session));
        }''')
        await page.reload()
        await page.wait_for_load_state('networkidle')
        await page.locator('button:has-text("ENTER ROUND 03")').click()
        await page.wait_for_timeout(800)
        print("Round 3 hash:", await page.evaluate('window.location.hash'))
        await page.screenshot(path='dashboard_nav_round3.png')
        print("Captured dashboard_nav_round3.png")
        await browser.close()

asyncio.run(run())
