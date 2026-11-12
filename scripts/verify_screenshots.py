import asyncio
from playwright.async_api import async_playwright
import shutil

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        # Navigate directly to Round 1 with mock query param
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Setup Stage 3 session in storage
        await page.evaluate('''() => {
            const teamId = 'fc_team_001';
            const squad = {
                teamId: teamId,
                teamName: 'TEAM AI',
                credits: 250,
                status: 'running',
                roundStartTime: Date.now(),
                stages: {
                    'stage-1': { status: 'locked' },
                    'stage-2': { status: 'in-progress' },
                    'stage-3': { status: 'available' }
                },
                stage2State: { foundTargetIds: [] },
                stage3State: {
                    collectedFragments: ['THE', 'NIGHT', 'RETURNS'],
                    placedBoneSlots: {},
                    dugSoilIds: [],
                    grave2CofferUnlocked: false
                }
            };
            sessionStorage.setItem('frost_cartel_team_session', JSON.stringify(squad));
            localStorage.setItem('frost_cartel_round1_status', 'running');
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ [teamId]: squad }));
        }''')
        
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1200)
        
        # Click Stage 3 portal (The Forgotten Graveyard)
        await page.click('text=THE FORGOTTEN GRAVEYARD')
        await page.wait_for_timeout(1200)
        
        # 1. Overview Screenshot
        await page.screenshot(path='public/assets/stage-3/verify_stage3_overview.png')
        print('Captured verify_stage3_overview.png')
        
        # 2. Click Grave 1
        await page.click('text=Grave 1: Bone Chamber')
        await page.wait_for_timeout(800)
        await page.screenshot(path='public/assets/stage-3/verify_grave1_clean.png')
        print('Captured verify_grave1_clean.png')
        
        # Return to Cemetery
        await page.click('text=RETURN TO CEMETERY')
        await page.wait_for_timeout(800)
        
        # 3. Click Grave 3
        await page.click('text=Grave 3: Rune Tombstone')
        await page.wait_for_timeout(800)
        await page.screenshot(path='public/assets/stage-3/verify_grave3_clean.png')
        print('Captured verify_grave3_clean.png')
        
        # Return to Cemetery
        await page.click('text=RETURN TO CEMETERY')
        await page.wait_for_timeout(800)
        
        # 4. Open Final Gate
        await page.click('text=SUBMIT FINAL ANSWER')
        await page.wait_for_timeout(600)
        
        # Chant phrase
        await page.click('text=Click to Chant Discovered Fragments')
        await page.wait_for_timeout(300)
        
        # Submit & Capture Gate Shattered
        await page.click('text=Speak Incantation & Break Gate')
        await page.wait_for_timeout(1000)
        await page.screenshot(path='public/assets/stage-3/verify_gate_shattered.png')
        print('Captured verify_gate_shattered.png')
        
        # Copy all to brain artifact directory
        art_dir = r'C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe'
        for f in ['verify_stage3_overview.png', 'verify_grave1_clean.png', 'verify_grave3_clean.png', 'verify_gate_shattered.png']:
            shutil.copyfile(f'public/assets/stage-3/{f}', f'{art_dir}\\{f}')
            
        print('All screenshots copied to artifacts successfully!')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(run())
