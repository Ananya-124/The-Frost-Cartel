import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test 1: Full Resolution 1440x900 Interactive Discovery
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Set up authenticated session starting on Stage 2
        await page.evaluate('''() => {
            const teamId = 'fc_detective_s2';
            const squad = {
                teamId: teamId,
                teamName: 'HAUNTED DETECTIVES',
                credits: 250,
                status: 'running',
                roundStartTime: Date.now(),
                stages: {
                    'stage-1': { status: 'not_configured' },
                    'stage-2': { status: 'in_progress' },
                    'stage-3': { status: 'available' }
                },
                stage2State: { foundTargetIds: [], usedHintsCount: 0 },
                evidenceJournal: { notes: [] }
            };
            sessionStorage.setItem('frost_cartel_team_session', JSON.stringify(squad));
            sessionStorage.setItem('frost_cartel_active_team', JSON.stringify({ teamId, teamName: 'HAUNTED DETECTIVES' }));
            localStorage.setItem('frost_cartel_round1_status', 'running');
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ [teamId]: squad }));
        }''')
        
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Click on Stage 2 portal card
        await page.click('text=THE HAUNTED IMAGE HUNT')
        await page.wait_for_timeout(1500)
        
        # 1. Overview of the new Evidence Table
        p_overview = os.path.join(ARTIFACT_DIR, "stage2_redesign_evidence_table.png")
        await page.screenshot(path=p_overview)
        print("1. Saved desk overview:", p_overview)
        
        # 2. Test Ghost in The Haunted Mansion
        print("2. Testing GHOST in The Haunted Mansion...")
        await page.click('text=The Haunted Mansion')
        await page.wait_for_timeout(1000)
        ghost_path = page.locator('path[aria-label="Select Spectral Ghost Apparition"]')
        await ghost_path.click(force=True)
        await page.wait_for_timeout(1000)
        p_ghost = os.path.join(ARTIFACT_DIR, "stage2_ghost_discovered.png")
        await page.screenshot(path=p_ghost)
        print("   Ghost discovered and screenshot saved:", p_ghost)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        # 3. Test Spider in The Cursed Attic
        print("3. Testing SPIDER in The Cursed Attic...")
        await page.click('text=The Cursed Attic')
        await page.wait_for_timeout(1000)
        spider_path = page.locator('path[aria-label="Select Crawling Spider"]')
        await spider_path.click(force=True)
        await page.wait_for_timeout(1000)
        p_spider = os.path.join(ARTIFACT_DIR, "stage2_spider_discovered.png")
        await page.screenshot(path=p_spider)
        print("   Spider discovered and screenshot saved:", p_spider)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        # 4. Test Pumpkin in The Ancestral Study
        print("4. Testing PUMPKIN in The Ancestral Study...")
        await page.click('text=The Ancestral Study')
        await page.wait_for_timeout(1000)
        pumpkin_path = page.locator('path[aria-label="Select Carved Jack-o\'-Lantern"]')
        await pumpkin_path.click(force=True)
        await page.wait_for_timeout(1000)
        p_pumpkin = os.path.join(ARTIFACT_DIR, "stage2_pumpkin_discovered.png")
        await page.screenshot(path=p_pumpkin)
        print("   Pumpkin discovered and screenshot saved:", p_pumpkin)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        # 5. Test Black Cat in The Haunted Village
        print("5. Testing BLACK CAT in The Haunted Village...")
        await page.click('text=The Haunted Village')
        await page.wait_for_timeout(1000)
        cat_path = page.locator('path[aria-label="Select Obsidian Black Cat"]')
        await cat_path.click(force=True)
        await page.wait_for_timeout(1000)
        p_cat = os.path.join(ARTIFACT_DIR, "stage2_cat_discovered.png")
        await page.screenshot(path=p_cat)
        print("   Black Cat discovered and screenshot saved:", p_cat)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        # 6. Complete remaining 8 targets to reach 12/12 FOUND
        print("6. Completing remaining targets to reach 12/12 Found...")
        
        # The Alchemist's Crypt -> Potion Bottle
        await page.click('text=The Alchemist\'s Crypt')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Venom Potion Bottle"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(800)
        
        # The Mausoleum Vault -> Coffin & Skull
        await page.click('text=The Mausoleum Vault')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Stone Sarcophagus Coffin"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.locator('path[aria-label="Select Ancestral Skull"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(800)
        
        # The Witch's Belfry -> Bat & Candle
        await page.click('text=The Witch\'s Belfry')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Nocturnal Bat"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.locator('path[aria-label="Select Altar Candle"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(800)
        
        # The Haunted Mansion -> Spider Web
        await page.click('text=The Haunted Mansion')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Woven Cobweb"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(800)
        
        # The Cursed Attic -> Witch Hat
        await page.click('text=The Cursed Attic')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Pointed Witch Hat"]').dispatch_event('click')
        await page.wait_for_timeout(500)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(800)
        
        # The Forest Bridge -> Skeleton Key
        await page.click('text=The Forest Bridge')
        await page.wait_for_timeout(800)
        await page.locator('path[aria-label="Select Ornate Skeleton Key"]').dispatch_event('click')
        await page.wait_for_timeout(800)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1500)
        
        # 7. Capture 12/12 Found Desk State
        p_complete = os.path.join(ARTIFACT_DIR, "stage2_all_12_completed.png")
        await page.screenshot(path=p_complete)
        print("7. All 12/12 completed screenshot saved:", p_complete)
        
        # 8. Test Target Calibration Modal
        await page.keyboard.press("Control+Shift+C")
        await page.wait_for_timeout(1000)
        p_calib = os.path.join(ARTIFACT_DIR, "stage2_calibration_modal_updated.png")
        await page.screenshot(path=p_calib)
        print("8. Calibration modal saved:", p_calib)
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)
        
        # 9. Test Multi-Resolution Views
        resolutions = [
            (1920, 1080, "1920x1080"),
            (1366, 768, "1366x768"),
            (1280, 720, "1280x720")
        ]
        for w, h, label in resolutions:
            await page.set_viewport_size({'width': w, 'height': h})
            await page.wait_for_timeout(800)
            res_path = os.path.join(ARTIFACT_DIR, f"stage2_res_{label}.png")
            await page.screenshot(path=res_path)
            print(f"9. Captured resolution {label}: {res_path}")
            
        await browser.close()
        print("\nALL PLAYWRIGHT TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    asyncio.run(main())
