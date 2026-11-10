import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        
        # Set session in sessionStorage and localStorage
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
        
        # Navigate to Round 1 Dashboard
        await page.goto('http://localhost:5173/#/round-1')
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path='round1_dashboard_current.png')
        print("Captured round1_dashboard_current.png")
        
        # Now let's test a state where Stage 1 and Stage 2 are completed (matching the user's screenshot!)
        await page.evaluate('''() => {
            const sessionsRaw = localStorage.getItem('frost_cartel_round1_sessions');
            let sessions = sessionsRaw ? JSON.parse(sessionsRaw) : {};
            if (!sessions['fc_team_001']) {
                sessions['fc_team_001'] = {
                    teamId: 'fc_team_001',
                    teamName: 'TEAM AI',
                    status: 'running',
                    roundStartTime: new Date().toISOString(),
                    credits: 350,
                    stages: {
                        'stage-1': { status: 'completed', earnedCredits: 100 },
                        'stage-2': { status: 'completed', earnedCredits: 150 },
                        'stage-3': { status: 'available', earnedCredits: 0 }
                    },
                    stage1State: { trials: [] },
                    stage2State: { foundTargetIds: ['1','2','3','4','5','6','7','8','9','10','11','12'] },
                    stage3State: { collectedFragments: ['frag1', 'frag2', 'frag3'] }
                };
            } else {
                sessions['fc_team_001'].stages['stage-1'].status = 'completed';
                sessions['fc_team_001'].stages['stage-1'].earnedCredits = 100;
                sessions['fc_team_001'].stages['stage-2'].status = 'completed';
                sessions['fc_team_001'].stages['stage-2'].earnedCredits = 150;
                sessions['fc_team_001'].stages['stage-3'].status = 'available';
                sessions['fc_team_001'].credits = 350;
                sessions['fc_team_001'].stage3State.collectedFragments = ['frag1', 'frag2', 'frag3'];
            }
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
            sessionStorage.setItem('frost_cartel_round1_sessions', JSON.stringify(sessions));
        }''')
        
        await page.reload()
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(1000)
        
        await page.screenshot(path='round1_dashboard_completed_match.png')
        print("Captured round1_dashboard_completed_match.png")
        
        await browser.close()

asyncio.run(run())
