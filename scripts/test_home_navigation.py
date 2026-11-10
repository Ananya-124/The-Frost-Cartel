import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # 1. Test Tab navigation and focus state
        await page.goto('http://localhost:5173/')
        await page.wait_for_load_state('networkidle')
        
        # Tab to Leaderboard button
        await page.keyboard.press('Tab')
        # Tab to Round 1 button
        await page.keyboard.press('Tab')
        await page.wait_for_timeout(300)
        
        # Verify active element is Round 1 button
        active_btn_text = await page.evaluate('document.activeElement.innerText')
        print(f"Active focused element after Tab: {active_btn_text}")
        
        # Check if parent group or focus-within triggered
        is_focused = await page.evaluate('''() => {
            const r1Card = document.querySelector('section[aria-label="Frost Cartel Game Rounds"] .group');
            return r1Card.contains(document.activeElement);
        }''')
        print(f"Round 1 card contains focused element: {is_focused}")
        await page.screenshot(path='dashboard_focus_round1.png')
        print("Captured dashboard_focus_round1.png")
        
        # 2. Test Round 4 direct entry (unauthenticated allowed)
        r4_btn = page.locator('button:has-text("ENTER ROUND 04")')
        await r4_btn.click()
        await page.wait_for_timeout(800)
        print("Navigated to hash:", await page.evaluate('window.location.hash'))
        # Check if Round 4 rendered
        r4_rendered = await page.locator('text=THE RADIANT TREASURE HUNT').count() > 0 or await page.locator('text=A LETTER AWAITS').count() > 0 or await page.locator('text=THE MESSENGER').count() > 0
        print(f"Round 4 rendered: {r4_rendered}")
        await page.screenshot(path='dashboard_nav_round4.png')
        
        # 3. Test with authenticated session
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
        await page.wait_for_timeout(500)
        
        # Click Enter Round 1
        await page.locator('button:has-text("ENTER ROUND 01")').click()
        await page.wait_for_timeout(800)
        print("Round 1 hash:", await page.evaluate('window.location.hash'))
        r1_rendered = await page.locator('text=THE GRAVEYARD ESCAPE').count() > 0 or await page.locator('text=STAGE 01').count() > 0
        print(f"Round 1 rendered: {r1_rendered}")
        await page.screenshot(path='dashboard_nav_round1.png')
        
        # Return home
        await page.goto('http://localhost:5173/')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(500)
        
        # Click Enter Round 2
        await page.locator('button:has-text("ENTER ROUND 02")').click()
        await page.wait_for_timeout(800)
        print("Round 2 hash:", await page.evaluate('window.location.hash'))
        r2_rendered = await page.locator('text=THE HAUNTED AUCTION').count() > 0 or await page.locator('text=AUCTION').count() > 0
        print(f"Round 2 rendered: {r2_rendered}")
        await page.screenshot(path='dashboard_nav_round2.png')

        await browser.close()

asyncio.run(run())
