import asyncio
from playwright.async_api import async_playwright
import os

ARTIFACT_DIR = r"C:\Users\yashm\.gemini\antigravity\brain\8f13d18b-3772-4740-bcdd-d4869ff605fe"

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width': 1440, 'height': 900})
        page = await context.new_page()
        
        # Setup session for team
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        await page.evaluate('''() => {
            const teamId = 'fc_team_s2';
            const squad = {
                teamId: teamId,
                teamName: 'INVESTIGATORS',
                credits: 200,
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
            sessionStorage.setItem('frost_cartel_active_team', JSON.stringify({ teamId, teamName: 'INVESTIGATORS' }));
            localStorage.setItem('frost_cartel_round1_status', 'running');
            localStorage.setItem('frost_cartel_round1_sessions', JSON.stringify({ [teamId]: squad }));
        }''')
        
        await page.goto('http://127.0.0.1:5173/?round=1&mock=1')
        await page.wait_for_timeout(1000)
        
        # Click on Stage 2 portal (THE HAUNTED IMAGE HUNT)
        await page.click('text=THE HAUNTED IMAGE HUNT')
        await page.wait_for_timeout(1500)
        
        # 1. Capture Stage 2 Evidence Desk Overview
        overview_path = os.path.join(ARTIFACT_DIR, "stage2_evidence_desk_overview.png")
        await page.screenshot(path=overview_path)
        print(f"Captured: {overview_path}")
        
        # 2. Click "The Haunted Village" photo
        await page.click('text=The Haunted Village')
        await page.wait_for_timeout(1000)
        
        village_viewer_path = os.path.join(ARTIFACT_DIR, "stage2_village_inspector_initial.png")
        await page.screenshot(path=village_viewer_path)
        print(f"Captured: {village_viewer_path}")
        
        # 3. Click the Black Cat hotspot
        # It has aria-label="Select Obsidian Black Cat"
        cat_button = page.locator('path[aria-label="Select Obsidian Black Cat"]')
        if await cat_button.count() == 0:
            cat_button = page.locator('[aria-label*="Black Cat"]')
        
        print("Clicking Black Cat hotspot...")
        await cat_button.click()
        await page.wait_for_timeout(1000)
        
        cat_discovered_path = os.path.join(ARTIFACT_DIR, "stage2_village_cat_discovered.png")
        await page.screenshot(path=cat_discovered_path)
        print(f"Captured: {cat_discovered_path}")
        
        # 4. Zoom in to 150% and 200%
        zoom_in_btn = page.locator('button[aria-label="Zoom In"]')
        await zoom_in_btn.click()
        await page.wait_for_timeout(500)
        await zoom_in_btn.click()
        await page.wait_for_timeout(800)
        
        cat_zoomed_path = os.path.join(ARTIFACT_DIR, "stage2_village_cat_zoomed_200.png")
        await page.screenshot(path=cat_zoomed_path)
        print(f"Captured: {cat_zoomed_path}")
        
        # 5. Close inspector
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(1000)
        
        desk_after_discovery_path = os.path.join(ARTIFACT_DIR, "stage2_desk_after_cat_found.png")
        await page.screenshot(path=desk_after_discovery_path)
        print(f"Captured: {desk_after_discovery_path}")
        
        # 6. Test Calibration Tool Modal (Ctrl+Shift+C)
        await page.keyboard.press("Control+Shift+C")
        await page.wait_for_timeout(1200)
        
        calibration_modal_path = os.path.join(ARTIFACT_DIR, "stage2_calibration_modal.png")
        await page.screenshot(path=calibration_modal_path)
        print(f"Captured: {calibration_modal_path}")
        
        await browser.close()
        print("Verification completed successfully!")

if __name__ == '__main__':
    asyncio.run(run())

