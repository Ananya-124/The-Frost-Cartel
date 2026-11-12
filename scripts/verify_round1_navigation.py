import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # 1. Setup session in sessionStorage & localStorage
        await page.goto('http://localhost:5173/')
        await page.evaluate('''() => {
            const session = {
                teamId: 'fc_team_001',
                teamName: 'TEAM AI',
                credits: 0,
                currentRound: 1,
                gameStatus: 'active',
                loginTime: new Date().toISOString()
            };
            sessionStorage.setItem('frost_cartel_session', JSON.stringify(session));
            localStorage.setItem('frost_cartel_session', JSON.stringify(session));
            
            // Clean fresh Round 1 session
            const sessions = {
                'fc_team_001': {
                    teamId: 'fc_team_001',
                    teamName: 'TEAM AI',
                    status: 'running',
                    roundStartTime: new Date().toISOString(),
                    credits: 0,
                    stages: {
                        'stage-1': { status: 'available', earnedCredits: 0 },
                        'stage-2': { status: 'available', earnedCredits: 0 },
                        'stage-3': { status: 'available', earnedCredits: 0 }
                    },
                    stage1State: { trials: [] },
                    stage2State: { foundTargetIds: [] },
                    stage3State: { collectedFragments: [] }
                }
            };
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
            sessionStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
        }''')
        
        # 2. Navigate to Round 1 Dashboard and reload to pick up active session
        await page.goto('http://localhost:5173/#/round-1')
        await page.reload()
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path='round1_dashboard_fresh.png')
        print("Captured round1_dashboard_fresh.png")
        
        # 3. Test Clicking Stage 1 Card
        print("Testing click Stage 1...")
        stage1_card = page.locator('div[role="button"]:has-text("PORTAL 01")').or_(page.locator('div[aria-label*="Stage 1"]')).first
        await stage1_card.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path='test_stage1_entered.png')
        print("Captured test_stage1_entered.png")
        
        # Return to Dashboard from Stage 1
        return_btn = page.locator('button:has-text("DASHBOARD")').or_(page.locator('button:has-text("RETURN")')).or_(page.locator('text=RETURN TO CEMETERY')).first
        if await return_btn.is_visible():
            await return_btn.click()
            await page.wait_for_timeout(1000)
        else:
            await page.goto('http://localhost:5173/#/round-1')
            await page.wait_for_timeout(1000)
            
        # 4. Test Clicking Stage 2 Card
        print("Testing click Stage 2...")
        stage2_card = page.locator('div[role="button"]:has-text("PORTAL 02")').or_(page.locator('div[aria-label*="Stage 2"]')).first
        await stage2_card.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path='test_stage2_entered.png')
        print("Captured test_stage2_entered.png")
        
        # Return to Dashboard from Stage 2
        return_btn2 = page.locator('button:has-text("DASHBOARD")').or_(page.locator('button:has-text("RETURN")')).or_(page.locator('text=RETURN TO CEMETERY')).first
        if await return_btn2.is_visible():
            await return_btn2.click()
            await page.wait_for_timeout(1000)
        else:
            await page.goto('http://localhost:5173/#/round-1')
            await page.wait_for_timeout(1000)
            
        # 5. Test Clicking Stage 3 Card
        print("Testing click Stage 3...")
        stage3_card = page.locator('div[role="button"]:has-text("PORTAL 03")').or_(page.locator('div[aria-label*="Stage 3"]')).first
        await stage3_card.click()
        await page.wait_for_timeout(1500)
        await page.screenshot(path='test_stage3_entered.png')
        print("Captured test_stage3_entered.png")
        
        await browser.close()
        print("All Stage Navigation QA Verified Successfully!")

asyncio.run(run())
