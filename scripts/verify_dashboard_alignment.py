import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={'width': 1920, 'height': 1080})
        await page.goto('http://localhost:5173/')
        
        # Wait for network idle and images to fully render
        await page.wait_for_load_state('networkidle')
        await page.wait_for_timeout(800)
        
        # 1. Capture clean default state at 1920x1080
        await page.screenshot(path='dashboard_default_1080p.png')
        print("Captured dashboard_default_1080p.png")
        
        # 2. Get coordinates and bounding boxes of all 4 cards, titles, badges, and buttons
        cards_info = await page.evaluate('''() => {
            const cards = Array.from(document.querySelectorAll('section[aria-label="Frost Cartel Game Rounds"] .group'));
            return cards.map((card, idx) => {
                const title = card.querySelector('h3');
                const badge = card.querySelector('span.rounded-full');
                const specs = card.querySelector('.font-mono');
                const btn = card.querySelector('button');
                const imgContainer = card.querySelector('.rounded-full.overflow-hidden');
                
                const titleRect = title ? title.getBoundingClientRect() : null;
                const badgeRect = badge ? badge.getBoundingClientRect() : null;
                const specsRect = specs ? specs.getBoundingClientRect() : null;
                const btnRect = btn ? btn.getBoundingClientRect() : null;
                const imgRect = imgContainer ? imgContainer.getBoundingClientRect() : null;
                
                return {
                    idx: idx + 1,
                    title: title ? title.innerText : '',
                    titleBox: titleRect,
                    badgeText: badge ? badge.innerText : '',
                    badgeBox: badgeRect,
                    specsText: specs ? specs.innerText : '',
                    specsBox: specsRect,
                    btnText: btn ? btn.innerText : '',
                    btnBox: btnRect,
                    imgBox: imgRect
                };
            });
        }''')
        
        print("\n--- CARDS ALIGNMENT AUDIT ---")
        for c in cards_info:
            print(f"Round {c['idx']}: {c['title']}")
            print(f"  Circle: top={c['imgBox']['top']:.1f}, size={c['imgBox']['width']:.1f}x{c['imgBox']['height']:.1f}")
            print(f"  Title:  top={c['titleBox']['top']:.1f}, h={c['titleBox']['height']:.1f}")
            print(f"  Badge:  top={c['badgeBox']['top']:.1f}, h={c['badgeBox']['height']:.1f}")
            print(f"  Specs:  top={c['specsBox']['top']:.1f}, h={c['specsBox']['height']:.1f}")
            print(f"  Button: top={c['btnBox']['top']:.1f}, h={c['btnBox']['height']:.1f}, w={c['btnBox']['width']:.1f}")

        # 3. Test Hover on Round 1
        r1_card = page.locator('section[aria-label="Frost Cartel Game Rounds"] .group').nth(0)
        await r1_card.hover()
        await page.wait_for_timeout(400)
        await page.screenshot(path='dashboard_hover_round1.png')
        print("Captured dashboard_hover_round1.png")
        
        # 4. Test Hover on Round 2
        r2_card = page.locator('section[aria-label="Frost Cartel Game Rounds"] .group').nth(1)
        await r2_card.hover()
        await page.wait_for_timeout(400)
        await page.screenshot(path='dashboard_hover_round2.png')
        print("Captured dashboard_hover_round2.png")
        
        # 5. Test Hover on Round 3
        r3_card = page.locator('section[aria-label="Frost Cartel Game Rounds"] .group').nth(2)
        await r3_card.hover()
        await page.wait_for_timeout(400)
        await page.screenshot(path='dashboard_hover_round3.png')
        print("Captured dashboard_hover_round3.png")

        # 6. Test Hover on Round 4
        r4_card = page.locator('section[aria-label="Frost Cartel Game Rounds"] .group').nth(3)
        await r4_card.hover()
        await page.wait_for_timeout(400)
        await page.screenshot(path='dashboard_hover_round4.png')
        print("Captured dashboard_hover_round4.png")

        # 7. Test unhover (mouse away) to ensure all return to silver
        await page.mouse.move(10, 10)
        await page.wait_for_timeout(400)
        await page.screenshot(path='dashboard_unhover_all_silver.png')
        print("Captured dashboard_unhover_all_silver.png")

        # 8. Test logged in state with sessionStorage
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
        await page.wait_for_timeout(800)
        await page.screenshot(path='dashboard_logged_in_1080p.png')
        print("Captured dashboard_logged_in_1080p.png")

        # 9. Multiple responsive viewports
        viewports = [
            (1600, 900, 'dashboard_1600x900.png'),
            (1440, 900, 'dashboard_1440x900.png'),
            (1366, 768, 'dashboard_1366x768.png'),
            (1280, 720, 'dashboard_1280x720.png'),
        ]
        for w, h, fname in viewports:
            await page.set_viewport_size({'width': w, 'height': h})
            await page.wait_for_timeout(400)
            await page.screenshot(path=fname)
            print(f"Captured {fname}")

        await browser.close()

asyncio.run(run())
