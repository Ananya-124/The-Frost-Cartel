import asyncio
from playwright.async_api import async_playwright

async def test():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        await page.evaluate('''() => {
            const teamId = 'test_web_click';
            const squad = {
                teamId: teamId,
                teamName: 'WEB TEST',
                credits: 200,
                status: 'running',
                roundStartTime: Date.now(),
                stages: { 'stage-1': { status: 'not_configured' }, 'stage-2': { status: 'in_progress' }, 'stage-3': { status: 'available' } },
                stage2State: { foundTargetIds: [], usedHintsCount: 0 },
                evidenceJournal: { notes: [] }
            };
            sessionStorage.setItem('frost_cartel_team_session', JSON.stringify(squad));
            sessionStorage.setItem('frost_cartel_active_team', JSON.stringify({ teamId, teamName: 'WEB TEST' }));
            localStorage.setItem('frost_cartel_round1_status', 'running');
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ [teamId]: squad }));
        }''')
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        await page.click('text=THE HAUNTED IMAGE HUNT')
        await page.wait_for_timeout(1000)
        await page.click('text=The Haunted Mansion')
        await page.wait_for_timeout(1000)
        
        web_loc = page.locator('path[aria-label="Select Woven Cobweb"]')
        print('Web loc count:', await web_loc.count())
        
        box = await web_loc.bounding_box()
        print('Web bounding box:', box)
        
        # Click
        await web_loc.dispatch_event('click')
        await page.wait_for_timeout(1000)
        
        # Check text
        txt = await page.inner_text('body')
        print('Found 1 / 12?', '1 / 12' in txt)
        await browser.close()

asyncio.run(test())

